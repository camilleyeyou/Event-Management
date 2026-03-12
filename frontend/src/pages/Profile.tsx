import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import api from '@/lib/api'
import { useAuthStore } from '@/stores/auth'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

interface ProfileForm {
  first_name: string
  last_name: string
  phone: string
}

export function Profile() {
  const { user, setUser, accessToken } = useAuthStore()
  const navigate = useNavigate()
  const { register, handleSubmit, formState: { errors }, reset } = useForm<ProfileForm>()
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (!accessToken) {
      navigate('/login')
      return
    }
    if (user) {
      reset({
        first_name: user.first_name,
        last_name: user.last_name,
        phone: user.phone,
      })
    }
  }, [user, accessToken, navigate, reset])

  const onSubmit = async (data: ProfileForm) => {
    setLoading(true)
    setSuccess(false)
    try {
      const res = await api.patch('/auth/me/', data)
      setUser(res.data)
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch {
      // handled by interceptor
    } finally {
      setLoading(false)
    }
  }

  if (!user) return null

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Account Settings</h1>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {success && (
            <div className="rounded-lg bg-green-50 p-3 text-sm text-green-700">
              Profile updated successfully.
            </div>
          )}

          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <p className="text-sm text-gray-500 bg-gray-50 rounded-lg px-3 py-2.5">{user.email}</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              id="first_name"
              label="First name"
              {...register('first_name', { required: 'First name is required' })}
              error={errors.first_name?.message}
            />
            <Input
              id="last_name"
              label="Last name"
              {...register('last_name', { required: 'Last name is required' })}
              error={errors.last_name?.message}
            />
          </div>

          <Input
            id="phone"
            label="Phone (optional)"
            type="tel"
            {...register('phone')}
          />

          <div className="flex items-center gap-3 pt-2">
            <Button type="submit" loading={loading}>
              Save changes
            </Button>
            <span className="text-xs text-gray-400">
              Member since {new Date(user.created_at).toLocaleDateString()}
            </span>
          </div>
        </form>
      </div>
    </div>
  )
}
