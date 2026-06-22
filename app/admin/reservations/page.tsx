'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'

interface Reservation {
  id: string
  confirmationNumber?: string
  status: string
  paymentStatus: string
  paymentAmount?: number
  reservedAt?: string
  createdAt: string
  user: {
    email: string
    name?: string | null
  }
  seat: {
    seatNumber: string
    status: string
  }
}

export default function AdminReservationsPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState({
    status: 'ALL',
    paymentStatus: 'ALL'
  })

  useEffect(() => {
    const loadReservations = async () => {
      try {
        setLoading(true)
        const params = new URLSearchParams(filter)
        const response = await fetch(`/api/admin/reservations?${params}`)
        const data = await response.json()

        if (data.success) {
          setReservations(data.reservations)
        }
      } catch (error) {
        console.error('Failed to load reservations:', error)
      } finally {
        setLoading(false)
      }
    }

    loadReservations()
  }, [filter])

  const handleProcessRefund = async (reservationId: string) => {
    if (!confirm('Are you sure you want to process a refund for this reservation?')) {
      return
    }

    try {
      const response = await fetch(`/api/admin/reservations/${reservationId}/refund`, {
        method: 'POST'
      })

      const data = await response.json()

      if (data.success) {
        alert('Refund processed successfully')
        // Reload reservations
        const params = new URLSearchParams(filter)
        const res = await fetch(`/api/admin/reservations?${params}`)
        const resData = await res.json()
        if (resData.success) {
          setReservations(resData.reservations)
        }
      } else {
        alert(data.error || 'Failed to process refund')
      }
    } catch (error) {
      console.error('Failed to process refund:', error)
      alert('Failed to process refund')
    }
  }

  const handleExportData = async () => {
    try {
      const params = new URLSearchParams(filter)
      const response = await fetch(`/api/admin/reservations/export?${params}`)
      const data = await response.json()

      if (data.success) {
        // Create CSV
        const csv = convertToCSV(data.reservations)
        downloadCSV(csv, 'reservations.csv')
      }
    } catch (error) {
      console.error('Failed to export data:', error)
      alert('Failed to export data')
    }
  }

  const convertToCSV = (data: Reservation[]) => {
    const headers = ['Confirmation #', 'Seat', 'Customer', 'Amount', 'Status', 'Payment Status', 'Date']
    const rows = data.map(r => [
      r.confirmationNumber || 'N/A',
      r.seat.seatNumber,
      r.user.email,
      r.paymentAmount ? `$${r.paymentAmount.toFixed(2)}` : '$0.00',
      r.status,
      r.paymentStatus,
      new Date(r.createdAt).toLocaleDateString()
    ])

    return [headers, ...rows].map(row => row.join(',')).join('\n')
  }

  const downloadCSV = (csv: string, filename: string) => {
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    window.URL.revokeObjectURL(url)
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
              Reservation Management
            </h1>
            <p className="text-gray-600">
              View and manage all reservations
            </p>
          </div>
          <button
            onClick={handleExportData}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            Export Data
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg p-6 mb-6 shadow">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Status</label>
              <select
                value={filter.status}
                onChange={(e) => setFilter({ ...filter, status: e.target.value })}
                className="w-full border border-gray-300 rounded px-3 py-2"
              >
                <option value="ALL">All Statuses</option>
                <option value="PENDING">Pending</option>
                <option value="CONFIRMED">Confirmed</option>
                <option value="CANCELLED">Cancelled</option>
                <option value="REFUNDED">Refunded</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Payment Status</label>
              <select
                value={filter.paymentStatus}
                onChange={(e) => setFilter({ ...filter, paymentStatus: e.target.value })}
                className="w-full border border-gray-300 rounded px-3 py-2"
              >
                <option value="ALL">All Payment Statuses</option>
                <option value="PENDING">Pending</option>
                <option value="COMPLETED">Completed</option>
                <option value="FAILED">Failed</option>
                <option value="REFUNDED">Refunded</option>
              </select>
            </div>

            <div className="flex items-end">
              <button
                onClick={() => setFilter({ status: 'ALL', paymentStatus: 'ALL' })}
                className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>

        {/* Reservations Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Confirmation #
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Seat
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Payment
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {reservations.map((reservation) => (
                  <tr key={reservation.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-mono font-medium text-blue-600">
                        {reservation.confirmationNumber || 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {reservation.seat.seatNumber}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{reservation.user.email}</div>
                      <div className="text-xs text-gray-500">{reservation.user.name || ''}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ${reservation.paymentAmount ? reservation.paymentAmount.toFixed(2) : '0.00'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <StatusBadge status={reservation.status} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <StatusBadge status={reservation.paymentStatus} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(reservation.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {reservation.paymentStatus === 'COMPLETED' && (
                        <button
                          onClick={() => handleProcessRefund(reservation.id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          Refund
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {reservations.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">No reservations found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const statusStyles: Record<string, string> = {
    PENDING: 'bg-yellow-100 text-yellow-800',
    CONFIRMED: 'bg-green-100 text-green-800',
    CANCELLED: 'bg-gray-100 text-gray-800',
    REFUNDED: 'bg-red-100 text-red-800',
    COMPLETED: 'bg-green-100 text-green-800',
    FAILED: 'bg-red-100 text-red-800'
  }

  return (
    <span className={`px-2 py-1 text-xs font-medium rounded ${statusStyles[status] || 'bg-gray-100 text-gray-800'}`}>
      {status}
    </span>
  )
}