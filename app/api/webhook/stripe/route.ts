import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/header'
import Stripe from 'stripe'
import { PaymentManager } from '@/lib/services/paymentManager'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia' as any,
})
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

/**
 * POST /api/webhook/stripe - Handle Stripe webhooks
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.text()
    const signature = headers().get('stripe-signature')

    if (!signature) {
      return NextResponse.json(
        { success: false, error: 'No signature provided' },
        { status: 400 }
      )
    }

    // Verify webhook signature
    let event: Stripe.Event
    try {
      event = stripe.webhooks.constructEvent(
        body,
        signature,
        webhookSecret
      )
    } catch (err) {
      console.error('Webhook signature verification failed:', err)
      return NextResponse.json(
        { success: false, error: 'Invalid signature' },
        { status: 400 }
      )
    }

    // Process the webhook
    const result = await PaymentManager.handleWebhook(event)

    if (result.success) {
      return NextResponse.json({ received: true })
    } else {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Webhook handling error:', error)
    return NextResponse.json(
      { success: false, error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}