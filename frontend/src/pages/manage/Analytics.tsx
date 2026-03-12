import { useEffect, useState } from 'react'
import { useParams, useSearchParams, Link } from 'react-router-dom'
import api from '@/lib/api'
import { Button } from '@/components/ui/Button'

interface AnalyticsData {
  registrations: {
    total: number
    by_tier: Array<{ tier_name: string; price: string; count: number; checked_in: number }>
  }
  attendance: {
    checked_in: number
    total: number
    rate: number
  }
  revenue: {
    gross: string
    discounts: string
    fees: string
    net: string
    orders: number
  }
  refunds: {
    count: number
    amount: string
  }
  timeline: Array<{ date: string; count: number }>
  promo_codes: Array<{ code: string; usage: number; discount_total: string }>
}

export function Analytics() {
  const { eventSlug } = useParams()
  const [searchParams] = useSearchParams()
  const orgSlug = searchParams.get('org') || ''
  const [data, setData] = useState<AnalyticsData | null>(null)

  useEffect(() => {
    api.get(`/organizations/${orgSlug}/events/${eventSlug}/analytics/`).then((res) => setData(res.data))
  }, [orgSlug, eventSlug])

  if (!data) return <div className="p-8 text-center text-gray-500">Loading...</div>

  const hasRevenue = parseFloat(data.revenue.gross) > 0

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <Link to={`/manage/events?org=${orgSlug}`} className="hover:text-gray-900">Events</Link>
        <span>/</span>
        <Link to={`/manage/events/${eventSlug}?org=${orgSlug}`} className="hover:text-gray-900">{eventSlug}</Link>
        <span>/</span>
        <span className="text-gray-900">Analytics</span>
      </div>

      <div className="flex flex-wrap gap-2 sm:gap-4 mb-8">
        <Link to={`/manage/events/${eventSlug}?org=${orgSlug}`}>
          <Button variant="outline">Overview</Button>
        </Link>
        <Link to={`/manage/events/${eventSlug}/guests?org=${orgSlug}`}>
          <Button variant="outline">Guests</Button>
        </Link>
        <Link to={`/manage/events/${eventSlug}/analytics?org=${orgSlug}`}>
          <Button variant="primary">Analytics</Button>
        </Link>
      </div>

      {/* Top-level metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <p className="text-sm text-gray-500">Registrations</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{data.registrations.total}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <p className="text-sm text-gray-500">Attendance Rate</p>
          <p className="text-3xl font-bold text-green-600 mt-1">{data.attendance.rate}%</p>
          <p className="text-xs text-gray-400">{data.attendance.checked_in}/{data.attendance.total}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <p className="text-sm text-gray-500">Gross Revenue</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">
            {hasRevenue ? `$${data.revenue.gross}` : 'Free'}
          </p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <p className="text-sm text-gray-500">Net Revenue</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">
            {hasRevenue ? `$${data.revenue.net}` : 'Free'}
          </p>
          {hasRevenue && <p className="text-xs text-gray-400">{data.revenue.orders} orders</p>}
        </div>
      </div>

      {/* Registrations by tier */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Registrations by Tier</h2>
        <div className="space-y-3">
          {data.registrations.by_tier.map((tier) => (
            <div key={tier.tier_name}>
              <div className="flex justify-between text-sm mb-1">
                <span className="font-medium text-gray-900">
                  {tier.tier_name}
                  <span className="text-gray-400 ml-2">
                    {parseFloat(tier.price) === 0 ? 'Free' : `$${tier.price}`}
                  </span>
                </span>
                <span className="text-gray-600">{tier.count} registered · {tier.checked_in} checked in</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-(--color-primary) h-2 rounded-full"
                  style={{ width: `${data.registrations.total > 0 ? (tier.count / data.registrations.total * 100) : 0}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Registration timeline */}
      {data.timeline.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Registration Timeline</h2>
          <div className="space-y-2">
            {data.timeline.map((day) => {
              const maxCount = Math.max(...data.timeline.map(d => d.count))
              return (
                <div key={day.date} className="flex items-center gap-3">
                  <span className="text-xs text-gray-500 w-24">{new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                  <div className="flex-1 bg-gray-100 rounded-full h-4">
                    <div
                      className="bg-(--color-primary) h-4 rounded-full flex items-center justify-end pr-2"
                      style={{ width: `${maxCount > 0 ? (day.count / maxCount * 100) : 0}%`, minWidth: '24px' }}
                    >
                      <span className="text-[10px] text-white font-medium">{day.count}</span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Promo code usage */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Promo Code Usage</h2>
          {data.promo_codes.length === 0 ? (
            <p className="text-sm text-gray-500">No promo codes used.</p>
          ) : (
            <div className="space-y-2">
              {data.promo_codes.map((p) => (
                <div key={p.code} className="flex justify-between text-sm">
                  <span className="font-mono text-gray-900">{p.code}</span>
                  <span className="text-gray-500">{p.usage} uses · ${p.discount_total} saved</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Revenue breakdown */}
        {hasRevenue && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Revenue Breakdown</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Gross revenue</span>
                <span className="text-gray-900">${data.revenue.gross}</span>
              </div>
              <div className="flex justify-between text-green-600">
                <span>Discounts</span>
                <span>-${data.revenue.discounts}</span>
              </div>
              <div className="flex justify-between border-t border-gray-200 pt-2 font-semibold">
                <span className="text-gray-900">Net revenue</span>
                <span className="text-gray-900">${data.revenue.net}</span>
              </div>
              {data.refunds.count > 0 && (
                <div className="flex justify-between text-red-600 pt-2">
                  <span>Refunds ({data.refunds.count})</span>
                  <span>-${data.refunds.amount}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
