import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link } from 'react-router-dom'
import api from '@/lib/api'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

interface ForgotPasswordForm {
  email: string
}

export function ForgotPassword() {
  const { register, handleSubmit, formState: { errors } } = useForm<ForgotPasswordForm>()
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [apiError, setApiError] = useState('')

  const onSubmit = async (data: ForgotPasswordForm) => {
    setLoading(true)
    setApiError('')
    try {
      await api.post('/auth/forgot-password/', data)
      setSubmitted(true)
    } catch {
      setApiError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (submitted) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4">
        <div className="w-full max-w-md text-center space-y-4">
          <h1 className="text-2xl font-bold text-gray-900">Check your email</h1>
          <p className="text-sm text-gray-600">
            If an account exists with that email, we've sent password reset instructions.
          </p>
          <Link to="/login">
            <Button variant="outline" className="mt-4">Back to login</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Reset your password</h1>
          <p className="mt-2 text-sm text-gray-600">
            Enter your email and we'll send you a reset link.
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

          <Button type="submit" loading={loading} className="w-full">
            Send reset link
          </Button>
        </form>

        <p className="text-center text-sm text-gray-600">
          <Link to="/login" className="font-medium text-(--color-primary) hover:underline">
            Back to login
          </Link>
        </p>
      </div>
    </div>
  )
}
