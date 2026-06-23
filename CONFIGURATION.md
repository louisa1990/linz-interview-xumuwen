# 配置指南

本文档详细说明如何配置 Linkz 座位预订平台的各个组件。

## 目录

- [数据库配置](#数据库配置)
- [认证配置](#认证配置)
- [支付配置](#支付配置)
- [Redis 配置](#redis-配置)
- [Next.js 配置](#nextjs-配置)
- [环境配置](#环境配置)

## 数据库配置

### 开发环境 (SQLite)

项目默认使用 SQLite 作为开发环境数据库：

```env
DATABASE_URL="file:./dev.db"
```

**优势**：
- 无需额外安装数据库服务
- 零配置启动
- 适合开发和测试

**限制**：
- 不适合生产环境
- 并发性能有限
- 不支持某些高级特性

### 生产环境 (PostgreSQL)

生产环境推荐使用 PostgreSQL：

```env
DATABASE_URL="postgresql://username:password@localhost:5432/seat_reservation?schema=public"
```

**配置步骤**：

1. **安装 PostgreSQL**
```bash
# macOS
brew install postgresql

# Ubuntu/Debian
sudo apt-get install postgresql postgresql-contrib

# Windows
# 下载安装程序：https://www.postgresql.org/download/windows/
```

2. **创建数据库**
```bash
# 连接到 PostgreSQL
psql -U postgres

# 创建数据库
CREATE DATABASE seat_reservation;

# 创建用户并授权
CREATE USER linkz_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE seat_reservation TO linkz_user;
```

3. **更新 .env 配置**
```env
DATABASE_URL="postgresql://linkz_user:your_password@localhost:5432/seat_reservation?schema=public"
```

4. **运行迁移**
```bash
npm run db:generate
npm run db:migrate
npm run db:seed
```

### Prisma 配置

编辑 `prisma/schema.prisma` 修改数据源：

```prisma
datasource db {
  provider = "postgresql"  // 改为 "postgresql"
  url      = env("DATABASE_URL")
}
```

## 认证配置

### NextAuth.js 配置

NextAuth.js 用于处理用户认证，配置位于 `lib/auth.ts`：

```typescript
import NextAuth from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        // 认证逻辑
      }
    })
  ],
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 天
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = user.role
      }
      return token
    },
    async session({ session, token }) {
      session.user.id = token.id as string
      session.user.role = token.role as string
      return session
    }
  }
})
```

### 环境变量

```env
# NextAuth 配置
NEXTAUTH_SECRET="your-super-secret-key-change-this-in-production"
NEXTAUTH_URL="http://localhost:3000"
```

**安全建议**：
- `NEXTAUTH_SECRET` 应该是长度至少 32 字符的随机字符串
- 生产环境使用强随机密钥生成器
- 不要在代码中硬编码密钥

**生成安全密钥**：
```bash
# 方法 1: 使用 Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# 方法 2: 使用 OpenSSL
openssl rand -base64 32

# 方法 3: 使用 Python
python3 -c "import secrets; print(secrets.token_urlsafe(32))"
```

### 会话配置

会话策略和有效期可在 `lib/auth.ts` 中配置：

```typescript
session: {
  strategy: "jwt",              // 或 "database"
  maxAge: 30 * 24 * 60 * 60,    // 30 天
  updateAge: 24 * 60 * 60,      // 24 小时更新一次
}
```

**策略对比**：

| 策略 | 优势 | 劣势 | 适用场景 |
|------|------|------|----------|
| JWT | 无需数据库查询、性能好 | 无法立即撤销会话 | 高并发应用 |
| Database | 可立即撤销、更安全 | 增加数据库负载 | 高安全要求 |

## 支付配置

### Stripe 配置

Stripe 用于处理支付，配置位于 `lib/stripe.ts`：

```typescript
import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia',
  typescript: true,
})
```

### 环境变量

```env
# Stripe 配置
STRIPE_SECRET_KEY="sk_test_your_stripe_secret_key"
STRIPE_WEBHOOK_SECRET="whsec_your_webhook_secret"
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_your_publishable_key"
```

### Stripe 配置步骤

1. **创建 Stripe 账户**
   - 访问 https://stripe.com/
   - 注册账户（测试模式无需真实银行卡）

2. **获取 API 密钥**
   - 进入 Stripe Dashboard
   - 开发者 → API 密钥
   - 复制测试密钥（以 `sk_test_` 和 `pk_test_` 开头）

3. **配置 Webhook**
   - 开发者 → Webhooks → 添加端点
   - URL: `https://your-domain.com/api/webhook/stripe`
   - 选择事件：`checkout.session.completed`
   - 复制 webhook secret（以 `whsec_` 开头）

4. **更新 .env 文件**
   ```env
   STRIPE_SECRET_KEY="sk_test_51xxxxx"
   STRIPE_WEBHOOK_SECRET="whsec_xxxxx"
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_51xxxxx"
   ```

### 价格配置

默认座位价格在种子数据和 API 中设置：

```typescript
// prisma/seed.ts
price: 50.00,  // 默认价格 $50
currency: "USD"
```

**自定义价格**：
- 修改 `prisma/seed.ts` 中的价格
- 或在管理后台中修改每个座位的价格

### Webhook 处理

Webhook 端点位于 `app/api/webhook/stripe/route.ts`：

```typescript
export async function POST(request: Request) {
  const sig = request.headers.get('stripe-signature')!

  try {
    const event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    )

    if (event.type === 'checkout.session.completed') {
      // 处理支付成功
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }
}
```

### 生产环境 Stripe

部署到生产环境时：

1. **切换到生产密钥**
   ```env
   STRIPE_SECRET_KEY="sk_live_your_live_key"
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_live_your_live_key"
   ```

2. **配置生产 Webhook**
   - 在生产环境中设置 webhook 端点
   - 更新 `STRIPE_WEBHOOK_SECRET`

3. **测试生产流程**
   - 使用真实的支付测试
   - 确保退款流程正常工作

## Redis 配置

### 安装 Redis

**macOS**:
```bash
brew install redis
brew services start redis
```

**Ubuntu/Debian**:
```bash
sudo apt-get install redis-server
sudo systemctl start redis
```

**Docker**:
```bash
docker run -d -p 6379:6379 redis:alpine
```

### 环境变量

```env
# Redis 配置
REDIS_URL="redis://localhost:6379"
```

### Redis 用途

1. **速率限制**
   - 防止 API 滥用
   - 限制座位锁定频率

2. **缓存**
   - 缓存座位状态
   - 减少数据库查询

3. **会话存储**
   - 可选的会话存储后端

### Redis 配置（可选）

创建 `lib/redis.ts`：

```typescript
import Redis from 'ioredis'

const redis = new Redis(process.env.REDIS_URL!, {
  maxRetriesPerRequest: 3,
  retryStrategy: (times) => {
    const delay = Math.min(times * 50, 2000)
    return delay
  },
})

export { redis }
```

### Redis 生产配置

生产环境建议配置：

```env
# Redis with authentication
REDIS_URL="redis://:password@localhost:6379"

# Redis Cluster
REDIS_URL="redis://:password@redis-cluster:6379"
```

**Redis 配置文件** (`redis.conf`)：
```
# 持久化配置
save 900 1
save 300 10
save 60 10000

# 内存限制
maxmemory 256mb
maxmemory-policy allkeys-lru

# 安全配置
requirepass your-strong-password
```

## Next.js 配置

### next.config.ts

```typescript
import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  // 环境变量（服务端）
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },

  // 图片优化
  images: {
    domains: ['example.com'],
  },

  // 重定向
  async redirects() {
    return [
      {
        source: '/old-page',
        destination: '/new-page',
        permanent: true,
      },
    ]
  },

  // 头部配置
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
        ],
      },
    ]
  },
}

export default nextConfig
```

### TypeScript 配置

`tsconfig.json`：

```json
{
  "compilerOptions": {
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "paths": {
      "@/*": ["./*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

## 环境配置

### 开发环境

创建 `.env.development`：

```env
DATABASE_URL="file:./dev.db"
NEXTAUTH_SECRET="dev-secret-key-do-not-use-in-production"
NEXTAUTH_URL="http://localhost:3000"
STRIPE_SECRET_KEY="sk_test_dev_key"
STRIPE_WEBHOOK_SECRET="whsec_dev_webhook"
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_dev_key"
REDIS_URL="redis://localhost:6379"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### 生产环境

创建 `.env.production`：

```env
DATABASE_URL="postgresql://user:pass@host:5432/db"
NEXTAUTH_SECRET="production-secret-key"
NEXTAUTH_URL="https://your-domain.com"
STRIPE_SECRET_KEY="sk_live_production_key"
STRIPE_WEBHOOK_SECRET="whsec_production_webhook"
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_live_production_key"
REDIS_URL="redis://production-redis:6379"
NEXT_PUBLIC_APP_URL="https://your-domain.com"
```

### 测试环境

创建 `.env.test`：

```env
DATABASE_URL="file:./test.db"
NEXTAUTH_SECRET="test-secret-key"
NEXTAUTH_URL="http://localhost:3000"
STRIPE_SECRET_KEY="sk_test_fake_key"
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_fake_key"
REDIS_URL="redis://localhost:6379/1"
```

## 配置验证

### 检查清单

部署前确保：

- [ ] 所有环境变量已设置
- [ ] `NEXTAUTH_SECRET` 是强随机密钥
- [ ] 数据库连接正常
- [ ] Stripe 密钥正确（测试/生产）
- [ ] Webhook 端点可访问
- [ ] Redis 服务运行（如使用）
- [ ] HTTPS 证书配置（生产）
- [ ] CORS 策略配置
- [ ] 文件上传限制配置
- [ ] 日志记录配置

### 配置测试脚本

创建 `scripts/check-config.js`：

```javascript
const requiredEnvVars = [
  'DATABASE_URL',
  'NEXTAUTH_SECRET',
  'NEXTAUTH_URL',
  'STRIPE_SECRET_KEY',
  'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY',
]

const missing = requiredEnvVars.filter(key => !process.env[key])

if (missing.length > 0) {
  console.error('Missing environment variables:', missing.join(', '))
  process.exit(1)
}

console.log('✅ All required environment variables are set')
```

运行检查：
```bash
node scripts/check-config.js
```

## 常见配置问题

### 数据库连接问题

**问题**: `Can't reach database server`

**解决方案**:
1. 检查数据库服务是否运行
2. 验证 `DATABASE_URL` 格式
3. 确认网络连接
4. 检查防火墙设置

### Stripe Webhook 失败

**问题**: Webhook signature verification failed

**解决方案**:
1. 确认 `STRIPE_WEBHOOK_SECRET` 正确
2. 检查 webhook 端点是否可访问
3. 验证请求签名
4. 查看 Stripe Dashboard 中的 webhook 日志

### Redis 连接超时

**问题**: Redis connection timeout

**解决方案**:
1. 确认 Redis 服务运行
2. 检查 `REDIS_URL` 格式
3. 验证网络连接
4. 检查 Redis 认证配置

## 配置最佳实践

1. **永远不要**:
   - 将 `.env` 文件提交到版本控制
   - 在代码中硬编码密钥
   - 使用生产密钥进行开发

2. **始终**:
   - 使用不同的密钥用于不同环境
   - 定期轮换密钥
   - 限制密钥权限到最小范围
   - 监控密钥使用情况

3. **建议**:
   - 使用密钥管理服务（如 AWS Secrets Manager）
   - 设置密钥过期策略
   - 配置密钥泄露监控
   - 定期审计访问权限

---

**最后更新**: 2025年1月