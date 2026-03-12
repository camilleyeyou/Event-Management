import { useEffect, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import api from '@/lib/api'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

interface Venue {
  id: string
  name: string
  city: string
  state: string
}

const CATEGORIES = [
  { value: 'FUNDRAISER', label: 'Fundraiser' },
  { value: 'WORKSHOP', label: 'Workshop' },
  { value: 'MEETUP', label: 'Meetup' },
  { value: 'VOLUNTEER', label: 'Volunteer' },
  { value: 'SOCIAL', label: 'Social' },
  { value: 'OTHER', label: 'Other' },
]

const FORMATS = [
  { value: 'IN_PERSON', label: 'In-Person' },
  { value: 'VIRTUAL', label: 'Virtual' },
  { value: 'HYBRID', label: 'Hybrid' },
]

const TIMEZONES = [
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'America/Anchorage',
  'Pacific/Honolulu',
  'UTC',
]

export function EventForm() {
  const { eventSlug } = useParams()
  const [searchParams] = useSearchParams()
  const orgSlug = searchParams.get('org') || ''
  const navigate = useNavigate()
  const isEdit = !!eventSlug

  const [venues, setVenues] = useState<Venue[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    title: '',
    subtitle: '',
    description: '',
    format: 'IN_PERSON',
    category: 'OTHER',
    cover_image_url: '',
    is_private: false,
    start_datetime: '',
    end_datetime: '',
    timezone: 'America/Los_Angeles',
    doors_open_time: '',
    date_tbd: false,
    venue: '',
    virtual_link: '',
    virtual_platform: '',
  })

  useEffect(() => {
    if (orgSlug) {
      api.get(`/organizations/${orgSlug}/venues/`).then((res) => setVenues(res.data))
    }
  }, [orgSlug])

  useEffect(() => {
    if (isEdit && orgSlug) {
      api.get(`/organizations/${orgSlug}/events/${eventSlug}/`).then((res) => {
        const e = res.data
        setForm({
          title: e.title || '',
          subtitle: e.subtitle || '',
          description: e.description || '',
          format: e.format || 'IN_PERSON',
          category: e.category || 'OTHER',
          cover_image_url: e.cover_image_url || '',
          is_private: e.is_private || false,
          start_datetime: e.start_datetime ? e.start_datetime.slice(0, 16) : '',
          end_datetime: e.end_datetime ? e.end_datetime.slice(0, 16) : '',
          timezone: e.timezone || 'America/Los_Angeles',
          doors_open_time: e.doors_open_time ? e.doors_open_time.slice(0, 16) : '',
          date_tbd: e.date_tbd || false,
          venue: e.venue || '',
          virtual_link: e.virtual_link || '',
          virtual_platform: e.virtual_platform || '',
        })
      })
    }
  }, [isEdit, orgSlug, eventSlug])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const target = e.target
    const value = target.type === 'checkbox' ? (target as HTMLInputElement).checked : target.value
    setForm({ ...form, [target.name]: value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    const payload = {
      ...form,
      venue: form.venue || null,
      start_datetime: form.start_datetime ? new Date(form.start_datetime).toISOString() : null,
      end_datetime: form.end_datetime ? new Date(form.end_datetime).toISOString() : null,
      doors_open_time: form.doors_open_time ? new Date(form.doors_open_time).toISOString() : null,
    }
    try {
      if (isEdit) {
        await api.patch(`/organizations/${orgSlug}/events/${eventSlug}/`, payload)
      } else {
        await api.post(`/organizations/${orgSlug}/events/`, payload)
      }
      navigate(`/manage/events?org=${orgSlug}`)
    } catch {
      setError('Failed to save event. Please check all fields.')
    } finally {
      setLoading(false)
    }
  }

  const showVenue = form.format === 'IN_PERSON' || form.format === 'HYBRID'
  const showVirtual = form.format === 'VIRTUAL' || form.format === 'HYBRID'

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">
        {isEdit ? 'Edit Event' : 'Create Event'}
      </h1>

      {error && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700 mb-6">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic info */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Event Details</h2>
          <Input id="title" name="title" label="Event title" value={form.title} onChange={handleChange} required />
          <Input id="subtitle" name="subtitle" label="Subtitle (optional)" value={form.subtitle} onChange={handleChange} />
          <div className="space-y-1">
            <label htmlFor="description" className="block text-sm font-medium text-gray-700">Description</label>
            <textarea
              id="description" name="description" rows={5} value={form.description} onChange={handleChange}
              className="block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-0 focus:border-(--color-primary) focus:ring-(--color-primary-light)"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">Category</label>
              <select name="category" value={form.category} onChange={handleChange}
                className="block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm">
                {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">Format</label>
              <select name="format" value={form.format} onChange={handleChange}
                className="block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm">
                {FORMATS.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
              </select>
            </div>
          </div>
          <Input id="cover_image_url" name="cover_image_url" label="Cover image URL (optional)" value={form.cover_image_url} onChange={handleChange} />
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="is_private" checked={form.is_private} onChange={handleChange} className="rounded" />
            Private event (unlisted, only accessible via direct link)
          </label>
        </div>

        {/* Date & Time */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Date & Time</h2>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="date_tbd" checked={form.date_tbd} onChange={handleChange} className="rounded" />
            Date TBD (publish without a confirmed date)
          </label>
          {!form.date_tbd && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input id="start_datetime" name="start_datetime" label="Start" type="datetime-local" value={form.start_datetime} onChange={handleChange} />
                <Input id="end_datetime" name="end_datetime" label="End" type="datetime-local" value={form.end_datetime} onChange={handleChange} />
              </div>
              <Input id="doors_open_time" name="doors_open_time" label="Doors open (optional)" type="datetime-local" value={form.doors_open_time} onChange={handleChange} />
            </>
          )}
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">Timezone</label>
            <select name="timezone" value={form.timezone} onChange={handleChange}
              className="block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm">
              {TIMEZONES.map((tz) => <option key={tz} value={tz}>{tz}</option>)}
            </select>
          </div>
        </div>

        {/* Location */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Location</h2>
          {showVenue && (
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">Venue</label>
              <select name="venue" value={form.venue} onChange={handleChange}
                className="block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm">
                <option value="">Select a venue...</option>
                {venues.map((v) => (
                  <option key={v.id} value={v.id}>{v.name} - {v.city}, {v.state}</option>
                ))}
              </select>
            </div>
          )}
          {showVirtual && (
            <>
              <Input id="virtual_link" name="virtual_link" label="Virtual meeting link" value={form.virtual_link} onChange={handleChange} />
              <Input id="virtual_platform" name="virtual_platform" label="Platform (e.g. Zoom, Google Meet)" value={form.virtual_platform} onChange={handleChange} />
            </>
          )}
        </div>

        <div className="flex gap-3">
          <Button type="submit" loading={loading}>
            {isEdit ? 'Save Changes' : 'Create Event'}
          </Button>
          <Button type="button" variant="outline" onClick={() => navigate(`/manage/events?org=${orgSlug}`)}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  )
}
