import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useParams, Link } from 'react-router-dom'
import api from '@/lib/api'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

interface Org {
  id: string
  name: string
  slug: string
  description: string
  website_url: string
  logo_url: string
  banner_url: string
  primary_color: string
  contact_email: string
  contact_phone: string
  role: string
}

interface OrgForm {
  name: string
  description: string
  website_url: string
  contact_email: string
  contact_phone: string
  primary_color: string
}

export function OrgSettings() {
  const { orgSlug } = useParams()
  const [org, setOrg] = useState<Org | null>(null)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const { register, handleSubmit, formState: { errors }, reset } = useForm<OrgForm>()

  useEffect(() => {
    api.get(`/organizations/${orgSlug}/`).then((res) => {
      setOrg(res.data)
      reset({
        name: res.data.name,
        description: res.data.description,
        website_url: res.data.website_url,
        contact_email: res.data.contact_email,
        contact_phone: res.data.contact_phone,
        primary_color: res.data.primary_color,
      })
    })
  }, [orgSlug, reset])

  const onSubmit = async (data: OrgForm) => {
    setLoading(true)
    setSuccess(false)
    try {
      const res = await api.patch(`/organizations/${orgSlug}/`, data)
      setOrg(res.data)
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch {
      // handled
    } finally {
      setLoading(false)
    }
  }

  if (!org) return <div className="p-8 text-center text-gray-500">Loading...</div>

  const canEdit = org.role === 'OWNER' || org.role === 'MANAGER'

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <Link to="/manage" className="hover:text-gray-900">Organizations</Link>
        <span>/</span>
        <span className="text-gray-900">{org.name}</span>
      </div>

      <div className="flex gap-4 mb-8">
        <Link to={`/manage/org/${orgSlug}`}>
          <Button variant="primary">Settings</Button>
        </Link>
        <Link to={`/manage/org/${orgSlug}/team`}>
          <Button variant="outline">Team</Button>
        </Link>
        <Link to={`/manage/org/${orgSlug}/venues`}>
          <Button variant="outline">Venues</Button>
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-5">Organization Settings</h2>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {success && (
            <div className="rounded-lg bg-green-50 p-3 text-sm text-green-700">
              Settings saved successfully.
            </div>
          )}

          <Input
            id="name"
            label="Organization name"
            disabled={!canEdit}
            {...register('name', { required: 'Name is required' })}
            error={errors.name?.message}
          />

          <div className="space-y-1">
            <label htmlFor="description" className="block text-sm font-medium text-gray-700">
              Description
            </label>
            <textarea
              id="description"
              rows={3}
              disabled={!canEdit}
              className="block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-0 focus:border-(--color-primary) focus:ring-(--color-primary-light) disabled:bg-gray-50"
              {...register('description')}
            />
          </div>

          <Input id="website_url" label="Website URL" disabled={!canEdit} {...register('website_url')} />

          <div className="grid grid-cols-2 gap-4">
            <Input id="contact_email" label="Contact email" disabled={!canEdit} {...register('contact_email')} />
            <Input id="contact_phone" label="Contact phone" disabled={!canEdit} {...register('contact_phone')} />
          </div>

          <div className="space-y-1">
            <label htmlFor="primary_color" className="block text-sm font-medium text-gray-700">Brand color</label>
            <input
              id="primary_color"
              type="color"
              disabled={!canEdit}
              className="h-10 w-14 rounded border border-gray-300 cursor-pointer"
              {...register('primary_color')}
            />
          </div>

          {canEdit && (
            <Button type="submit" loading={loading}>Save changes</Button>
          )}
        </form>
      </div>
    </div>
  )
}
