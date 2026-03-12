import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import api from '@/lib/api'
import { Button } from '@/components/ui/Button'

interface OrderData {
  id: string
  confirmation_code: string
  event_title: string
  billing_name: string
  billing_email: string
  subtotal: string
  discount_amount: string
  total: string
  status: string
  tickets: Array<{
    id: string
    tier_name: string
    attendee_name: string
    qr_code_data: string
  }>
  line_items: Array<{
    tier_name: string
    quantity: number
    line_total: string
  }>
  created_at: string
}

export function CheckoutConfirmation() {
  const { eventSlug } = useParams()
  const [order, setOrder] = useState<OrderData | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkout = sessionStorage.getItem('checkout')
    if (!checkout) {
      setError('No checkout data found.')
      setLoading(false)
      return
    }

    const data = JSON.parse(checkout)

    // Complete the order
    api.post('/checkout/', {
      action: 'complete',
      org_slug: data.org_slug,
      event_slug: data.event_slug,
      items: data.items,
      promo_code: data.promo_code || '',
      billing_name: data.billing_name,
      billing_email: data.billing_email,
      billing_phone: data.billing_phone || '',
    }).then((res) => {
      setOrder(res.data)
      sessionStorage.removeItem('checkout')
    }).catch((err) => {
      setError(err.response?.data?.detail || 'Failed to complete order.')
    }).finally(() => {
      setLoading(false)
    })
  }, [eventSlug])

  if (loading) return <div className="p-8 text-center text-gray-500">Processing your order...</div>
  if (error) return <div className="max-w-xl mx-auto px-4 py-16 text-center text-red-600">{error}</div>
  if (!order) return null

  const isFree = parseFloat(order.total) === 0

  return (
    <div className="max-w-xl mx-auto px-4 py-10">
      <div className="flex items-center gap-2 text-sm text-gray-400 mb-8">
        <span>1. Select Tickets</span>
        <span>—</span><span>2. Your Details</span>
        <span>—</span><span>{isFree ? <s>3. Payment</s> : '3. Payment'}</span>
        <span>—</span><span className="text-(--color-primary) font-medium">4. Confirmation</span>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center mb-6">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          {isFree ? "You're registered!" : "Payment successful!"}
        </h1>
        <p className="text-gray-600 mb-4">
          Thank you for registering for <strong>{order.event_title}</strong>
        </p>
        <div className="inline-block bg-gray-100 rounded-lg px-4 py-2">
          <p className="text-xs text-gray-500">Confirmation Code</p>
          <p className="text-xl font-mono font-bold text-gray-900">{order.confirmation_code}</p>
        </div>
      </div>

      {/* Order summary */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h2>
        <div className="space-y-2 mb-4">
          {order.line_items.map((item, i) => (
            <div key={i} className="flex justify-between text-sm">
              <span>{item.quantity}x {item.tier_name}</span>
              <span>{parseFloat(item.line_total) === 0 ? 'Free' : `$${item.line_total}`}</span>
            </div>
          ))}
          {parseFloat(order.discount_amount) > 0 && (
            <div className="flex justify-between text-sm text-green-600">
              <span>Discount</span>
              <span>-${order.discount_amount}</span>
            </div>
          )}
          <div className="flex justify-between font-semibold text-gray-900 pt-2 border-t border-gray-200">
            <span>Total</span>
            <span>{isFree ? 'Free' : `$${order.total}`}</span>
          </div>
        </div>
        <div className="text-sm text-gray-500">
          <p>Name: {order.billing_name}</p>
          <p>Email: {order.billing_email}</p>
        </div>
      </div>

      {/* Tickets */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Your Tickets ({order.tickets.length})
        </h2>
        <div className="space-y-3">
          {order.tickets.map((ticket) => (
            <div key={ticket.id} className="border border-gray-200 rounded-lg p-4">
              <p className="font-medium text-gray-900">{ticket.tier_name}</p>
              <p className="text-sm text-gray-500">{ticket.attendee_name}</p>
              <p className="text-xs font-mono text-gray-400 mt-2 break-all">QR: {ticket.qr_code_data}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="flex gap-3">
        <Link to="/my/tickets" className="flex-1">
          <Button variant="outline" className="w-full">View My Tickets</Button>
        </Link>
        <Link to="/" className="flex-1">
          <Button className="w-full">Browse More Events</Button>
        </Link>
      </div>
    </div>
  )
}
