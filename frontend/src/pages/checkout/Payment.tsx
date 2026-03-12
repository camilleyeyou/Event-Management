import { useParams, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/Button'

export function CheckoutPayment() {
  const { eventSlug } = useParams()
  const navigate = useNavigate()

  const checkout = sessionStorage.getItem('checkout')
  if (!checkout) {
    navigate(`/checkout/${eventSlug}`)
    return null
  }

  const checkoutData = JSON.parse(checkout)

  // For now, show a placeholder for Stripe Elements
  // Full Stripe integration requires publishable key configuration
  const handlePay = () => {
    // In production: use Stripe Elements to collect card, then complete
    // For MVP testing: proceed directly to confirmation
    navigate(`/checkout/${eventSlug}/confirmation`)
  }

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
          {checkoutData.calc?.line_items.map((item: { quantity: number; tier_name: string; line_total: string }, i: number) => (
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

        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center text-gray-500 text-sm">
          <p className="font-medium mb-2">Stripe Payment Form</p>
          <p>Configure STRIPE_PUBLISHABLE_KEY and STRIPE_SECRET_KEY in .env to enable card payments.</p>
          <p className="mt-2 text-xs text-gray-400">For testing, click "Pay Now" to simulate a successful payment.</p>
        </div>
      </div>

      <div className="flex gap-3">
        <Button type="button" variant="outline" onClick={() => navigate(`/checkout/${eventSlug}/details`)}>
          Back
        </Button>
        <Button onClick={handlePay} className="flex-1">
          Pay ${checkoutData.calc?.total}
        </Button>
      </div>
    </div>
  )
}
