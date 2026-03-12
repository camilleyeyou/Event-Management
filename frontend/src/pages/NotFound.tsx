import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/Button'

export function NotFound() {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4">
      <div className="text-center space-y-4 max-w-md">
        <h1 className="text-6xl font-bold text-(--color-primary)">404</h1>
        <h2 className="text-xl font-semibold text-gray-900">Page not found</h2>
        <p className="text-gray-600">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="flex gap-4 justify-center">
          <Link to="/">
            <Button>Go home</Button>
          </Link>
          <Link to="/events">
            <Button variant="outline">Browse events</Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
