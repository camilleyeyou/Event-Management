import { useEffect, useState } from 'react'
import { useParams, useSearchParams, Link } from 'react-router-dom'
import api from '@/lib/api'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'

interface Tier {
  id: string
  name: string
  description: string
  price: string
  quantity_total: number
  quantity_sold: number
  quantity_remaining: number
  min_per_order: number
  max_per_order: number
  visibility: string
  attendance_mode: string
  sort_order: number
  is_active: boolean
}

const emptyTier = {
  name: '', description: '', price: '0', quantity_total: '',
  min_per_order: '1', max_per_order: '10',
  visibility: 'PUBLIC', attendance_mode: 'IN_PERSON', sort_order: '0',
}

export function TicketTiers() {
  const { eventSlug } = useParams()
  const [searchParams] = useSearchParams()
  const orgSlug = searchParams.get('org') || ''
  const [tiers, setTiers] = useState<Tier[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState(emptyTier)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })

  const base = `/organizations/${orgSlug}/events/${eventSlug}`

  const loadTiers = () => {
    api.get(`${base}/ticket-tiers/`).then((res) => setTiers(res.data))
  }

  useEffect(() => { loadTiers() }, [orgSlug, eventSlug])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage({ type: '', text: '' })
    const payload = {
      ...form,
      price: parseFloat(form.price) || 0,
      quantity_total: parseInt(form.quantity_total) || 0,
      min_per_order: parseInt(form.min_per_order) || 1,
      max_per_order: parseInt(form.max_per_order) || 10,
      sort_order: parseInt(form.sort_order) || 0,
    }
    try {
      if (editingId) {
        await api.patch(`${base}/ticket-tiers/${editingId}/`, payload)
        setMessage({ type: 'success', text: 'Tier updated.' })
      } else {
        await api.post(`${base}/ticket-tiers/`, payload)
        setMessage({ type: 'success', text: 'Tier created.' })
      }
      setForm(emptyTier)
      setShowForm(false)
      setEditingId(null)
      loadTiers()
    } catch {
      setMessage({ type: 'error', text: 'Failed to save tier.' })
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (tier: Tier) => {
    setForm({
      name: tier.name,
      description: tier.description,
      price: tier.price,
      quantity_total: tier.quantity_total.toString(),
      min_per_order: tier.min_per_order.toString(),
      max_per_order: tier.max_per_order.toString(),
      visibility: tier.visibility,
      attendance_mode: tier.attendance_mode,
      sort_order: tier.sort_order.toString(),
    })
    setEditingId(tier.id)
    setShowForm(true)
  }

  const [deactivateTarget, setDeactivateTarget] = useState<string | null>(null)

  const handleDeactivate = async () => {
    if (!deactivateTarget) return
    await api.delete(`${base}/ticket-tiers/${deactivateTarget}/`)
    loadTiers()
    setDeactivateTarget(null)
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <Link to={`/manage/events?org=${orgSlug}`} className="hover:text-gray-900">Events</Link>
        <span>/</span>
        <Link to={`/manage/events/${eventSlug}?org=${orgSlug}`} className="hover:text-gray-900">{eventSlug}</Link>
        <span>/</span>
        <span className="text-gray-900">Tickets</span>
      </div>

      <div className="flex flex-wrap gap-2 sm:gap-4 mb-8">
        <Link to={`/manage/events/${eventSlug}?org=${orgSlug}`}>
          <Button variant="outline">Overview</Button>
        </Link>
        <Link to={`/manage/events/${eventSlug}/tickets?org=${orgSlug}`}>
          <Button variant="primary">Tickets</Button>
        </Link>
        <Link to={`/manage/events/${eventSlug}/promos?org=${orgSlug}`}>
          <Button variant="outline">Promo Codes</Button>
        </Link>
      </div>

      {message.text && (
        <div className={`rounded-lg p-3 text-sm mb-6 ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
          {message.text}
        </div>
      )}

      {showForm ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            {editingId ? 'Edit Ticket Tier' : 'Add Ticket Tier'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input id="name" name="name" label="Tier name" value={form.name} onChange={handleChange} required />
            <div className="space-y-1">
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">Description</label>
              <textarea id="description" name="description" rows={2} value={form.description} onChange={handleChange}
                className="block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-0 focus:border-(--color-primary) focus:ring-(--color-primary-light)" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Input id="price" name="price" label="Price ($)" type="number" step="0.01" min="0" value={form.price} onChange={handleChange} required />
              <Input id="quantity_total" name="quantity_total" label="Total quantity" type="number" min="1" value={form.quantity_total} onChange={handleChange} required />
              <Input id="sort_order" name="sort_order" label="Sort order" type="number" value={form.sort_order} onChange={handleChange} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input id="min_per_order" name="min_per_order" label="Min per order" type="number" min="1" value={form.min_per_order} onChange={handleChange} />
              <Input id="max_per_order" name="max_per_order" label="Max per order" type="number" min="1" value={form.max_per_order} onChange={handleChange} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700">Visibility</label>
                <select name="visibility" value={form.visibility} onChange={handleChange}
                  className="block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm">
                  <option value="PUBLIC">Public</option>
                  <option value="HIDDEN">Hidden</option>
                  <option value="INVITE_ONLY">Invite Only</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700">Attendance mode</label>
                <select name="attendance_mode" value={form.attendance_mode} onChange={handleChange}
                  className="block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm">
                  <option value="IN_PERSON">In-Person</option>
                  <option value="VIRTUAL">Virtual</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3">
              <Button type="submit" loading={loading}>{editingId ? 'Update' : 'Create'} Tier</Button>
              <Button type="button" variant="outline" onClick={() => { setShowForm(false); setEditingId(null); setForm(emptyTier) }}>Cancel</Button>
            </div>
          </form>
        </div>
      ) : (
        <div className="mb-6">
          <Button onClick={() => setShowForm(true)}>Add Ticket Tier</Button>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-5 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">Ticket Tiers ({tiers.filter(t => t.is_active).length})</h2>
        </div>
        {tiers.length === 0 ? (
          <div className="p-8 text-center text-gray-500 text-sm">No ticket tiers yet.</div>
        ) : (
          <div className="divide-y divide-gray-100">
            {tiers.map((tier) => (
              <div key={tier.id} className={`p-5 flex items-start justify-between ${!tier.is_active ? 'opacity-50' : ''}`}>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-gray-900">{tier.name}</p>
                    <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded">{tier.visibility}</span>
                    {!tier.is_active && <span className="text-xs text-red-500">Inactive</span>}
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    {parseFloat(tier.price) === 0 ? 'Free' : `$${tier.price}`}
                    {' · '}
                    {tier.quantity_sold}/{tier.quantity_total} sold
                    {' · '}
                    {tier.quantity_remaining} remaining
                  </p>
                  {tier.description && <p className="text-sm text-gray-400 mt-1">{tier.description}</p>}
                </div>
                {tier.is_active && (
                  <div className="flex gap-2">
                    <button onClick={() => handleEdit(tier)} className="text-sm text-blue-600 hover:text-blue-800">Edit</button>
                    <button onClick={() => setDeactivateTarget(tier.id)} className="text-sm text-red-500 hover:text-red-700">Deactivate</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <ConfirmDialog
        open={!!deactivateTarget}
        title="Deactivate tier"
        message="Are you sure you want to deactivate this ticket tier? It will no longer be available for purchase."
        confirmLabel="Deactivate"
        variant="danger"
        onConfirm={handleDeactivate}
        onCancel={() => setDeactivateTarget(null)}
      />
    </div>
  )
}
