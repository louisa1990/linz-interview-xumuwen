import { NextRequest, NextResponse } from 'next/server'
import { PaymentManager } from '@/lib/services/paymentManager'
import { requireAuth } from '@/lib/auth/utils'

/**
 * POST /api/payment/create-checkout - Create Stripe Checkout Session
 */
export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth()
    const { seatId, seatPrice } = await req.json()

    if (!seatId) {
      return NextResponse.json(
        { success: false, error: 'Seat ID is required' },
        { status: 400 }
      )
    }

    const result = await PaymentManager.createCheckoutSession(
      seatId,
      session.id,
      seatPrice
    )

    if (result.success) {
      return NextResponse.json({
        success: true,
        checkoutUrl: result.checkoutUrl,
        sessionId: result.sessionId,
        expiresAt: result.expiresAt
      })
    } else {
      return NextResponse.json(
        { success: false, error: result.error || 'Failed to create checkout session' },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Create checkout error:', error)

    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Failed to create checkout session' },
      { status: 500 }
    )
  }
}