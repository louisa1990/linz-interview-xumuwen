'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'

interface DashboardStats {
  totalSeats: number
  availableSeats: number
  lockedSeats: number
  reservedSeats: number
  maintenanceSeats: number
  todayReservations: number
  totalRevenue: number
  activeUsers: number
  recentActivity: Array<{
    id: string
    action: string
    resourceType: string
    resourceId: string
    user: string
    timestamp: string
  }>
}

export default function AdminDashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
      return
    }

    if (status === 'authenticated' && session?.user?.role !== 'ADMIN') {
      router.push('/seats')
      return
    }

    const fetchDashboardData = async () => {
      try {
        setLoading(true)
        const response = await fetch('/api/admin/dashboard')
        const data = await response.json()

        if (data.success) {
          setStats(data.stats)
        }
      } catch (error) {
        console.error('Failed to load dashboard data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()

    // Refresh every 30 seconds
    const interval = setInterval(fetchDashboardData, 30000)
    return () => clearInterval(interval)
  }, [status, session, router])

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600">Admin access required</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Admin Dashboard
          </h1>
          <p className="text-gray-600">
            Monitor and manage seat reservations
          </p>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard title="Total Seats" value={stats.totalSeats} icon="🪑" color="blue" />
          <StatCard title="Available" value={stats.availableSeats} icon="✅" color="green" />
          <StatCard title="Active Locks" value={stats.lockedSeats} icon="🔒" color="yellow" />
          <StatCard title="Reserved" value={stats.reservedSeats} icon="✈️" color="purple" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Revenue Card */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">Today's Performance</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Today's Reservations</span>
                <span className="text-2xl font-bold text-blue-600">
                  {stats.todayReservations}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Total Revenue</span>
                <span className="text-2xl font-bold text-green-600">
                  ${stats.totalRevenue.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Active Users</span>
                <span className="text-2xl font-bold text-purple-600">
                  {stats.activeUsers}
                </span>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {stats.recentActivity.slice(0, 10).map((activity, index) => (
                <div key={index} className="text-sm border-b border-gray-100 pb-2">
                  <div className="font-medium text-gray-900">{formatAction(activity.action)}</div>
                  <div className="text-gray-500 text-xs">
                    {activity.user} • {new Date(activity.timestamp).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={() => router.push('/admin/seats')}
              className="px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
            >
              Manage Seats
            </button>
            <button
              onClick={() => router.push('/admin/reservations')}
              className="px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
            >
              View Reservations
            </button>
            <button
              onClick={() => router.push('/admin/activity')}
              className="px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium"
            >
              Activity Logs
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function StatCard({ title, value, icon, color }: { title: string; value: number; icon: string; color: string }) {
  const colorClasses: Record<string, string> = {
    blue: 'bg-blue-100 text-blue-800',
    green: 'bg-green-100 text-green-800',
    yellow: 'bg-yellow-100 text-yellow-800',
    purple: 'bg-purple-100 text-purple-800',
    red: 'bg-red-100 text-red-800'
  }

  return (
    <div className={`${colorClasses[color]} rounded-lg p-6 shadow`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium">{title}</p>
          <p className="text-3xl font-bold mt-2">{value}</p>
        </div>
        <div className="text-4xl">{icon}</div>
      </div>
    </div>
  )
}

function formatAction(action: string): string {
  const actionMap: Record<string, string> = {
    'SEAT_LOCKED': 'Seat Locked',
    'SEAT_RELEASED': 'Seat Released',
    'SEAT_RESERVED': 'Seat Reserved',
    'PAYMENT_COMPLETED': 'Payment Completed',
    'PAYMENT_FAILED': 'Payment Failed',
    'FORCE_RELEASE_LOCK': 'Force Released Lock',
    'SEAT_MAINTENANCE_ENABLED': 'Seat Maintenance Enabled',
    'SEAT_MAINTENANCE_DISABLED': 'Seat Maintenance Disabled'
  }

  return actionMap[action] || action
}