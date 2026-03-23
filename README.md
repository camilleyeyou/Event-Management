# GatherGood

A simple, modern event management platform built for nonprofits and community organizations. Create events, sell tickets or collect RSVPs, communicate with attendees, and check people in at the door.

**Live Demo:** [event-management-two-red.vercel.app](https://event-management-two-red.vercel.app)

## Features

- **Event Creation & Management** — Rich text descriptions, cover images, in-person/virtual/hybrid formats, event lifecycle (draft → published → live → completed)
- **Multi-Tier Ticketing** — Free RSVPs and paid tickets with multiple tiers, capacity tracking, promo codes
- **Stripe Payments** — Secure checkout for paid events, automatic fee calculation, free event flow skips payment
- **QR Code Check-In** — HMAC-signed QR codes, mobile camera scanner (no app needed), manual fallback search
- **Organization Management** — Nonprofit profiles with branding, team roles (Owner/Manager/Volunteer), saved venues
- **Guest Lists & Analytics** — Attendee management, CSV export, registration/revenue/attendance dashboards
- **Email Notifications** — Confirmation, reminders (48h + day-of), cancellation notices, custom bulk emails
- **Responsive Design** — Mobile-first UI inspired by Partiful, glassmorphism effects, smooth animations

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + TypeScript + Vite |
| Styling | Tailwind CSS v4 + custom components |
| State | Zustand (client) + React Query patterns |
| Backend | Python 3.12 / Django 6 + Django REST Framework |
| Database | PostgreSQL 16 |
| Payments | Stripe (PaymentIntents + Elements) |
| Auth | JWT (access + refresh tokens) |
| Deployment | Vercel (frontend) + Railway (backend + Postgres) |

## Project Structure

```
├── frontend/                # React SPA
│   ├── src/
│   │   ├── components/      # Layout, UI primitives (Button, Input, etc.)
│   │   ├── pages/           # Route pages
│   │   │   ├── manage/      # Organizer dashboard pages
│   │   │   ├── checkout/    # 4-step checkout flow
│   │   │   └── my/          # Attendee pages (tickets, orders, settings)
│   │   ├── stores/          # Zustand auth store
│   │   └── lib/             # API client, utilities
│   └── public/
├── backend/                 # Django REST API
│   ├── config/              # Settings, URLs, WSGI
│   ├── accounts/            # User auth (register, login, JWT)
│   ├── organizations/       # Org profiles, team members, venues
│   ├── events/              # Event CRUD, status lifecycle
│   ├── orders/              # Checkout, tickets, QR generation
│   └── checkin/             # QR scan, manual check-in, stats
└── CLAUDE.md                # Product spec & build guide
```

## Getting Started

### Prerequisites

- Python 3.12+
- Node.js 18+
- PostgreSQL 16

### Backend Setup

```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env with your database URL and secret key

python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```

### Frontend Setup

```bash
cd frontend
npm install

# Configure environment
cp .env.example .env
# Edit .env — set VITE_API_URL to your backend

npm run dev
```

The frontend runs on `http://localhost:5173` and the backend API on `http://localhost:8000/api/v1/`.

## Deployment

### Backend (Railway)

1. Create a new project on [Railway](https://railway.com)
2. Add a **PostgreSQL** database service
3. Add a **web service** connected to this repo (set root directory to `/backend`)
4. Set environment variables:

```
SECRET_KEY=<random-string>
DEBUG=False
ALLOWED_HOSTS=<your-app>.up.railway.app
DATABASE_URL=${{Postgres.DATABASE_URL}}
CORS_ALLOWED_ORIGINS=https://<your-app>.vercel.app
```

Railway auto-deploys on push. Migrations run at startup via the Procfile.

### Frontend (Vercel)

1. Import the repo on [Vercel](https://vercel.com)
2. Set root directory to `frontend`
3. Set environment variable:

```
VITE_API_URL=https://<your-backend>.up.railway.app/api/v1
```

Vercel auto-deploys on push. The `vercel.json` handles SPA routing.

## API Endpoints

All endpoints are prefixed with `/api/v1/`.

| Group | Endpoints |
|---|---|
| Auth | `POST /auth/register/`, `POST /auth/login/`, `POST /auth/logout/`, `GET /auth/me/` |
| Organizations | `GET/POST /organizations/`, `GET/PATCH /{slug}/`, members, venues |
| Events | `GET/POST /events/`, `GET/PATCH /{slug}/`, publish, cancel, guests, analytics |
| Ticket Tiers | `GET/POST /events/{slug}/ticket-tiers/`, `PATCH/DELETE /{id}/` |
| Promo Codes | `GET/POST /events/{slug}/promo-codes/`, validate |
| Checkout | `POST /checkout/cart/`, payment-intent, complete |
| Orders | `GET /orders/`, `GET /{id}/`, tickets, refund |
| Check-In | `POST /check-in/scan/`, `POST /{id}/manual/`, stats, search |

## License

Private project. All rights reserved.
