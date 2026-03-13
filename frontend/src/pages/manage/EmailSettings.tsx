import { useEffect, useState } from 'react'
import { useParams, useSearchParams, Link } from 'react-router-dom'
import api from '@/lib/api'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'

interface EmailConfig {
  confirmation: boolean
  reminder_48h: boolean
  reminder_day_of: boolean
  cancellation: boolean
  post_event_thanks: boolean
  new_registration: boolean
}

interface EmailLog {
  id: string
  trigger_type: string
  recipient_email: string
  subject: string
  status: string
  sent_at: string
}

const toggleLabels: Record<string, { label: string; description: string }> = {
  confirmation: { label: 'Confirmation Email', description: 'Sent immediately after registration' },
  reminder_48h: { label: '48-Hour Reminder', description: 'Sent 48 hours before event' },
  reminder_day_of: { label: 'Day-Of Reminder', description: 'Sent the morning of the event' },
  cancellation: { label: 'Cancellation Notice', description: 'Sent when event is cancelled' },
  post_event_thanks: { label: 'Post-Event Thank You', description: 'Sent 24 hours after event ends' },
  new_registration: { label: 'New Registration Alert', description: 'Notify organizer of new registrations' },
}

export function EmailSettings() {
  const { eventSlug } = useParams()
  const [searchParams] = useSearchParams()
  const orgSlug = searchParams.get('org') || ''

  const [config, setConfig] = useState<EmailConfig | null>(null)
  const [logs, setLogs] = useState<EmailLog[]>([])
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })

  // Bulk email
  const [bulkSubject, setBulkSubject] = useState('')
  const [bulkBody, setBulkBody] = useState('')
  const [bulkLoading, setBulkLoading] = useState(false)

  const base = `/organizations/${orgSlug}/events/${eventSlug}/emails`

  useEffect(() => {
    api.get(`${base}/config/`).then((res) => setConfig(res.data))
    api.get(`${base}/log/`).then((res) => setLogs(res.data))
  }, [base])

  const handleToggle = (key: keyof EmailConfig) => {
    if (!config) return
    setConfig({ ...config, [key]: !config[key] })
  }

  const handleSave = async () => {
    setSaving(true)
    setMessage({ type: '', text: '' })
    try {
      await api.put(`${base}/config/`, config)
      setMessage({ type: 'success', text: 'Email settings saved.' })
    } catch {
      setMessage({ type: 'error', text: 'Failed to save settings.' })
    } finally {
      setSaving(false)
    }
  }

  const [showBulkConfirm, setShowBulkConfirm] = useState(false)

  const handleBulkSend = async () => {
    setShowBulkConfirm(false)
    setBulkLoading(true)
    try {
      const res = await api.post(`${base}/bulk/`, { subject: bulkSubject, body: bulkBody })
      setMessage({ type: 'success', text: `Sent to ${res.data.sent}/${res.data.total} attendees.` })
      setBulkSubject('')
      setBulkBody('')
      // Refresh log
      api.get(`${base}/log/`).then((r) => setLogs(r.data))
    } catch (err: unknown) {
      const error = err as { response?: { data?: { detail?: string } } }
      setMessage({ type: 'error', text: error.response?.data?.detail || 'Failed to send.' })
    } finally {
      setBulkLoading(false)
    }
  }

  if (!config) return <div className="p-8 text-center text-gray-500">Loading...</div>

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <Link to={`/manage/events?org=${orgSlug}`} className="hover:text-gray-900">Events</Link>
        <span>/</span>
        <Link to={`/manage/events/${eventSlug}?org=${orgSlug}`} className="hover:text-gray-900">{eventSlug}</Link>
        <span>/</span>
        <span className="text-gray-900">Emails</span>
      </div>

      <div className="flex flex-wrap gap-2 sm:gap-4 mb-8">
        <Link to={`/manage/events/${eventSlug}?org=${orgSlug}`}>
          <Button variant="outline">Overview</Button>
        </Link>
        <Link to={`/manage/events/${eventSlug}/tickets?org=${orgSlug}`}>
          <Button variant="outline">Tickets</Button>
        </Link>
        <Link to={`/manage/events/${eventSlug}/emails?org=${orgSlug}`}>
          <Button variant="primary">Emails</Button>
        </Link>
      </div>

      {message.text && (
        <div className={`rounded-lg p-3 text-sm mb-6 ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
          {message.text}
        </div>
      )}

      {/* Email toggles */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Automated Emails</h2>
        <div className="space-y-4">
          {Object.entries(toggleLabels).map(([key, { label, description }]) => (
            <label key={key} className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={config[key as keyof EmailConfig]}
                onChange={() => handleToggle(key as keyof EmailConfig)}
                className="mt-1 rounded"
              />
              <div>
                <p className="font-medium text-gray-900 text-sm">{label}</p>
                <p className="text-xs text-gray-500">{description}</p>
              </div>
            </label>
          ))}
        </div>
        <div className="mt-5">
          <Button onClick={handleSave} loading={saving}>Save Settings</Button>
        </div>
      </div>

      {/* Bulk email */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Send Bulk Email</h2>
        <form onSubmit={(e) => { e.preventDefault(); setShowBulkConfirm(true) }} className="space-y-4">
          <Input
            id="bulk-subject"
            label="Subject"
            value={bulkSubject}
            onChange={(e) => setBulkSubject(e.target.value)}
            required
          />
          <div className="space-y-1">
            <label htmlFor="bulk-body" className="block text-sm font-medium text-gray-700">Message</label>
            <textarea
              id="bulk-body"
              rows={5}
              value={bulkBody}
              onChange={(e) => setBulkBody(e.target.value)}
              required
              className="block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-0 focus:border-(--color-primary) focus:ring-(--color-primary-light)"
            />
          </div>
          <Button type="submit" loading={bulkLoading}>Send to All Attendees</Button>
        </form>
      </div>

      {/* Email log */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-5 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">Email History ({logs.length})</h2>
        </div>
        {logs.length === 0 ? (
          <div className="p-8 text-center text-gray-500 text-sm">No emails sent yet.</div>
        ) : (
          <div className="divide-y divide-gray-100 max-h-96 overflow-y-auto">
            {logs.map((log) => (
              <div key={log.id} className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">{log.subject}</p>
                  <p className="text-xs text-gray-500">
                    {log.trigger_type} · {log.recipient_email} · {new Date(log.sent_at).toLocaleString()}
                  </p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded ${log.status === 'SENT' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                  {log.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <ConfirmDialog
        open={showBulkConfirm}
        title="Send bulk email"
        message="Send this email to all attendees of this event?"
        confirmLabel="Send"
        onConfirm={handleBulkSend}
        onCancel={() => setShowBulkConfirm(false)}
      />
    </div>
  )
}
