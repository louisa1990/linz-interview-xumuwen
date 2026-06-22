import { NextRequest, NextResponse } from 'next/server'
import { SeatManager } from '@/lib/services/seatManager'
import { requireAuth } from '@/lib/auth/utils'

/**
 * GET /api/seats - Get all available seats
 */
export async function GET() {
  try {
    const seats = await SeatManager.getAvailableSeats()

    return NextResponse.json({
      success: true,
      seats,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Get seats error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to get available seats' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/seats/lock - Lock a specific seat
 */
export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth()
    const { seatId } = await req.json()

    if (!seatId) {
      return NextResponse.json(
        { success: false, error: 'Seat ID is required' },
        { status: 400 }
      )
    }

    const result = await SeatManager.lockSeat(seatId, session.id)

    if (result.success) {
      return NextResponse.json({
        success: true,
        seat: result.seat,
        lockExpiresAt: result.lockExpiresAt,
        message: 'Seat locked successfully. Please proceed to payment within 15 minutes.'
      })
    } else {
      const statusCode = result.error === 'SEAT_ALREADY_LOCKED' ? 409 : 400

      return NextResponse.json({
        success: false,
        error: result.error,
        seatNumber: result.seatNumber,
        lockExpiresAt: result.lockExpiresAt,
        message: getErrorMessage(result.error)
      }, { status: statusCode })
    }
  } catch (error) {
    console.error('Lock seat error:', error)

    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Failed to lock seat' },
      { status: 500 }
    )
  }
}

function getErrorMessage(errorCode: string): string {
  const messages: Record<string, string> = {
    'SEAT_ALREADY_LOCKED': 'This seat is currently being selected by another user. Please try again in a few minutes.',
    'SEAT_RESERVED': 'This seat is already reserved.',
    'SEAT_MAINTENANCE': 'This seat is currently under maintenance.',
    'SEAT_NOT_FOUND': 'The selected seat does not exist.',
    'LOCK_EXPIRED': 'Your seat lock has expired. Please select a seat again.',
    'UNAUTHORIZED': 'You must be logged in to select a seat.'
  }

  return messages[errorCode] || 'An error occurred while processing your request.'
}