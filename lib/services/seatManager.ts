import { prisma } from '@/lib/db'

export class SeatManager {
  private static readonly LOCK_DURATION = 15 * 60 * 1000 // 15 minutes

  /**
   * Get all available seats
   */
  static async getAvailableSeats() {
    try {
      const seats = await prisma.seat.findMany({
        where: {
          status: 'AVAILABLE'
        },
        select: {
          id: true,
          seatNumber: true,
          status: true,
          price: true,
          description: true
        },
        orderBy: {
          seatNumber: 'asc'
        }
      })

      return seats
    } catch (error) {
      console.error('Get available seats error:', error)
      throw new Error('Failed to get available seats')
    }
  }

  /**
   * Get seat status
   */
  static async getSeatStatus(seatId: string) {
    try {
      const seat = await prisma.seat.findUnique({
        where: { id: seatId },
        select: {
          id: true,
          seatNumber: true,
          status: true,
          lockedBy: true,
          lockedAt: true,
          lockExpiresAt: true,
          price: true
        }
      })

      if (!seat) {
        throw new Error('Seat not found')
      }

      // Check if lock has expired and release it
      if (seat.status === 'LOCKED' && seat.lockExpiresAt) {
        if (seat.lockExpiresAt <= new Date()) {
          await this.releaseExpiredLock(seatId)
          seat.status = 'AVAILABLE'
          seat.lockedBy = null
          seat.lockExpiresAt = null
        }
      }

      return seat
    } catch (error) {
      console.error('Get seat status error:', error)
      throw new Error('Failed to get seat status')
    }
  }

  /**
   * Lock a seat for a user
   */
  static async lockSeat(seatId: string, userId: string) {
    try {
      const result = await prisma.$transaction(async (tx) => {
        // Check if seat exists and get current status
        const seat = await tx.seat.findUnique({
          where: { id: seatId },
          select: {
            id: true,
            seatNumber: true,
            status: true,
            lockedBy: true,
            lockExpiresAt: true
          }
        })

        if (!seat) {
          throw new Error('Seat not found')
        }

        // Check if seat is available
        if (seat.status !== 'AVAILABLE') {
          // If locked, check if lock has expired
          if (seat.status === 'LOCKED' && seat.lockExpiresAt) {
            if (seat.lockExpiresAt <= new Date()) {
              // Lock expired, release it and proceed with new lock
              await this.releaseExpiredLockInTransaction(tx, seatId)
            } else {
              // Seat is actively locked by someone else
              return {
                success: false,
                error: 'SEAT_ALREADY_LOCKED',
                seatNumber: seat.seatNumber,
                lockedBy: seat.lockedBy,
                lockExpiresAt: seat.lockExpiresAt
              }
            }
          } else {
            // Seat is reserved or in maintenance
            return {
              success: false,
              error: seat.status === 'RESERVED' ? 'SEAT_RESERVED' : 'SEAT_MAINTENANCE',
              seatNumber: seat.seatNumber
            }
          }
        }

        // Lock the seat
        const lockExpiresAt = new Date(Date.now() + this.LOCK_DURATION)
        const updatedSeat = await tx.seat.update({
          where: { id: seatId },
          data: {
            status: 'LOCKED',
            lockedBy: userId,
            lockedAt: new Date(),
            lockExpiresAt
          }
        })

        // Create a temporary reservation record
        await tx.reservation.create({
          data: {
            userId: userId,
            seatId: seatId,
            status: 'PENDING',
            expiresAt: lockExpiresAt
          }
        })

        // Log the activity
        await tx.activityLog.create({
          data: {
            userId: userId,
            action: 'SEAT_LOCKED',
            resourceType: 'SEAT',
            resourceId: seatId,
            metadata: {
              lockExpiresAt: lockExpiresAt.toISOString()
            }
          }
        })

        return {
          success: true,
          seat: updatedSeat,
          lockExpiresAt
        }
      })

      return result
    } catch (error) {
      console.error('Seat lock error:', error)
      throw new Error('Failed to lock seat')
    }
  }

  /**
   * Release a seat lock
   */
  static async releaseSeatLock(seatId: string, userId: string) {
    try {
      const result = await prisma.$transaction(async (tx) => {
        const seat = await tx.seat.findUnique({
          where: { id: seatId },
          select: { status: true, lockedBy: true }
        })

        if (!seat || seat.status !== 'LOCKED') {
          return false
        }

        // Verify the user owns this lock (or is admin)
        if (seat.lockedBy !== userId) {
          return false
        }

        // Release the lock
        await tx.seat.update({
          where: { id: seatId },
          data: {
            status: 'AVAILABLE',
            lockedBy: null,
            lockedAt: null,
            lockExpiresAt: null
          }
        })

        // Update associated reservation
        await tx.reservation.updateMany({
          where: {
            seatId: seatId,
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
            resourceId: seatId
          }
        })

        return true
      })

      return result
    } catch (error) {
      console.error('Seat lock release error:', error)
      return false
    }
  }

  /**
   * Confirm seat reservation after successful payment
   */
  static async confirmReservation(seatId: string, userId: string, paymentId: string) {
    try {
      const reservation = await prisma.$transaction(async (tx) => {
        const seat = await tx.seat.findUnique({
          where: { id: seatId },
          select: { status: true, lockedBy: true }
        })

        if (!seat) {
          throw new Error('Seat not found')
        }

        if (seat.status !== 'LOCKED' || seat.lockedBy !== userId) {
          throw new Error('Seat is not locked by this user')
        }

        // Update seat to reserved
        await tx.seat.update({
          where: { id: seatId },
          data: {
            status: 'RESERVED',
            lockedBy: null,
            lockedAt: null,
            lockExpiresAt: null
          }
        })

        // Update reservation
        const reservation = await tx.reservation.updateFirst({
          where: {
            seatId: seatId,
            userId: userId,
            status: 'PENDING'
          },
          data: {
            status: 'CONFIRMED',
            paymentId: paymentId,
            paymentStatus: 'COMPLETED',
            reservedAt: new Date(),
            confirmationNumber: await this.generateConfirmationNumber()
          }
        })

        // Log the activity
        await tx.activityLog.create({
          data: {
            userId: userId,
            action: 'SEAT_RESERVED',
            resourceType: 'SEAT',
            resourceId: seatId,
            metadata: {
              confirmationNumber: reservation.confirmationNumber,
              paymentId: paymentId
            }
          }
        })

        return reservation
      })

      return reservation
    } catch (error) {
      console.error('Reservation confirmation error:', error)
      throw new Error('Failed to confirm reservation')
    }
  }

  /**
   * Release expired lock
   */
  private static async releaseExpiredLock(seatId: string) {
    await prisma.$transaction(async (tx) => {
      await this.releaseExpiredLockInTransaction(tx, seatId)
    })
  }

  /**
   * Release expired lock within transaction
   */
  private static async releaseExpiredLockInTransaction(tx: any, seatId: string) {
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
        status: 'PENDING'
      },
      data: {
        status: 'EXPIRED'
      }
    })
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