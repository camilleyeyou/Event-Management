import { useState } from 'react'
import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/stores/auth'
import { Button } from '@/components/ui/Button'

export function Layout() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/login')
    setMenuOpen(false)
  }

  const isActive = (path: string) => location.pathname.startsWith(path)

  const navLinkClass = (path: string) =>
    `text-sm font-medium transition-colors ${
      isActive(path) ? 'text-(--color-primary)' : 'text-gray-500 hover:text-gray-900'
    }`

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-gray-200/60">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-linear-to-br from-(--color-primary) to-(--color-accent) flex items-center justify-center">
                <span className="text-white font-bold text-sm">G</span>
              </div>
              <span className="text-lg font-bold text-gray-900">GatherGood</span>
            </Link>

            {/* Desktop nav */}
            <div className="hidden md:flex items-center gap-1">
              {user ? (
                <>
                  <Link to="/manage" className={`px-3 py-2 rounded-lg hover:bg-gray-100 ${navLinkClass('/manage')}`}>
                    Dashboard
                  </Link>
                  <Link to="/events" className={`px-3 py-2 rounded-lg hover:bg-gray-100 ${navLinkClass('/events')}`}>
                    Browse
                  </Link>
                  <Link to="/my/tickets" className={`px-3 py-2 rounded-lg hover:bg-gray-100 ${navLinkClass('/my/tickets')}`}>
                    My Tickets
                  </Link>
                  <div className="w-px h-6 bg-gray-200 mx-2" />
                  <Link to="/my/settings" className={`px-3 py-2 rounded-lg hover:bg-gray-100 ${navLinkClass('/my/settings')}`}>
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-linear-to-br from-(--color-primary) to-(--color-accent) flex items-center justify-center">
                        <span className="text-white text-xs font-medium">
                          {user.first_name?.charAt(0) || user.email?.charAt(0)?.toUpperCase()}
                        </span>
                      </div>
                      <span className="text-sm text-gray-700">{user.first_name}</span>
                    </div>
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="px-3 py-2 rounded-lg text-sm text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                  >
                    Log out
                  </button>
                </>
              ) : (
                <>
                  <Link to="/events" className={`px-3 py-2 rounded-lg hover:bg-gray-100 ${navLinkClass('/events')}`}>
                    Browse Events
                  </Link>
                  <div className="w-px h-6 bg-gray-200 mx-2" />
                  <Link to="/login">
                    <Button variant="secondary" className="text-sm">Log in</Button>
                  </Link>
                  <Link to="/register">
                    <Button className="text-sm">Sign up</Button>
                  </Link>
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
          <div className="md:hidden border-t border-gray-100 px-4 py-3 space-y-1 bg-white/95 backdrop-blur-lg">
            {user ? (
              <>
                <div className="flex items-center gap-3 px-3 py-3 mb-2 bg-gray-50 rounded-lg">
                  <div className="w-9 h-9 rounded-full bg-linear-to-br from-(--color-primary) to-(--color-accent) flex items-center justify-center">
                    <span className="text-white text-sm font-medium">
                      {user.first_name?.charAt(0) || user.email?.charAt(0)?.toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{user.first_name} {user.last_name}</p>
                    <p className="text-xs text-gray-500">{user.email}</p>
                  </div>
                </div>
                <Link to="/manage" onClick={() => setMenuOpen(false)} className="block px-3 py-2.5 text-sm text-gray-700 rounded-lg hover:bg-gray-50">Dashboard</Link>
                <Link to="/events" onClick={() => setMenuOpen(false)} className="block px-3 py-2.5 text-sm text-gray-700 rounded-lg hover:bg-gray-50">Browse Events</Link>
                <Link to="/my/tickets" onClick={() => setMenuOpen(false)} className="block px-3 py-2.5 text-sm text-gray-700 rounded-lg hover:bg-gray-50">My Tickets</Link>
                <Link to="/my/settings" onClick={() => setMenuOpen(false)} className="block px-3 py-2.5 text-sm text-gray-700 rounded-lg hover:bg-gray-50">Settings</Link>
                <div className="border-t border-gray-100 mt-2 pt-2">
                  <button onClick={handleLogout} className="block w-full text-left px-3 py-2.5 text-sm text-red-600 rounded-lg hover:bg-red-50">Log out</button>
                </div>
              </>
            ) : (
              <>
                <Link to="/events" onClick={() => setMenuOpen(false)} className="block px-3 py-2.5 text-sm text-gray-700 rounded-lg hover:bg-gray-50">Browse Events</Link>
                <div className="border-t border-gray-100 mt-2 pt-2 flex gap-2">
                  <Link to="/login" onClick={() => setMenuOpen(false)} className="flex-1">
                    <Button variant="outline" className="w-full">Log in</Button>
                  </Link>
                  <Link to="/register" onClick={() => setMenuOpen(false)} className="flex-1">
                    <Button className="w-full">Sign up</Button>
                  </Link>
                </div>
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
