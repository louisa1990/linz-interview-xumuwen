'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'

interface ReservationDetails {
  confirmationNumber: string
  seatNumber: string
  status: string
  reservedAt: string
  paymentAmount: number
}

export default function ReservationConfirmedPage() {
  const searchParams = useSearchParams()
  const sessionId = searchParams.get('session_id')
  const [reservation, setReservation] = useState<ReservationDetails | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchReservationDetails = async () => {
      if (!sessionId) return

      try {
        const response = await fetch(`/api/payment/status/${sessionId}`)
        const data = await response.json()

        if (data.success && data.status === 'COMPLETED') {
          // In a real app, you'd fetch full reservation details
          setReservation({
            confirmationNumber: data.confirmationNumber || 'N/A',
            seatNumber: data.seatNumber,
            status: data.reservationStatus,
            reservedAt: new Date().toISOString(),
            paymentAmount: 50.00
          })
        }
      } catch (error) {
        console.error('Failed to fetch reservation details:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchReservationDetails()
  }, [sessionId])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!reservation) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-red-600 text-6xl mb-4">❌</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Reservation Not Found</h2>
          <p className="text-gray-600">Unable to find your reservation details.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white shadow-lg rounded-lg overflow-hidden">
          {/* Success Header */}
          <div className="bg-green-600 px-6 py-8 text-center">
            <div className="text-white text-6xl mb-4">✓</div>
            <h1 className="text-3xl font-bold text-white mb-2">
              Reservation Confirmed!
            </h1>
            <p className="text-green-100">
              Your seat has been successfully reserved
            </p>
          </div>

          {/* Reservation Details */}
          <div className="p-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">
              Reservation Details
            </h2>

            <div className="space-y-4">
              <div className="flex justify-between items-center py-3 border-b">
                <span className="text-gray-600">Confirmation Number</span>
                <span className="font-mono font-bold text-blue-600 text-lg">
                  {reservation.confirmationNumber}
                </span>
              </div>

              <div className="flex justify-between items-center py-3 border-b">
                <span className="text-gray-600">Seat Number</span>
                <span className="font-bold text-gray-900 text-lg">
                  {reservation.seatNumber}
                </span>
              </div>

              <div className="flex justify-between items-center py-3 border-b">
                <span className="text-gray-600">Status</span>
                <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                  {reservation.status}
                </span>
              </div>

              <div className="flex justify-between items-center py-3 border-b">
                <span className="text-gray-600">Amount Paid</span>
                <span className="font-bold text-gray-900 text-lg">
                  ${reservation.paymentAmount.toFixed(2)}
                </span>
              </div>

              <div className="flex justify-between items-center py-3">
                <span className="text-gray-600">Reserved At</span>
                <span className="text-gray-900">
                  {new Date(reservation.reservedAt).toLocaleString()}
                </span>
              </div>
            </div>

            {/* Important Information */}
            <div className="mt-8 p-4 bg-blue-50 rounded-lg">
              <h3 className="font-semibold text-blue-900 mb-2">
                Important Information
              </h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Please save your confirmation number for future reference</li>
                <li>• You can view your reservation details in your account</li>
                <li>• Cancellations and refunds can be processed by admin</li>
              </ul>
            </div>

            {/* Action Buttons */}
            <div className="mt-8 flex flex-col sm:flex-row gap-4">
              <button
                onClick={() => window.print()}
                className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
              >
                Print Confirmation
              </button>
              <button
                onClick={() => window.location.href = '/seats'}
                className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
              >
                Back to Seats
              </button>
            </div>
          </div>
        </div>

        {/* Help Section */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>Need help? Contact our support team with your confirmation number</p>
          <p className="mt-1">Email: support@seatres.com | Phone: 1-800-SEAT-HELP</p>
        </div>
      </div>
    </div>
  )
}