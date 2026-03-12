import { useEffect, useState } from 'react'
import { useParams, useSearchParams, Link } from 'react-router-dom'
import api from '@/lib/api'
import { Button } from '@/components/ui/Button'

interface EventData {
  id: string
  title: string
  subtitle: string
  slug: string
  description: string
  format: string
  status: string
  category: string
  start_datetime: string | null
  end_datetime: string | null
  timezone: string
  is_private: boolean
  venue_detail: { name: string; city: string; state: string } | null
  virtual_link: string
  org_slug: string
}

const statusColors: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-600',
  PUBLISHED: 'bg-green-100 text-green-700',
  LIVE: 'bg-blue-100 text-blue-700',
  COMPLETED: 'bg-purple-100 text-purple-700',
  CANCELLED: 'bg-red-100 text-red-600',
}

export function EventDetail() {
  const { eventSlug } = useParams()
  const [searchParams] = useSearchParams()
  const orgSlug = searchParams.get('org') || ''
  const [event, setEvent] = useState<EventData | null>(null)
  const [actionLoading, setActionLoading] = useState('')

  const loadEvent = () => {
    api.get(`/organizations/${orgSlug}/events/${eventSlug}/`).then((res) => setEvent(res.data))
  }

  useEffect(() => { loadEvent() }, [orgSlug, eventSlug])

  const handlePublish = async () => {
    setActionLoading('publish')
    try {
      await api.post(`/organizations/${orgSlug}/events/${eventSlug}/publish/`)
      loadEvent()
    } catch { /* handled */ }
    setActionLoading('')
  }

  const handleCancel = async () => {
    if (!confirm('Are you sure you want to cancel this event? Attendees will be notified.')) return
    setActionLoading('cancel')
    try {
      await api.post(`/organizations/${orgSlug}/events/${eventSlug}/cancel/`)
      loadEvent()
    } catch { /* handled */ }
    setActionLoading('')
  }

  if (!event) return <div className="p-8 text-center text-gray-500">Loading...</div>

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <Link to={`/manage/events?org=${orgSlug}`} className="hover:text-gray-900">Events</Link>
        <span>/</span>
        <span className="text-gray-900">{event.title}</span>
      </div>

      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{event.title}</h1>
            {event.subtitle && <p className="text-gray-500 mt-1">{event.subtitle}</p>}
            <div className="flex flex-wrap items-center gap-2 mt-3">
              <span className={`text-xs font-medium px-2 py-1 rounded uppercase ${statusColors[event.status]}`}>
                {event.status}
              </span>
              <span className="text-sm text-gray-500">{event.category}</span>
              <span className="text-sm text-gray-400">{event.format.replace('_', '-')}</span>
              {event.is_private && <span className="text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded">Private</span>}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {event.status === 'DRAFT' && (
              <Button onClick={handlePublish} loading={actionLoading === 'publish'}>Publish</Button>
            )}
            {!['COMPLETED', 'CANCELLED'].includes(event.status) && (
              <Link to={`/manage/events/${event.slug}/edit?org=${orgSlug}`}>
                <Button variant="outline">Edit</Button>
              </Link>
            )}
            {['PUBLISHED', 'LIVE'].includes(event.status) && (
              <Link to={`/manage/events/${event.slug}/check-in?org=${orgSlug}`}>
                <Button variant="outline">Check-In</Button>
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Info cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Date & Time</h3>
          {event.start_datetime ? (
            <>
              <p className="font-medium text-gray-900">
                {new Date(event.start_datetime).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
              </p>
              <p className="text-sm text-gray-600">
                {new Date(event.start_datetime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                {event.end_datetime && ` - ${new Date(event.end_datetime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`}
              </p>
              <p className="text-xs text-gray-400 mt-1">{event.timezone}</p>
            </>
          ) : (
            <p className="text-gray-500">Date TBD</p>
          )}
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Location</h3>
          {event.venue_detail ? (
            <>
              <p className="font-medium text-gray-900">{event.venue_detail.name}</p>
              <p className="text-sm text-gray-600">{event.venue_detail.city}, {event.venue_detail.state}</p>
            </>
          ) : event.virtual_link ? (
            <p className="text-sm text-gray-600">Virtual Event</p>
          ) : (
            <p className="text-gray-500">No location set</p>
          )}
        </div>
      </div>

      {/* Description */}
      {event.description && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <h3 className="text-sm font-medium text-gray-500 mb-3">Description</h3>
          <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-wrap">
            {event.description}
          </div>
        </div>
      )}

      {/* Actions */}
      {!['COMPLETED', 'CANCELLED'].includes(event.status) && (
        <div className="flex justify-end">
          <button
            onClick={handleCancel}
            disabled={actionLoading === 'cancel'}
            className="text-sm text-red-500 hover:text-red-700"
          >
            {actionLoading === 'cancel' ? 'Cancelling...' : 'Cancel Event'}
          </button>
        </div>
      )}
    </div>
  )
}
