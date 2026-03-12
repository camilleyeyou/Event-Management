import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '@/lib/api'
import { Button } from '@/components/ui/Button'

interface Org {
  slug: string
  name: string
}

interface Event {
  id: string
  title: string
  slug: string
  status: string
  category: string
  format: string
  start_datetime: string | null
  org_slug: string
}

const statusColors: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-600',
  PUBLISHED: 'bg-green-100 text-green-700',
  LIVE: 'bg-blue-100 text-blue-700',
  COMPLETED: 'bg-purple-100 text-purple-700',
  CANCELLED: 'bg-red-100 text-red-600',
}

export function EventList() {
  const [orgs, setOrgs] = useState<Org[]>([])
  const [events, setEvents] = useState<Event[]>([])
  const [selectedOrg, setSelectedOrg] = useState<string>('')

  useEffect(() => {
    api.get('/organizations/').then((res) => {
      setOrgs(res.data)
      if (res.data.length > 0) {
        setSelectedOrg(res.data[0].slug)
      }
    })
  }, [])

  useEffect(() => {
    if (selectedOrg) {
      api.get(`/organizations/${selectedOrg}/events/`).then((res) => setEvents(res.data))
    }
  }, [selectedOrg])

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Events</h1>
        {selectedOrg && (
          <Link to={`/manage/events/new?org=${selectedOrg}`}>
            <Button>Create Event</Button>
          </Link>
        )}
      </div>

      {orgs.length > 1 && (
        <div className="mb-6">
          <select
            value={selectedOrg}
            onChange={(e) => setSelectedOrg(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
          >
            {orgs.map((org) => (
              <option key={org.slug} value={org.slug}>{org.name}</option>
            ))}
          </select>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        {events.length === 0 ? (
          <div className="p-8 text-center text-gray-500 text-sm">
            No events yet. Create your first event to get started.
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {events.map((event) => (
              <Link
                key={event.id}
                to={`/manage/events/${event.slug}?org=${event.org_slug}`}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-5 hover:bg-gray-50 transition-colors"
              >
                <div>
                  <p className="font-medium text-gray-900">{event.title}</p>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-sm text-gray-500">{event.category}</span>
                    <span className="text-sm text-gray-400">{event.format.replace('_', '-')}</span>
                    {event.start_datetime && (
                      <span className="text-sm text-gray-500">
                        {new Date(event.start_datetime).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
                <span className={`text-xs font-medium px-2 py-1 rounded uppercase ${statusColors[event.status] || ''}`}>
                  {event.status}
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
