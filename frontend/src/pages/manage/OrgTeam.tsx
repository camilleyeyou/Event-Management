import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import api from '@/lib/api'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'

interface Member {
  id: string
  email: string
  first_name: string
  last_name: string
  role: string
}

interface Org {
  role: string
  name: string
}

export function OrgTeam() {
  const { orgSlug } = useParams()
  const [members, setMembers] = useState<Member[]>([])
  const [org, setOrg] = useState<Org | null>(null)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState('VOLUNTEER')
  const [inviteLoading, setInviteLoading] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })

  const loadData = () => {
    api.get(`/organizations/${orgSlug}/`).then((res) => setOrg(res.data))
    api.get(`/organizations/${orgSlug}/members/`).then((res) => setMembers(res.data))
  }

  useEffect(() => { loadData() }, [orgSlug])

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    setInviteLoading(true)
    setMessage({ type: '', text: '' })
    try {
      await api.post(`/organizations/${orgSlug}/members/invite/`, {
        email: inviteEmail,
        role: inviteRole,
      })
      setInviteEmail('')
      setMessage({ type: 'success', text: 'Team member invited successfully.' })
      loadData()
    } catch (err: unknown) {
      const error = err as { response?: { data?: { detail?: string } } }
      setMessage({
        type: 'error',
        text: error.response?.data?.detail || 'Failed to invite member.',
      })
    } finally {
      setInviteLoading(false)
    }
  }

  const [removeTarget, setRemoveTarget] = useState<string | null>(null)

  const handleRemove = async () => {
    if (!removeTarget) return
    try {
      await api.delete(`/organizations/${orgSlug}/members/${removeTarget}/`)
      loadData()
    } catch {
      setMessage({ type: 'error', text: 'Failed to remove member.' })
    } finally {
      setRemoveTarget(null)
    }
  }

  if (!org) return <div className="p-8 text-center text-gray-500">Loading...</div>

  const isOwner = org.role === 'OWNER'
  const canInvite = isOwner || org.role === 'MANAGER'

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <Link to="/manage" className="hover:text-gray-900">Organizations</Link>
        <span>/</span>
        <span className="text-gray-900">{org.name}</span>
      </div>

      <div className="flex flex-wrap gap-2 sm:gap-4 mb-8">
        <Link to={`/manage/org/${orgSlug}`}>
          <Button variant="outline">Settings</Button>
        </Link>
        <Link to={`/manage/org/${orgSlug}/team`}>
          <Button variant="primary">Team</Button>
        </Link>
        <Link to={`/manage/org/${orgSlug}/venues`}>
          <Button variant="outline">Venues</Button>
        </Link>
      </div>

      {message.text && (
        <div className={`rounded-lg p-3 text-sm mb-6 ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
          {message.text}
        </div>
      )}

      {/* Invite form */}
      {canInvite && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Invite Team Member</h2>
          <form onSubmit={handleInvite} className="flex flex-col sm:flex-row gap-3 sm:items-end">
            <div className="flex-1">
              <Input
                id="invite-email"
                label="Email"
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="teammate@example.com"
              />
            </div>
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">Role</label>
              <select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value)}
                className="rounded-lg border border-gray-300 px-3 py-2.5 text-sm"
              >
                <option value="VOLUNTEER">Volunteer</option>
                <option value="MANAGER">Manager</option>
                {isOwner && <option value="OWNER">Owner</option>}
              </select>
            </div>
            <Button type="submit" loading={inviteLoading}>Invite</Button>
          </form>
        </div>
      )}

      {/* Members list */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-5 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">
            Team Members ({members.length})
          </h2>
        </div>
        <div className="divide-y divide-gray-100">
          {members.map((member) => (
            <div key={member.id} className="flex items-center justify-between p-5">
              <div>
                <p className="font-medium text-gray-900">
                  {member.first_name} {member.last_name}
                </p>
                <p className="text-sm text-gray-500">{member.email}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs font-medium text-gray-400 uppercase bg-gray-100 px-2 py-1 rounded">
                  {member.role}
                </span>
                {isOwner && (
                  <button
                    onClick={() => setRemoveTarget(member.id)}
                    className="text-sm text-red-500 hover:text-red-700"
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <ConfirmDialog
        open={!!removeTarget}
        title="Remove team member"
        message="Are you sure you want to remove this team member from the organization?"
        confirmLabel="Remove"
        variant="danger"
        onConfirm={handleRemove}
        onCancel={() => setRemoveTarget(null)}
      />
    </div>
  )
}
