import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth/utils'
import { prisma } from '@/lib/db'

/**
 * PATCH /api/admin/seats/:id - Update seat status
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAdmin()
    const { id: seatId } = await params
    const { status, price, description } = await req.json()

    // Validate status
    const validStatuses = ['AVAILABLE', 'MAINTENANCE']
    if (status && !validStatuses.includes(status)) {
      return NextResponse.json(
        { success: false, error: 'Invalid status' },
        { status: 400 }
      )
    }

    const seat = await prisma.seat.findUnique({
      where: { id: seatId }
    })

    if (!seat) {
      return NextResponse.json(
        { success: false, error: 'Seat not found' },
        { status: 404 }
      )
    }

    // If seat is locked, cannot put in maintenance
    if (seat.status === 'LOCKED' && status === 'MAINTENANCE') {
      return NextResponse.json(
        { success: false, error: 'Cannot put locked seat in maintenance' },
        { status: 400 }
      )
    }

    // Update seat
    const updateData: any = {}
    if (status) updateData.status = status
    if (price) updateData.price = price
    if (description !== undefined) updateData.description = description

    const updatedSeat = await prisma.seat.update({
      where: { id: seatId },
      data: updateData
    })

    // Log the action
    await prisma.activityLog.create({
      data: {
        userId: session.id,
        action: status === 'MAINTENANCE' ? 'SEAT_MAINTENANCE_ENABLED' : 'SEAT_MAINTENANCE_DISABLED',
        resourceType: 'SEAT',
        resourceId: seatId,
        metadata: {
          previousStatus: seat.status,
          newStatus: status,
          updatedBy: session.id
        }
      }
    })

    return NextResponse.json({
      success: true,
      seat: updatedSeat
    })
  } catch (error) {
    console.error('Update seat error:', error)

    if (error instanceof Error && error.message === 'Admin access required') {
      return NextResponse.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Failed to update seat' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/admin/seats/:id/release - Force release seat lock
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAdmin()
    const { id: seatId } = await params

    const seat = await prisma.seat.findUnique({
      where: { id: seatId },
      select: { status: true, lockedBy: true }
    })

    if (!seat) {
      return NextResponse.json(
        { success: false, error: 'Seat not found' },
        { status: 404 }
      )
    }

    if (seat.status !== 'LOCKED') {
      return NextResponse.json(
        { success: false, error: 'Seat is not locked' },
        { status: 400 }
      )
    }

    // Force release the lock
    await prisma.$transaction(async (tx) => {
      // Update seat to available
      await tx.seat.update({
        where: { id: seatId },
        data: {
          status: 'AVAILABLE',
          lockedBy: null,
          lockedAt: null,
          lockExpiresAt: null
        }
      })

      // Update reservation
      await tx.reservation.updateMany({
        where: {
          seatId: seatId,
          status: 'PENDING'
        },
        data: {
          status: 'CANCELLED'
        }
      })

      // Log the action
      await tx.activityLog.create({
        data: {
          userId: session.id,
          action: 'FORCE_RELEASE_LOCK',
          resourceType: 'SEAT',
          resourceId: seatId,
          metadata: {
            previousLockedBy: seat.lockedBy,
            releasedBy: session.id
          }
        }
      })
    })

    return NextResponse.json({
      success: true,
      message: 'Seat lock released successfully'
    })
  } catch (error) {
    console.error('Force release seat error:', error)

    if (error instanceof Error && error.message === 'Admin access required') {
      return NextResponse.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Failed to release seat lock' },
      { status: 500 }
    )
  }
}