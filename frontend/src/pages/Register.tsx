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
    <div className="flex min-h-[calc(100vh-4rem)]">
      {/* Left panel - decorative */}
      <div className="hidden lg:flex lg:w-1/2 gradient-hero relative items-center justify-center p-12">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="animate-float absolute top-[15%] right-[20%] w-24 h-24 rounded-full bg-blue-300/25 blur-xl" />
          <div className="animate-float-slow absolute bottom-[30%] left-[15%] w-20 h-20 rounded-full bg-green-300/30 blur-xl" />
          <div className="animate-float-delayed absolute top-[50%] right-[35%] w-16 h-16 rounded-full bg-rose-300/25 blur-xl" />
        </div>
        <div className="relative z-10 max-w-md">
          <h2 className="text-4xl font-bold text-gray-900 leading-tight">
            Start organizing events that matter
          </h2>
          <p className="mt-4 text-lg text-gray-600 leading-relaxed">
            Join hundreds of nonprofits using GatherGood to bring their communities together.
          </p>
          <div className="mt-8 space-y-3">
            {[
              'Free for community events',
              'QR code check-in included',
              'No technical skills needed',
            ].map((item) => (
              <div key={item} className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-white/70 flex items-center justify-center shrink-0">
                  <svg className="w-3.5 h-3.5 text-(--color-primary)" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                </div>
                <span className="text-gray-700 font-medium">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel - form */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-8 py-12 bg-white">
        <div className="w-full max-w-sm animate-fade-up">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900">Create your account</h1>
            <p className="mt-2 text-sm text-gray-500">
              Get started in under a minute. No credit card required.
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {apiError && (
              <div className="rounded-xl bg-red-50 border border-red-100 p-3 text-sm text-red-700">{apiError}</div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <Input
                id="first_name"
                label="First name"
                placeholder="Jane"
                {...register('first_name', { required: 'First name is required' })}
                error={errors.first_name?.message}
              />
              <Input
                id="last_name"
                label="Last name"
                placeholder="Doe"
                {...register('last_name', { required: 'Last name is required' })}
                error={errors.last_name?.message}
              />
            </div>

            <Input
              id="email"
              label="Email"
              type="email"
              placeholder="you@organization.org"
              {...register('email', { required: 'Email is required' })}
              error={errors.email?.message}
            />

            <Input
              id="password"
              label="Password"
              type="password"
              placeholder="Min. 8 characters"
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
              placeholder="Re-enter your password"
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

          <p className="mt-8 text-center text-sm text-gray-500">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-(--color-primary) hover:underline">
              Log in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
