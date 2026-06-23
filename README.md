# Linkz - 座位预订平台

一个功能完整的座位预订系统，支持用户认证、实时座位管理、支付集成和管理后台。

## 功能特性

### 用户功能
- **用户认证**：安全的登录/注销系统，支持会话管理
- **座位浏览**：查看所有可用座位的实时状态
- **座位预订**：选择并预订座位，支持座位锁定机制
- **支付集成**：通过 Stripe 进行安全的支付处理
- **我的预订**：查看和管理个人预订记录
- **预订确认**：支付成功后获得预订确认和确认号

### 管理功能
- **管理后台**：专门的管理界面
- **座位管理**：添加、编辑、删除座位，设置座位状态
- **预订管理**：查看所有预订，处理退款
- **座位维护**：将座位设置为维护状态
- **数据统计**：查看平台使用情况统计

### 技术特性
- **并发控制**：座位锁定机制防止重复预订
- **会话管理**：安全的会话处理和自动过期
- **活动日志**：完整的用户操作审计跟踪
- **幂等性控制**：防止重复请求
- **队列管理**：座位并发请求队列处理
- **Redis 集成**：速率限制和缓存支持

## 技术栈

- **前端框架**：Next.js 16 (App Router)
- **UI 框架**：React 19
- **样式**：Tailwind CSS 4
- **数据库**：SQLite (开发) / PostgreSQL (生产)
- **ORM**：Prisma
- **认证**：NextAuth.js
- **支付**：Stripe
- **缓存**：Redis (IORedis)
- **类型安全**：TypeScript
- **会话管理**：JSON Web Tokens
- **定时任务**：node-cron

## 快速开始

### 前置要求

- Node.js 18+
- npm 或 yarn
- Stripe 账户 (用于支付功能)

## 详细安装指南

### 1. 系统准备

#### 安装 Node.js

确保您的系统已安装 Node.js 18 或更高版本：

```bash
# 检查 Node.js 版本
node --version

# 如果未安装，访问 https://nodejs.org/ 下载安装
# 或使用 nvm (推荐)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 18
nvm use 18
```

### 2. 克隆和安装项目

```bash
# 克隆仓库
git clone <repository-url>
cd linz-interview-xumuwen

# 安装项目依赖
npm install

# 验证安装
npm --version
node --version
```

### 3. 环境配置

#### 创建环境变量文件

```bash
# 复制环境变量模板
cp .env.example .env
```

#### 编辑 .env 文件

使用文本编辑器打开 `.env` 文件并配置以下变量：

```env
# 数据库配置 (开发环境使用 SQLite)
DATABASE_URL="file:./dev.db"

# NextAuth 认证配置
NEXTAUTH_SECRET="your-super-secret-key-min-32-chars"
NEXTAUTH_URL="http://localhost:3000"

# Stripe 支付配置 (测试密钥)
STRIPE_SECRET_KEY="sk_test_your_stripe_secret_key"
STRIPE_WEBHOOK_SECRET="whsec_your_webhook_secret"
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_your_publishable_key"

# 应用 URL
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

#### 获取 Stripe 密钥

1. 访问 https://stripe.com/ 并注册账户
2. 进入 Stripe Dashboard → 开发者 → API 密钥
3. 复制测试密钥（以 `sk_test_` 和 `pk_test_` 开头）
4. 配置 Webhook 端点获取 webhook secret

#### 生成安全的 NEXTAUTH_SECRET

```bash
# 使用 Node.js 生成
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# 或使用 OpenSSL
openssl rand -base64 32
```

### 4. 数据库初始化

```bash
# 生成 Prisma 客户端
npm run db:generate

# 推送数据库模式到 SQLite
npm run db:push

# 填充初始数据（管理员账户、测试座位等）
npm run db:seed
```

**数据库说明**:
- 开发环境使用 SQLite (`file:./dev.db`)
- 数据库文件位于项目根目录的 `prisma/dev.db`
- 包含默认管理员和测试用户账户

### 5. 验证安装

```bash
# 检查数据库是否正确初始化
ls -la prisma/dev.db

# 使用 Prisma Studio 查看数据（可选）
npm run db:studio
```

### 6. 启动开发服务器

```bash
# 启动 Next.js 开发服务器
npm run dev
```

服务器启动后，访问以下地址：
- **用户界面**: http://localhost:3000
- **管理后台**: http://localhost:3000/admin
- **Prisma Studio**: http://localhost:5555 (运行 `npm run db:studio` 后)

### 7. 测试应用

#### 使用默认账户登录

**管理员账户**:
- 邮箱: `admin@example.com`
- 密码: `admin123`

**测试用户账户**:
- 邮箱: `user@example.com`
- 密码: `user123`

#### 功能测试清单

- [ ] 用户登录/注销
- [ ] 浏览座位列表
- [ ] 选择和预订座位
- [ ] 支付流程（需要 Stripe 配置）
- [ ] 查看我的预订
- [ ] 管理员后台访问
- [ ] 座位管理（添加/编辑/删除）
- [ ] 预订管理和退款

## 环境配置指南

### 开发环境配置

开发环境使用以下默认配置：

**数据库**: SQLite
```env
DATABASE_URL="file:./dev.db"
```

**优势**:
- 无需额外安装数据库服务
- 快速启动和测试
- 数据存储在本地文件中

**Redis** (可选):
```env
REDIS_URL="redis://localhost:6379"
```

如未安装 Redis，应用仍可正常运行，但会失去缓存和速率限制功能。

### 生产环境配置

生产环境建议使用以下配置：

**数据库**: PostgreSQL
```env
DATABASE_URL="postgresql://username:password@localhost:5432/seat_reservation?schema=public"
```

**切换到 PostgreSQL**:
1. 安装 PostgreSQL
2. 创建数据库和用户
3. 更新 `.env` 中的 `DATABASE_URL`
4. 修改 `prisma/schema.prisma` 中的 provider 为 "postgresql"
5. 运行迁移：`npm run db:migrate`

**Stripe 生产密钥**:
```env
STRIPE_SECRET_KEY="sk_live_your_live_key"
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_live_your_live_key"
```

**安全配置**:
- 使用强随机 `NEXTAUTH_SECRET`
- 启用 HTTPS
- 配置 CORS 策略

### 环境变量详解

| 变量名 | 必需 | 说明 | 示例 |
|--------|------|------|------|
| `DATABASE_URL` | ✅ | 数据库连接字符串 | `file:./dev.db` |
| `NEXTAUTH_SECRET` | ✅ | 认证密钥，最少 32 字符 | 随机字符串 |
| `NEXTAUTH_URL` | ✅ | 应用完整 URL | `http://localhost:3000` |
| `STRIPE_SECRET_KEY` | ✅ | Stripe 私钥 | `sk_test_...` |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | ✅ | Stripe 公钥 | `pk_test_...` |
| `STRIPE_WEBHOOK_SECRET` | ⚠️ | Stripe Webhook 密钥 | `whsec_...` |
| `NEXT_PUBLIC_APP_URL` | ✅ | 公开应用 URL | `http://localhost:3000` |

✅ = 必需，⚠️ = 可选但推荐

## 默认账户

### 管理员账户
- 邮箱：`admin@example.com`
- 密码：`admin123`

### 测试用户账户
- 邮箱：`user@example.com`
- 密码：`user123`

## 项目结构

```
linkz/
├── app/                          # Next.js App Router 页面
│   ├── api/                      # API 路由
│   │   ├── auth/                 # 认证相关
│   │   ├── seats/                # 座位管理
│   │   ├── reservations/         # 预订管理
│   │   ├── payment/              # 支付处理
│   │   ├── webhook/              # Stripe Webhooks
│   │   └── admin/                # 管理功能
│   ├── admin/                    # 管理后台页面
│   ├── payment/                  # 支付页面
│   ├── reservation/              # 预订页面
│   ├── seats/                    # 座位浏览页面
│   ├── login/                    # 登录页面
│   └── my-reservations/          # 我的预订页面
├── prisma/                       # 数据库相关
│   ├── schema.prisma             # 数据库模式
│   ├── seed.ts                   # 数据库种子
│   └── dev.db                    # SQLite 数据库
├── lib/                          # 工具函数和库
│   ├── auth.ts                   # 认证配置
│   ├── db.ts                     # Prisma 客户端
│   ├── redis.ts                  # Redis 配置
│   └── stripe.ts                 # Stripe 配置
└── public/                       # 静态资源

```

## 可用脚本和辅助工具

### 开发脚本

```bash
npm run dev          # 启动开发服务器 (http://localhost:3000)
npm run build        # 构建生产版本
npm run start        # 启动生产服务器
npm run lint         # 运行 ESLint 检查
```

### 数据库脚本

```bash
npm run db:generate  # 生成 Prisma 客户端
npm run db:push      # 推送模式到数据库 (开发环境，无迁移文件)
npm run db:migrate   # 运行数据库迁移 (生产环境，创建迁移文件)
npm run db:seed      # 填充种子数据 (创建默认账户和座位)
npm run db:studio    # 打开 Prisma Studio (数据库可视化工具)
```

**数据库脚本说明**:

- `db:generate`: 修改 `prisma/schema.prisma` 后必须运行
- `db:push`: 快速将模式更改推送到数据库，适合开发环境
- `db:migrate`: 创建迁移文件，适合生产环境和版本控制
- `db:seed`: 填充测试数据，包含管理员账户和示例座位
- `db:studio`: 在浏览器中可视化编辑数据库数据

### 环境变量详细说明

#### DATABASE_URL
数据库连接字符串，支持SQLite和PostgreSQL：

**开发环境（SQLite）**:
```env
DATABASE_URL="file:./dev.db"
```

**生产环境（PostgreSQL）**:
```env
DATABASE_URL="postgresql://用户名:密码@主机:端口/数据库名?schema=public"
# 示例: DATABASE_URL="postgresql://linkz:user:pass123@localhost:5432/seat_reservation?schema=public"
```

#### NEXTAUTH_SECRET
认证系统的安全密钥，必须是至少32字符的随机字符串：

```bash
# 生成安全密钥的方法
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

#### NEXTAUTH_URL vs NEXT_PUBLIC_APP_URL
- `NEXTAUTH_URL`: 认证系统内部使用的URL
- `NEXT_PUBLIC_APP_URL`: 前端公开访问的URL

开发环境通常相同：
```env
NEXTAUTH_URL="http://localhost:3000"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

#### Stripe配置
需要三个Stripe相关的密钥：

1. **STRIPE_SECRET_KEY**: 以`sk_test_`(测试)或`sk_live_`(生产)开头
2. **NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY**: 以`pk_test_`(测试)或`pk_live_`(生产)开头
3. **STRIPE_WEBHOOK_SECRET**: 以`whsec_`开头，用于验证webhook

**获取Stripe密钥**:
1. 访问 https://stripe.com/ 注册账户
2. Dashboard → 开发者 → API密钥
3. 复制对应的密钥到.env文件

### 系统要求和安装指南

#### 最低系统要求
- **Node.js**: 18.0 或更高版本
- **内存**: 4GB RAM（推荐8GB）
- **存储**: 10GB可用空间

#### 安装Node.js（如未安装）

**检查当前版本**:
```bash
node --version
```

**安装Node.js 18**:

方法1 - 官方网站: 访问 https://nodejs.org/ 下载LTS版本

方法2 - 使用nvm (推荐):
```bash
# 安装nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# 重新加载终端
source ~/.bashrc

# 安装Node.js 18
nvm install 18
nvm use 18
```

### 生产环境快速部署

#### 1. 服务器准备
```bash
# 更新系统
sudo apt-get update && sudo apt-get upgrade -y

# 安装必要工具
sudo apt-get install -y build-essential git curl
```

#### 2. 安装PostgreSQL（生产数据库）
```bash
# 安装PostgreSQL
sudo apt-get install -y postgresql postgresql-contrib
sudo systemctl start postgresql

# 创建数据库和用户
sudo -u postgres psql
```

在PostgreSQL提示符下：
```sql
CREATE USER linkz_user WITH PASSWORD 'your_password';
CREATE DATABASE seat_reservation OWNER linkz_user;
GRANT ALL PRIVILEGES ON DATABASE seat_reservation TO linkz_user;
\q
```

#### 3. 部署应用
```bash
# 克隆代码到服务器
git clone <repository-url> /var/www/linkz
cd /var/www/linkz

# 安装依赖
npm install --production

# 配置生产环境变量
nano .env
```

生产环境`.env`示例：
```env
DATABASE_URL="postgresql://linkz_user:password@localhost:5432/seat_reservation?schema=public"
NEXTAUTH_SECRET="your-production-secret-key-at-least-32-characters"
NEXTAUTH_URL="https://your-domain.com"
STRIPE_SECRET_KEY="sk_live_your_live_key"
STRIPE_WEBHOOK_SECRET="whsec_your_webhook_secret"
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_live_your_live_key"
NEXT_PUBLIC_APP_URL="https://your-domain.com"
NODE_ENV="production"
```

初始化数据库：
```bash
npm run db:generate
npm run db:migrate
npm run db:seed  # 仅首次部署
```

#### 4. 使用PM2管理进程
```bash
# 安装PM2
npm install -g pm2

# 构建应用
npm run build

# 启动应用
pm2 start npm --name "linkz" -- start

# 设置开机自启
pm2 startup
pm2 save

# 查看状态
pm2 status
pm2 logs linkz
```

### 故障排除

#### 常见问题解决

**1. 端口被占用**
```bash
# 查找占用端口的进程
lsof -i :3000
# 终止进程
kill -9 <PID>
```

**2. 数据库连接失败**
```bash
# 检查PostgreSQL状态
sudo systemctl status postgresql
# 启动服务
sudo systemctl start postgresql
```

**3. 依赖安装失败**
```bash
# 清除缓存重新安装
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

**4. 权限错误**
```bash
# 修复文件权限
sudo chown -R $USER:$USER /path/to/project
chmod -R 755 /path/to/project
```

**5. 查看详细日志**
```bash
# 开发环境详细日志
DEBUG=* npm run dev

# PM2日志
pm2 logs linkz --lines 100
```

### 日常开发工作流

```bash
# 1. 启动开发环境
npm run dev

# 2. 在另一个终端启动 Redis (可选)
redis-server

# 3. 修改数据库模式后
# 编辑 prisma/schema.prisma
npm run db:generate
npm run db:push

# 4. 重新填充数据
npm run db:seed

# 5. 查看数据库
npm run db:studio

# 6. 构建和测试
npm run build
npm run start
```

### 快速修复脚本

```bash
# 清除依赖重新安装
rm -rf node_modules package-lock.json
npm install

# 重新生成数据库
rm prisma/dev.db
npm run db:generate
npm run db:push
npm run db:seed

# 检查端口占用
lsof -i :3000

# 查看日志
npm run dev -- --verbose
```

## API 端点

### 公开端点
- `POST /api/auth/[...nextauth]` - NextAuth 认证
- `GET /api/seats` - 获取座位列表
- `GET /api/seats/[id]` - 获取单个座位信息
- `POST /api/reservations` - 创建预订

### 支付端点
- `POST /api/payment/create-checkout` - 创建 Stripe Checkout 会话
- `GET /api/payment/status/[sessionId]` - 检查支付状态
- `POST /api/webhook/stripe` - Stripe webhook 处理

### 管理端点
- `GET /api/admin/dashboard` - 获取管理后台统计数据
- `GET /api/admin/seats` - 获取所有座位（管理）
- `POST /api/admin/seats` - 创建新座位
- `PUT /api/admin/seats/[id]` - 更新座位信息
- `GET /api/admin/reservations` - 获取所有预订（管理）
- `POST /api/admin/reservations/[id]/refund` - 处理退款

## 数据库模式

### 核心模型
- **User** - 用户信息和认证
- **Session** - 会话管理
- **Seat** - 座位信息
- **Reservation** - 预订记录
- **MaintenanceLog** - 维护日志
- **ActivityLog** - 活动日志

### 枚举类型
- **UserRole** - 用户角色（USER, ADMIN）
- **SeatStatus** - 座位状态（AVAILABLE, LOCKED, RESERVED, MAINTENANCE）
- **ReservationStatus** - 预订状态（PENDING, CONFIRMED, CANCELLED, EXPIRED, REFUNDED）
- **PaymentStatus** - 支付状态（PENDING, COMPLETED, FAILED, EXPIRED, REFUNDED, CANCELLED）

## 部署

### Vercel 部署
1. 连接 GitHub 仓库到 Vercel
2. 配置环境变量
3. 部署（自动）

### 手动部署
```bash
npm run build
npm run start
```

## 生产环境注意事项

1. **安全性**
   - 修改所有默认密码
   - 使用强随机密钥作为 `NEXTAUTH_SECRET`
   - 配置 CORS 策略
   - 启用 HTTPS

2. **数据库**
   - 使用 PostgreSQL 而非 SQLite
   - 配置数据库连接池
   - 定期备份数据

3. **Redis**
   - 配置 Redis 持久化
   - 设置内存限制
   - 启用 Redis 认证

4. **Stripe**
   - 使用生产环境密钥
   - 配置 webhook 端点
   - 设置正确的货币和价格

## 贡献指南

欢迎贡献！请遵循以下步骤：

1. Fork 项目
2. 创建功能分支
3. 提交更改
4. 推送到分支
5. 创建 Pull Request

## 许可证

MIT License

## 支持

如有问题或建议，请创建 Issue 或联系维护团队。

---

**最后更新**: 2025年1月