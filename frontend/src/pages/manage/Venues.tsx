import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import api from '@/lib/api'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'

interface Venue {
  id: string
  name: string
  address: string
  city: string
  state: string
  postal_code: string
  capacity: number | null
  accessibility_info: string
  parking_notes: string
}

const emptyVenue = {
  name: '',
  address: '',
  city: '',
  state: '',
  postal_code: '',
  capacity: '',
  accessibility_info: '',
  parking_notes: '',
}

export function Venues() {
  const { orgSlug } = useParams()
  const [venues, setVenues] = useState<Venue[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState(emptyVenue)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })

  const loadVenues = () => {
    api.get(`/organizations/${orgSlug}/venues/`).then((res) => setVenues(res.data))
  }

  useEffect(() => { loadVenues() }, [orgSlug])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage({ type: '', text: '' })
    const payload = {
      ...form,
      capacity: form.capacity ? parseInt(form.capacity) : null,
    }
    try {
      if (editingId) {
        await api.patch(`/organizations/${orgSlug}/venues/${editingId}/`, payload)
        setMessage({ type: 'success', text: 'Venue updated.' })
      } else {
        await api.post(`/organizations/${orgSlug}/venues/`, payload)
        setMessage({ type: 'success', text: 'Venue created.' })
      }
      setForm(emptyVenue)
      setShowForm(false)
      setEditingId(null)
      loadVenues()
    } catch {
      setMessage({ type: 'error', text: 'Failed to save venue.' })
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (venue: Venue) => {
    setForm({
      name: venue.name,
      address: venue.address,
      city: venue.city,
      state: venue.state,
      postal_code: venue.postal_code,
      capacity: venue.capacity?.toString() || '',
      accessibility_info: venue.accessibility_info,
      parking_notes: venue.parking_notes,
    })
    setEditingId(venue.id)
    setShowForm(true)
  }

  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      await api.delete(`/organizations/${orgSlug}/venues/${deleteTarget}/`)
      loadVenues()
    } catch {
      setMessage({ type: 'error', text: 'Failed to delete venue.' })
    } finally {
      setDeleteTarget(null)
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <Link to="/manage" className="hover:text-gray-900">Organizations</Link>
        <span>/</span>
        <Link to={`/manage/org/${orgSlug}`} className="hover:text-gray-900">{orgSlug}</Link>
        <span>/</span>
        <span className="text-gray-900">Venues</span>
      </div>

      <div className="flex flex-wrap gap-2 sm:gap-4 mb-8">
        <Link to={`/manage/org/${orgSlug}`}>
          <Button variant="outline">Settings</Button>
        </Link>
        <Link to={`/manage/org/${orgSlug}/team`}>
          <Button variant="outline">Team</Button>
        </Link>
        <Link to={`/manage/org/${orgSlug}/venues`}>
          <Button variant="primary">Venues</Button>
        </Link>
      </div>

      {message.text && (
        <div className={`rounded-lg p-3 text-sm mb-6 ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
          {message.text}
        </div>
      )}

      {/* Add / Edit form */}
      {showForm ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            {editingId ? 'Edit Venue' : 'Add Venue'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input id="name" name="name" label="Venue name" value={form.name} onChange={handleChange} required />
            <Input id="address" name="address" label="Street address" value={form.address} onChange={handleChange} required />
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Input id="city" name="city" label="City" value={form.city} onChange={handleChange} required />
              <Input id="state" name="state" label="State" value={form.state} onChange={handleChange} required />
              <Input id="postal_code" name="postal_code" label="ZIP" value={form.postal_code} onChange={handleChange} required />
            </div>
            <Input id="capacity" name="capacity" label="Capacity" type="number" value={form.capacity} onChange={handleChange} />
            <div className="space-y-1">
              <label htmlFor="accessibility_info" className="block text-sm font-medium text-gray-700">Accessibility info</label>
              <textarea id="accessibility_info" name="accessibility_info" rows={2} value={form.accessibility_info} onChange={handleChange}
                className="block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-0 focus:border-(--color-primary) focus:ring-(--color-primary-light)" />
            </div>
            <div className="space-y-1">
              <label htmlFor="parking_notes" className="block text-sm font-medium text-gray-700">Parking / transit notes</label>
              <textarea id="parking_notes" name="parking_notes" rows={2} value={form.parking_notes} onChange={handleChange}
                className="block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-0 focus:border-(--color-primary) focus:ring-(--color-primary-light)" />
            </div>
            <div className="flex gap-3">
              <Button type="submit" loading={loading}>{editingId ? 'Update' : 'Create'} Venue</Button>
              <Button type="button" variant="outline" onClick={() => { setShowForm(false); setEditingId(null); setForm(emptyVenue) }}>Cancel</Button>
            </div>
          </form>
        </div>
      ) : (
        <div className="mb-6">
          <Button onClick={() => setShowForm(true)}>Add Venue</Button>
        </div>
      )}

      {/* Venues list */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-5 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">Saved Venues ({venues.length})</h2>
        </div>
        {venues.length === 0 ? (
          <div className="p-8 text-center text-gray-500 text-sm">
            No venues saved yet. Add your first venue above.
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {venues.map((venue) => (
              <div key={venue.id} className="p-5 flex items-start justify-between">
                <div>
                  <p className="font-medium text-gray-900">{venue.name}</p>
                  <p className="text-sm text-gray-500">{venue.address}, {venue.city}, {venue.state} {venue.postal_code}</p>
                  {venue.capacity && (
                    <p className="text-sm text-gray-400 mt-1">Capacity: {venue.capacity}</p>
                  )}
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleEdit(venue)} className="text-sm text-blue-600 hover:text-blue-800">Edit</button>
                  <button onClick={() => setDeleteTarget(venue.id)} className="text-sm text-red-500 hover:text-red-700">Delete</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete venue"
        message="Are you sure you want to delete this venue? This cannot be undone."
        confirmLabel="Delete"
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  )
}
