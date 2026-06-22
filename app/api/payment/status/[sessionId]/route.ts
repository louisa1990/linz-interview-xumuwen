import { NextRequest, NextResponse } from 'next/server'
import { PaymentManager } from '@/lib/services/paymentManager'

/**
 * GET /api/payment/status/:sessionId - Get payment status for polling
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params
    const status = await PaymentManager.getPaymentStatus(sessionId)

    return NextResponse.json({
      success: true,
      status: status.status,
      reservationStatus: status.reservationStatus,
      seatNumber: status.seatNumber,
      seatStatus: status.seatStatus,
      confirmationNumber: status.confirmationNumber,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Get payment status error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to get payment status' },
      { status: 500 }
    )
  }
}