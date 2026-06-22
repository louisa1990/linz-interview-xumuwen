'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { useSession } from 'next-auth/react'

export default function PaymentPage() {
  const searchParams = useSearchParams()
  const seatId = searchParams.get('seatId')
  const { data: session, status } = useSession()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (status === 'unauthenticated') {
      window.location.href = '/login'
      return
    }

    if (!seatId) {
      setError('Missing seat information')
      setLoading(false)
      return
    }

    const initiatePayment = async () => {
      try {
        setLoading(true)
        const response = await fetch('/api/payment/create-checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ seatId, seatPrice: 50.00 })
        })

        const result = await response.json()

        if (result.success) {
          // Redirect to Stripe Checkout
          window.location.href = result.checkoutUrl
        } else {
          setError(result.error || 'Failed to initiate payment')
        }
      } catch (err) {
        setError('Failed to initiate payment')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    initiatePayment()
  }, [seatId, status])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Redirecting to secure payment...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md">
          <div className="text-red-600 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Payment Error</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => window.history.back()}
            className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Go Back
          </button>
        </div>
      </div>
    )
  }

  return null
}