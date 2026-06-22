import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth/utils'
import { prisma } from '@/lib/db'

/**
 * GET /api/admin/dashboard - Get admin dashboard statistics
 */
export async function GET(req: NextRequest) {
  try {
    const session = await requireAdmin()

    const [
      totalSeats,
      availableSeats,
      lockedSeats,
      reservedSeats,
      maintenanceSeats,
      todayReservations,
      totalRevenue,
      activeUsers,
      recentActivity
    ] = await Promise.all([
      // Total seats
      prisma.seat.count(),

      // Available seats
      prisma.seat.count({ where: { status: 'AVAILABLE' } }),

      // Locked seats
      prisma.seat.count({ where: { status: 'LOCKED' } }),

      // Reserved seats
      prisma.seat.count({ where: { status: 'RESERVED' } }),

      // Maintenance seats
      prisma.seat.count({ where: { status: 'MAINTENANCE' } }),

      // Today's reservations
      prisma.reservation.count({
        where: {
          createdAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0))
          }
        }
      }),

      // Total revenue
      prisma.reservation.aggregate({
        where: {
          paymentStatus: 'COMPLETED'
        },
        _sum: {
          paymentAmount: true
        }
      }),

      // Active users (with sessions)
      prisma.session.count({
        where: {
          expires: {
            gt: new Date()
          }
        }
      }),

      // Recent activity (last 10)
      prisma.activityLog.findMany({
        take: 10,
        orderBy: {
          createdAt: 'desc'
        },
        include: {
          user: {
            select: {
              email: true
            }
          }
        }
      })
    ])

    const stats = {
      totalSeats,
      availableSeats,
      lockedSeats,
      reservedSeats,
      maintenanceSeats,
      todayReservations,
      totalRevenue: totalRevenue._sum.paymentAmount || 0,
      activeUsers,
      recentActivity: recentActivity.map(log => ({
        id: log.id,
        action: log.action,
        resourceType: log.resourceType,
        resourceId: log.resourceId,
        user: log.user?.email || 'System',
        timestamp: log.createdAt
      }))
    }

    return NextResponse.json({
      success: true,
      stats
    })
  } catch (error) {
    console.error('Get dashboard stats error:', error)

    if (error instanceof Error && error.message === 'Admin access required') {
      return NextResponse.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      )
    }

    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Failed to fetch dashboard stats' },
      { status: 500 }
    )
  }
}