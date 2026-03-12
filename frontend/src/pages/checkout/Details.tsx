import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { useAuthStore } from '@/stores/auth'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

interface DetailsForm {
  billing_name: string
  billing_email: string
  billing_phone: string
}

export function CheckoutDetails() {
  const { eventSlug } = useParams()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const [error] = useState('')

  const { register, handleSubmit, formState: { errors } } = useForm<DetailsForm>({
    defaultValues: {
      billing_name: user ? `${user.first_name} ${user.last_name}` : '',
      billing_email: user?.email || '',
      billing_phone: '',
    },
  })

  const checkout = sessionStorage.getItem('checkout')
  if (!checkout) {
    navigate(`/checkout/${eventSlug}`)
    return null
  }

  const checkoutData = JSON.parse(checkout)
  const isFree = checkoutData.calc?.is_free

  const onSubmit = (data: DetailsForm) => {
    const updated = { ...checkoutData, ...data }
    sessionStorage.setItem('checkout', JSON.stringify(updated))

    if (isFree) {
      // Skip payment, go straight to complete
      navigate(`/checkout/${eventSlug}/confirmation`)
    } else {
      navigate(`/checkout/${eventSlug}/payment`)
    }
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-10">
      <div className="flex items-center gap-2 text-sm text-gray-400 mb-8">
        <span>1. Select Tickets</span>
        <span>—</span><span className="text-(--color-primary) font-medium">2. Your Details</span>
        <span>—</span><span>{isFree ? <s>3. Payment</s> : '3. Payment'}</span>
        <span>—</span><span>4. Confirmation</span>
      </div>

      <h1 className="text-2xl font-bold text-gray-900 mb-8">Your Details</h1>

      {error && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700 mb-4">{error}</div>}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
          <Input
            id="billing_name"
            label="Full name"
            {...register('billing_name', { required: 'Name is required' })}
            error={errors.billing_name?.message}
          />
          <Input
            id="billing_email"
            label="Email"
            type="email"
            {...register('billing_email', { required: 'Email is required' })}
            error={errors.billing_email?.message}
          />
          <Input
            id="billing_phone"
            label="Phone (optional)"
            {...register('billing_phone')}
          />
        </div>

        {/* Order summary */}
        {checkoutData.calc && (
          <div className="bg-gray-50 rounded-xl p-5 space-y-2">
            {checkoutData.calc.line_items.map((item: { quantity: number; tier_name: string; line_total: string }, i: number) => (
              <div key={i} className="flex justify-between text-sm">
                <span>{item.quantity}x {item.tier_name}</span>
                <span>{parseFloat(item.line_total) === 0 ? 'Free' : `$${item.line_total}`}</span>
              </div>
            ))}
            <div className="flex justify-between font-semibold text-gray-900 pt-2 border-t border-gray-200">
              <span>Total</span>
              <span>{parseFloat(checkoutData.calc.total) === 0 ? 'Free' : `$${checkoutData.calc.total}`}</span>
            </div>
          </div>
        )}

        <div className="flex gap-3">
          <Button type="button" variant="outline" onClick={() => navigate(`/checkout/${eventSlug}`)}>
            Back
          </Button>
          <Button type="submit" className="flex-1">
            {isFree ? 'Complete Registration' : 'Continue to Payment'}
          </Button>
        </div>
      </form>
    </div>
  )
}
