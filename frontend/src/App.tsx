import { Routes, Route } from 'react-router-dom'
import { Layout } from '@/components/Layout'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { Home } from '@/pages/Home'
import { Login } from '@/pages/Login'
import { Register } from '@/pages/Register'
import { ForgotPassword } from '@/pages/ForgotPassword'
import { ResetPassword } from '@/pages/ResetPassword'
import { Profile } from '@/pages/Profile'
import { MyTickets } from '@/pages/MyTickets'
import { OrgList } from '@/pages/manage/OrgList'
import { OrgCreate } from '@/pages/manage/OrgCreate'
import { OrgSettings } from '@/pages/manage/OrgSettings'
import { OrgTeam } from '@/pages/manage/OrgTeam'
import { Venues } from '@/pages/manage/Venues'
import { EventList } from '@/pages/manage/EventList'
import { EventForm } from '@/pages/manage/EventForm'
import { EventDetail } from '@/pages/manage/EventDetail'
import { TicketTiers } from '@/pages/manage/TicketTiers'
import { PromoCodes } from '@/pages/manage/PromoCodes'
import { CheckIn } from '@/pages/manage/CheckIn'
import { EmailSettings } from '@/pages/manage/EmailSettings'
import { GuestList } from '@/pages/manage/GuestList'
import { Analytics } from '@/pages/manage/Analytics'
import { SelectTickets } from '@/pages/checkout/SelectTickets'
import { CheckoutDetails } from '@/pages/checkout/Details'
import { CheckoutPayment } from '@/pages/checkout/Payment'
import { CheckoutConfirmation } from '@/pages/checkout/Confirmation'
import { EventBrowse } from '@/pages/EventBrowse'
import { EventPage } from '@/pages/EventPage'
import { OrgPage } from '@/pages/OrgPage'
import { NotFound } from '@/pages/NotFound'

function App() {
  return (
    <ErrorBoundary>
      <Routes>
        <Route element={<Layout />}>
          {/* Public */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          {/* Attendee (protected) */}
          <Route element={<ProtectedRoute />}>
            <Route path="/my/settings" element={<Profile />} />
            <Route path="/my/tickets" element={<MyTickets />} />
          </Route>
          {/* Organizer (protected) */}
          <Route element={<ProtectedRoute />}>
            <Route path="/manage" element={<OrgList />} />
            <Route path="/manage/org/new" element={<OrgCreate />} />
            <Route path="/manage/org/:orgSlug" element={<OrgSettings />} />
            <Route path="/manage/org/:orgSlug/team" element={<OrgTeam />} />
            <Route path="/manage/org/:orgSlug/venues" element={<Venues />} />
            <Route path="/manage/events" element={<EventList />} />
            <Route path="/manage/events/new" element={<EventForm />} />
            <Route path="/manage/events/:eventSlug" element={<EventDetail />} />
            <Route path="/manage/events/:eventSlug/edit" element={<EventForm />} />
            <Route path="/manage/events/:eventSlug/tickets" element={<TicketTiers />} />
            <Route path="/manage/events/:eventSlug/promos" element={<PromoCodes />} />
            <Route path="/manage/events/:eventSlug/check-in" element={<CheckIn />} />
            <Route path="/manage/events/:eventSlug/emails" element={<EmailSettings />} />
            <Route path="/manage/events/:eventSlug/guests" element={<GuestList />} />
            <Route path="/manage/events/:eventSlug/analytics" element={<Analytics />} />
          </Route>
          {/* Checkout */}
          <Route path="/checkout/:eventSlug" element={<SelectTickets />} />
          <Route path="/checkout/:eventSlug/details" element={<CheckoutDetails />} />
          <Route path="/checkout/:eventSlug/payment" element={<CheckoutPayment />} />
          <Route path="/checkout/:eventSlug/confirmation" element={<CheckoutConfirmation />} />
          {/* Public pages */}
          <Route path="/events" element={<EventBrowse />} />
          <Route path="/:orgSlug" element={<OrgPage />} />
          <Route path="/:orgSlug/events/:eventSlug" element={<EventPage />} />
          {/* 404 */}
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </ErrorBoundary>
  )
}

export default App
