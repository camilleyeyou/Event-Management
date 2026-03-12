import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'
import api from '@/lib/api'
import { useAuthStore } from '@/stores/auth'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

interface RegisterForm {
  first_name: string
  last_name: string
  email: string
  password: string
  password_confirm: string
}

export function Register() {
  const { register, handleSubmit, formState: { errors }, watch } = useForm<RegisterForm>()
  const [loading, setLoading] = useState(false)
  const [apiError, setApiError] = useState('')
  const navigate = useNavigate()
  const { setTokens, setUser } = useAuthStore()

  const onSubmit = async (data: RegisterForm) => {
    setLoading(true)
    setApiError('')
    try {
      const res = await api.post('/auth/register/', data)
      // Auto-login after registration
      const loginRes = await api.post('/auth/login/', {
        email: data.email,
        password: data.password,
      })
      setTokens(loginRes.data.access, loginRes.data.refresh)
      setUser(res.data.user)
      navigate('/my/settings')
    } catch (err: unknown) {
      const error = err as { response?: { data?: Record<string, unknown> } }
      const data = error.response?.data
      console.log('Registration error response:', JSON.stringify(data))
      if (data && typeof data === 'object') {
        const messages: string[] = []
        for (const value of Object.values(data)) {
          if (typeof value === 'string') {
            messages.push(value)
          } else if (Array.isArray(value)) {
            for (const item of value.flat()) {
              if (typeof item === 'string') messages.push(item)
            }
          }
        }
        setApiError(messages[0] || 'Registration failed.')
      } else {
        setApiError('Something went wrong. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Create your account</h1>
          <p className="mt-2 text-sm text-gray-600">
            Join GatherGood to organize and discover community events.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {apiError && (
            <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{apiError}</div>
          )}

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
            {...register('password', {
              required: 'Password is required',
              minLength: { value: 8, message: 'At least 8 characters' },
            })}
            error={errors.password?.message}
          />

          <Input
            id="password_confirm"
            label="Confirm password"
            type="password"
            {...register('password_confirm', {
              required: 'Please confirm your password',
              validate: (val) => val === watch('password') || 'Passwords do not match',
            })}
            error={errors.password_confirm?.message}
          />

          <Button type="submit" loading={loading} className="w-full">
            Create account
          </Button>
        </form>

        <p className="text-center text-sm text-gray-600">
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-(--color-primary) hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </div>
  )
}
