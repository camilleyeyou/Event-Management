import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import api from '@/lib/api'

interface OrgData {
  organization: {
    name: string
    slug: string
    description: string
    website_url: string
    logo_url: string
    banner_url: string
    primary_color: string
    contact_email: string
    contact_phone: string
  }
  events: Array<{
    slug: string
    title: string
    subtitle: string
    cover_image_url: string
    category: string
    format: string
    status: string
    start_datetime: string | null
    end_datetime: string | null
    timezone: string
    date_tbd: boolean
    venue_name: string | null
    venue_city: string | null
  }>
}

export function OrgPage() {
  const { orgSlug } = useParams()
  const [data, setData] = useState<OrgData | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    api
      .get(`/public/${orgSlug}/`)
      .then((res) => setData(res.data))
      .catch(() => setError('Organization not found.'))
  }, [orgSlug])

  if (error) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Not Found</h1>
        <p className="text-gray-500">This organization page doesn't exist.</p>
      </div>
    )
  }

  if (!data) return <div className="p-8 text-center text-gray-500">Loading...</div>

  const { organization, events } = data
  const upcoming = events.filter((e) => e.status === 'PUBLISHED' || e.status === 'LIVE')
  const past = events.filter((e) => e.status === 'COMPLETED')

  return (
    <div>
      {/* Banner */}
      {organization.banner_url ? (
        <div className="h-48 md:h-64 w-full overflow-hidden">
          <img src={organization.banner_url} alt="" className="w-full h-full object-cover" />
        </div>
      ) : (
        <div className="h-32 w-full" style={{ backgroundColor: organization.primary_color }} />
      )}

      <div className="max-w-3xl mx-auto px-4 -mt-12">
        {/* Org header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4 mb-8">
          {organization.logo_url ? (
            <img
              src={organization.logo_url}
              alt={organization.name}
              className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl object-cover border-4 border-white shadow-sm"
            />
          ) : (
            <div
              className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl border-4 border-white shadow-sm flex items-center justify-center text-white text-2xl sm:text-3xl font-bold"
              style={{ backgroundColor: organization.primary_color }}
            >
              {organization.name.charAt(0)}
            </div>
          )}
          <div className="pb-1">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">{organization.name}</h1>
            {organization.website_url && (
              <a
                href={organization.website_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-(--color-primary) hover:underline"
              >
                {organization.website_url.replace(/^https?:\/\//, '')}
              </a>
            )}
          </div>
        </div>

        {/* Description */}
        {organization.description && (
          <p className="text-gray-600 mb-8 max-w-2xl">{organization.description}</p>
        )}

        {/* Contact info */}
        {(organization.contact_email || organization.contact_phone) && (
          <div className="flex gap-6 text-sm text-gray-500 mb-10">
            {organization.contact_email && <span>Email: {organization.contact_email}</span>}
            {organization.contact_phone && <span>Phone: {organization.contact_phone}</span>}
          </div>
        )}

        {/* Upcoming events */}
        <div className="mb-10">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Upcoming Events {upcoming.length > 0 && `(${upcoming.length})`}
          </h2>
          {upcoming.length === 0 ? (
            <p className="text-gray-500 text-sm">No upcoming events at the moment.</p>
          ) : (
            <div className="space-y-4">
              {upcoming.map((event) => (
                <EventCard key={event.slug} event={event} orgSlug={organization.slug} />
              ))}
            </div>
          )}
        </div>

        {/* Past events */}
        {past.length > 0 && (
          <div className="mb-10">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Past Events ({past.length})</h2>
            <div className="space-y-4">
              {past.map((event) => (
                <EventCard key={event.slug} event={event} orgSlug={organization.slug} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function EventCard({ event, orgSlug }: { event: OrgData['events'][0]; orgSlug: string }) {
  const formatDate = (dt: string) =>
    new Date(dt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

  return (
    <Link
      to={`/${orgSlug}/events/${event.slug}`}
      className="block bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow overflow-hidden"
    >
      <div className="flex flex-col sm:flex-row">
        {event.cover_image_url && (
          <div className="w-full sm:w-32 h-40 sm:h-28 shrink-0">
            <img src={event.cover_image_url} alt="" className="w-full h-full object-cover" />
          </div>
        )}
        <div className="p-4 flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-medium text-gray-500 uppercase">{event.category}</span>
            {event.status === 'COMPLETED' && (
              <span className="text-xs text-gray-400">Past</span>
            )}
          </div>
          <h3 className="font-semibold text-gray-900 truncate">{event.title}</h3>
          {event.subtitle && <p className="text-sm text-gray-500 truncate">{event.subtitle}</p>}
          <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-gray-500">
            {event.date_tbd ? (
              <span>Date TBD</span>
            ) : event.start_datetime ? (
              <span>{formatDate(event.start_datetime)}</span>
            ) : null}
            {event.venue_name && <span>{event.venue_name}</span>}
            {event.venue_city && <span>{event.venue_city}</span>}
          </div>
        </div>
      </div>
    </Link>
  )
}
