import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import api from '@/lib/api'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

interface OrgForm {
  name: string
  description: string
  website_url: string
  contact_email: string
  contact_phone: string
  primary_color: string
}

export function OrgCreate() {
  const { register, handleSubmit, formState: { errors } } = useForm<OrgForm>({
    defaultValues: { primary_color: '#2e7d5b' },
  })
  const [loading, setLoading] = useState(false)
  const [apiError, setApiError] = useState('')
  const navigate = useNavigate()

  const onSubmit = async (data: OrgForm) => {
    setLoading(true)
    setApiError('')
    try {
      const res = await api.post('/organizations/', data)
      navigate(`/manage/org/${res.data.slug}`)
    } catch {
      setApiError('Failed to create organization. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Create Organization</h1>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {apiError && (
            <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{apiError}</div>
          )}

          <Input
            id="name"
            label="Organization name"
            placeholder='e.g., "Friends of the Library"'
            {...register('name', { required: 'Organization name is required' })}
            error={errors.name?.message}
          />

          <div className="space-y-1">
            <label htmlFor="description" className="block text-sm font-medium text-gray-700">
              Description
            </label>
            <textarea
              id="description"
              rows={3}
              className="block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-0 focus:border-(--color-primary) focus:ring-(--color-primary-light)"
              placeholder="Short bio or mission statement"
              {...register('description')}
            />
          </div>

          <Input
            id="website_url"
            label="Website URL (optional)"
            type="url"
            placeholder="https://yourorg.org"
            {...register('website_url')}
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              id="contact_email"
              label="Contact email (optional)"
              type="email"
              {...register('contact_email')}
            />
            <Input
              id="contact_phone"
              label="Contact phone (optional)"
              type="tel"
              {...register('contact_phone')}
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="primary_color" className="block text-sm font-medium text-gray-700">
              Brand color
            </label>
            <div className="flex items-center gap-3">
              <input
                id="primary_color"
                type="color"
                className="h-10 w-14 rounded border border-gray-300 cursor-pointer"
                {...register('primary_color')}
              />
              <span className="text-sm text-gray-500">Used for your branded pages</span>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="submit" loading={loading}>Create organization</Button>
            <Button type="button" variant="outline" onClick={() => navigate('/manage')}>
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
