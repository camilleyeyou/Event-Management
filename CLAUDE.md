# GatherGood - Simple Event Management for Nonprofits

Product Reference & Build Guide | Version 1.0 | February 2026

Built for community organizations hosting fundraiser dinners, volunteer meetups, awareness nights, and small workshops.

## 1. Product Overview

### Vision
GatherGood is a simple, affordable event management platform built for nonprofits and community organizations hosting events in cafes, libraries, community centers, and small venues. It handles the entire event lifecycle: create an event, sell tickets or collect RSVPs, communicate with attendees, and check people in at the door.

### Design Principles
- **Simple first:** Every feature should be usable by a nonprofit volunteer with no technical background. If it requires a tutorial, it needs to be simpler.
- **Free events are first-class:** Most nonprofit events are free RSVPs. The platform must treat free events with the same care as paid ones.
- **Mobile-ready:** Event managers often work from phones. Check-in happens on phones. Everything must work beautifully on mobile.
- **Community-focused copy:** Language uses terms like "community," "supporters," "attendees" rather than corporate event jargon.
- **Affordable:** Low or no platform fees for small nonprofits.

### What This Is NOT
- Not a fundraising/donation platform (though events may be fundraisers)
- Not a CRM or donor management system
- Not a venue booking or rental marketplace
- Not a social network or community forum

## 2. User Roles & Permissions

### Platform Admin
The GatherGood team. Full platform oversight: manage organizations, moderate content, handle disputes, process payouts, view platform-wide analytics.

### Organizer (Nonprofit Staff/Volunteer)
The primary user. Creates and manages nonprofit profiles, events, ticketing, guest lists, communications, and check-in. Sub-roles within an organization:

| Sub-Role | Can Do | Cannot Do |
|---|---|---|
| Owner | Everything, including billing and org deletion | N/A |
| Manager | Create/edit events, manage guests, send comms, check in | Change billing, delete org, remove Owner |
| Volunteer | View guest lists, check in attendees | Create/edit events, manage billing, send bulk comms |

### Attendee
Community members who discover events, RSVP or purchase tickets, receive communications, check in via QR code, and leave post-event feedback. Can view event history and manage tickets.

### Deferred Roles (Phase 2+)
Speaker/Performer and Vendor/Sponsor roles are deferred. Phase 1 organizers can list speaker names and sponsor logos in the event description rich text editor.

## 3. Core Features (Phase 1 MVP)

### 3.1 Organization (Nonprofit) Profile

| Field | Details |
|---|---|
| Organization Name | Display name (e.g., "Friends of the Library") |
| Description | Short bio / mission statement |
| Website URL | Link back to the org's own website |
| Logo | Square image, used in headers and event cards |
| Brand Color | Primary accent color for branded pages |
| Banner Image | Wide hero image for org landing page |
| Contact Email | Public contact for attendees |
| Contact Phone | Optional public phone number |
| Payout Config | Bank account for receiving ticket revenue (ACH) |

**Team Management:**
- Invite team members by email
- Assign roles: Owner, Manager, Volunteer
- Remove team members (Owner only)
- Each member sees only their organization's data

### 3.2 Venue Management

| Field | Details |
|---|---|
| Venue Name | e.g., "Blue Bottle Coffee - Hayes Valley" |
| Address | Street address, auto-geocoded to lat/long |
| City / State / ZIP | For search and display |
| Capacity | Max number of attendees the venue holds |
| Accessibility Info | Wheelchair access, elevator, etc. |
| Parking / Transit | Notes on how to get there |

Venues are saved per organization and reusable across events. Address is auto-geocoded on save for map display and proximity search.

### 3.3 Event Creation & Management

**Event Details:**

| Field | Details |
|---|---|
| Title | Event name (e.g., "Spring Community Dinner") |
| Subtitle | Optional tagline |
| Description | Rich text editor with formatting, links, images |
| Format | In-Person / Virtual / Hybrid |
| Category | Fundraiser, Workshop, Meetup, Volunteer, Social, Other |
| Cover Image | Hero image for event page and cards |
| Date & Time | Start, end, doors-open, timezone. Optional "Date TBD" flag |
| Venue | Select saved venue or enter new (in-person/hybrid) |
| Virtual Link | Zoom/Google Meet URL, revealed only to ticket holders |
| Private Toggle | Unlisted event, accessible only via direct link |

**Event Status Lifecycle:**

```
DRAFT -> PUBLISHED -> LIVE -> COMPLETED -> CANCELLED
```

- Draft: Event is being set up, not visible to the public
- Published: Event page is live, tickets are available
- Live: Event is currently happening (auto-transitions at start time)
- Completed: Event has ended (auto-transitions after end time)
- Cancelled: Organizer has cancelled; attendees are notified

### 3.4 Ticketing

GatherGood supports both free RSVPs and paid tickets with multiple tiers.

**Ticket Tier Example (nonprofit dinner):**

| Tier | Price | Capacity | Visibility | Notes |
|---|---|---|---|---|
| Free Community RSVP | $0 | 50 | Public | Open to everyone |
| Supporter Ticket | $25 | 30 | Public | Includes dinner |
| Patron Table (8 seats) | $200 | 5 | Public | Reserved table for 8 |
| Board Member | $0 | 12 | Invite-Only | Pre-reserved, hidden from public |

**Per-Tier Configuration:**
- Name and description
- Price ($0 for free RSVP tiers)
- Quantity available (capacity per tier)
- Sales start and end dates (for early bird pricing, etc.)
- Min/max tickets per order
- Visibility: Public, Hidden, or Invite-Only
- For hybrid events: mark tier as In-Person or Virtual

**Promo Codes:**
- Code string (e.g., VOLUNTEER20, BOARDMEMBER)
- Discount type: percentage off or fixed dollar amount
- Applicable to all tiers or specific ones
- Usage limits (total and per-person)
- Valid date range and active/inactive toggle

**Refund Policy (configurable per event):**
- Full refund before X days
- Partial refund before Y days
- No refunds after Z days
- Organizer can always issue manual refunds
- Platform admin can override any refund policy

### 3.5 Checkout & Payments

**Checkout Flow (4 steps):**
1. Select Tickets: Choose tier(s), enter quantities, apply promo code
2. Your Details: Name, email, phone number
3. Payment: Credit/debit card via Stripe (skipped for free events)
4. Confirmation: Order summary, ticket PDF download, QR code, "Add to Calendar" button

**Free Event Flow:** For events where all tiers are $0, the checkout skips the payment step entirely. Attendees just provide their name and email, and receive a confirmation with their QR code.

**Payment Details:**
- Stripe as payment processor (PCI-compliant, card data never touches our servers)
- Apple Pay and Google Pay supported via Stripe
- Automatic receipt emails
- Platform takes a small configurable fee per paid transaction
- Nonprofits receive payouts on a configurable schedule (weekly/bi-weekly/monthly)
- Cart holds tickets for 15 minutes, then releases them back to inventory

### 3.6 QR Code Check-In

Every ticket gets a unique QR code that can be scanned at the door using any smartphone. No app download required.

**How It Works:**
1. Attendee receives QR code in confirmation email and on their "My Tickets" page
2. At the event, a volunteer opens the check-in page on their phone
3. Phone camera scans the QR code
4. Screen shows: attendee name, ticket type, and status (green = valid, yellow = already checked in, red = invalid)

**Security:**
- QR codes contain an HMAC-signed payload (order ID + ticket tier + attendee ID)
- Validated server-side to prevent forgery
- Cannot be reused (shows "already checked in" with timestamp on second scan)

**Fallback Options:**
- Search by attendee name or confirmation code
- Manual check-in checkbox from the guest list view
- Live counter: checked-in vs. total registered

### 3.7 Email Notifications

Automated emails at key moments. Organizers can toggle each one on/off per event.

| Email | To | When |
|---|---|---|
| RSVP / Purchase Confirmation | Attendee | Immediately after registration |
| Ticket PDF + QR Code | Attendee | Attached to confirmation email |
| Event Reminder | Attendee | 48 hours before event |
| Day-Of Reminder | Attendee | Morning of the event |
| Event Update | Attendee | When organizer changes event details |
| Event Cancellation | Attendee | When event is cancelled |
| Post-Event Thank You | Attendee | 24 hours after event ends |
| New Registration Alert | Organizer | When someone registers (configurable) |
| Daily Summary | Organizer | Daily digest of registrations + revenue |
| Low Inventory Alert | Organizer | When a ticket tier is almost sold out |
| Payout Processed | Organizer | When funds are transferred to bank |
| Refund Processed | Attendee | When a refund is completed |

Organizers can also send custom bulk emails to all attendees of a specific event.

### 3.8 Guest List & Analytics

**Guest List:**
- View all registered attendees with name, email, ticket tier, and check-in status
- Search and filter by name, tier, or status
- Export to CSV for use in other tools

**Analytics Dashboard (Basic):**
- Total registrations (per tier and overall)
- Total revenue (gross and net after fees)
- Registration timeline (chart showing signups over time)
- Attendance rate (checked-in vs. registered)
- Top promo codes by usage
- Refund count and amount

### 3.9 Public Event Pages

**Event Detail Page:**
- SEO-friendly URL: gathergood.com/{org-slug}/events/{event-slug}
- Event details: title, date, venue with map, description, cover image
- Ticket selection and "Register" / "Get Tickets" button
- Organization branding (logo, colors) applied automatically
- Responsive design that looks great shared on social media

**Organization Landing Page:** Each nonprofit gets a branded page listing all their upcoming and past events.

**Event Browse / Discovery:** A simple public page where community members can find events by keyword, category, date, or location.

## 4. Data Model

All tables use soft deletes (status flags) rather than hard deletes. All datetimes are stored as UTC.

### User
- `id` - UUID primary key
- `email` - Unique, used for login
- `password_hash` - Hashed password
- `first_name, last_name` - Display name
- `phone` - Optional, for SMS features (Phase 2)
- `avatar_url` - Profile photo
- `stripe_customer_id` - Stripe reference for saved payment methods
- `email_verified` - Boolean
- `created_at, updated_at` - Timestamps

### Organization
- `id, name, slug` - Identity and URL-friendly slug
- `description` - Mission statement / bio
- `website_url` - External website link
- `logo_url, banner_url` - Branding images
- `primary_color` - Hex color for branded pages
- `contact_email, contact_phone` - Public contact info
- `payout_config` - JSON: bank account details, payout schedule
- `created_at, updated_at` - Timestamps

### OrganizationMember
- `id, organization_id, user_id` - Links user to org
- `role` - OWNER | MANAGER | VOLUNTEER
- `invited_at, accepted_at` - Invitation tracking

### Venue
- `id, organization_id` - Belongs to an org
- `name, address, city, state, postal_code` - Location details
- `latitude, longitude` - Auto-geocoded from address
- `capacity` - Max attendees
- `accessibility_info, parking_notes` - Helpful details for attendees

### Event
- `id, organization_id, created_by` - Ownership
- `title, subtitle, slug` - Display and URL
- `description` - Rich text (HTML)
- `format` - IN_PERSON | VIRTUAL | HYBRID
- `status` - DRAFT | PUBLISHED | LIVE | COMPLETED | CANCELLED
- `category, tags[]` - For discovery and filtering
- `cover_image_url` - Hero image
- `is_private` - Boolean: unlisted event
- `start_datetime, end_datetime` - UTC timestamps
- `timezone, doors_open_time` - Display timezone and optional doors time
- `date_tbd` - Boolean: allows publishing without confirmed date
- `venue_id` - Nullable FK to Venue
- `virtual_link, virtual_platform` - For virtual/hybrid events
- `refund_policy` - JSON: time-based refund rules
- `email_config` - JSON: toggle each automated email on/off

### TicketTier
- `id, event_id` - Belongs to an event
- `name, description` - Tier display info
- `price` - Decimal ($0 for free)
- `quantity_total, quantity_sold` - Capacity tracking
- `sales_start, sales_end` - Time-limited availability
- `min_per_order, max_per_order` - Purchase limits
- `visibility` - PUBLIC | HIDDEN | INVITE_ONLY
- `attendance_mode` - IN_PERSON | VIRTUAL (hybrid events)
- `sort_order, is_active` - Display order and soft delete

### PromoCode
- `id, event_id, code` - Unique code per event
- `discount_type` - PERCENTAGE | FIXED
- `discount_value` - Amount or percentage
- `applicable_tier_ids[]` - Empty = all tiers
- `usage_limit, usage_count` - Total uses tracking
- `per_customer_limit` - Max uses per person
- `valid_from, valid_until` - Date range
- `is_active` - Toggle

### Order
- `id, user_id, event_id` - Who bought what, where
- `status` - PENDING | COMPLETED | REFUNDED | PARTIALLY_REFUNDED | FAILED
- `confirmation_code` - Random 10-char alphanumeric
- `subtotal, discount_amount, fees, total` - Financial breakdown
- `promo_code_id` - Nullable FK
- `billing_name, billing_email, billing_phone` - Buyer info
- `stripe_payment_intent_id` - Stripe reference
- `refund_amount` - Running total of refunds issued

### OrderLineItem
- `id, order_id, ticket_tier_id` - Links order to tiers
- `quantity, unit_price` - What was purchased
- `discount_amount, line_total` - After discounts

### Ticket
- `id, order_id, ticket_tier_id, event_id, user_id` - Full context
- `attendee_name, attendee_email` - Per-ticket attendee info
- `qr_code_data` - HMAC-signed payload
- `qr_code_image_url` - S3 link to QR image
- `checked_in, checked_in_at, checked_in_by` - Check-in tracking
- `status` - ACTIVE | CANCELLED | REFUNDED

### EventEmailLog
- `id, event_id, trigger_type` - Which automated email
- `recipient_id, sent_at` - Who and when
- `status` - SENT | FAILED | BOUNCED

### Payout
- `id, organization_id` - Which org gets paid
- `period_start, period_end` - Payout window
- `gross_amount, platform_fee, net_amount` - Financial breakdown
- `status` - PENDING | PROCESSING | COMPLETED | FAILED
- `transfer_id` - Bank transfer reference

## 5. Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18+ with TypeScript |
| UI Framework | Tailwind CSS + shadcn/ui |
| State Management | React Query (server) + Zustand (client) |
| Backend | Python 3.12+ / Django 5.x + Django REST Framework |
| Database | PostgreSQL 16 |
| Cache | Redis (sessions, rate limiting, live check-in counts) |
| Task Queue | Celery + Redis (async emails, payout processing) |
| Payments | Stripe (PaymentIntents, webhooks) |
| Email | SendGrid or AWS SES (transactional email) |
| File Storage | AWS S3 (images, ticket PDFs) |
| Search | PostgreSQL full-text search |
| Geocoding | Google Maps Geocoding API or Mapbox |
| QR Generation | Python: qrcode library / React: qrcode.react |
| PDF Generation | WeasyPrint (ticket PDFs) |
| Real-time | Django Channels + WebSockets (live check-in counts) |
| Deployment | Docker containers on Railway or Render |
| CI/CD | GitHub Actions |
| Monitoring | Sentry (errors) |

## 6. API Structure

All API endpoints are prefixed with `/api/v1/`. Authentication uses JWT tokens. The API follows REST conventions with Django REST Framework serializers and viewsets.

### Auth (/auth/)
| Endpoint | Description |
|---|---|
| POST /register | Create new account |
| POST /login | Get JWT tokens |
| POST /logout | Invalidate tokens |
| POST /forgot-password | Send reset email |
| POST /reset-password | Set new password |
| GET /me | Current user profile |
| PATCH /me | Update profile |

### Organizations (/organizations/)
| Endpoint | Description |
|---|---|
| GET / | List my organizations |
| POST / | Create organization |
| GET /{org_slug} | Organization detail |
| PATCH /{org_slug} | Update organization |
| GET /{org_slug}/members | List team members |
| POST /{org_slug}/members | Invite team member |
| DELETE /{org_slug}/members/{id} | Remove team member |
| GET /{org_slug}/venues | List saved venues |

### Events (/events/)
| Endpoint | Description |
|---|---|
| GET / | Browse/search events (public) |
| POST / | Create event |
| GET /{event_slug} | Event detail page (public) |
| PATCH /{event_slug} | Update event |
| POST /{event_slug}/publish | Publish draft event |
| POST /{event_slug}/cancel | Cancel event |
| GET /{event_slug}/guests | Guest list (organizer only) |
| GET /{event_slug}/guests/csv | Export guest list CSV |
| GET /{event_slug}/analytics | Event metrics |

### Ticket Tiers (/events/{slug}/ticket-tiers/)
| Endpoint | Description |
|---|---|
| GET / | List tiers for event |
| POST / | Create tier |
| PATCH /{tier_id} | Update tier |
| DELETE /{tier_id} | Deactivate tier |

### Promo Codes (/events/{slug}/promo-codes/)
| Endpoint | Description |
|---|---|
| GET / | List promo codes |
| POST / | Create promo code |
| PATCH /{code_id} | Update promo code |
| POST /validate | Validate a code at checkout |

### Check-In (/events/{slug}/check-in/)
| Endpoint | Description |
|---|---|
| POST /scan | Scan QR code |
| POST /{ticket_id}/manual | Manual check-in |
| GET /stats | Live check-in counts |
| GET /search | Search by name or confirmation code |

### Checkout (/checkout/)
| Endpoint | Description |
|---|---|
| POST /cart | Create or update cart |
| GET /cart | Get current cart |
| POST /payment-intent | Create Stripe PaymentIntent |
| POST /complete | Finalize order after payment |
| POST /webhook | Stripe webhook handler |

### Orders (/orders/)
| Endpoint | Description |
|---|---|
| GET / | My orders |
| GET /{order_id} | Order detail |
| GET /{order_id}/tickets | My tickets with QR codes |
| POST /{order_id}/refund | Request refund |
| GET /{order_id}/receipt.pdf | Download receipt |

## 7. Background Tasks (Celery)

| Task | Schedule | Description |
|---|---|---|
| send_event_reminder_48h | Hourly | Email 48-hour reminder to attendees |
| send_event_reminder_day_of | Hourly | Email day-of reminder to attendees |
| send_post_event_thanks | Hourly | Send thank-you email 24h after event |
| send_daily_sales_summary | Daily 8am | Email digest to organizers |
| process_payouts | Configurable | Calculate and initiate bank transfers |
| mark_events_completed | Hourly | Auto-transition past events to COMPLETED |
| send_low_inventory_alerts | Every 15 min | Alert when tiers nearly sold out |
| cleanup_abandoned_carts | Hourly | Release held tickets after 15 min |
| retry_failed_payments | Every 30 min | Retry failed charges with notification |

## 8. Frontend Page Structure

React Router routes organized by user context.

### 8.1 Public Routes
| Route | Page |
|---|---|
| / | Homepage / event discovery |
| /events | Browse and search events |
| /events/{event-slug} | Event detail page |
| /{org-slug} | Organization landing page |
| /{org-slug}/events/{event-slug} | Event page within org context |
| /login | Login |
| /register | Create account |
| /forgot-password | Password reset |

### 8.2 Attendee Routes (Authenticated)
| Route | Page |
|---|---|
| /my/tickets | My upcoming tickets |
| /my/orders | Order history |
| /my/orders/{order-id} | Order detail with tickets |
| /my/settings | Account settings |

### 8.3 Organizer Routes (Authenticated)
| Route | Page |
|---|---|
| /manage | Organizer dashboard home |
| /manage/org/{org-slug} | Organization settings |
| /manage/org/{org-slug}/team | Team management |
| /manage/org/{org-slug}/venues | Saved venues |
| /manage/org/{org-slug}/payouts | Payout history |
| /manage/events | My events list |
| /manage/events/new | Create event |
| /manage/events/{slug}/edit | Edit event |
| /manage/events/{slug}/tickets | Manage ticket tiers |
| /manage/events/{slug}/promos | Manage promo codes |
| /manage/events/{slug}/guests | Guest list |
| /manage/events/{slug}/check-in | QR check-in scanner |
| /manage/events/{slug}/comms | Email settings |
| /manage/events/{slug}/analytics | Event analytics |

### 8.4 Checkout Flow
| Route | Page |
|---|---|
| /checkout/{event-slug} | Select tickets + promo code |
| /checkout/{event-slug}/details | Attendee + billing info |
| /checkout/{event-slug}/payment | Stripe payment (paid events only) |
| /checkout/{event-slug}/confirmation | Order confirmation + QR code |

## 9. Business Rules

| Rule | Details |
|---|---|
| Confirmation Codes | Random 10-character alphanumeric string, unique per order |
| Geocoding on Save | Venue addresses are auto-geocoded to lat/long for map display and proximity search |
| Soft Deletes | Tickets, orders, and events use status flags. Nothing is ever hard-deleted |
| Email Cadence | Configurable per event. Organizers toggle each automated email on or off |
| Capacity Enforcement | Ticket sales cannot exceed tier quantity. Enforced with database row-level locking |
| Cart Expiration | Tickets held in cart for 15 minutes, then automatically released back to inventory |
| QR Code Security | QR payloads are HMAC-signed server-side. Check-in validates the signature to prevent forgery |
| Timezone Handling | All datetimes stored as UTC. Displayed in the event's configured timezone |
| Idempotent Payments | Stripe PaymentIntent IDs prevent double-charges on retries or network issues |
| Free Event Optimization | When all tiers are $0, checkout skips payment step. No Stripe interaction needed |

## 10. Build Milestones

Each milestone is a self-contained feature set that can be built and tested independently. Build them in order.

### Milestone 1: Project Setup & Authentication
**What to build:** Django project with PostgreSQL, React app with TypeScript + Tailwind + shadcn/ui, user registration/login/logout, JWT auth, basic profile page.
**How to test:** Can you register an account, log in, and see your profile?

### Milestone 2: Organization (Nonprofit) Management
**What to build:** Create/edit nonprofit profile with name, description, logo, brand color. Invite team members by email. Role-based permissions (Owner/Manager/Volunteer).
**How to test:** Can you create "Friends of the Library", upload a logo, and invite a teammate?

### Milestone 3: Venue Management
**What to build:** CRUD for saved venues. Address auto-geocoding. Map display on venue detail.
**How to test:** Can you save "Blue Bottle Coffee, 315 Linden St" and see it on a map?

### Milestone 4: Event Creation & Management
**What to build:** Full event CRUD with rich text description. Support for in-person, virtual, hybrid. Event status lifecycle with publish/cancel actions. Attach saved venues.
**How to test:** Can you create a "Spring Community Dinner" and publish it?

### Milestone 5: Ticketing & Promo Codes
**What to build:** Create multiple ticket tiers per event. Configure pricing, capacity, visibility. Create and validate promo codes.
**How to test:** Can you set up Free RSVP + $25 Supporter tiers and validate code VOLUNTEER20?

### Milestone 6: Checkout & Payments
**What to build:** 4-step checkout flow. Stripe integration (test mode). Free event flow (skip payment). Order creation with confirmation code. Cart expiration (15 min).
**How to test:** Can you complete a test purchase and see the order confirmation?

### Milestone 7: QR Codes & Check-In
**What to build:** Generate HMAC-signed QR codes per ticket. QR on confirmation page + downloadable PDF. Mobile camera scanner. Manual check-in fallback. Live count dashboard.
**How to test:** Can you scan a QR code on your phone and see green "Checked In"?

### Milestone 8: Email Notifications
**What to build:** SendGrid/SES integration. Confirmation email with ticket. 48-hour and day-of reminders. Cancellation notice. Bulk email to attendees. Per-event toggle config.
**How to test:** Do you get a confirmation email after registering? A reminder the next day?

### Milestone 9: Guest List & Analytics
**What to build:** Guest list view with search and filter. CSV export. Analytics dashboard cards: registrations, revenue, attendance rate, promo code usage.
**How to test:** Can you see all attendees, export to CSV, and view the analytics dashboard?

### Milestone 10: Public Pages & Discovery
**What to build:** Public event detail page (SEO-friendly). Organization landing page with branding. Event browse page with search, category, and location filters.
**How to test:** Can someone find your event by searching "fundraiser dinner" on the browse page?

## 11. Deferred Features (Phase 2+)

These features are part of the full vision but are NOT included in the Phase 1 MVP. The data model and architecture should accommodate them, but they will not be built until Phase 1 is complete and tested.

- **SMS Notifications** - Twilio integration for day-of reminders and cancellation alerts
- **In-App Messaging** - Notification inbox, organizer-to-attendee messaging, push notifications
- **Speaker/Performer Management** - Invitation workflows, speaker profiles on event pages, speaker dashboard
- **Vendor/Sponsor Management** - Tiered sponsorship, branding on event pages, sponsor metrics
- **Group Discounts** - Threshold-based pricing (e.g., 10+ tickets = 15% off)
- **Waitlist System** - Auto-notify when tickets become available, time-limited purchase window
- **Embeddable Widget** - JS snippet for orgs to embed event listings on their own websites
- **Custom Subdomains** - yourorg.gathergood.com
- **Reserved Seating** - Venue maps, section/row/seat assignment, seat selection at checkout
- **Advanced Analytics** - Conversion funnels, cohort analysis, revenue forecasting
- **Recurring Events** - Series events with shared settings
- **Mobile App** - React Native app for check-in and attendee experience
- **Stripe Connect** - Let orgs use their own Stripe accounts instead of platform-managed payouts
- **Multi-Language Support** - Localization for non-English communities
- **Webhook / API** - Let orgs build integrations with their existing tools

## 12. Non-Functional Requirements

| Requirement | Details |
|---|---|
| Performance | Event pages load in under 2 seconds. Checkout flow under 1 second per step |
| Security | OWASP top 10 compliance. HTTPS everywhere. HMAC-signed QR codes. PCI compliance via Stripe (card data never touches our servers) |
| Accessibility | WCAG 2.1 AA compliance for all public-facing pages. Keyboard navigation, screen reader support, sufficient color contrast |
| SEO | Server-side rendering or static generation for public event pages. Open Graph meta tags for social sharing |
| Data Privacy | GDPR-compliant data handling. Users can export or delete their data. Daily automated backups |
| Availability | 99.9% uptime target |
| Mobile | Fully responsive design. Check-in scanner works on any modern smartphone browser |

## 13. AI Build Prompt Template

Use this prompt when starting each milestone:

> I am building GatherGood, a simple event management platform for nonprofits. The tech stack is:
> Frontend: React 18 + TypeScript + Tailwind CSS + shadcn/ui
> Backend: Python 3.12 / Django 5.x + Django REST Framework
> Database: PostgreSQL 16 | Cache/Queue: Redis + Celery | Payments: Stripe
> I am working on [MILESTONE]. See the attached PRODUCT_SPEC for the full data model, API structure, and business rules. Please build this feature step by step, explaining each file you create.
