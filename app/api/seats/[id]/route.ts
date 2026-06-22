import { NextRequest, NextResponse } from 'next/server'
import { SeatManager } from '@/lib/services/seatManager'
import { requireAuth } from '@/lib/auth/utils'

/**
 * GET /api/seats/:id - Get seat status
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: seatId } = await params
    const status = await SeatManager.getSeatStatus(seatId)

    return NextResponse.json({
      success: true,
      seat: status,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Get seat status error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to get seat status' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/seats/:id - Release seat lock
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth()
    const { id: seatId } = await params

    const success = await SeatManager.releaseSeatLock(seatId, session.id)

    if (success) {
      return NextResponse.json({
        success: true,
        message: 'Seat lock released'
      })
    } else {
      return NextResponse.json(
        { success: false, error: 'Failed to release seat lock' },
        { status: 400 }
      )
    }
  } catch (error) {
    console.error('Release seat lock error:', error)

    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Failed to release seat lock' },
      { status: 500 }
    )
  }
}