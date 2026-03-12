import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '@/lib/api'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

interface Tier {
  id: string
  name: string
  description: string
  price: string
  quantity_remaining: number
  min_per_order: number
  max_per_order: number
  visibility: string
}

interface EventData {
  title: string
  slug: string
  org_slug: string
  start_datetime: string | null
  venue_detail: { name: string } | null
}

interface CalcResult {
  line_items: Array<{ tier_name: string; quantity: number; unit_price: string; line_total: string }>
  subtotal: string
  discount_amount: string
  total: string
  is_free: boolean
  promo_applied: string | null
}

export function SelectTickets() {
  const { eventSlug } = useParams()
  const navigate = useNavigate()
  const [event, setEvent] = useState<EventData | null>(null)
  const [tiers, setTiers] = useState<Tier[]>([])
  const [quantities, setQuantities] = useState<Record<string, number>>({})
  const [promoCode, setPromoCode] = useState('')
  const [calcResult, setCalcResult] = useState<CalcResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // We need org_slug - get it from the public event endpoint or URL
  const [orgSlug, setOrgSlug] = useState('')

  useEffect(() => {
    // Fetch event info from all orgs the user has or from public
    // For simplicity, we'll search for the event across orgs
    api.get('/organizations/').then(async (orgRes) => {
      for (const org of orgRes.data) {
        try {
          const eventRes = await api.get(`/public/${org.slug}/events/${eventSlug}/`)
          setEvent({ ...eventRes.data, org_slug: org.slug })
          setOrgSlug(org.slug)
          // Get tiers
          const tierRes = await api.get(`/organizations/${org.slug}/events/${eventSlug}/ticket-tiers/`)
          setTiers(tierRes.data.filter((t: Tier) => t.visibility === 'PUBLIC' && t.quantity_remaining > 0))
          return
        } catch {
          // not in this org
        }
      }
      // Try public endpoint without auth
      try {
        // We need to figure out the org slug from URL or event data
        // For now, try a direct public lookup pattern
      } catch {
        setError('Event not found.')
      }
    }).catch(() => {
      setError('Could not load event.')
    })
  }, [eventSlug])

  const updateQty = (tierId: string, delta: number) => {
    const tier = tiers.find(t => t.id === tierId)
    if (!tier) return
    const current = quantities[tierId] || 0
    const next = Math.max(0, Math.min(current + delta, tier.max_per_order, tier.quantity_remaining))
    setQuantities({ ...quantities, [tierId]: next })
  }

  const totalQty = Object.values(quantities).reduce((sum, q) => sum + q, 0)

  const handleCalculate = async () => {
    setLoading(true)
    setError('')
    const items = Object.entries(quantities)
      .filter(([, qty]) => qty > 0)
      .map(([tier_id, quantity]) => ({ tier_id, quantity }))

    try {
      const res = await api.post('/checkout/', {
        action: 'calculate',
        org_slug: orgSlug,
        event_slug: eventSlug,
        items,
        promo_code: promoCode,
      })
      setCalcResult(res.data)
    } catch (err: unknown) {
      const e = err as { response?: { data?: { detail?: string } } }
      setError(e.response?.data?.detail || 'Failed to calculate.')
    } finally {
      setLoading(false)
    }
  }

  const handleContinue = () => {
    const items = Object.entries(quantities)
      .filter(([, qty]) => qty > 0)
      .map(([tier_id, quantity]) => ({ tier_id, quantity }))

    // Store checkout state in sessionStorage
    sessionStorage.setItem('checkout', JSON.stringify({
      org_slug: orgSlug,
      event_slug: eventSlug,
      items,
      promo_code: promoCode,
      calc: calcResult,
    }))
    navigate(`/checkout/${eventSlug}/details`)
  }

  if (error && !event) {
    return <div className="max-w-xl mx-auto px-4 py-16 text-center text-red-600">{error}</div>
  }

  if (!event) return <div className="p-8 text-center text-gray-500">Loading...</div>

  return (
    <div className="max-w-xl mx-auto px-4 py-10">
      {/* Steps indicator */}
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs sm:text-sm text-gray-400 mb-8">
        <span className="text-(--color-primary) font-medium">1. Select Tickets</span>
        <span className="hidden sm:inline">—</span><span>2. Your Details</span>
        <span className="hidden sm:inline">—</span><span>3. Payment</span>
        <span className="hidden sm:inline">—</span><span>4. Confirmation</span>
      </div>

      <h1 className="text-2xl font-bold text-gray-900 mb-1">{event.title}</h1>
      {event.start_datetime && (
        <p className="text-sm text-gray-500 mb-6">
          {new Date(event.start_datetime).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
          {event.venue_detail && ` · ${event.venue_detail.name}`}
        </p>
      )}

      {error && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700 mb-4">{error}</div>}

      {/* Ticket tiers */}
      <div className="space-y-3 mb-6">
        {tiers.map((tier) => (
          <div key={tier.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <p className="font-medium text-gray-900">{tier.name}</p>
              {tier.description && <p className="text-sm text-gray-500 mt-0.5">{tier.description}</p>}
              <p className="text-sm text-gray-600 mt-1">
                {parseFloat(tier.price) === 0 ? 'Free' : `$${tier.price}`}
                <span className="text-gray-400 ml-2">{tier.quantity_remaining} left</span>
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => updateQty(tier.id, -1)}
                disabled={(quantities[tier.id] || 0) <= 0}
                className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center text-gray-600 hover:bg-gray-50 disabled:opacity-30"
              >-</button>
              <span className="w-6 text-center font-medium">{quantities[tier.id] || 0}</span>
              <button
                onClick={() => updateQty(tier.id, 1)}
                disabled={(quantities[tier.id] || 0) >= Math.min(tier.max_per_order, tier.quantity_remaining)}
                className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center text-gray-600 hover:bg-gray-50 disabled:opacity-30"
              >+</button>
            </div>
          </div>
        ))}
      </div>

      {/* Promo code */}
      <div className="flex gap-3 items-end mb-6">
        <div className="flex-1">
          <Input
            id="promo"
            label="Promo code"
            value={promoCode}
            onChange={(e) => setPromoCode(e.target.value)}
            placeholder="Enter code"
          />
        </div>
        <Button variant="outline" onClick={handleCalculate} disabled={totalQty === 0}>
          Apply
        </Button>
      </div>

      {/* Summary */}
      {calcResult && (
        <div className="bg-gray-50 rounded-xl p-5 mb-6 space-y-2">
          {calcResult.line_items.map((item, i) => (
            <div key={i} className="flex justify-between text-sm">
              <span>{item.quantity}x {item.tier_name}</span>
              <span>{parseFloat(item.line_total) === 0 ? 'Free' : `$${item.line_total}`}</span>
            </div>
          ))}
          {parseFloat(calcResult.discount_amount) > 0 && (
            <div className="flex justify-between text-sm text-green-600">
              <span>Discount {calcResult.promo_applied && `(${calcResult.promo_applied})`}</span>
              <span>-${calcResult.discount_amount}</span>
            </div>
          )}
          <div className="flex justify-between font-semibold text-gray-900 pt-2 border-t border-gray-200">
            <span>Total</span>
            <span>{parseFloat(calcResult.total) === 0 ? 'Free' : `$${calcResult.total}`}</span>
          </div>
        </div>
      )}

      <Button
        onClick={totalQty > 0 && !calcResult ? handleCalculate : handleContinue}
        disabled={totalQty === 0}
        loading={loading}
        className="w-full"
      >
        {totalQty === 0 ? 'Select tickets to continue' : !calcResult ? 'Review Order' : 'Continue'}
      </Button>
    </div>
  )
}
