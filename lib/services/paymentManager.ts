import Stripe from 'stripe'
import { prisma } from '@/lib/db'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia' as any,
  typescript: true,
})

export class PaymentManager {
  private static readonly CURRENCY = 'usd'
  private static readonly SESSION_TIMEOUT = 15 * 60 // 15 minutes

  /**
   * Create Stripe Checkout Session for seat reservation
   */
  static async createCheckoutSession(
    seatId: string,
    userId: string,
    seatPrice: number = 50.00
  ) {
    try {
      // Verify seat is locked by this user
      const seat = await prisma.seat.findUnique({
        where: { id: seatId },
        select: {
          id: true,
          seatNumber: true,
          status: true,
          lockedBy: true,
          lockExpiresAt: true,
          price: true
        }
      })

      if (!seat) {
        throw new Error('Seat not found')
      }

      if (seat.status !== 'LOCKED' || seat.lockedBy !== userId) {
        throw new Error('Seat is not locked by this user')
      }

      if (seat.lockExpiresAt && seat.lockExpiresAt <= new Date()) {
        throw new Error('Seat lock has expired')
      }

      // Create Stripe Checkout Session
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: this.CURRENCY,
              product_data: {
                name: `Seat ${seat.seatNumber}`,
                description: 'Seat reservation for public event',
                metadata: {
                  seat_id: seatId,
                  seat_number: seat.seatNumber,
                  user_id: userId
                }
              },
              unit_amount: Math.round(seat.price * 100), // Convert to cents
            },
            quantity: 1,
          },
        ],
        mode: 'payment',
        success_url: `${process.env.NEXT_PUBLIC_APP_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/payment/cancel?seat_id=${seatId}`,
        expires_at: Math.floor(Date.now() / 1000) + this.SESSION_TIMEOUT,
        metadata: {
          seat_id: seatId,
          user_id: userId,
          type: 'seat_reservation'
        },
        customer_email: await this.getUserEmail(userId)
      })

      // Update reservation with payment session ID
      await prisma.reservation.updateMany({
        where: {
          seatId: seatId,
          userId: userId,
          status: 'PENDING'
        },
        data: {
          paymentId: session.id,
          paymentStatus: 'PENDING'
        }
      })

      return {
        success: true,
        checkoutUrl: session.url!,
        sessionId: session.id,
        expiresAt: new Date(session.expires_at! * 1000)
      }
    } catch (error) {
      console.error('Create checkout session error:', error)
      throw new Error('Failed to create payment session')
    }
  }

  /**
   * Handle Stripe webhook events
   */
  static async handleWebhook(event: Stripe.Event) {
    try {
      switch (event.type) {
        case 'checkout.session.completed':
          await this.handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session)
          break

        case 'checkout.session.expired':
          await this.handleCheckoutExpired(event.data.object as Stripe.Checkout.Session)
          break

        case 'payment_intent.payment_failed':
          await this.handlePaymentFailed(event.data.object as Stripe.PaymentIntent)
          break

        default:
          console.log(`Unhandled event type: ${event.type}`)
      }

      return { success: true }
    } catch (error) {
      console.error('Webhook handling error:', error)
      return { success: false, error: 'Failed to process webhook' }
    }
  }

  /**
   * Handle successful checkout completion
   */
  private static async handleCheckoutCompleted(session: Stripe.Checkout.Session) {
    const { seat_id, user_id } = session.metadata || {}

    if (!seat_id || !user_id) {
      throw new Error('Missing required metadata')
    }

    await prisma.$transaction(async (tx) => {
      // Verify seat is still locked by this user
      const seat = await tx.seat.findUnique({
        where: { id: seat_id },
        select: { status: true, lockedBy: true }
      })

      if (!seat) {
        throw new Error('Seat not found')
      }

      if (seat.status !== 'LOCKED' || seat.lockedBy !== user_id) {
        throw new Error('Seat is not in correct state for reservation')
      }

      // Update seat to reserved
      await tx.seat.update({
        where: { id: seat_id },
        data: {
          status: 'RESERVED',
          lockedBy: null,
          lockedAt: null,
          lockExpiresAt: null
        }
      })

      // Generate confirmation number
      const confirmationNumber = await this.generateConfirmationNumber()

      // Update reservation
      await tx.reservation.updateMany({
        where: {
          seatId: seat_id,
          userId: user_id,
          paymentId: session.id
        },
        data: {
          status: 'CONFIRMED',
          paymentStatus: 'COMPLETED',
          paymentAmount: session.amount_total ? session.amount_total / 100 : 50.00,
          reservedAt: new Date(),
          confirmationNumber: confirmationNumber
        }
      })

      // Log the activity
      await tx.activityLog.create({
        data: {
          userId: user_id,
          action: 'PAYMENT_COMPLETED',
          resourceType: 'SEAT',
          resourceId: seat_id,
          metadata: {
            confirmationNumber: confirmationNumber,
            paymentId: session.id,
            amount: session.amount_total
          }
        }
      })

      console.log(`Reservation confirmed for seat ${seat_id} by user ${user_id}`)
    })
  }

  /**
   * Handle expired checkout session
   */
  private static async handleCheckoutExpired(session: Stripe.Checkout.Session) {
    const { seat_id, user_id } = session.metadata || {}

    if (!seat_id || !user_id) {
      return
    }

    // Release the seat lock
    await this.releaseSeatLock(seat_id, user_id)

    // Update reservation status
    await prisma.reservation.updateMany({
      where: {
        paymentId: session.id
      },
      data: {
        status: 'CANCELLED',
        paymentStatus: 'EXPIRED'
      }
    })

    console.log(`Released seat lock for expired payment: ${seat_id}`)
  }

  /**
   * Handle failed payment
   */
  private static async handlePaymentFailed(paymentIntent: Stripe.PaymentIntent) {
    const sessions = await stripe.checkout.sessions.list({
      payment_intent: paymentIntent.id,
      limit: 1
    })

    if (sessions.data.length === 0) {
      return
    }

    const checkoutSession = sessions.data[0]
    const { seat_id, user_id } = checkoutSession.metadata || {}

    if (!seat_id || !user_id) {
      return
    }

    // Release the seat lock
    await this.releaseSeatLock(seat_id, user_id)

    // Update reservation status
    await prisma.reservation.updateMany({
      where: {
        paymentId: checkoutSession.id
      },
      data: {
        status: 'CANCELLED',
        paymentStatus: 'FAILED'
      }
    })

    console.log(`Released seat lock for failed payment: ${seat_id}`)
  }

  /**
   * Get payment status for polling
   */
  static async getPaymentStatus(sessionId: string) {
    try {
      const reservation = await prisma.reservation.findFirst({
        where: {
          paymentId: sessionId
        },
        select: {
          status: true,
          paymentStatus: true,
          seat: {
            select: {
              seatNumber: true,
              status: true
            }
          },
          confirmationNumber: true
        }
      })

      if (!reservation) {
        throw new Error('Payment session not found')
      }

      return {
        status: reservation.paymentStatus,
        reservationStatus: reservation.status,
        seatNumber: reservation.seat.seatNumber,
        seatStatus: reservation.seat.status,
        confirmationNumber: reservation.confirmationNumber
      }
    } catch (error) {
      console.error('Get payment status error:', error)
      throw new Error('Failed to get payment status')
    }
  }

  /**
   * Process refund
   */
  static async processRefund(reservationId: string) {
    try {
      const reservation = await prisma.reservation.findUnique({
        where: { id: reservationId },
        select: { paymentId: true, paymentStatus: true, seatId: true }
      })

      if (!reservation || reservation.paymentStatus !== 'COMPLETED') {
        throw new Error('Invalid reservation for refund')
      }

      // Create refund in Stripe
      const refund = await stripe.refunds.create({
        payment_intent: reservation.paymentId!,
        reason: 'requested_by_customer'
      })

      // Update reservation status
      await prisma.reservation.update({
        where: { id: reservationId },
        data: {
          paymentStatus: 'REFUNDED',
          status: 'CANCELLED'
        }
      })

      // Release the seat
      await prisma.seat.update({
        where: { id: reservation.seatId },
        data: {
          status: 'AVAILABLE'
        }
      })

      console.log(`Refund processed for reservation ${reservationId}`)
      return true
    } catch (error) {
      console.error('Refund processing error:', error)
      return false
    }
  }

  /**
   * Release seat lock
   */
  private static async releaseSeatLock(seatId: string, userId: string) {
    await prisma.$transaction(async (tx) => {
      await tx.seat.update({
        where: { id: seatId },
        data: {
          status: 'AVAILABLE',
          lockedBy: null,
          lockedAt: null,
          lockExpiresAt: null
        }
      })

      await tx.reservation.updateMany({
        where: {
          seatId: seatId,
          userId: userId,
          status: 'PENDING'
        },
        data: {
          status: 'CANCELLED'
        }
      })

      // Log the activity
      await tx.activityLog.create({
        data: {
          userId: userId,
          action: 'SEAT_RELEASED',
          resourceType: 'SEAT',
          resourceId: seatId,
          metadata: {
            reason: 'Payment expired or failed'
          }
        }
      })
    })
  }

  /**
   * Get user email for Stripe
   */
  private static async getUserEmail(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true }
    })

    return user?.email || ''
  }

  /**
   * Generate unique confirmation number
   */
  private static async generateConfirmationNumber(): Promise<string> {
    const prefix = 'SR'
    const timestamp = Date.now().toString().slice(-8)
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
    return `${prefix}-${timestamp}-${random}`
  }
}