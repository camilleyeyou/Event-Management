import { useState } from 'react'
import { Link, Outlet, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/auth'
import { Button } from '@/components/ui/Button'

export function Layout() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/login')
    setMenuOpen(false)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <Link to="/" className="text-xl font-bold text-(--color-primary)">
              GatherGood
            </Link>

            {/* Desktop nav */}
            <div className="hidden md:flex items-center gap-4">
              {user ? (
                <>
                  <Link to="/manage" className="text-sm text-gray-600 hover:text-gray-900">Dashboard</Link>
                  <Link to="/manage/events" className="text-sm text-gray-600 hover:text-gray-900">Events</Link>
                  <Link to="/my/tickets" className="text-sm text-gray-600 hover:text-gray-900">My Tickets</Link>
                  <Link to="/my/settings" className="text-sm text-gray-600 hover:text-gray-900">
                    {user.first_name} {user.last_name}
                  </Link>
                  <Button variant="outline" onClick={handleLogout}>Log out</Button>
                </>
              ) : (
                <>
                  <Link to="/events" className="text-sm text-gray-600 hover:text-gray-900">Browse Events</Link>
                  <Link to="/login"><Button variant="outline">Log in</Button></Link>
                  <Link to="/register"><Button>Sign up</Button></Link>
                </>
              )}
            </div>

            {/* Mobile hamburger */}
            <button
              className="md:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="Toggle menu"
            >
              {menuOpen ? (
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden border-t border-gray-100 px-4 py-3 space-y-1 bg-white">
            {user ? (
              <>
                <Link to="/manage" onClick={() => setMenuOpen(false)} className="block py-2 text-sm text-gray-700">Dashboard</Link>
                <Link to="/manage/events" onClick={() => setMenuOpen(false)} className="block py-2 text-sm text-gray-700">Events</Link>
                <Link to="/my/tickets" onClick={() => setMenuOpen(false)} className="block py-2 text-sm text-gray-700">My Tickets</Link>
                <Link to="/my/settings" onClick={() => setMenuOpen(false)} className="block py-2 text-sm text-gray-700">
                  {user.first_name} {user.last_name}
                </Link>
                <button onClick={handleLogout} className="block w-full text-left py-2 text-sm text-red-600">Log out</button>
              </>
            ) : (
              <>
                <Link to="/events" onClick={() => setMenuOpen(false)} className="block py-2 text-sm text-gray-700">Browse Events</Link>
                <Link to="/login" onClick={() => setMenuOpen(false)} className="block py-2 text-sm text-gray-700">Log in</Link>
                <Link to="/register" onClick={() => setMenuOpen(false)} className="block py-2 text-sm text-gray-700">Sign up</Link>
              </>
            )}
          </div>
        )}
      </nav>
      <main>
        <Outlet />
      </main>
    </div>
  )
}
