import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useSearchParams } from 'react-router-dom'
import api from '@/lib/api'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

interface ResetPasswordForm {
  password: string
  password_confirm: string
}

export function ResetPassword() {
  const [searchParams] = useSearchParams()
  const uid = searchParams.get('uid')
  const token = searchParams.get('token')

  const { register, handleSubmit, formState: { errors }, watch } = useForm<ResetPasswordForm>()
  const [loading, setLoading] = useState(false)
  const [apiError, setApiError] = useState('')
  const [success, setSuccess] = useState(false)

  if (!uid || !token) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4">
        <div className="w-full max-w-md text-center space-y-4">
          <h1 className="text-2xl font-bold text-gray-900">Invalid reset link</h1>
          <p className="text-sm text-gray-600">
            This password reset link is invalid or has expired.
          </p>
          <Link to="/forgot-password">
            <Button variant="outline" className="mt-4">Request a new link</Button>
          </Link>
        </div>
      </div>
    )
  }

  const onSubmit = async (data: ResetPasswordForm) => {
    setLoading(true)
    setApiError('')
    try {
      await api.post('/auth/reset-password/', {
        uid,
        token,
        password: data.password,
        password_confirm: data.password_confirm,
      })
      setSuccess(true)
    } catch (err: unknown) {
      const error = err as { response?: { data?: Record<string, unknown> } }
      const responseData = error.response?.data
      if (responseData && typeof responseData === 'object') {
        const messages: string[] = []
        for (const value of Object.values(responseData)) {
          if (typeof value === 'string') {
            messages.push(value)
          } else if (Array.isArray(value)) {
            for (const item of value.flat()) {
              if (typeof item === 'string') messages.push(item)
            }
          }
        }
        setApiError(messages[0] || 'Failed to reset password.')
      } else {
        setApiError('Something went wrong. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4">
        <div className="w-full max-w-md text-center space-y-4">
          <h1 className="text-2xl font-bold text-gray-900">Password reset</h1>
          <p className="text-sm text-gray-600">
            Your password has been reset successfully. You can now log in with your new password.
          </p>
          <Link to="/login">
            <Button className="mt-4">Log in</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Set new password</h1>
          <p className="mt-2 text-sm text-gray-600">
            Enter your new password below.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {apiError && (
            <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{apiError}</div>
          )}

          <Input
            id="password"
            label="New password"
            type="password"
            {...register('password', {
              required: 'Password is required',
              minLength: { value: 8, message: 'At least 8 characters' },
            })}
            error={errors.password?.message}
          />

          <Input
            id="password_confirm"
            label="Confirm new password"
            type="password"
            {...register('password_confirm', {
              required: 'Please confirm your password',
              validate: (val) => val === watch('password') || 'Passwords do not match',
            })}
            error={errors.password_confirm?.message}
          />

          <Button type="submit" loading={loading} className="w-full">
            Reset password
          </Button>
        </form>
      </div>
    </div>
  )
}
