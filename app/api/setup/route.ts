import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import bcrypt from 'bcrypt'

export async function POST() {
  try {
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

    return NextResponse.json({
      success: true,
      message: 'Database initialized successfully',
      users: { admin: admin.email, user: user.email },
      seats: seats.map(s => s.seatNumber)
    })
  } catch (error) {
    console.error('Setup error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to initialize database' },
      { status: 500 }
    )
  }
}