import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth/utils'
import { prisma } from '@/lib/db'

/**
 * GET /api/admin/reservations - Get all reservations with filters
 */
export async function GET(req: NextRequest) {
  try {
    const session = await requireAdmin()

    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status')
    const paymentStatus = searchParams.get('paymentStatus')
    const limit = parseInt(searchParams.get('limit') || '50')

    const where: any = {}

    if (status && status !== 'ALL') {
      where.status = status
    }

    if (paymentStatus && paymentStatus !== 'ALL') {
      where.paymentStatus = paymentStatus
    }

    const reservations = await prisma.reservation.findMany({
      where,
      include: {
        user: {
          select: {
            email: true,
            name: true
          }
        },
        seat: {
          select: {
            seatNumber: true,
            status: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: limit
    })

    return NextResponse.json({
      success: true,
      reservations
    })
  } catch (error) {
    console.error('Get admin reservations error:', error)

    if (error instanceof Error && error.message === 'Admin access required') {
      return NextResponse.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Failed to fetch reservations' },
      { status: 500 }
    )
  }
}