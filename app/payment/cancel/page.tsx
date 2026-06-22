'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function PaymentCancelPage() {
  const router = useRouter()

  useEffect(() => {
    // Redirect back to seat selection after showing cancel message
    const timer = setTimeout(() => {
      router.push('/seats')
    }, 5000)

    return () => clearTimeout(timer)
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center max-w-md">
        <div className="text-yellow-600 text-8xl mb-6">⚠️</div>
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Payment Cancelled
        </h1>
        <div className="bg-white rounded-lg p-6 mb-6">
          <p className="text-gray-600 mb-4">
            Your payment was cancelled and the seat has been released.
          </p>
          <div className="text-sm text-gray-500">
            <p>You can select a different seat if you'd like to try again.</p>
          </div>
        </div>
        <div className="space-y-3">
          <p className="text-sm text-gray-500">
            Redirecting to seat selection...
          </p>
          <button
            onClick={() => router.push('/seats')}
            className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Go to Seats Now
          </button>
        </div>
      </div>
    </div>
  )
}