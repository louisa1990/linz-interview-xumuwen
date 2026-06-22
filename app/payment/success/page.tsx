'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'

interface PaymentStatus {
  status: string
  reservationStatus: string
  seatNumber: string
  confirmationNumber?: string
}

export default function PaymentSuccessPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const sessionId = searchParams.get('session_id')
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!sessionId) {
      router.push('/seats')
      return
    }

    const checkPaymentStatus = async () => {
      try {
        const response = await fetch(`/api/payment/status/${sessionId}`)
        const data = await response.json()

        if (data.success) {
          setPaymentStatus({
            status: data.status,
            reservationStatus: data.reservationStatus,
            seatNumber: data.seatNumber,
            confirmationNumber: data.confirmationNumber
          })
        }
      } catch (error) {
        console.error('Failed to check payment status:', error)
      } finally {
        setIsLoading(false)
      }
    }

    checkPaymentStatus()

    // Poll for status updates every 2 seconds
    const interval = setInterval(checkPaymentStatus, 2000)

    return () => clearInterval(interval)
  }, [sessionId, router])

  useEffect(() => {
    if (paymentStatus?.status === 'COMPLETED') {
      // Redirect to confirmation page after showing success
      const timer = setTimeout(() => {
        router.push(`/reservation/confirmed?session_id=${sessionId}`)
      }, 5000)

      return () => clearTimeout(timer)
    }
  }, [paymentStatus, sessionId, router])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Processing your payment...</p>
        </div>
      </div>
    )
  }

  if (paymentStatus?.status === 'COMPLETED') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-lg">
          <div className="text-green-600 text-8xl mb-6">✓</div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Payment Successful!
          </h1>
          <div className="bg-white rounded-lg p-6 mb-6">
            <p className="text-gray-600 mb-2">
              Your seat <span className="font-bold text-gray-900">{paymentStatus.seatNumber}</span> has been reserved.
            </p>
            {paymentStatus.confirmationNumber && (
              <div className="mt-4 p-4 bg-blue-50 rounded">
                <p className="text-sm text-gray-600 mb-1">Confirmation Number:</p>
                <p className="text-xl font-mono font-bold text-blue-600">
                  {paymentStatus.confirmationNumber}
                </p>
              </div>
            )}
          </div>
          <p className="text-sm text-gray-500">
            Redirecting to confirmation page...
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="text-red-600 text-6xl mb-4">⚠️</div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Payment Processing</h2>
        <p className="text-gray-600">Please wait while we confirm your payment...</p>
      </div>
    </div>
  )
}