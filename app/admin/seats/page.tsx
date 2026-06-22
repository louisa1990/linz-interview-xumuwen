'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'

interface Seat {
  id: string
  seatNumber: string
  status: 'AVAILABLE' | 'LOCKED' | 'RESERVED' | 'MAINTENANCE'
  price: number
  lockedBy?: string | null
  lockedAt?: string | null
  lockExpiresAt?: string | null
  description?: string
  lockedByUser?: {
    email: string
    name?: string | null
  } | null
}

export default function AdminSeatsPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [seats, setSeats] = useState<Seat[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  useEffect(() => {
    const loadSeats = async () => {
      try {
        setLoading(true)
        const response = await fetch('/api/admin/seats')
        const data = await response.json()

        if (data.success) {
          setSeats(data.seats)
        }
      } catch (error) {
        console.error('Failed to load seats:', error)
      } finally {
        setLoading(false)
      }
    }

    loadSeats()
    const interval = setInterval(loadSeats, 10000) // Refresh every 10s
    return () => clearInterval(interval)
  }, [])

  const handleToggleMaintenance = async (seatId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'MAINTENANCE' ? 'AVAILABLE' : 'MAINTENANCE'

    if (!confirm(`Are you sure you want to put this seat in ${newStatus === 'MAINTENANCE' ? 'maintenance' : 'available'} status?`)) {
      return
    }

    try {
      setActionLoading(seatId)
      const response = await fetch(`/api/admin/seats/${seatId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      })

      const data = await response.json()

      if (data.success) {
        // Refresh seats
        await loadSeats()
      } else {
        alert(data.error || 'Failed to update seat status')
      }
    } catch (error) {
      console.error('Failed to update seat status:', error)
      alert('Failed to update seat status')
    } finally {
      setActionLoading(null)
    }
  }

  const handleForceRelease = async (seatId: string) => {
    if (!confirm('Are you sure you want to force release this seat lock?')) {
      return
    }

    try {
      setActionLoading(seatId)
      const response = await fetch(`/api/admin/seats/${seatId}`, {
        method: 'POST'
      })

      const data = await response.json()

      if (data.success) {
        // Refresh seats
        await loadSeats()
      } else {
        alert(data.error || 'Failed to release seat')
      }
    } catch (error) {
      console.error('Failed to release seat:', error)
      alert('Failed to release seat')
    } finally {
      setActionLoading(null)
    }
  }

  const loadSeats = async () => {
    try {
      const response = await fetch('/api/admin/seats')
      const data = await response.json()

      if (data.success) {
        setSeats(data.seats)
      }
    } catch (error) {
      console.error('Failed to load seats:', error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Seat Management
            </h1>
            <p className="text-gray-600">
              Manage seat status and availability
            </p>
          </div>
          <button
            onClick={loadSeats}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Refresh
          </button>
        </div>

        {/* Seat Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {seats.map(seat => (
            <SeatCard
              key={seat.id}
              seat={seat}
              onToggleMaintenance={() => handleToggleMaintenance(seat.id, seat.status)}
              onForceRelease={() => handleForceRelease(seat.id)}
              isLoading={actionLoading === seat.id}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

function SeatCard({ seat, onToggleMaintenance, onForceRelease, isLoading }: {
  seat: Seat
  onToggleMaintenance: () => void
  onForceRelease: () => void
  isLoading: boolean
}) {
  const statusColors: Record<string, string> = {
    AVAILABLE: 'border-green-500 bg-green-50',
    LOCKED: 'border-yellow-500 bg-yellow-50',
    RESERVED: 'border-blue-500 bg-blue-50',
    MAINTENANCE: 'border-red-500 bg-red-50'
  }

  const statusIcons: Record<string, string> = {
    AVAILABLE: '✅',
    LOCKED: '🔒',
    RESERVED: '✈️',
    MAINTENANCE: '🔧'
  }

  return (
    <div className={`border-2 ${statusColors[seat.status]} rounded-lg p-6 shadow`}>
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-xl font-bold text-gray-900">{seat.seatNumber}</h3>
          <p className="text-sm text-gray-600">{seat.status}</p>
        </div>
        <div className="text-2xl">{statusIcons[seat.status]}</div>
      </div>

      <div className="space-y-2 text-sm mb-4">
        <div className="flex justify-between">
          <span className="text-gray-600">Price:</span>
          <span className="font-medium">${seat.price.toFixed(2)}</span>
        </div>

        {seat.description && (
          <div className="text-gray-600">
            {seat.description}
          </div>
        )}

        {seat.status === 'LOCKED' && seat.lockedByUser && (
          <div className="mt-2 p-2 bg-yellow-100 rounded text-xs">
            <div className="font-medium">Locked by:</div>
            <div>{seat.lockedByUser.email}</div>
            {seat.lockExpiresAt && (
              <div className="text-yellow-700">
                Expires: {new Date(seat.lockExpiresAt).toLocaleTimeString()}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="space-y-2">
        {seat.status === 'LOCKED' && (
          <button
            onClick={onForceRelease}
            disabled={isLoading}
            className="w-full px-3 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700 text-sm disabled:opacity-50"
          >
            {isLoading ? 'Processing...' : 'Force Release'}
          </button>
        )}

        <button
          onClick={onToggleMaintenance}
          disabled={isLoading}
          className={`w-full px-3 py-2 rounded text-sm disabled:opacity-50 ${
            seat.status === 'MAINTENANCE'
              ? 'bg-green-600 text-white hover:bg-green-700'
              : 'bg-red-600 text-white hover:bg-red-700'
          }`}
        >
          {isLoading ? 'Processing...' : seat.status === 'MAINTENANCE' ? 'Enable Seat' : 'Maintenance Mode'}
        </button>
      </div>
    </div>
  )
}