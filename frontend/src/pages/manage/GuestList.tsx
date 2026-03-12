import { useEffect, useState } from 'react'
import { useParams, useSearchParams, Link } from 'react-router-dom'
import api from '@/lib/api'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

interface Guest {
  id: string
  attendee_name: string
  attendee_email: string
  tier_name: string
  confirmation_code: string
  checked_in: boolean
  checked_in_at: string | null
  order_total: string
  created_at: string
}

export function GuestList() {
  const { eventSlug } = useParams()
  const [searchParams] = useSearchParams()
  const orgSlug = searchParams.get('org') || ''

  const [guests, setGuests] = useState<Guest[]>([])
  const [search, setSearch] = useState('')
  const [tierFilter, setTierFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [tiers, setTiers] = useState<string[]>([])

  const base = `/organizations/${orgSlug}/events/${eventSlug}`

  const loadGuests = () => {
    const params = new URLSearchParams()
    if (search) params.set('q', search)
    if (tierFilter) params.set('tier', tierFilter)
    if (statusFilter) params.set('status', statusFilter)
    api.get(`${base}/guests/?${params}`).then((res) => {
      setGuests(res.data)
      // Extract unique tiers
      const uniqueTiers = [...new Set(res.data.map((g: Guest) => g.tier_name))] as string[]
      if (tiers.length === 0) setTiers(uniqueTiers)
    })
  }

  useEffect(() => { loadGuests() }, [orgSlug, eventSlug, tierFilter, statusFilter])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    loadGuests()
  }

  const handleExportCSV = () => {
    window.open(`/api/v1${base}/guests/csv/`, '_blank')
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <Link to={`/manage/events?org=${orgSlug}`} className="hover:text-gray-900">Events</Link>
        <span>/</span>
        <Link to={`/manage/events/${eventSlug}?org=${orgSlug}`} className="hover:text-gray-900">{eventSlug}</Link>
        <span>/</span>
        <span className="text-gray-900">Guests</span>
      </div>

      <div className="flex gap-4 mb-8">
        <Link to={`/manage/events/${eventSlug}?org=${orgSlug}`}>
          <Button variant="outline">Overview</Button>
        </Link>
        <Link to={`/manage/events/${eventSlug}/guests?org=${orgSlug}`}>
          <Button variant="primary">Guests</Button>
        </Link>
        <Link to={`/manage/events/${eventSlug}/analytics?org=${orgSlug}`}>
          <Button variant="outline">Analytics</Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <form onSubmit={handleSearch} className="flex gap-2 flex-1">
          <Input
            id="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email, or code..."
          />
          <Button type="submit" variant="outline">Search</Button>
        </form>
        <select
          value={tierFilter}
          onChange={(e) => setTierFilter(e.target.value)}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
        >
          <option value="">All tiers</option>
          {tiers.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
        >
          <option value="">All statuses</option>
          <option value="checked_in">Checked in</option>
          <option value="not_checked_in">Not checked in</option>
        </select>
        <Button variant="outline" onClick={handleExportCSV}>Export CSV</Button>
      </div>

      {/* Guest table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-5 border-b border-gray-100 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-900">Guests ({guests.length})</h2>
        </div>
        {guests.length === 0 ? (
          <div className="p-8 text-center text-gray-500 text-sm">No guests found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left">
                <tr>
                  <th className="px-5 py-3 text-gray-500 font-medium">Name</th>
                  <th className="px-5 py-3 text-gray-500 font-medium">Email</th>
                  <th className="px-5 py-3 text-gray-500 font-medium">Tier</th>
                  <th className="px-5 py-3 text-gray-500 font-medium">Code</th>
                  <th className="px-5 py-3 text-gray-500 font-medium">Status</th>
                  <th className="px-5 py-3 text-gray-500 font-medium">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {guests.map((guest) => (
                  <tr key={guest.id} className="hover:bg-gray-50">
                    <td className="px-5 py-3 font-medium text-gray-900">{guest.attendee_name}</td>
                    <td className="px-5 py-3 text-gray-600">{guest.attendee_email}</td>
                    <td className="px-5 py-3 text-gray-600">{guest.tier_name}</td>
                    <td className="px-5 py-3 font-mono text-gray-500 text-xs">{guest.confirmation_code}</td>
                    <td className="px-5 py-3">
                      {guest.checked_in ? (
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">Checked In</span>
                      ) : (
                        <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded">Registered</span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-gray-500 text-xs">
                      {new Date(guest.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
