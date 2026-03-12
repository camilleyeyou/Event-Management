import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import api from '@/lib/api'
import { Button } from '@/components/ui/Button'

interface TicketTier {
  id: string
  name: string
  description: string
  price: string
  quantity_remaining: number
}

interface EventData {
  event: {
    title: string
    subtitle: string
    slug: string
    description: string
    format: string
    status: string
    category: string
    cover_image_url: string
    start_datetime: string | null
    end_datetime: string | null
    timezone: string
    date_tbd: boolean
    venue_detail: {
      name: string
      address: string
      city: string
      state: string
      accessibility_info: string
      parking_notes: string
    } | null
  }
  organization: {
    name: string
    slug: string
    logo_url: string
    primary_color: string
    description: string
    contact_email: string
  }
  ticket_tiers: TicketTier[]
}

export function EventPage() {
  const { orgSlug, eventSlug } = useParams()
  const [data, setData] = useState<EventData | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    api
      .get(`/public/${orgSlug}/events/${eventSlug}/`)
      .then((res) => setData(res.data))
      .catch(() => setError('Event not found.'))
  }, [orgSlug, eventSlug])

  if (error) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Event Not Found</h1>
        <p className="text-gray-500 mb-6">This event may have been removed or is not yet public.</p>
        <Link to="/events"><Button variant="outline">Browse events</Button></Link>
      </div>
    )
  }

  if (!data) return <div className="p-8 text-center text-gray-500">Loading...</div>

  const { event, organization, ticket_tiers } = data
  const isPast = event.status === 'COMPLETED'
  const hasFreeTiers = ticket_tiers.some((t) => parseFloat(t.price) === 0)
  const hasPaidTiers = ticket_tiers.some((t) => parseFloat(t.price) > 0)

  const formatDate = (dt: string) =>
    new Date(dt).toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    })

  const formatTime = (dt: string) =>
    new Date(dt).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    })

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <Link to="/events" className="hover:text-gray-900">Events</Link>
        <span>/</span>
        <Link to={`/${orgSlug}`} className="hover:text-gray-900">{organization.name}</Link>
        <span>/</span>
        <span className="text-gray-900">{event.title}</span>
      </div>

      {/* Cover image */}
      {event.cover_image_url && (
        <div className="rounded-xl overflow-hidden mb-6">
          <img
            src={event.cover_image_url}
            alt={event.title}
            className="w-full h-64 object-cover"
          />
        </div>
      )}

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <span className="inline-block text-xs font-medium px-2.5 py-1 rounded-full bg-gray-100 text-gray-600">
            {event.category}
          </span>
          <span className="inline-block text-xs font-medium px-2.5 py-1 rounded-full bg-gray-100 text-gray-600">
            {event.format.replace('_', '-')}
          </span>
          {isPast && (
            <span className="inline-block text-xs font-medium px-2.5 py-1 rounded-full bg-gray-200 text-gray-500">
              Past Event
            </span>
          )}
        </div>
        <h1 className="text-3xl font-bold text-gray-900">{event.title}</h1>
        {event.subtitle && <p className="text-lg text-gray-500 mt-1">{event.subtitle}</p>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Main content */}
        <div className="md:col-span-2 space-y-6">
          {/* Date & time */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">Date & Time</h2>
            {event.date_tbd ? (
              <p className="text-gray-900">Date to be announced</p>
            ) : event.start_datetime ? (
              <div>
                <p className="text-gray-900 font-medium">{formatDate(event.start_datetime)}</p>
                <p className="text-gray-600">
                  {formatTime(event.start_datetime)}
                  {event.end_datetime && ` – ${formatTime(event.end_datetime)}`}
                </p>
                <p className="text-sm text-gray-400 mt-1">{event.timezone}</p>
              </div>
            ) : null}
          </div>

          {/* Venue */}
          {event.venue_detail && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">Location</h2>
              <p className="text-gray-900 font-medium">{event.venue_detail.name}</p>
              <p className="text-gray-600">{event.venue_detail.address}</p>
              <p className="text-gray-600">{event.venue_detail.city}, {event.venue_detail.state}</p>
              {event.venue_detail.accessibility_info && (
                <p className="text-sm text-gray-500 mt-2">Accessibility: {event.venue_detail.accessibility_info}</p>
              )}
              {event.venue_detail.parking_notes && (
                <p className="text-sm text-gray-500 mt-1">Parking: {event.venue_detail.parking_notes}</p>
              )}
            </div>
          )}

          {/* Description */}
          {event.description && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">About This Event</h2>
              <div
                className="prose prose-sm max-w-none text-gray-700"
                dangerouslySetInnerHTML={{ __html: event.description }}
              />
            </div>
          )}

          {/* Organizer */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">Organized by</h2>
            <Link to={`/${organization.slug}`} className="flex items-center gap-3 hover:opacity-80">
              {organization.logo_url ? (
                <img src={organization.logo_url} alt={organization.name} className="w-10 h-10 rounded-full object-cover" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 text-sm font-bold">
                  {organization.name.charAt(0)}
                </div>
              )}
              <div>
                <p className="font-medium text-gray-900">{organization.name}</p>
                {organization.contact_email && (
                  <p className="text-sm text-gray-500">{organization.contact_email}</p>
                )}
              </div>
            </Link>
          </div>
        </div>

        {/* Sidebar - tickets */}
        <div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 sticky top-24">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              {isPast ? 'This event has ended' : 'Tickets'}
            </h2>

            {!isPast && ticket_tiers.length > 0 ? (
              <>
                <div className="space-y-3 mb-5">
                  {ticket_tiers.map((tier) => (
                    <div key={tier.id} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{tier.name}</p>
                        {tier.description && <p className="text-xs text-gray-500">{tier.description}</p>}
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900">
                          {parseFloat(tier.price) === 0 ? 'Free' : `$${tier.price}`}
                        </p>
                        {tier.quantity_remaining <= 10 && tier.quantity_remaining > 0 && (
                          <p className="text-xs text-orange-500">{tier.quantity_remaining} left</p>
                        )}
                        {tier.quantity_remaining === 0 && (
                          <p className="text-xs text-red-500">Sold out</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <Link to={`/checkout/${eventSlug}`}>
                  <Button className="w-full">
                    {hasFreeTiers && !hasPaidTiers ? 'Register' : 'Get Tickets'}
                  </Button>
                </Link>
              </>
            ) : !isPast ? (
              <p className="text-sm text-gray-500">No tickets available at this time.</p>
            ) : (
              <p className="text-sm text-gray-500">Check back for future events from this organizer.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
