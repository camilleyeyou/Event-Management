import { Link, Outlet, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/auth'
import { Button } from '@/components/ui/Button'

export function Layout() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <Link to="/" className="text-xl font-bold text-(--color-primary)">
              GatherGood
            </Link>
            <div className="flex items-center gap-4">
              {user ? (
                <>
                  <Link to="/manage" className="text-sm text-gray-600 hover:text-gray-900">
                    Dashboard
                  </Link>
                  <Link to="/manage/events" className="text-sm text-gray-600 hover:text-gray-900">
                    Events
                  </Link>
                  <Link to="/my/settings" className="text-sm text-gray-600 hover:text-gray-900">
                    {user.first_name} {user.last_name}
                  </Link>
                  <Button variant="outline" onClick={handleLogout}>
                    Log out
                  </Button>
                </>
              ) : (
                <>
                  <Link to="/login">
                    <Button variant="outline">Log in</Button>
                  </Link>
                  <Link to="/register">
                    <Button>Sign up</Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>
      <main>
        <Outlet />
      </main>
    </div>
  )
}
