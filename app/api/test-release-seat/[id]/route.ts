import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

/**
 * TEST API: Force release seat lock without authentication
 * This is for development testing only
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
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
          userId: 'cmqowu92o0001mvj31winhc5p', // admin@seatres.com
          action: 'FORCE_RELEASE_LOCK',
          resourceType: 'SEAT',
          resourceId: seatId,
          metadata: {
            previousLockedBy: seat.lockedBy,
            releasedBy: 'test-admin',
            note: 'Bypassed auth for testing'
          }
        }
      })
    })

    return NextResponse.json({
      success: true,
      message: 'Seat lock released successfully (TEST MODE - NO AUTH)',
      seatId: seatId
    })
  } catch (error: any) {
    console.error('Force release seat error:', error)

    return NextResponse.json(
      { success: false, error: 'Failed to release seat lock', details: error.message },
      { status: 500 }
    )
  }
}