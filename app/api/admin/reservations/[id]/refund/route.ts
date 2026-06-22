import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth/utils'
import { PaymentManager } from '@/lib/services/paymentManager'

/**
 * POST /api/admin/reservations/:id/refund - Process refund
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAdmin()
    const { id: reservationId } = await params

    const success = await PaymentManager.processRefund(reservationId)

    if (success) {
      return NextResponse.json({
        success: true,
        message: 'Refund processed successfully'
      })
    } else {
      return NextResponse.json(
        { success: false, error: 'Failed to process refund' },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Process refund error:', error)

    if (error instanceof Error && error.message === 'Admin access required') {
      return NextResponse.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Failed to process refund' },
      { status: 500 }
    )
  }
}