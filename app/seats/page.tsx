'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'

interface Seat {
  id: string
  seatNumber: string
  status: string
  price: number
  description?: string
}

export default function SeatsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [seats, setSeats] = useState<Seat[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedSeat, setSelectedSeat] = useState<Seat | null>(null)
  const [locking, setLocking] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status, router])

  useEffect(() => {
    let intervalId: NodeJS.Timeout

    const fetchSeats = async () => {
      try {
        const response = await fetch('/api/seats')
        const data = await response.json()

        if (data.success) {
          setSeats(data.seats)
        }
      } catch (err) {
        console.error('Failed to fetch seats:', err)
      } finally {
        setLoading(false)
      }
    }

    // Initial fetch
    fetchSeats()

    // Poll every 5 seconds
    intervalId = setInterval(fetchSeats, 5000)

    return () => clearInterval(intervalId)
  }, [])

  const handleSeatSelect = async (seat: Seat) => {
    if (!session || seat.status !== 'AVAILABLE') return

    setLocking(true)
    setError('')

    try {
      const response = await fetch('/api/seats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ seatId: seat.id })
      })

      const result = await response.json()

      if (result.success) {
        setSelectedSeat(seat)
        // Navigate to payment page which will handle Stripe Checkout
        router.push(`/payment?seatId=${seat.id}`)
      } else {
        setError(result.message || 'Failed to lock seat')
        // Refresh seats to get updated status
        setTimeout(() => {
          window.location.reload()
        }, 3000)
      }
    } catch (err) {
      setError('Failed to lock seat. Please try again.')
    } finally {
      setLocking(false)
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading available seats...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Select Your Seat
          </h1>
          <p className="text-gray-600">
            Choose from our available premium seats. Reserve now to secure your spot!
          </p>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
            {error}
          </div>
        )}

        <div className="bg-white shadow rounded-lg p-6">
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-4">Available Seats</h2>
            <div className="flex items-center space-x-4 text-sm text-gray-600">
              <div className="flex items-center">
                <div className="w-4 h-4 bg-green-500 rounded mr-2"></div>
                Available
              </div>
              <div className="flex items-center">
                <div className="w-4 h-4 bg-yellow-500 rounded mr-2"></div>
                Locked
              </div>
              <div className="flex items-center">
                <div className="w-4 h-4 bg-blue-500 rounded mr-2"></div>
                Reserved
              </div>
            </div>
          </div>

          {seats.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">No seats currently available</p>
              <p className="text-gray-400 text-sm mt-2">
                Please check back later or contact customer service
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {seats.map(seat => (
                <div
                  key={seat.id}
                  className="border-2 border-green-500 rounded-lg p-6 hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => handleSeatSelect(seat)}
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">
                        {seat.seatNumber}
                      </h3>
                      <p className="text-sm text-green-600 font-medium">
                        Available
                      </p>
                    </div>
                    <div className="text-2xl">✅</div>
                  </div>

                  <div className="space-y-2 text-sm mb-4">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Price:</span>
                      <span className="font-bold text-gray-900">${seat.price.toFixed(2)}</span>
                    </div>
                    {seat.description && (
                      <div className="text-gray-600 text-xs">
                        {seat.description}
                      </div>
                    )}
                  </div>

                  <button
                    className={`w-full px-4 py-2 rounded font-medium transition-colors ${
                      locking
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
                    disabled={locking}
                  >
                    {locking ? 'Processing...' : 'Select Seat'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-8 text-center text-sm text-gray-500">
          <p>💡 Tip: Seat availability updates automatically every 5 seconds</p>
          <p className="mt-2">⏰ Seat locks expire after 15 minutes if payment is not completed</p>
        </div>
      </div>
    </div>
  )
}