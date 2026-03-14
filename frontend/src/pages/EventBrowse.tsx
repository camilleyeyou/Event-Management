import { useEffect, useState, useCallback } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import api from '@/lib/api'

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

const CATEGORY_EMOJI: Record<string, string> = {
  FUNDRAISER: '$',
  WORKSHOP: 'W',
  MEETUP: 'M',
  VOLUNTEER: 'V',
  SOCIAL: 'S',
  OTHER: 'E',
}

const CATEGORY_GRADIENT: Record<string, string> = {
  FUNDRAISER: 'from-amber-400 to-orange-500',
  WORKSHOP: 'from-blue-400 to-indigo-500',
  MEETUP: 'from-emerald-400 to-teal-500',
  VOLUNTEER: 'from-purple-400 to-violet-500',
  SOCIAL: 'from-rose-400 to-pink-500',
  OTHER: 'from-gray-400 to-slate-500',
}

export function EventBrowse() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [events, setEvents] = useState<BrowseEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState(searchParams.get('q') || '')
  const [category, setCategory] = useState(searchParams.get('category') || '')
  const [format, setFormat] = useState(searchParams.get('format') || '')

  const fetchEvents = useCallback((params?: Record<string, string>) => {
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
  }, [query, category, format])

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

  const toggleFilter = (type: 'category' | 'format', value: string) => {
    const setter = type === 'category' ? setCategory : setFormat
    const current = type === 'category' ? category : format
    const next = current === value ? '' : value
    setter(next)
    const params: Record<string, string> = {}
    if (query) params.q = query
    if (type === 'category' ? next : category) params.category = type === 'category' ? next : category
    if (type === 'format' ? next : format) params.format = type === 'format' ? next : format
    setSearchParams(params)
    fetchEvents(params)
  }

  const formatDate = (dt: string) => {
    const d = new Date(dt)
    const month = d.toLocaleDateString('en-US', { month: 'short' }).toUpperCase()
    const day = d.getDate()
    const weekday = d.toLocaleDateString('en-US', { weekday: 'short' })
    const time = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
    return { month, day, weekday, time }
  }

  const formatLabel = (s: string) =>
    s.charAt(0) + s.slice(1).toLowerCase().replace('_', ' ')

  return (
    <div className="min-h-screen">
      {/* Hero header with gradient */}
      <div className="relative overflow-hidden bg-linear-to-b from-gray-50 via-white to-white">
        {/* Decorative background */}
        <div className="absolute inset-0 bg-dots opacity-40" />
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-linear-to-br from-(--color-primary)/5 to-(--color-accent)/5 rounded-full blur-3xl" />
        <div className="absolute top-10 right-1/4 w-72 h-72 bg-linear-to-br from-(--color-rose)/5 to-(--color-warm)/5 rounded-full blur-3xl" />

        <div className="relative max-w-6xl mx-auto px-4 pt-16 pb-8">
          {/* Title */}
          <div className="text-center mb-10 animate-fade-up">
            <h1 className="text-5xl sm:text-6xl font-extrabold tracking-tight text-gray-900 mb-3">
              Discover <span className="text-gradient">Events</span>
            </h1>
            <p className="text-lg text-gray-500 max-w-lg mx-auto">
              Find community events, fundraisers, workshops, and more happening near you.
            </p>
          </div>

          {/* Search */}
          <form onSubmit={handleSearch} className="max-w-2xl mx-auto mb-8 animate-fade-up" style={{ animationDelay: '0.1s' }}>
            <div className="search-glow flex items-center bg-white rounded-2xl border border-gray-200 transition-all duration-300 overflow-hidden">
              <div className="pl-4">
                <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search events, organizations..."
                className="flex-1 px-3 py-4 text-base bg-transparent outline-none placeholder:text-gray-400"
              />
              <button
                type="submit"
                className="px-6 py-4 text-sm font-semibold text-(--color-primary) hover:bg-(--color-primary-light) transition-colors"
              >
                Search
              </button>
            </div>
          </form>

          {/* Filters */}
          <div className="flex flex-col items-center gap-3 animate-fade-up" style={{ animationDelay: '0.15s' }}>
            <div className="flex flex-wrap gap-2 justify-center">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => toggleFilter('category', cat)}
                  className={`text-sm font-medium px-4 py-2 rounded-full transition-all duration-200 ${
                    category === cat
                      ? 'bg-(--color-primary) text-white shadow-md shadow-(--color-primary)/25 scale-105'
                      : 'bg-white text-gray-600 border border-gray-200 hover:border-gray-300 hover:bg-gray-50'
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
                  onClick={() => toggleFilter('format', fmt)}
                  className={`text-sm font-medium px-4 py-2 rounded-full transition-all duration-200 ${
                    format === fmt
                      ? 'bg-gray-900 text-white shadow-md shadow-gray-900/25 scale-105'
                      : 'bg-white text-gray-600 border border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {formatLabel(fmt)}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="max-w-6xl mx-auto px-4 py-10">
        {loading ? (
          /* Skeleton loading grid */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="rounded-2xl overflow-hidden" style={{ animationDelay: `${i * 0.1}s` }}>
                <div className="skeleton h-48 rounded-b-none" />
                <div className="bg-white p-5 space-y-3 border border-t-0 border-gray-100 rounded-b-2xl">
                  <div className="skeleton h-5 w-3/4" />
                  <div className="skeleton h-4 w-1/2" />
                  <div className="skeleton h-4 w-2/3" />
                  <div className="flex items-center gap-2 pt-2">
                    <div className="skeleton h-6 w-6 rounded-full" />
                    <div className="skeleton h-3 w-24" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : events.length === 0 ? (
          /* Empty state */
          <div className="text-center py-24 animate-fade-up">
            <div className="relative inline-block mb-6">
              <div className="w-24 h-24 rounded-full bg-linear-to-br from-gray-100 to-gray-50 flex items-center justify-center mx-auto">
                <svg className="w-10 h-10 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                </svg>
              </div>
              <div className="absolute -top-1 -right-1 w-8 h-8 rounded-full bg-(--color-primary-light) flex items-center justify-center">
                <svg className="w-4 h-4 text-(--color-primary)" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">No events found</h3>
            <p className="text-gray-500 max-w-sm mx-auto mb-6">
              We couldn't find any events matching your search. Try different keywords or clear your filters.
            </p>
            {(query || category || format) && (
              <button
                onClick={() => {
                  setQuery('')
                  setCategory('')
                  setFormat('')
                  setSearchParams({})
                  fetchEvents({ q: '', category: '', format: '' })
                }}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-(--color-primary) text-white text-sm font-medium hover:bg-(--color-primary-dark) transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
                Clear all filters
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Results count */}
            <p className="text-sm text-gray-400 mb-6">
              {events.length} event{events.length !== 1 ? 's' : ''} found
            </p>

            {/* Event card grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-7">
              {events.map((event, index) => (
                <Link
                  key={`${event.org_slug}-${event.slug}`}
                  to={`/${event.org_slug}/events/${event.slug}`}
                  className="group animate-card-in card-shadow card-hover rounded-2xl overflow-hidden bg-white"
                  style={{ animationDelay: `${index * 0.08}s` }}
                >
                  {/* Cover image with overlay */}
                  <div className="relative aspect-[4/3] overflow-hidden">
                    {event.cover_image_url ? (
                      <img
                        src={event.cover_image_url}
                        alt=""
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                    ) : (
                      <div className={`w-full h-full bg-linear-to-br ${CATEGORY_GRADIENT[event.category] || CATEGORY_GRADIENT.OTHER} flex items-center justify-center`}>
                        <span className="text-6xl font-black text-white/20">
                          {CATEGORY_EMOJI[event.category] || 'E'}
                        </span>
                      </div>
                    )}

                    {/* Bottom gradient overlay */}
                    <div className="absolute inset-0 bg-linear-to-t from-black/50 via-transparent to-transparent" />

                    {/* Date badge - top left */}
                    {!event.date_tbd && event.start_datetime && (
                      <div className="absolute top-3 left-3 bg-white rounded-xl px-2.5 py-1.5 text-center shadow-lg min-w-[52px]">
                        <p className="text-[10px] font-bold text-(--color-primary) uppercase leading-none">
                          {formatDate(event.start_datetime).month}
                        </p>
                        <p className="text-xl font-extrabold text-gray-900 leading-none mt-0.5">
                          {formatDate(event.start_datetime).day}
                        </p>
                      </div>
                    )}

                    {event.date_tbd && (
                      <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm rounded-xl px-3 py-2 text-center shadow-lg">
                        <p className="text-xs font-bold text-gray-500">TBD</p>
                      </div>
                    )}

                    {/* Format badge - top right */}
                    <div className="absolute top-3 right-3">
                      <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-white/90 backdrop-blur-sm text-gray-700 shadow-sm">
                        {formatLabel(event.format)}
                      </span>
                    </div>

                    {/* Title overlay on image bottom */}
                    <div className="absolute bottom-0 left-0 right-0 p-4">
                      <span className={`inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md mb-2 bg-white/20 backdrop-blur-sm text-white`}>
                        {formatLabel(event.category)}
                      </span>
                      <h3 className="text-lg font-bold text-white leading-snug line-clamp-2 drop-shadow-md">
                        {event.title}
                      </h3>
                    </div>
                  </div>

                  {/* Card body */}
                  <div className="px-4 py-4">
                    {/* Time & venue */}
                    <div className="space-y-1.5">
                      {!event.date_tbd && event.start_datetime && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <svg className="w-3.5 h-3.5 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span className="font-medium">
                            {formatDate(event.start_datetime).weekday}, {formatDate(event.start_datetime).time}
                          </span>
                        </div>
                      )}

                      {(event.venue_name || event.venue_city) && (
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <svg className="w-3.5 h-3.5 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                          </svg>
                          <span className="truncate">{event.venue_name || event.venue_city}</span>
                        </div>
                      )}
                    </div>

                    {/* Organizer */}
                    <div className="mt-3 pt-3 border-t border-gray-100 flex items-center gap-2.5">
                      {event.org_logo_url ? (
                        <img src={event.org_logo_url} alt="" className="w-6 h-6 rounded-full object-cover ring-2 ring-white shadow-sm" />
                      ) : (
                        <div className="w-6 h-6 rounded-full bg-linear-to-br from-(--color-primary) to-(--color-accent) flex items-center justify-center ring-2 ring-white shadow-sm">
                          <span className="text-[9px] font-bold text-white">{event.org_name?.charAt(0)}</span>
                        </div>
                      )}
                      <span className="text-xs font-medium text-gray-500 truncate">
                        by {event.org_name}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
