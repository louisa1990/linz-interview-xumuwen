import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/utils'
import { prisma } from '@/lib/db'

/**
 * GET /api/reservations - Get user's reservations
 */
export async function GET(req: NextRequest) {
  try {
    const session = await requireAuth()

    const reservations = await prisma.reservation.findMany({
      where: {
        userId: session.id
      },
      include: {
        seat: {
          select: {
            seatNumber: true,
            status: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    const formattedReservations = reservations.map(reservation => ({
      id: reservation.id,
      confirmationNumber: reservation.confirmationNumber,
      seatNumber: reservation.seat.seatNumber,
      status: reservation.status,
      paymentStatus: reservation.paymentStatus,
      reservedAt: reservation.reservedAt,
      paymentAmount: reservation.paymentAmount || 0
    }))

    return NextResponse.json({
      success: true,
      reservations: formattedReservations
    })
  } catch (error) {
    console.error('Get reservations error:', error)

    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Failed to get reservations' },
      { status: 500 }
    )
  }
}