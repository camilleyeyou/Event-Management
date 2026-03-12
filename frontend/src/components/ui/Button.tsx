import { type ButtonHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline'
  loading?: boolean
}

export function Button({ className, variant = 'primary', loading, children, disabled, ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center rounded-lg px-4 py-2.5 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed',
        variant === 'primary' && 'bg-(--color-primary) text-white hover:bg-(--color-primary-dark) focus:ring-(--color-primary)',
        variant === 'secondary' && 'bg-gray-100 text-gray-900 hover:bg-gray-200 focus:ring-gray-500',
        variant === 'outline' && 'border border-gray-300 text-gray-700 hover:bg-gray-50 focus:ring-(--color-primary)',
        className,
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      ) : null}
      {children}
    </button>
  )
}
