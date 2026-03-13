import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js'
import api from '@/lib/api'
import { Button } from '@/components/ui/Button'

const stripePublishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || ''
const stripePromise = stripePublishableKey ? loadStripe(stripePublishableKey) : null

interface CheckoutData {
  org_slug: string
  event_slug: string
  items: Array<{ tier_id: string; quantity: number }>
  promo_code?: string
  billing_name: string
  billing_email: string
  billing_phone?: string
  calc?: {
    line_items: Array<{ quantity: number; tier_name: string; line_total: string }>
    total: string
    is_free: boolean
  }
}

function PaymentForm({ checkoutData, eventSlug }: { checkoutData: CheckoutData; eventSlug: string }) {
  const stripe = useStripe()
  const elements = useElements()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!stripe || !elements) return

    setLoading(true)
    setError('')

    const { error: submitError } = await elements.submit()
    if (submitError) {
      setError(submitError.message || 'Payment failed.')
      setLoading(false)
      return
    }

    const { error: confirmError } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/checkout/${eventSlug}/confirmation`,
      },
    })

    if (confirmError) {
      setError(confirmError.message || 'Payment failed.')
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      {error && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700 mb-4">{error}</div>
      )}
      <div className="mb-6">
        <PaymentElement />
      </div>
      <div className="flex gap-3">
        <Button type="button" variant="outline" onClick={() => navigate(`/checkout/${eventSlug}/details`)}>
          Back
        </Button>
        <Button type="submit" loading={loading} disabled={!stripe} className="flex-1">
          Pay ${checkoutData.calc?.total}
        </Button>
      </div>
    </form>
  )
}

export function CheckoutPayment() {
  const { eventSlug } = useParams()
  const navigate = useNavigate()
  const [clientSecret, setClientSecret] = useState('')
  const [checkoutData, setCheckoutData] = useState<CheckoutData | null>(null)
  const [error, setError] = useState('')
  const [initializing, setInitializing] = useState(true)

  useEffect(() => {
    const checkout = sessionStorage.getItem('checkout')
    if (!checkout) {
      navigate(`/checkout/${eventSlug}`)
      return
    }

    let parsed: CheckoutData
    try {
      parsed = JSON.parse(checkout)
    } catch {
      sessionStorage.removeItem('checkout')
      navigate(`/checkout/${eventSlug}`)
      return
    }

    setCheckoutData(parsed)

    // Create order on backend, then get PaymentIntent client_secret
    api.post('/checkout/', {
      action: 'complete',
      org_slug: parsed.org_slug,
      event_slug: parsed.event_slug,
      items: parsed.items,
      promo_code: parsed.promo_code || '',
      billing_name: parsed.billing_name,
      billing_email: parsed.billing_email,
      billing_phone: parsed.billing_phone || '',
    }).then((res) => {
      const orderId = res.data.id
      // Store order for confirmation page
      sessionStorage.setItem('completed_order', JSON.stringify(res.data))
      sessionStorage.removeItem('checkout')

      // Create PaymentIntent
      return api.post('/checkout/payment-intent/', { order_id: orderId })
    }).then((res) => {
      setClientSecret(res.data.client_secret)
    }).catch((err) => {
      setError(err.response?.data?.detail || 'Failed to initialize payment.')
    }).finally(() => {
      setInitializing(false)
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (!checkoutData) return null

  return (
    <div className="max-w-xl mx-auto px-4 py-10">
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs sm:text-sm text-gray-400 mb-8">
        <span>1. Select Tickets</span>
        <span className="hidden sm:inline">—</span><span>2. Your Details</span>
        <span className="hidden sm:inline">—</span><span className="text-(--color-primary) font-medium">3. Payment</span>
        <span className="hidden sm:inline">—</span><span>4. Confirmation</span>
      </div>

      <h1 className="text-2xl font-bold text-gray-900 mb-8">Payment</h1>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <div className="bg-gray-50 rounded-xl p-5 space-y-2 mb-6">
          {checkoutData.calc?.line_items.map((item, i) => (
            <div key={i} className="flex justify-between text-sm">
              <span>{item.quantity}x {item.tier_name}</span>
              <span>${item.line_total}</span>
            </div>
          ))}
          <div className="flex justify-between font-semibold text-gray-900 pt-2 border-t border-gray-200">
            <span>Total</span>
            <span>${checkoutData.calc?.total}</span>
          </div>
        </div>

        {initializing && (
          <div className="text-center py-8 text-gray-500">Setting up payment...</div>
        )}

        {error && !initializing && (
          <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>
        )}

        {!initializing && !error && !stripePromise && (
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center text-gray-500 text-sm">
            <p className="font-medium mb-2">Stripe not configured</p>
            <p>Set VITE_STRIPE_PUBLISHABLE_KEY in your environment to enable payments.</p>
            <Button
              className="mt-4"
              onClick={() => navigate(`/checkout/${eventSlug}/confirmation`)}
            >
              Continue without payment (test mode)
            </Button>
          </div>
        )}

        {!initializing && !error && stripePromise && clientSecret && (
          <Elements stripe={stripePromise} options={{ clientSecret }}>
            <PaymentForm checkoutData={checkoutData} eventSlug={eventSlug!} />
          </Elements>
        )}
      </div>

      {!initializing && !error && !stripePromise && (
        <div className="flex gap-3">
          <Button type="button" variant="outline" onClick={() => navigate(`/checkout/${eventSlug}/details`)}>
            Back
          </Button>
        </div>
      )}
    </div>
  )
}
