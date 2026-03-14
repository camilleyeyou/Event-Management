import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { useAuthStore } from '@/stores/auth'

const FEATURES = [
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16.5 6v.75m0 3v.75m0 3v.75m0 3V18m-9-5.25h5.25M7.5 15h3M3.375 5.25c-.621 0-1.125.504-1.125 1.125v3.026a2.999 2.999 0 010 5.198v3.026c0 .621.504 1.125 1.125 1.125h17.25c.621 0 1.125-.504 1.125-1.125v-3.026a2.999 2.999 0 010-5.198V6.375c0-.621-.504-1.125-1.125-1.125H3.375z" />
      </svg>
    ),
    title: 'Ticketing & RSVPs',
    desc: 'Free RSVPs and paid tickets with multiple tiers. Promo codes, early bird pricing, and capacity management built in.',
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 013.75 9.375v-4.5zM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 01-1.125-1.125v-4.5zM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0113.5 9.375v-4.5z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6.75 6.75h.75v.75h-.75v-.75zM6.75 16.5h.75v.75h-.75v-.75zM16.5 6.75h.75v.75h-.75v-.75zM13.5 13.5h.75v.75h-.75v-.75zM13.5 19.5h.75v.75h-.75v-.75zM19.5 13.5h.75v.75h-.75v-.75zM19.5 19.5h.75v.75h-.75v-.75zM16.5 16.5h.75v.75h-.75v-.75z" />
      </svg>
    ),
    title: 'QR Check-In',
    desc: 'Every ticket gets a unique QR code. Scan at the door with any phone — no app download needed.',
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
      </svg>
    ),
    title: 'Smart Emails',
    desc: 'Automated confirmations, reminders, and follow-ups. Send custom messages to all your attendees.',
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
      </svg>
    ),
    title: 'Analytics',
    desc: 'Track registrations, revenue, attendance rates, and promo code performance at a glance.',
  },
]

const EVENT_TYPES = [
  { label: 'Fundraiser Dinners', color: 'bg-amber-100 text-amber-700' },
  { label: 'Volunteer Meetups', color: 'bg-green-100 text-green-700' },
  { label: 'Community Workshops', color: 'bg-blue-100 text-blue-700' },
  { label: 'Awareness Nights', color: 'bg-purple-100 text-purple-700' },
  { label: 'Social Gatherings', color: 'bg-rose-100 text-rose-700' },
  { label: 'Board Meetings', color: 'bg-teal-100 text-teal-700' },
]

export function Home() {
  const { accessToken, user } = useAuthStore()
  const isLoggedIn = !!accessToken

  return (
    <div className="overflow-hidden">
      {/* Hero Section */}
      <section className="gradient-hero relative min-h-[calc(100vh-4rem)] flex items-center justify-center px-4">
        {/* Floating decorative blobs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="animate-float absolute top-[15%] left-[10%] w-20 h-20 rounded-full bg-green-300/30 blur-xl" />
          <div className="animate-float-slow absolute top-[25%] right-[15%] w-32 h-32 rounded-full bg-purple-300/25 blur-2xl" />
          <div className="animate-float-delayed absolute bottom-[20%] left-[20%] w-24 h-24 rounded-full bg-yellow-300/30 blur-xl" />
          <div className="animate-float absolute bottom-[30%] right-[10%] w-16 h-16 rounded-full bg-blue-300/30 blur-xl" />
          <div className="animate-float-slow absolute top-[50%] left-[50%] w-28 h-28 rounded-full bg-rose-300/20 blur-2xl" />
        </div>

        <div className="relative z-10 text-center max-w-3xl mx-auto animate-fade-up">
          <div className="inline-flex items-center gap-2 bg-white/60 backdrop-blur-sm rounded-full px-4 py-1.5 text-sm font-medium text-gray-700 mb-6 border border-white/50">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            Built for nonprofits & community orgs
          </div>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold text-gray-900 tracking-tight leading-[1.1]">
            Events that bring
            <br />
            <span className="bg-linear-to-r from-(--color-primary) via-(--color-accent) to-(--color-rose) bg-clip-text text-transparent">
              communities together
            </span>
          </h1>

          <p className="mt-6 text-lg sm:text-xl text-gray-600 max-w-xl mx-auto leading-relaxed">
            Create events, collect RSVPs, sell tickets, and check people in at the door. Simple, affordable, and made for organizations that do good.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
            {isLoggedIn ? (
              <>
                <Link to="/manage">
                  <Button className="w-full sm:w-auto text-base px-8 py-3">
                    Go to Dashboard
                  </Button>
                </Link>
                <Link to="/events">
                  <Button variant="outline" className="w-full sm:w-auto text-base px-8 py-3 bg-white/80 backdrop-blur-sm">
                    Browse Events
                  </Button>
                </Link>
              </>
            ) : (
              <>
                <Link to="/register">
                  <Button className="w-full sm:w-auto text-base px-8 py-3">
                    Start for free
                  </Button>
                </Link>
                <Link to="/events">
                  <Button variant="outline" className="w-full sm:w-auto text-base px-8 py-3 bg-white/80 backdrop-blur-sm">
                    Browse Events
                  </Button>
                </Link>
              </>
            )}
          </div>

          {isLoggedIn && (
            <p className="mt-4 text-sm text-gray-500">
              Welcome back, {user?.first_name || 'there'}!
            </p>
          )}
        </div>
      </section>

      {/* Event Types Ribbon */}
      <section className="py-10 bg-white border-y border-gray-100">
        <div className="max-w-4xl mx-auto px-4">
          <p className="text-center text-sm font-medium text-gray-400 uppercase tracking-wider mb-5">
            Perfect for
          </p>
          <div className="flex flex-wrap justify-center gap-2.5">
            {EVENT_TYPES.map((type) => (
              <span
                key={type.label}
                className={`px-4 py-2 rounded-full text-sm font-medium ${type.color}`}
              >
                {type.label}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
              Everything you need, nothing you don't
            </h2>
            <p className="mt-3 text-lg text-gray-500 max-w-2xl mx-auto">
              No bloated features, no steep learning curve. Just the tools your nonprofit needs to run great events.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {FEATURES.map((feature) => (
              <div
                key={feature.title}
                className="bg-white rounded-2xl p-6 border border-gray-100 card-hover"
              >
                <div className="w-12 h-12 rounded-xl bg-linear-to-br from-(--color-primary-light) to-(--color-primary)/10 flex items-center justify-center text-(--color-primary) mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
              Up and running in minutes
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            {[
              { step: '1', title: 'Create your event', desc: 'Set up your event page with all the details — venue, tickets, schedule, and branding.' },
              { step: '2', title: 'Share & sell tickets', desc: 'Share your event page. Attendees RSVP or buy tickets with a simple checkout.' },
              { step: '3', title: 'Check in & go', desc: 'Scan QR codes at the door. Track attendance in real-time. Done.' },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="w-12 h-12 rounded-full bg-linear-to-br from-(--color-primary) to-(--color-accent) text-white font-bold text-lg flex items-center justify-center mx-auto mb-4">
                  {item.step}
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="gradient-hero py-20 px-4 relative">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="animate-float-slow absolute top-[20%] right-[20%] w-20 h-20 rounded-full bg-purple-300/25 blur-xl" />
          <div className="animate-float absolute bottom-[20%] left-[15%] w-16 h-16 rounded-full bg-green-300/30 blur-xl" />
        </div>
        <div className="relative z-10 max-w-2xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            Ready to bring your community together?
          </h2>
          <p className="text-lg text-gray-600 mb-8">
            Join organizations already using GatherGood to create meaningful events.
          </p>
          {isLoggedIn ? (
            <Link to="/manage/events/new">
              <Button className="text-base px-8 py-3">Create Your Next Event</Button>
            </Link>
          ) : (
            <Link to="/register">
              <Button className="text-base px-8 py-3">Get Started — It's Free</Button>
            </Link>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12 px-4">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-6">
          <div>
            <span className="text-white font-bold text-lg">GatherGood</span>
            <p className="text-sm mt-1">Simple event management for nonprofits.</p>
          </div>
          <div className="flex gap-6 text-sm">
            <Link to="/events" className="hover:text-white transition-colors">Browse Events</Link>
            {isLoggedIn ? (
              <>
                <Link to="/manage" className="hover:text-white transition-colors">Dashboard</Link>
                <Link to="/my/tickets" className="hover:text-white transition-colors">My Tickets</Link>
              </>
            ) : (
              <>
                <Link to="/register" className="hover:text-white transition-colors">Sign Up</Link>
                <Link to="/login" className="hover:text-white transition-colors">Log In</Link>
              </>
            )}
          </div>
        </div>
      </footer>
    </div>
  )
}
