# Linkz - Seat Reservation Platform

A fully-featured seat reservation system with user authentication, real-time seat management, payment integration, and admin dashboard.

## Features

### User Features
- **User Authentication**: Secure login/logout system with session management
- **Seat Browse**: View real-time status of all available seats
- **Seat Reservation**: Select and reserve seats with seat locking mechanism
- **Payment Integration**: Secure payment processing via Stripe
- **My Reservations**: View and manage personal booking history
- **Booking Confirmation**: Receive booking confirmation and confirmation number after successful payment

### Admin Features
- **Admin Dashboard**: Dedicated admin interface
- **Seat Management**: Add, edit, delete seats, and set seat status
- **Reservation Management**: View all bookings and process refunds
- **Seat Maintenance**: Set seats to maintenance status
- **Analytics**: View platform usage statistics

### Technical Features
- **Concurrency Control**: Seat locking mechanism prevents double bookings
- **Session Management**: Secure session handling with automatic expiration
- **Activity Logging**: Complete audit trail of user operations
- **Idempotency Control**: Prevent duplicate requests
- **Queue Management**: Handle concurrent seat requests with queue processing
- **Redis Integration**: Rate limiting and caching support

## Tech Stack

- **Frontend Framework**: Next.js 16 (App Router)
- **UI Framework**: React 19
- **Styling**: Tailwind CSS 4
- **Database**: SQLite (development) / PostgreSQL (production)
- **ORM**: Prisma
- **Authentication**: NextAuth.js
- **Payment**: Stripe
- **Caching**: Redis (IORedis)
- **Type Safety**: TypeScript
- **Session Management**: JSON Web Tokens
- **Scheduled Jobs**: node-cron

## Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn
- Stripe account (for payment functionality)

## Detailed Installation Guide

### 1. System Preparation

#### Install Node.js

Ensure your system has Node.js 18 or higher installed:

```bash
# Check Node.js version
node --version

# If not installed, visit https://nodejs.org/ to download and install
# Or use nvm (recommended)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 18
nvm use 18
```

### 2. Clone and Install Project

```bash
# Clone repository
git clone <repository-url>
cd linkz

# Install project dependencies
npm install

# Verify installation
npm --version
node --version
```

### 3. Environment Configuration

#### Create Environment Variables File

```bash
# Copy environment variables template
cp .env.example .env
```

#### Edit .env File

Open `.env` file in a text editor and configure the following variables:

```env
# Database configuration (SQLite for development)
DATABASE_URL="file:./dev.db"

# NextAuth authentication configuration
NEXTAUTH_SECRET="your-super-secret-key-min-32-chars"
NEXTAUTH_URL="http://localhost:3000"

# Stripe payment configuration (test keys)
STRIPE_SECRET_KEY="sk_test_your_stripe_secret_key"
STRIPE_WEBHOOK_SECRET="whsec_your_webhook_secret"
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_your_publishable_key"

# Application URL
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

#### Get Stripe Keys

1. Visit https://stripe.com/ and sign up for an account
2. Go to Stripe Dashboard → Developers → API keys
3. Copy test keys (starting with `sk_test_` and `pk_test_`)
4. Configure Webhook endpoint to get webhook secret

#### Generate Secure NEXTAUTH_SECRET

```bash
# Generate using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# Or use OpenSSL
openssl rand -base64 32
```

### 4. Database Initialization

```bash
# Generate Prisma client
npm run db:generate

# Push database schema to SQLite
npm run db:push

# Seed initial data (admin account, test seats, etc.)
npm run db:seed
```

**Database Notes**:
- Development environment uses SQLite (`file:./dev.db`)
- Database file is located at `prisma/dev.db` in project root
- Includes default admin and test user accounts

### 5. Verify Installation

```bash
# Check if database is properly initialized
ls -la prisma/dev.db

# View data using Prisma Studio (optional)
npm run db:studio
```

### 6. Start Development Server

```bash
# Start Next.js development server
npm run dev
```

After the server starts, visit these URLs:
- **User Interface**: http://localhost:3000
- **Admin Dashboard**: http://localhost:3000/admin
- **Prisma Studio**: http://localhost:5555 (after running `npm run db:studio`)

### 7. Test the Application

#### Login with Default Accounts

**Admin Account**:
- Email: `admin@example.com`
- Password: `admin123`

**Test User Account**:
- Email: `user@example.com`
- Password: `user123`

#### Feature Testing Checklist

- [ ] User login/logout
- [ ] Browse seat list
- [ ] Select and reserve seats
- [ ] Payment flow (requires Stripe configuration)
- [ ] View my reservations
- [ ] Access admin dashboard
- [ ] Seat management (add/edit/delete)
- [ ] Reservation management and refunds

## Environment Configuration Guide

### Development Environment Configuration

Development environment uses the following default configuration:

**Database**: SQLite
```env
DATABASE_URL="file:./dev.db"
```

**Advantages**:
- No need to install additional database services
- Quick startup and testing
- Data stored in local files

**Redis** (optional):
```env
REDIS_URL="redis://localhost:6379"
```

If Redis is not installed, the application will still run normally, but will lose caching and rate limiting functionality.

### Production Environment Configuration

Production environment is recommended to use the following configuration:

**Database**: PostgreSQL
```env
DATABASE_URL="postgresql://username:password@localhost:5432/seat_reservation?schema=public"
```

**Switch to PostgreSQL**:
1. Install PostgreSQL
2. Create database and user
3. Update `DATABASE_URL` in `.env`
4. Change provider in `prisma/schema.prisma` to "postgresql"
5. Run migration: `npm run db:migrate`

**Stripe Production Keys**:
```env
STRIPE_SECRET_KEY="sk_live_your_live_key"
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_live_your_live_key"
```

**Security Configuration**:
- Use strong random `NEXTAUTH_SECRET`
- Enable HTTPS
- Configure CORS policy

### Environment Variables Reference

| Variable Name | Required | Description | Example |
|--------------|----------|-------------|---------|
| `DATABASE_URL` | ✅ | Database connection string | `file:./dev.db` |
| `NEXTAUTH_SECRET` | ✅ | Authentication secret, minimum 32 characters | Random string |
| `NEXTAUTH_URL` | ✅ | Full application URL | `http://localhost:3000` |
| `STRIPE_SECRET_KEY` | ✅ | Stripe secret key | `sk_test_...` |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | ✅ | Stripe public key | `pk_test_...` |
| `STRIPE_WEBHOOK_SECRET` | ⚠️ | Stripe webhook secret | `whsec_...` |
| `NEXT_PUBLIC_APP_URL` | ✅ | Public application URL | `http://localhost:3000` |

✅ = Required, ⚠️ = Optional but recommended

## Default Accounts

### Admin Account
- Email: `admin@example.com`
- Password: `admin123`

### Test User Account
- Email: `user@example.com`
- Password: `user123`

## Project Structure

```
linkz/
├── app/                          # Next.js App Router pages
│   ├── api/                      # API routes
│   │   ├── auth/                 # Authentication related
│   │   ├── seats/                # Seat management
│   │   ├── reservations/         # Reservation management
│   │   ├── payment/              # Payment processing
│   │   ├── webhook/              # Stripe Webhooks
│   │   └── admin/                # Admin functionality
│   ├── admin/                    # Admin dashboard pages
│   ├── payment/                  # Payment pages
│   ├── reservation/              # Reservation pages
│   ├── seats/                    # Seat browsing pages
│   ├── login/                    # Login page
│   └── my-reservations/          # My reservations page
├── prisma/                       # Database related
│   ├── schema.prisma             # Database schema
│   ├── seed.ts                   # Database seed
│   └── dev.db                    # SQLite database
├── lib/                          # Utility functions and libraries
│   ├── auth.ts                   # Authentication configuration
│   ├── db.ts                     # Prisma client
│   ├── redis.ts                  # Redis configuration
│   └── stripe.ts                 # Stripe configuration
└── public/                       # Static assets

```

## Available Scripts and Utilities

### Development Scripts

```bash
npm run dev          # Start development server (http://localhost:3000)
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint checks
```

### Database Scripts

```bash
npm run db:generate  # Generate Prisma client
npm run db:push      # Push schema to database (development, no migration files)
npm run db:migrate   # Run database migration (production, create migration files)
npm run db:seed      # Seed database with initial data (create default accounts and seats)
npm run db:studio    # Open Prisma Studio (database visualizer)
```

**Database Script Explanation**:

- `db:generate`: Must run after modifying `prisma/schema.prisma`
- `db:push`: Quickly push schema changes to database, suitable for development
- `db:migrate`: Create migration files, suitable for production and version control
- `db:seed`: Populate test data, including admin account and sample seats
- `db:studio`: Visually edit database data in browser

### Environment Variables Detail

#### DATABASE_URL
Database connection string, supporting SQLite and PostgreSQL:

**Development Environment (SQLite)**:
```env
DATABASE_URL="file:./dev.db"
```

**Production Environment (PostgreSQL)**:
```env
DATABASE_URL="postgresql://username:password@host:port/database_name?schema=public"
# Example: DATABASE_URL="postgresql://linkz_user:pass123@localhost:5432/seat_reservation?schema=public"
```

#### NEXTAUTH_SECRET
Security key for authentication system, must be a random string of at least 32 characters:

```bash
# Generate secure key method
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

#### NEXTAUTH_URL vs NEXT_PUBLIC_APP_URL
- `NEXTAUTH_URL`: URL used internally by authentication system
- `NEXT_PUBLIC_APP_URL`: Publicly accessible frontend URL

Usually the same in development:
```env
NEXTAUTH_URL="http://localhost:3000"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

#### Stripe Configuration
Requires three Stripe-related keys:

1. **STRIPE_SECRET_KEY**: Starts with `sk_test_`(test) or `sk_live_`(production)
2. **NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY**: Starts with `pk_test_`(test) or `pk_live_`(production)
3. **STRIPE_WEBHOOK_SECRET**: Starts with `whsec_`, used to verify webhooks

**Get Stripe Keys**:
1. Visit https://stripe.com/ to register account
2. Dashboard → Developers → API keys
3. Copy corresponding keys to .env file

### System Requirements and Installation Guide

#### Minimum System Requirements
- **Node.js**: 18.0 or higher
- **Memory**: 4GB RAM (8GB recommended)
- **Storage**: 10GB available space

#### Install Node.js (if not installed)

**Check current version**:
```bash
node --version
```

**Install Node.js 18**:

Method 1 - Official website: Visit https://nodejs.org/ to download LTS version

Method 2 - Using nvm (recommended):
```bash
# Install nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# Reload terminal
source ~/.bashrc

# Install Node.js 18
nvm install 18
nvm use 18
```

### Production Environment Quick Deployment

#### 1. Server Preparation
```bash
# Update system
sudo apt-get update && sudo apt-get upgrade -y

# Install necessary tools
sudo apt-get install -y build-essential git curl
```

#### 2. Install PostgreSQL (production database)
```bash
# Install PostgreSQL
sudo apt-get install -y postgresql postgresql-contrib
sudo systemctl start postgresql

# Create database and user
sudo -u postgres psql
```

In PostgreSQL prompt:
```sql
CREATE USER linkz_user WITH PASSWORD 'your_password';
CREATE DATABASE seat_reservation OWNER linkz_user;
GRANT ALL PRIVILEGES ON DATABASE seat_reservation TO linkz_user;
\q
```

#### 3. Deploy Application
```bash
# Clone code to server
git clone <repository-url> /var/www/linkz
cd /var/www/linkz

# Install dependencies
npm install --production

# Configure production environment variables
nano .env
```

Production environment `.env` example:
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

Initialize database:
```bash
npm run db:generate
npm run db:migrate
npm run db:seed  # First deployment only
```

#### 4. Process Management with PM2
```bash
# Install PM2
npm install -g pm2

# Build application
npm run build

# Start application
pm2 start npm --name "linkz" -- start

# Enable auto-start on boot
pm2 startup
pm2 save

# View status
pm2 status
pm2 logs linkz
```

### Troubleshooting

#### Common Issue Resolution

**1. Port Already in Use**
```bash
# Find process occupying port
lsof -i :3000
# Kill process
kill -9 <PID>
```

**2. Database Connection Failed**
```bash
# Check PostgreSQL status
sudo systemctl status postgresql
# Start service
sudo systemctl start postgresql
```

**3. Dependency Installation Failed**
```bash
# Clear cache and reinstall
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

**4. Permission Errors**
```bash
# Fix file permissions
sudo chown -R $USER:$USER /path/to/project
chmod -R 755 /path/to/project
```

**5. View Detailed Logs**
```bash
# Development environment detailed logs
DEBUG=* npm run dev

# PM2 logs
pm2 logs linkz --lines 100
```

### Daily Development Workflow

```bash
# 1. Start development environment
npm run dev

# 2. Start Redis in another terminal (optional)
redis-server

# 3. After modifying database schema
# Edit prisma/schema.prisma
npm run db:generate
npm run db:push

# 4. Re-populate data
npm run db:seed

# 5. View database
npm run db:studio

# 6. Build and test
npm run build
npm run start
```

### Quick Fix Scripts

```bash
# Clean dependencies and reinstall
rm -rf node_modules package-lock.json
npm install

# Regenerate database
rm prisma/dev.db
npm run db:generate
npm run db:push
npm run db:seed

# Check port occupation
lsof -i :3000

# View logs
npm run dev -- --verbose
```

## API Endpoints

### Public Endpoints
- `POST /api/auth/[...nextauth]` - NextAuth authentication
- `GET /api/seats` - Get seat list
- `GET /api/seats/[id]` - Get single seat information
- `POST /api/reservations` - Create reservation

### Payment Endpoints
- `POST /api/payment/create-checkout` - Create Stripe Checkout session
- `GET /api/payment/status/[sessionId]` - Check payment status
- `POST /api/webhook/stripe` - Stripe webhook handler

### Admin Endpoints
- `GET /api/admin/dashboard` - Get admin dashboard statistics
- `GET /api/admin/seats` - Get all seats (admin)
- `POST /api/admin/seats` - Create new seat
- `PUT /api/admin/seats/[id]` - Update seat information
- `GET /api/admin/reservations` - Get all reservations (admin)
- `POST /api/admin/reservations/[id]/refund` - Process refund

## Database Schema

### Core Models
- **User** - User information and authentication
- **Session** - Session management
- **Seat** - Seat information
- **Reservation** - Reservation records
- **MaintenanceLog** - Maintenance logs
- **ActivityLog** - Activity logs

### Enum Types
- **UserRole** - User roles (USER, ADMIN)
- **SeatStatus** - Seat status (AVAILABLE, LOCKED, RESERVED, MAINTENANCE)
- **ReservationStatus** - Reservation status (PENDING, CONFIRMED, CANCELLED, EXPIRED, REFUNDED)
- **PaymentStatus** - Payment status (PENDING, COMPLETED, FAILED, EXPIRED, REFUNDED, CANCELLED)

## Deployment

### Vercel Deployment
1. Connect GitHub repository to Vercel
2. Configure environment variables
3. Deploy (automatic)

### Manual Deployment
```bash
npm run build
npm run start
```

## Production Environment Considerations

1. **Security**
   - Change all default passwords
   - Use strong random keys for `NEXTAUTH_SECRET`
   - Configure CORS policy
   - Enable HTTPS

2. **Database**
   - Use PostgreSQL instead of SQLite
   - Configure database connection pool
   - Regular data backups

3. **Redis**
   - Configure Redis persistence
   - Set memory limits
   - Enable Redis authentication

4. **Stripe**
   - Use production environment keys
   - Configure webhook endpoints
   - Set correct currency and pricing

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the project
2. Create feature branch
3. Commit changes
4. Push to branch
5. Create Pull Request

## License

MIT License

## Support

For questions or suggestions, please create an Issue or contact the maintenance team.

---

**Last Updated**: January 2025