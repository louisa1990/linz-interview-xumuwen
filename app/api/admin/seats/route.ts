import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth/utils'
import { prisma } from '@/lib/db'

/**
 * GET /api/admin/seats - Get all seats with detailed info
 */
export async function GET(req: NextRequest) {
  try {
    const session = await requireAdmin()

    const seats = await prisma.seat.findMany({
      select: {
        id: true,
        seatNumber: true,
        status: true,
        price: true,
        lockedBy: true,
        lockedAt: true,
        lockExpiresAt: true,
        description: true,
        createdAt: true,
        _count: {
          select: { reservations: true }
        }
      },
      orderBy: {
        seatNumber: 'asc'
      }
    })

    // Get user info for locked seats
    const seatsWithUserInfo = await Promise.all(
      seats.map(async (seat) => {
        let lockedByUser = null
        if (seat.lockedBy) {
          const user = await prisma.user.findUnique({
            where: { id: seat.lockedBy },
            select: { email: true, name: true }
          })
          lockedByUser = user
        }

        return {
          ...seat,
          lockedByUser
        }
      })
    )

    return NextResponse.json({
      success: true,
      seats: seatsWithUserInfo
    })
  } catch (error) {
    console.error('Get admin seats error:', error)

    if (error instanceof Error && error.message === 'Admin access required') {
      return NextResponse.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Failed to fetch seats' },
      { status: 500 }
    )
  }
}