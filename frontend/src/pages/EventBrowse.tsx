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
    <div className="max-w-4xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Discover Events</h1>
      <p className="text-gray-500 mb-8">Find community events, fundraisers, workshops, and more.</p>

      {/* Search bar */}
      <form onSubmit={handleSearch} className="flex gap-3 mb-6">
        <div className="flex-1">
          <Input
            id="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search events, organizations..."
          />
        </div>
        <Button type="submit">Search</Button>
      </form>

      {/* Filters */}
      <div className="mb-8 space-y-3">
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => handleCategoryChange(cat)}
              className={`text-xs font-medium px-3 py-1.5 rounded-full border transition-colors ${
                category === cat
                  ? 'bg-(--color-primary) text-white border-transparent'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
              }`}
            >
              {formatLabel(cat)}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          {FORMATS.map((fmt) => (
            <button
              key={fmt}
              onClick={() => handleFormatChange(fmt)}
              className={`text-xs font-medium px-3 py-1.5 rounded-full border transition-colors ${
                format === fmt
                  ? 'bg-(--color-primary) text-white border-transparent'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
              }`}
            >
              {formatLabel(fmt)}
            </button>
          ))}
        </div>
      </div>

      {/* Results */}
      {loading ? (
        <div className="text-center text-gray-500 py-12">Loading...</div>
      ) : events.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-gray-500 text-lg mb-2">No events found</p>
          <p className="text-gray-400 text-sm">Try adjusting your search or filters.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {events.map((event) => (
            <Link
              key={`${event.org_slug}-${event.slug}`}
              to={`/${event.org_slug}/events/${event.slug}`}
              className="block bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow overflow-hidden"
            >
              <div className="flex">
                {event.cover_image_url ? (
                  <div className="w-40 h-32 flex-shrink-0">
                    <img src={event.cover_image_url} alt="" className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className="w-40 h-32 flex-shrink-0 bg-gray-100 flex items-center justify-center">
                    <span className="text-3xl text-gray-300">
                      {event.category === 'FUNDRAISER' ? '$' :
                       event.category === 'WORKSHOP' ? 'W' :
                       event.category === 'MEETUP' ? 'M' :
                       event.category === 'VOLUNTEER' ? 'V' : 'E'}
                    </span>
                  </div>
                )}
                <div className="p-4 flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-medium text-gray-500 uppercase">{event.category}</span>
                    <span className="text-xs text-gray-300">|</span>
                    <span className="text-xs text-gray-500">{formatLabel(event.format)}</span>
                  </div>
                  <h3 className="font-semibold text-gray-900 truncate">{event.title}</h3>
                  {event.subtitle && <p className="text-sm text-gray-500 truncate">{event.subtitle}</p>}
                  <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                    {event.date_tbd ? (
                      <span>Date TBD</span>
                    ) : event.start_datetime ? (
                      <span>{formatDate(event.start_datetime)}</span>
                    ) : null}
                    {event.venue_name && <span>{event.venue_name}</span>}
                    {event.venue_city && <span>{event.venue_city}</span>}
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    {event.org_logo_url ? (
                      <img src={event.org_logo_url} alt="" className="w-4 h-4 rounded-full" />
                    ) : (
                      <div className="w-4 h-4 rounded-full bg-gray-200" />
                    )}
                    <span className="text-xs text-gray-400">{event.org_name}</span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
