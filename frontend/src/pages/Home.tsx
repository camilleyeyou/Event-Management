import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { useAuthStore } from '@/stores/auth'

export function Home() {
  const { accessToken, user } = useAuthStore()
  const isLoggedIn = !!accessToken

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4">
      <div className="text-center space-y-6 max-w-lg">
        <h1 className="text-4xl font-bold text-gray-900">
          Simple Event Management for{' '}
          <span className="text-(--color-primary)">Nonprofits</span>
        </h1>
        <p className="text-lg text-gray-600">
          {isLoggedIn
            ? `Welcome back, ${user?.first_name || 'there'}! Manage your events or discover what's happening in your community.`
            : 'Create events, collect RSVPs, sell tickets, and check people in at the door. Built for community organizations.'}
        </p>
        <div className="flex gap-4 justify-center">
          {isLoggedIn ? (
            <>
              <Link to="/manage">
                <Button>Go to Dashboard</Button>
              </Link>
              <Link to="/events">
                <Button variant="outline">Browse events</Button>
              </Link>
            </>
          ) : (
            <>
              <Link to="/register">
                <Button>Get started</Button>
              </Link>
              <Link to="/events">
                <Button variant="outline">Browse events</Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
