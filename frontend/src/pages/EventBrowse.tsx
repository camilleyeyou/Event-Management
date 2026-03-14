import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import api from '@/lib/api'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

interface BrowseEvent {
  slug: string
  title: string
  subtitle: string
  cover_image_url: string
  category: string
  format: string
  start_datetime: string | null
  timezone: string
  date_tbd: boolean
  venue_name: string | null
  venue_city: string | null
  org_name: string
  org_slug: string
  org_logo_url: string
}

const CATEGORIES = ['FUNDRAISER', 'WORKSHOP', 'MEETUP', 'VOLUNTEER', 'SOCIAL', 'OTHER']
const FORMATS = ['IN_PERSON', 'VIRTUAL', 'HYBRID']

const CATEGORY_COLORS: Record<string, string> = {
  FUNDRAISER: 'bg-amber-100 text-amber-700',
  WORKSHOP: 'bg-blue-100 text-blue-700',
  MEETUP: 'bg-green-100 text-green-700',
  VOLUNTEER: 'bg-purple-100 text-purple-700',
  SOCIAL: 'bg-rose-100 text-rose-700',
  OTHER: 'bg-gray-100 text-gray-600',
}

export function EventBrowse() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [events, setEvents] = useState<BrowseEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState(searchParams.get('q') || '')
  const [category, setCategory] = useState(searchParams.get('category') || '')
  const [format, setFormat] = useState(searchParams.get('format') || '')

  const fetchEvents = (params?: Record<string, string>) => {
    setLoading(true)
    const p = new URLSearchParams()
    const q = params?.q ?? query
    const cat = params?.category ?? category
    const fmt = params?.format ?? format
    if (q) p.set('q', q)
    if (cat) p.set('category', cat)
    if (fmt) p.set('format', fmt)

    api.get(`/public/events/?${p}`).then((res) => {
      setEvents(res.data)
    }).finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchEvents()
  }, [])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const params: Record<string, string> = {}
    if (query) params.q = query
    if (category) params.category = category
    if (format) params.format = format
    setSearchParams(params)
    fetchEvents(params)
  }

  const handleCategoryChange = (cat: string) => {
    const next = category === cat ? '' : cat
    setCategory(next)
    const params: Record<string, string> = {}
    if (query) params.q = query
    if (next) params.category = next
    if (format) params.format = format
    setSearchParams(params)
    fetchEvents({ ...params, category: next })
  }

  const handleFormatChange = (fmt: string) => {
    const next = format === fmt ? '' : fmt
    setFormat(next)
    const params: Record<string, string> = {}
    if (query) params.q = query
    if (category) params.category = category
    if (next) params.format = next
    setSearchParams(params)
    fetchEvents({ ...params, format: next })
  }

  const formatDate = (dt: string) =>
    new Date(dt).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    })

  const formatLabel = (s: string) =>
    s.charAt(0) + s.slice(1).toLowerCase().replace('_', '-')

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      {/* Header */}
      <div className="text-center mb-10">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Discover Events</h1>
        <p className="text-lg text-gray-500">Find community events, fundraisers, workshops, and more.</p>
      </div>

      {/* Search bar */}
      <form onSubmit={handleSearch} className="max-w-2xl mx-auto mb-8">
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <Input
              id="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search events, organizations..."
              className="pl-10"
            />
          </div>
          <Button type="submit">Search</Button>
        </div>
      </form>

      {/* Filters */}
      <div className="mb-10 space-y-3 flex flex-col items-center">
        <div className="flex flex-wrap gap-2 justify-center">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => handleCategoryChange(cat)}
              className={`text-xs font-medium px-3.5 py-2 rounded-full border transition-all duration-200 ${
                category === cat
                  ? 'bg-(--color-primary) text-white border-transparent shadow-sm'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:shadow-sm'
              }`}
            >
              {formatLabel(cat)}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2 justify-center">
          {FORMATS.map((fmt) => (
            <button
              key={fmt}
              onClick={() => handleFormatChange(fmt)}
              className={`text-xs font-medium px-3.5 py-2 rounded-full border transition-all duration-200 ${
                format === fmt
                  ? 'bg-(--color-primary) text-white border-transparent shadow-sm'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:shadow-sm'
              }`}
            >
              {formatLabel(fmt)}
            </button>
          ))}
        </div>
      </div>

      {/* Results */}
      {loading ? (
        <div className="text-center py-20">
          <div className="inline-flex items-center gap-2 text-gray-400">
            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Loading events...
          </div>
        </div>
      ) : events.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
            </svg>
          </div>
          <p className="text-gray-500 text-lg font-medium mb-1">No events found</p>
          <p className="text-gray-400 text-sm">Try adjusting your search or filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((event) => (
            <Link
              key={`${event.org_slug}-${event.slug}`}
              to={`/${event.org_slug}/events/${event.slug}`}
              className="group bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden card-hover"
            >
              {/* Cover image */}
              <div className="aspect-video bg-gray-100 relative overflow-hidden">
                {event.cover_image_url ? (
                  <img
                    src={event.cover_image_url}
                    alt=""
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full bg-linear-to-br from-gray-50 to-gray-100 flex items-center justify-center">
                    <svg className="w-10 h-10 text-gray-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                    </svg>
                  </div>
                )}
                {/* Category badge */}
                <div className="absolute top-3 left-3">
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${CATEGORY_COLORS[event.category] || CATEGORY_COLORS.OTHER}`}>
                    {formatLabel(event.category)}
                  </span>
                </div>
                {/* Format badge */}
                <div className="absolute top-3 right-3">
                  <span className="text-xs font-medium px-2 py-1 rounded-full bg-white/80 backdrop-blur-sm text-gray-600">
                    {formatLabel(event.format)}
                  </span>
                </div>
              </div>

              {/* Content */}
              <div className="p-5">
                <h3 className="font-semibold text-gray-900 group-hover:text-(--color-primary) transition-colors line-clamp-1">
                  {event.title}
                </h3>
                {event.subtitle && (
                  <p className="text-sm text-gray-500 mt-0.5 line-clamp-1">{event.subtitle}</p>
                )}

                <div className="mt-3 space-y-1.5">
                  {/* Date */}
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                    </svg>
                    <span>{event.date_tbd ? 'Date TBD' : event.start_datetime ? formatDate(event.start_datetime) : ''}</span>
                  </div>

                  {/* Venue */}
                  {(event.venue_name || event.venue_city) && (
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                      </svg>
                      <span className="truncate">{event.venue_name}{event.venue_city ? `, ${event.venue_city}` : ''}</span>
                    </div>
                  )}
                </div>

                {/* Org */}
                <div className="mt-4 pt-3 border-t border-gray-100 flex items-center gap-2">
                  {event.org_logo_url ? (
                    <img src={event.org_logo_url} alt="" className="w-5 h-5 rounded-full object-cover" />
                  ) : (
                    <div className="w-5 h-5 rounded-full bg-linear-to-br from-(--color-primary) to-(--color-accent) flex items-center justify-center">
                      <span className="text-[8px] font-bold text-white">{event.org_name?.charAt(0)}</span>
                    </div>
                  )}
                  <span className="text-xs font-medium text-gray-500">{event.org_name}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
