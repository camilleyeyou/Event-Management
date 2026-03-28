# GatherGood — End-to-End Test Specification

Complete testing guide for automated agents or QA testers. Covers every feature, endpoint, UI flow, and business rule.

---

## Deployment Info

| Service | URL |
|---|---|
| Frontend (Vercel) | `https://event-management-two-red.vercel.app` |
| Backend API (Railway) | `https://event-management-production-ad62.up.railway.app/api/v1` |
| Database | PostgreSQL 16 (Railway-managed) |

All API requests use base URL: `https://event-management-production-ad62.up.railway.app/api/v1`

---

## Authentication

JWT-based authentication via `djangorestframework-simplejwt`.

| Setting | Value |
|---|---|
| Access token lifetime | 30 minutes |
| Refresh token lifetime | 7 days |
| Rotate refresh tokens | Yes |
| Header format | `Authorization: Bearer {access_token}` |

### Token Flow

1. **Register** — `POST /auth/register/` (no auth)
2. **Login** — `POST /auth/login/` → returns `{access, refresh}`
3. **Use access token** — attach `Authorization: Bearer {access}` header to all authenticated requests
4. **Refresh** — `POST /auth/token/refresh/` with `{refresh: "..."}` → returns new `{access, refresh}`
5. **Logout** — client-side only (remove tokens from storage)

---

## Test Scenarios

### 1. User Registration

**Endpoint:** `POST /auth/register/`
**Auth:** None

**Request:**
```json
{
  "email": "testuser@example.com",
  "password": "SecurePass123!",
  "password_confirm": "SecurePass123!",
  "first_name": "Test",
  "last_name": "User"
}
```

**Expected Response (201):**
```json
{
  "message": "Account created successfully.",
  "user": {
    "id": "uuid",
    "email": "testuser@example.com",
    "first_name": "Test",
    "last_name": "User",
    "phone": "",
    "avatar_url": "",
    "email_verified": false,
    "created_at": "..."
  }
}
```

**Negative Tests:**
| Test | Input | Expected |
|---|---|---|
| Missing email | omit `email` | 400 — email required |
| Duplicate email | same email twice | 400 — email already exists |
| Password mismatch | different password_confirm | 400 — passwords don't match |
| Weak password | "123" | 400 — password too short/common |
| Missing first_name | omit `first_name` | 400 — first_name required |

**Frontend Route:** `/register`
**UI Test:** Fill all fields, submit, verify redirect to login or dashboard.

---

### 2. User Login

**Endpoint:** `POST /auth/login/`
**Auth:** None

**Request:**
```json
{
  "email": "testuser@example.com",
  "password": "SecurePass123!"
}
```

**Expected Response (200):**
```json
{
  "access": "eyJ0eXAiOiJKV1Qi...",
  "refresh": "eyJ0eXAiOiJKV1Qi..."
}
```

**Negative Tests:**
| Test | Input | Expected |
|---|---|---|
| Wrong password | wrong password string | 401 — no active account |
| Non-existent email | unknown@example.com | 401 — no active account |
| Missing fields | omit password | 400 |

**Frontend Route:** `/login`
**UI Test:** Login, verify navbar shows user avatar and name, "Dashboard" link appears.

---

### 3. Token Refresh

**Endpoint:** `POST /auth/token/refresh/`
**Auth:** None

**Request:**
```json
{
  "refresh": "eyJ0eXAiOiJKV1Qi..."
}
```

**Expected Response (200):**
```json
{
  "access": "new_access_token",
  "refresh": "new_refresh_token"
}
```

**Negative Tests:**
| Test | Input | Expected |
|---|---|---|
| Expired refresh token | old/expired token | 401 — token invalid or expired |
| Invalid token | random string | 401 |

---

### 4. User Profile

**Endpoint:** `GET /auth/me/` | `PATCH /auth/me/`
**Auth:** Required

**GET Response (200):**
```json
{
  "id": "uuid",
  "email": "testuser@example.com",
  "first_name": "Test",
  "last_name": "User",
  "phone": "",
  "avatar_url": "",
  "email_verified": false,
  "created_at": "..."
}
```

**PATCH Request (update profile):**
```json
{
  "first_name": "Updated",
  "phone": "415-555-0100"
}
```

**Negative Tests:**
| Test | Expected |
|---|---|
| No auth header | 401 |
| Expired access token | 401 (frontend should auto-refresh) |

**Frontend Route:** `/my/settings`

---

### 5. Password Reset

**Step 1 — Request reset:**
**Endpoint:** `POST /auth/forgot-password/`
```json
{
  "email": "testuser@example.com"
}
```
**Expected:** 200 with success message (always succeeds to prevent email enumeration)

**Step 2 — Reset password:**
**Endpoint:** `POST /auth/reset-password/`
```json
{
  "uid": "base64-encoded-user-id",
  "token": "reset-token-from-email",
  "password": "NewSecurePass456!",
  "password_confirm": "NewSecurePass456!"
}
```
**Expected:** 200 with success message

**Frontend Routes:** `/forgot-password`, `/reset-password?uid=...&token=...`

---

### 6. Create Organization

**Endpoint:** `POST /organizations/`
**Auth:** Required

**Request:**
```json
{
  "name": "Friends of the Library",
  "description": "A community organization supporting local libraries",
  "contact_email": "info@friendsofthelibrary.org",
  "primary_color": "#2e7d5b"
}
```

**Expected Response (201):**
```json
{
  "id": "uuid",
  "name": "Friends of the Library",
  "slug": "friends-of-the-library",
  "description": "A community organization supporting local libraries",
  "website_url": "",
  "logo_url": "",
  "banner_url": "",
  "primary_color": "#2e7d5b",
  "contact_email": "info@friendsofthelibrary.org",
  "contact_phone": "",
  "created_at": "...",
  "updated_at": "...",
  "role": "OWNER"
}
```

**Important:** The creator is automatically assigned the OWNER role.

**Slug auto-generation:** "Friends of the Library" → "friends-of-the-library". Duplicate names get suffixed: "friends-of-the-library-1".

**Frontend Route:** `/manage/org/new`

---

### 7. List My Organizations

**Endpoint:** `GET /organizations/`
**Auth:** Required

**Expected:** Array of organizations where the authenticated user is a member. Each includes a `role` field.

---

### 8. Update Organization

**Endpoint:** `PATCH /organizations/{org_slug}/`
**Auth:** Required (MANAGER or OWNER)

**Request:**
```json
{
  "description": "Updated mission statement",
  "website_url": "https://friendsofthelibrary.org"
}
```

**Permission Tests:**
| Role | Expected |
|---|---|
| OWNER | 200 — success |
| MANAGER | 200 — success |
| VOLUNTEER | 403 — forbidden |
| Non-member | 404 — not found |

**Frontend Route:** `/manage/org/{org_slug}`

---

### 9. Team Management

**Invite Member:**
**Endpoint:** `POST /organizations/{org_slug}/members/invite/`
**Auth:** Required (MANAGER or OWNER)

```json
{
  "email": "volunteer@example.com",
  "role": "VOLUNTEER"
}
```

**List Members:**
**Endpoint:** `GET /organizations/{org_slug}/members/`

**Remove Member:**
**Endpoint:** `DELETE /organizations/{org_slug}/members/{member_id}/`
**Auth:** Required (OWNER only)

**Permission Tests:**
| Action | OWNER | MANAGER | VOLUNTEER |
|---|---|---|---|
| Invite member | Yes | Yes | No (403) |
| Remove member | Yes | No (403) | No (403) |
| List members | Yes | Yes | Yes |

**Constraint:** Managers cannot assign the OWNER role when inviting.

**Frontend Route:** `/manage/org/{org_slug}/team`

---

### 10. Venue Management

**Create Venue:**
**Endpoint:** `POST /organizations/{org_slug}/venues/`
**Auth:** Required (org member)

```json
{
  "name": "Blue Bottle Coffee - Hayes Valley",
  "address": "315 Linden St",
  "city": "San Francisco",
  "state": "CA",
  "postal_code": "94102",
  "capacity": 60,
  "accessibility_info": "Wheelchair accessible, ground floor",
  "parking_notes": "Street parking on Linden and Octavia"
}
```

**Expected:** 201 with venue data. `latitude` and `longitude` may be auto-geocoded.

**List Venues:**
**Endpoint:** `GET /organizations/{org_slug}/venues/`

**Update Venue:**
**Endpoint:** `PATCH /organizations/{org_slug}/venues/{venue_id}/`

**Frontend Route:** `/manage/org/{org_slug}/venues`

---

### 11. Event Creation

**Endpoint:** `POST /organizations/{org_slug}/events/`
**Auth:** Required (MANAGER or OWNER)

```json
{
  "title": "Spring Community Dinner",
  "subtitle": "Annual fundraiser dinner",
  "description": "<p>Join us for our annual spring dinner supporting local literacy programs.</p>",
  "format": "IN_PERSON",
  "category": "FUNDRAISER",
  "start_datetime": "2026-04-15T18:00:00Z",
  "end_datetime": "2026-04-15T21:00:00Z",
  "timezone": "America/Los_Angeles",
  "venue": "venue-uuid-here",
  "tags": ["dinner", "fundraiser", "community"]
}
```

**Expected:** 201 with event data. `status` defaults to `DRAFT`. `slug` auto-generated from title.

**Format Options:** `IN_PERSON`, `VIRTUAL`, `HYBRID`
**Category Options:** `FUNDRAISER`, `WORKSHOP`, `MEETUP`, `VOLUNTEER`, `SOCIAL`, `OTHER`

**Frontend Route:** `/manage/events/new` (requires `?org={org_slug}` query param)

---

### 12. Event Lifecycle

**Publish Event:**
**Endpoint:** `POST /organizations/{org_slug}/events/{event_slug}/publish/`
**Auth:** Required (MANAGER or OWNER)
**Precondition:** Event must be in DRAFT status.
**Result:** Status changes to PUBLISHED.

**Cancel Event:**
**Endpoint:** `POST /organizations/{org_slug}/events/{event_slug}/cancel/`
**Auth:** Required (MANAGER or OWNER)
**Result:** Status changes to CANCELLED from any status.

**Auto-transitions (background):**
- PUBLISHED → LIVE: when current time passes `start_datetime`
- LIVE → COMPLETED: when current time passes `end_datetime`

**Status Flow Tests:**
| From | Action | To | Expected |
|---|---|---|---|
| DRAFT | publish | PUBLISHED | 200 |
| PUBLISHED | publish | — | 400 (already published) |
| DRAFT | cancel | CANCELLED | 200 |
| PUBLISHED | cancel | CANCELLED | 200 |
| COMPLETED | cancel | CANCELLED | 200 |
| CANCELLED | publish | — | 400 (cannot publish cancelled) |

---

### 13. Ticket Tier Management

**Create Tier:**
**Endpoint:** `POST /organizations/{org_slug}/events/{event_slug}/ticket-tiers/`
**Auth:** Required (MANAGER or OWNER)

**Example: Free RSVP Tier:**
```json
{
  "name": "Free Community RSVP",
  "description": "Open to everyone in the community",
  "price": "0.00",
  "quantity_total": 50,
  "min_per_order": 1,
  "max_per_order": 5,
  "visibility": "PUBLIC",
  "attendance_mode": "IN_PERSON",
  "sort_order": 0
}
```

**Example: Paid Tier:**
```json
{
  "name": "Supporter Ticket",
  "description": "Includes dinner and beverages",
  "price": "25.00",
  "quantity_total": 30,
  "min_per_order": 1,
  "max_per_order": 10,
  "visibility": "PUBLIC",
  "attendance_mode": "IN_PERSON",
  "sort_order": 1
}
```

**Example: Invite-Only Tier:**
```json
{
  "name": "Board Member",
  "description": "Pre-reserved for board members",
  "price": "0.00",
  "quantity_total": 12,
  "visibility": "INVITE_ONLY",
  "sort_order": 2
}
```

**Visibility Options:** `PUBLIC`, `HIDDEN`, `INVITE_ONLY`
**Attendance Mode:** `IN_PERSON`, `VIRTUAL`

**Response includes calculated field:**
```json
{
  "quantity_remaining": 50
}
```

**Delete (soft):**
**Endpoint:** `DELETE /organizations/{org_slug}/events/{event_slug}/ticket-tiers/{tier_id}/`
Sets `is_active = false` (soft delete, not hard delete).

**Frontend Route:** `/manage/events/{eventSlug}/tickets` (requires `?org={org_slug}` query param)

---

### 14. Promo Code Management

**Create Promo Code:**
**Endpoint:** `POST /organizations/{org_slug}/events/{event_slug}/promo-codes/`
**Auth:** Required (MANAGER or OWNER)

**Example: Percentage Discount:**
```json
{
  "code": "VOLUNTEER20",
  "discount_type": "PERCENTAGE",
  "discount_value": "20.00",
  "applicable_tier_ids": [],
  "usage_limit": 100,
  "per_customer_limit": 1,
  "valid_from": "2026-03-01T00:00:00Z",
  "valid_until": "2026-04-30T23:59:59Z",
  "is_active": true
}
```

**Example: Fixed Dollar Discount:**
```json
{
  "code": "EARLYBIRD10",
  "discount_type": "FIXED",
  "discount_value": "10.00",
  "applicable_tier_ids": ["tier-uuid-1"],
  "usage_limit": 50,
  "per_customer_limit": 1,
  "is_active": true
}
```

**Note:** `applicable_tier_ids = []` (empty array) means the code applies to ALL tiers.
**Note:** `code` is stored uppercase automatically.

**Validate Promo Code (public):**
**Endpoint:** `POST /organizations/{org_slug}/events/{event_slug}/promo-codes/validate/`
**Auth:** None

```json
{
  "code": "VOLUNTEER20",
  "tier_ids": ["tier-uuid-1", "tier-uuid-2"]
}
```

**Validation checks:**
- Code exists and is_active
- Code not expired (valid_from/valid_until)
- usage_count < usage_limit
- Code applies to at least one of the provided tier_ids

**Frontend Route:** `/manage/events/{eventSlug}/promos` (requires `?org={org_slug}` query param)

---

### 15. Checkout Flow — Free Event

This is the most critical flow. Free events skip payment entirely.

**Step 1: Calculate totals**
**Endpoint:** `POST /checkout/`

```json
{
  "action": "calculate",
  "org_slug": "friends-of-the-library",
  "event_slug": "spring-community-dinner",
  "items": [
    {"tier_id": "free-tier-uuid", "quantity": 2}
  ]
}
```

**Expected Response:**
```json
{
  "line_items": [
    {
      "tier_id": "free-tier-uuid",
      "tier_name": "Free Community RSVP",
      "quantity": 2,
      "unit_price": "0.00",
      "discount_amount": "0.00",
      "line_total": "0.00"
    }
  ],
  "subtotal": "0.00",
  "discount_amount": "0.00",
  "fees": "0.00",
  "total": "0.00",
  "is_free": true,
  "promo_applied": null
}
```

**Step 2: Complete order**
**Endpoint:** `POST /checkout/`

```json
{
  "action": "complete",
  "org_slug": "friends-of-the-library",
  "event_slug": "spring-community-dinner",
  "items": [
    {"tier_id": "free-tier-uuid", "quantity": 2}
  ],
  "billing_name": "Jane Doe",
  "billing_email": "jane@example.com",
  "billing_phone": "415-555-0123"
}
```

**Expected Response (201):** Full order with:
- `status: "COMPLETED"` (free orders complete immediately)
- `confirmation_code`: 10-character alphanumeric string
- `total: "0.00"`
- `tickets`: array of ticket objects, each with `qr_code_data`
- `line_items`: array matching the requested items

**Frontend Flow:**
1. `/checkout/{eventSlug}` — select tiers and quantities
2. `/checkout/{eventSlug}/details` — enter name, email, phone
3. Skips `/checkout/{eventSlug}/payment` (free event)
4. `/checkout/{eventSlug}/confirmation` — shows confirmation code, QR codes

---

### 16. Checkout Flow — Paid Event

**Step 1: Calculate** (same as free, but total > 0)

```json
{
  "action": "calculate",
  "org_slug": "friends-of-the-library",
  "event_slug": "spring-community-dinner",
  "items": [
    {"tier_id": "paid-tier-uuid", "quantity": 1}
  ],
  "promo_code": "VOLUNTEER20"
}
```

**Expected:** `is_free: false`, `total: "20.00"` (after 20% discount on $25)

**Step 2: Create PaymentIntent**
**Endpoint:** `POST /checkout/payment-intent/`

```json
{
  "order_id": "order-uuid"
}
```

**Expected Response:**
```json
{
  "client_secret": "pi_...._secret_..."
}
```

**Step 3: Stripe Payment** — Frontend calls `stripe.confirmPayment()` with the client_secret.

**Step 4: Complete order** (same as free event's step 2, but order may already exist from PaymentIntent creation)

**Frontend Flow:**
1. `/checkout/{eventSlug}` — select tiers, apply promo code
2. `/checkout/{eventSlug}/details` — enter billing info
3. `/checkout/{eventSlug}/payment` — Stripe card form, pay
4. `/checkout/{eventSlug}/confirmation` — order summary + QR codes

---

### 17. Checkout Validation Tests

| Test | Input | Expected |
|---|---|---|
| Quantity exceeds capacity | quantity: 999 on tier with 50 remaining | 400 — not enough tickets |
| Quantity below minimum | quantity: 0 on tier with min_per_order: 1 | 400 — below minimum |
| Quantity above maximum | quantity: 20 on tier with max_per_order: 10 | 400 — above maximum |
| Invalid tier_id | non-existent UUID | 400 — tier not found |
| Event not published | DRAFT event | 400 — event not available |
| Expired promo code | code past valid_until | 400 — code expired |
| Promo usage exceeded | code at usage_limit | 400 — code usage exceeded |
| Missing billing_email | omit on complete | 400 — email required |
| Invalid event_slug | non-existent slug | 404 — event not found |

---

### 18. Orders & Tickets

**List My Orders:**
**Endpoint:** `GET /orders/`
**Auth:** Required
**Returns:** Array of orders for the authenticated user.

**Order Detail:**
**Endpoint:** `GET /orders/{order_id}/`
**Auth:** Required (must be the order's owner)

**Lookup by Confirmation Code (public):**
**Endpoint:** `GET /orders/lookup/{confirmation_code}/`
**Auth:** None
**Returns:** Order detail including tickets and QR codes.

**List My Tickets:**
**Endpoint:** `GET /tickets/`
**Auth:** Required
**Returns:** Array of tickets for the authenticated user.

**Frontend Routes:**
- `/my/tickets` — list of upcoming tickets
- `/my/orders` — order history (if implemented)

---

### 19. QR Code Check-In

**Scan QR Code:**
**Endpoint:** `POST /organizations/{org_slug}/events/{event_slug}/check-in/scan/`
**Auth:** Required (any org member)

```json
{
  "qr_data": "order-uuid:tier-uuid:ticket-uuid:hmac-signature-16chars"
}
```

**Response Scenarios:**

**Success (green):**
```json
{
  "status": "success",
  "message": "Checked in successfully!",
  "attendee_name": "Jane Doe",
  "attendee_email": "jane@example.com",
  "tier_name": "Supporter",
  "checked_in_at": "2026-04-15T18:05:30Z"
}
```

**Already checked in (yellow):**
```json
{
  "status": "already_checked_in",
  "message": "Already checked in at 06:05 PM.",
  "attendee_name": "Jane Doe",
  "tier_name": "Supporter",
  "checked_in_at": "2026-04-15T18:05:30Z"
}
```

**Invalid QR (red):**
```json
{
  "status": "invalid",
  "message": "Invalid QR code. Signature verification failed."
}
```

**Ticket not found (red):**
```json
{
  "status": "invalid",
  "message": "Ticket not found for this event."
}
```

**Cancelled/refunded ticket (red):**
```json
{
  "status": "invalid",
  "message": "Ticket is cancelled."
}
```

**QR Payload Format:**
```
{order_id}:{ticket_tier_id}:{ticket_id}:{hmac_sha256_first_16_hex_chars}
```
The HMAC is computed over `{order_id}:{ticket_tier_id}:{ticket_id}` using the Django `SECRET_KEY`.

---

### 20. Manual Check-In

**Endpoint:** `POST /organizations/{org_slug}/events/{event_slug}/check-in/{ticket_id}/manual/`
**Auth:** Required (any org member)
**Body:** Empty `{}`

**Same response format as scan.** Used when QR code doesn't work.

---

### 21. Check-In Stats

**Endpoint:** `GET /organizations/{org_slug}/events/{event_slug}/check-in/stats/`
**Auth:** Required (any org member)

**Response:**
```json
{
  "total_registered": 100,
  "checked_in": 45,
  "not_checked_in": 55,
  "percentage": 45.0,
  "by_tier": [
    {"tier_name": "Free RSVP", "total": 50, "checked_in": 30},
    {"tier_name": "Supporter", "total": 30, "checked_in": 15},
    {"tier_name": "Board Member", "total": 20, "checked_in": 0}
  ]
}
```

**Frontend:** Polls every 10 seconds for live updates.

---

### 22. Check-In Search

**Endpoint:** `GET /organizations/{org_slug}/events/{event_slug}/check-in/search/?q={query}`
**Auth:** Required (any org member)

**Searches by:** attendee_name, attendee_email, or order confirmation_code.

**Response:** Array of:
```json
{
  "ticket_id": "uuid",
  "attendee_name": "Jane Doe",
  "attendee_email": "jane@example.com",
  "tier_name": "Supporter",
  "confirmation_code": "ABC1234DEF",
  "checked_in": false,
  "checked_in_at": null
}
```

---

### 23. Guest List

**List Guests:**
**Endpoint:** `GET /organizations/{org_slug}/events/{event_slug}/guests/`
**Auth:** Required (MANAGER or OWNER)

**Export CSV:**
**Endpoint:** `GET /organizations/{org_slug}/events/{event_slug}/guests/csv/`
**Auth:** Required (MANAGER or OWNER)
**Returns:** CSV file download with attendee data.

**Frontend Route:** `/manage/events/{eventSlug}/guests` (requires `?org={org_slug}` query param)

---

### 24. Event Analytics

**Endpoint:** `GET /organizations/{org_slug}/events/{event_slug}/analytics/`
**Auth:** Required (MANAGER or OWNER)

**Expected Response:**
```json
{
  "total_registrations": 80,
  "total_revenue": "2500.00",
  "total_fees": "50.00",
  "net_revenue": "2450.00",
  "attendance_rate": 45.0,
  "registrations_by_tier": [
    {"tier_name": "Free RSVP", "count": 50},
    {"tier_name": "Supporter", "count": 30}
  ],
  "registrations_over_time": [
    {"date": "2026-03-20", "count": 15},
    {"date": "2026-03-21", "count": 22}
  ]
}
```

**Frontend Route:** `/manage/events/{eventSlug}/analytics` (requires `?org={org_slug}` query param)

---

### 25. Email Settings

**Get Config:**
**Endpoint:** `GET /organizations/{org_slug}/events/{event_slug}/emails/config/`
**Auth:** Required (MANAGER or OWNER)

**Response:**
```json
{
  "confirmation": true,
  "reminder_48h": true,
  "reminder_day_of": true,
  "event_update": true,
  "cancellation": true,
  "post_event_thanks": true,
  "new_registration": false,
  "daily_summary": false,
  "low_inventory": true
}
```

**Update Config:**
**Endpoint:** `PUT /organizations/{org_slug}/events/{event_slug}/emails/config/`

```json
{
  "confirmation": true,
  "reminder_48h": false,
  "new_registration": true
}
```

**Send Bulk Email:**
**Endpoint:** `POST /organizations/{org_slug}/events/{event_slug}/emails/bulk/`

```json
{
  "subject": "Important update about Spring Community Dinner",
  "body": "Hi everyone, we've moved the venue to..."
}
```

**View Email Log:**
**Endpoint:** `GET /organizations/{org_slug}/events/{event_slug}/emails/log/`

**Frontend Route:** `/manage/events/{eventSlug}/emails` (requires `?org={org_slug}` query param)

---

### 26. Public Pages (No Auth Required)

**Browse Events:**
**Endpoint:** `GET /public/events/`
**Query Params:** `?search=dinner&category=FUNDRAISER&format=IN_PERSON`
**Returns:** Published, non-private events only. No DRAFT or CANCELLED events.

**Organization Page:**
**Endpoint:** `GET /public/{org_slug}/`
**Returns:** Org profile with list of upcoming published events.

**Event Detail:**
**Endpoint:** `GET /public/{org_slug}/events/{event_slug}/`
**Returns:** Full event detail with ticket tiers (PUBLIC visibility only). Only if PUBLISHED or LIVE.

**Frontend Routes:**
- `/events` — browse/search all events
- `/{org_slug}` — organization landing page
- `/{org_slug}/events/{event_slug}` — event detail page

---

## Full Integration Test Sequence

Run these in order. Each step depends on data from previous steps.

### Phase 1: Account Setup
```
1. POST /auth/register/        → Create user "organizer@test.com"
2. POST /auth/login/           → Get access token
3. GET  /auth/me/              → Verify profile data
4. PATCH /auth/me/             → Update first_name
```

### Phase 2: Organization Setup
```
5. POST /organizations/                              → Create "Test Nonprofit"
6. GET  /organizations/                              → Verify it appears in list
7. PATCH /organizations/test-nonprofit/              → Update description
8. POST /organizations/test-nonprofit/venues/        → Create a venue
9. GET  /organizations/test-nonprofit/venues/        → Verify venue in list
```

### Phase 3: Event Setup
```
10. POST /organizations/test-nonprofit/events/       → Create "Test Dinner" (DRAFT)
11. GET  /organizations/test-nonprofit/events/       → Verify event in list
12. POST .../events/test-dinner/ticket-tiers/        → Create free tier (qty: 50)
13. POST .../events/test-dinner/ticket-tiers/        → Create paid tier ($25, qty: 30)
14. POST .../events/test-dinner/promo-codes/         → Create "SAVE20" (20% off)
15. POST .../events/test-dinner/publish/             → Publish event
16. GET  /public/events/                             → Verify event appears in browse
17. GET  /public/test-nonprofit/events/test-dinner/  → Verify public event page
```

### Phase 4: Checkout (Free)
```
18. POST /checkout/  (action=calculate, free tier, qty=2)    → Verify total=0, is_free=true
19. POST /checkout/  (action=complete, billing info)          → Create order, get tickets
20. Save confirmation_code and ticket qr_code_data from response
21. GET  /orders/lookup/{confirmation_code}/                  → Verify lookup works
```

### Phase 5: Checkout (Paid with Promo)
```
22. POST /checkout/  (action=calculate, paid tier, qty=1, promo="SAVE20")  → Verify discount applied
23. POST /checkout/  (action=complete, billing info)                        → Create paid order
24. Save confirmation_code and ticket data
```

### Phase 6: Check-In
```
25. GET  .../check-in/stats/                    → Verify total_registered matches ticket count
26. POST .../check-in/scan/  (qr_code_data)    → Verify status="success"
27. POST .../check-in/scan/  (same qr_data)    → Verify status="already_checked_in"
28. POST .../check-in/scan/  (invalid string)  → Verify status="invalid"
29. GET  .../check-in/search/?q=jane            → Verify attendee found
30. POST .../check-in/{ticket_id}/manual/       → Manual check-in of another ticket
31. GET  .../check-in/stats/                    → Verify checked_in count increased
```

### Phase 7: Guest List & Analytics
```
32. GET .../guests/          → Verify all attendees listed
33. GET .../guests/csv/      → Verify CSV download
34. GET .../analytics/       → Verify registration/revenue numbers
```

### Phase 8: Email Settings
```
35. GET .../emails/config/              → Verify default toggles
36. PUT .../emails/config/              → Toggle reminder_48h off
37. GET .../emails/config/              → Verify toggle saved
38. POST .../emails/bulk/               → Send test bulk email
39. GET .../emails/log/                 → Verify email logged
```

### Phase 9: Team Management
```
40. POST /auth/register/  (volunteer@test.com)           → Create second user
41. POST /organizations/test-nonprofit/members/invite/   → Invite as VOLUNTEER
42. GET  /organizations/test-nonprofit/members/          → Verify member listed
43. Login as volunteer → GET .../check-in/stats/         → Verify volunteer can access check-in
44. Login as volunteer → POST .../events/                → Verify 403 (volunteer can't create events)
```

### Phase 10: Edge Cases
```
45. POST /checkout/ (quantity > remaining)     → Verify 400 capacity error
46. POST /checkout/ (expired promo code)       → Verify 400 promo error
47. POST .../events/test-dinner/publish/       → Verify 400 (already published)
48. POST .../events/test-dinner/cancel/        → Verify event cancelled
49. GET  /public/events/                       → Verify cancelled event no longer in browse
```

---

## Frontend UI Test Checklist

### Navigation
- [ ] Logo links to homepage
- [ ] Logged-out: shows "Log in" and "Sign up" buttons
- [ ] Logged-in: shows Dashboard, Browse, My Tickets, Create Event, user avatar, Log out
- [ ] Mobile: hamburger menu opens/closes, all links work
- [ ] Active nav link is highlighted

### Homepage (`/`)
- [ ] Hero section renders with gradient background
- [ ] Logged-out: "Get Started" and "Browse Events" buttons visible
- [ ] Logged-in: "Get Started" changes to "Go to Dashboard"
- [ ] Feature cards display (3 cards)
- [ ] Footer shows correct links based on auth state
- [ ] Footer logged-in: shows "Dashboard" and "My Tickets" instead of "Sign Up" and "Log In"

### Registration (`/register`)
- [ ] All fields render (first name, last name, email, password, confirm password)
- [ ] Validation errors display inline
- [ ] Successful registration redirects to login
- [ ] "Already have an account?" link goes to login
- [ ] Password requirements enforced

### Login (`/login`)
- [ ] Email and password fields render
- [ ] Error message on wrong credentials
- [ ] Successful login redirects to dashboard or previous page
- [ ] "Forgot password?" link works
- [ ] "Don't have an account?" link goes to register

### Event Browse (`/events`)
- [ ] Event cards render with cover images
- [ ] Search input filters events
- [ ] Category filter works
- [ ] Cards show: title, date, venue, category badge, format badge
- [ ] Clicking card navigates to event detail page
- [ ] Empty state shown when no events match

### Event Detail (`/{org_slug}/events/{event_slug}`)
- [ ] Event title, description, cover image render
- [ ] Date/time shown in event's timezone
- [ ] Venue info with address displayed
- [ ] Ticket tiers listed with prices and availability
- [ ] "Get Tickets" / "RSVP" button navigates to checkout
- [ ] Only PUBLIC tiers visible (not HIDDEN or INVITE_ONLY)

### Checkout Flow
- [ ] Step indicators show current step highlighted
- [ ] Step 1: Tier selection with quantity +/- controls
- [ ] Step 1: Promo code input and "Apply" button
- [ ] Step 1: Order summary updates live
- [ ] Step 2: Name, email, phone form
- [ ] Step 2: Pre-fills if user is logged in
- [ ] Step 3 (paid): Stripe card form renders
- [ ] Step 3 skipped for free events
- [ ] Step 4: Confirmation code displayed prominently
- [ ] Step 4: QR code(s) displayed for each ticket
- [ ] Step 4: "Add to Calendar" button works
- [ ] Responsive on mobile (step indicators wrap, forms stack)

### Organizer Dashboard (`/manage`)
- [ ] Lists all user's organizations
- [ ] "Create Organization" button works
- [ ] Each org card links to org settings

### Event Management
- [ ] Event list shows all events with status badges
- [ ] Create event form has all fields (title, description, format, category, dates, venue)
- [ ] Rich text editor works for description
- [ ] Publish button appears on draft events
- [ ] Cancel button appears on active events
- [ ] Ticket tier management: create, edit, delete tiers
- [ ] Promo code management: create, edit codes

### Check-In (`/manage/events/{slug}/check-in`)
- [ ] Stats panel shows checked-in / total / remaining
- [ ] Progress bar animates
- [ ] Per-tier breakdown if multiple tiers
- [ ] "Start Scanner" requests camera permission
- [ ] Scanner reads QR code and shows result
- [ ] Green banner on success, yellow on duplicate, red on invalid
- [ ] Search field finds attendees by name/email/code
- [ ] Manual "Check In" button works from search results
- [ ] Stats auto-refresh every 10 seconds

### Responsive Design
- [ ] All pages work on mobile (375px width)
- [ ] All pages work on tablet (768px width)
- [ ] All pages work on desktop (1280px+ width)
- [ ] No horizontal overflow on any screen size
- [ ] Touch targets are at least 44x44px on mobile
- [ ] Forms stack vertically on mobile, grid on desktop

---

## Data Cleanup

After testing, you can clean up by:
1. Cancelling all test events
2. Deleting test organizations (if endpoint available)
3. Or simply create fresh test data for next run

**Note:** The system uses soft deletes — nothing is ever hard-deleted. Tickets and events use status flags.
