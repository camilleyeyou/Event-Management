import { useEffect, useState } from 'react'
import { useParams, useSearchParams, Link } from 'react-router-dom'
import api from '@/lib/api'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

interface Promo {
  id: string
  code: string
  discount_type: string
  discount_value: string
  usage_limit: number | null
  usage_count: number
  per_customer_limit: number
  is_active: boolean
}

const emptyPromo = {
  code: '', discount_type: 'PERCENTAGE', discount_value: '',
  usage_limit: '', per_customer_limit: '1',
}

export function PromoCodes() {
  const { eventSlug } = useParams()
  const [searchParams] = useSearchParams()
  const orgSlug = searchParams.get('org') || ''
  const [promos, setPromos] = useState<Promo[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState(emptyPromo)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })

  // Validate test
  const [validateCode, setValidateCode] = useState('')
  const [validateResult, setValidateResult] = useState<{ valid: boolean; detail?: string; discount_type?: string; discount_value?: string } | null>(null)

  const base = `/organizations/${orgSlug}/events/${eventSlug}`

  const loadPromos = () => {
    api.get(`${base}/promo-codes/`).then((res) => setPromos(res.data))
  }

  useEffect(() => { loadPromos() }, [orgSlug, eventSlug])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage({ type: '', text: '' })
    const payload = {
      ...form,
      discount_value: parseFloat(form.discount_value) || 0,
      usage_limit: form.usage_limit ? parseInt(form.usage_limit) : null,
      per_customer_limit: parseInt(form.per_customer_limit) || 1,
    }
    try {
      if (editingId) {
        await api.patch(`${base}/promo-codes/${editingId}/`, payload)
        setMessage({ type: 'success', text: 'Promo code updated.' })
      } else {
        await api.post(`${base}/promo-codes/`, payload)
        setMessage({ type: 'success', text: 'Promo code created.' })
      }
      setForm(emptyPromo)
      setShowForm(false)
      setEditingId(null)
      loadPromos()
    } catch {
      setMessage({ type: 'error', text: 'Failed to save promo code.' })
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (promo: Promo) => {
    setForm({
      code: promo.code,
      discount_type: promo.discount_type,
      discount_value: promo.discount_value,
      usage_limit: promo.usage_limit?.toString() || '',
      per_customer_limit: promo.per_customer_limit.toString(),
    })
    setEditingId(promo.id)
    setShowForm(true)
  }

  const handleToggle = async (promo: Promo) => {
    await api.patch(`${base}/promo-codes/${promo.id}/`, { is_active: !promo.is_active })
    loadPromos()
  }

  const handleValidate = async () => {
    try {
      const res = await api.post(`${base}/promo-codes/validate/`, { code: validateCode })
      setValidateResult(res.data)
    } catch {
      setValidateResult({ valid: false, detail: 'Error validating code.' })
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <Link to={`/manage/events?org=${orgSlug}`} className="hover:text-gray-900">Events</Link>
        <span>/</span>
        <Link to={`/manage/events/${eventSlug}?org=${orgSlug}`} className="hover:text-gray-900">{eventSlug}</Link>
        <span>/</span>
        <span className="text-gray-900">Promo Codes</span>
      </div>

      <div className="flex gap-4 mb-8">
        <Link to={`/manage/events/${eventSlug}?org=${orgSlug}`}>
          <Button variant="outline">Overview</Button>
        </Link>
        <Link to={`/manage/events/${eventSlug}/tickets?org=${orgSlug}`}>
          <Button variant="outline">Tickets</Button>
        </Link>
        <Link to={`/manage/events/${eventSlug}/promos?org=${orgSlug}`}>
          <Button variant="primary">Promo Codes</Button>
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
            {editingId ? 'Edit Promo Code' : 'Add Promo Code'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input id="code" name="code" label="Code" value={form.code} onChange={handleChange} placeholder="e.g. VOLUNTEER20" required />
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700">Discount type</label>
                <select name="discount_type" value={form.discount_type} onChange={handleChange}
                  className="block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm">
                  <option value="PERCENTAGE">Percentage off</option>
                  <option value="FIXED">Fixed amount off</option>
                </select>
              </div>
              <Input id="discount_value" name="discount_value" label={form.discount_type === 'PERCENTAGE' ? 'Discount (%)' : 'Discount ($)'} type="number" step="0.01" min="0" value={form.discount_value} onChange={handleChange} required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input id="usage_limit" name="usage_limit" label="Total usage limit (optional)" type="number" min="1" value={form.usage_limit} onChange={handleChange} />
              <Input id="per_customer_limit" name="per_customer_limit" label="Per customer limit" type="number" min="1" value={form.per_customer_limit} onChange={handleChange} />
            </div>
            <div className="flex gap-3">
              <Button type="submit" loading={loading}>{editingId ? 'Update' : 'Create'} Code</Button>
              <Button type="button" variant="outline" onClick={() => { setShowForm(false); setEditingId(null); setForm(emptyPromo) }}>Cancel</Button>
            </div>
          </form>
        </div>
      ) : (
        <div className="mb-6">
          <Button onClick={() => setShowForm(true)}>Add Promo Code</Button>
        </div>
      )}

      {/* Promo codes list */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
        <div className="p-5 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">Promo Codes ({promos.length})</h2>
        </div>
        {promos.length === 0 ? (
          <div className="p-8 text-center text-gray-500 text-sm">No promo codes yet.</div>
        ) : (
          <div className="divide-y divide-gray-100">
            {promos.map((promo) => (
              <div key={promo.id} className={`p-5 flex items-center justify-between ${!promo.is_active ? 'opacity-50' : ''}`}>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-mono font-medium text-gray-900">{promo.code}</p>
                    {!promo.is_active && <span className="text-xs text-red-500">Inactive</span>}
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    {promo.discount_type === 'PERCENTAGE' ? `${promo.discount_value}% off` : `$${promo.discount_value} off`}
                    {' · '}
                    {promo.usage_count}{promo.usage_limit ? `/${promo.usage_limit}` : ''} used
                  </p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleEdit(promo)} className="text-sm text-blue-600 hover:text-blue-800">Edit</button>
                  <button onClick={() => handleToggle(promo)} className="text-sm text-gray-500 hover:text-gray-700">
                    {promo.is_active ? 'Deactivate' : 'Activate'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Validate tester */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Test Promo Code</h2>
        <div className="flex gap-3 items-end">
          <div className="flex-1">
            <Input id="validate-code" label="Enter code" value={validateCode} onChange={(e) => setValidateCode(e.target.value)} />
          </div>
          <Button type="button" variant="outline" onClick={handleValidate}>Validate</Button>
        </div>
        {validateResult && (
          <div className={`mt-3 rounded-lg p-3 text-sm ${validateResult.valid ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
            {validateResult.valid
              ? `Valid! ${validateResult.discount_type === 'PERCENTAGE' ? `${validateResult.discount_value}% off` : `$${validateResult.discount_value} off`}`
              : validateResult.detail}
          </div>
        )}
      </div>
    </div>
  )
}
