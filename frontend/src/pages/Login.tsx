import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'
import api from '@/lib/api'
import { useAuthStore } from '@/stores/auth'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

interface LoginForm {
  email: string
  password: string
}

export function Login() {
  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>()
  const [loading, setLoading] = useState(false)
  const [apiError, setApiError] = useState('')
  const navigate = useNavigate()
  const { setTokens, setUser } = useAuthStore()

  const onSubmit = async (data: LoginForm) => {
    setLoading(true)
    setApiError('')
    try {
      const loginRes = await api.post('/auth/login/', data)
      setTokens(loginRes.data.access, loginRes.data.refresh)
      const profileRes = await api.get('/auth/me/', {
        headers: { Authorization: `Bearer ${loginRes.data.access}` },
      })
      setUser(profileRes.data)
      navigate('/my/settings')
    } catch {
      setApiError('Invalid email or password.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Welcome back</h1>
          <p className="mt-2 text-sm text-gray-600">
            Log in to manage your events and tickets.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {apiError && (
            <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{apiError}</div>
          )}

          <Input
            id="email"
            label="Email"
            type="email"
            {...register('email', { required: 'Email is required' })}
            error={errors.email?.message}
          />

          <Input
            id="password"
            label="Password"
            type="password"
            {...register('password', { required: 'Password is required' })}
            error={errors.password?.message}
          />

          <div className="flex justify-end">
            <Link to="/forgot-password" className="text-sm text-(--color-primary) hover:underline">
              Forgot password?
            </Link>
          </div>

          <Button type="submit" loading={loading} className="w-full">
            Log in
          </Button>
        </form>

        <p className="text-center text-sm text-gray-600">
          Don't have an account?{' '}
          <Link to="/register" className="font-medium text-(--color-primary) hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  )
}
