const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcrypt')

const prisma = new PrismaClient()

async function main() {
  console.log('Starting database seed...')

  // Create admin user
  const hashedAdminPassword = await bcrypt.hash('admin123', 10)
  const admin = await prisma.user.upsert({
    where: { email: 'admin@seatres.com' },
    update: {},
    create: {
      email: 'admin@seatres.com',
      name: 'Admin User',
      password: hashedAdminPassword,
      role: 'ADMIN'
    }
  })

  console.log('✓ Created admin user:', admin.email)

  // Create test user
  const hashedUserPassword = await bcrypt.hash('user123', 10)
  const user = await prisma.user.upsert({
    where: { email: 'user@example.com' },
    update: {},
    create: {
      email: 'user@example.com',
      name: 'Test User',
      password: hashedUserPassword,
      role: 'USER'
    }
  })

  console.log('✓ Created test user:', user.email)

  // Create 3 initial seats
  const seats = await Promise.all([
    prisma.seat.upsert({
      where: { seatNumber: 'A1' },
      update: {},
      create: {
        seatNumber: 'A1',
        status: 'AVAILABLE',
        price: 50.00,
        description: 'Front row seat with great view'
      }
    }),
    prisma.seat.upsert({
      where: { seatNumber: 'A2' },
      update: {},
      create: {
        seatNumber: 'A2',
        status: 'AVAILABLE',
        price: 50.00,
        description: 'Front row seat with great view'
      }
    }),
    prisma.seat.upsert({
      where: { seatNumber: 'A3' },
      update: {},
      create: {
        seatNumber: 'A3',
        status: 'AVAILABLE',
        price: 50.00,
        description: 'Front row seat with great view'
      }
    })
  ])

  console.log('✓ Created seats:', seats.length)

  // Create system configuration
  await prisma.systemConfig.upsert({
    where: { key: 'seat_lock_duration' },
    update: {},
    create: {
      key: 'seat_lock_duration',
      value: '15',
      description: 'Seat lock duration in minutes'
    }
  })

  await prisma.systemConfig.upsert({
    where: { key: 'max_concurrent_users' },
    update: {},
    create: {
      key: 'max_concurrent_users',
      value: '100',
      description: 'Maximum concurrent users supported'
    }
  })

  await prisma.systemConfig.upsert({
    where: { key: 'default_seat_price' },
    update: {},
    create: {
      key: 'default_seat_price',
      value: '50.00',
      description: 'Default price for all seats'
    }
  })

  console.log('✓ Created system configuration')

  console.log('Database seed completed successfully!')
  console.log('\nLogin credentials:')
  console.log('Admin: admin@seatres.com / admin123')
  console.log('User: user@example.com / user123')
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })