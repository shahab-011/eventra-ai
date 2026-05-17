# Eventra Backend API

Node.js + Express + PostgreSQL + Prisma

## Setup

```bash
cd backend
npm install

# Copy env file and fill in values
cp .env.example .env

# Run database migrations
npm run db:migrate

# Start dev server
npm run dev
```

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | /api/auth/signup | Register new studio account |
| POST | /api/auth/login | Login, returns JWT |
| GET | /api/auth/me | Get current user |
| GET | /api/events | List all studio events |
| POST | /api/events | Create event |
| GET | /api/events/:id | Get single event |
| PATCH | /api/events/:id | Update event |
| DELETE | /api/events/:id | Delete event |
| GET | /api/events/:id/subevents | List sub-events |
| POST | /api/events/:id/subevents | Add sub-event |
| GET | /api/guests?eventId= | List guests |
| POST | /api/guests | Add guest |
| POST | /api/guests/bulk | Bulk import guests |
| POST | /api/guests/:id/selfie | Register guest face |
| GET | /api/media?eventId= | List media |
| POST | /api/media/upload | Upload file |
| POST | /api/media/:id/ai-edit | Queue AI editing |
| POST | /api/media/:id/face-match | Queue face matching |
| POST | /api/whatsapp/send | Send WhatsApp messages |
| GET | /api/whatsapp/webhook | WhatsApp webhook verify |
| POST | /api/whatsapp/webhook | Receive WhatsApp events |
| GET | /api/analytics/overview | Studio-level analytics |
| GET | /api/analytics/event/:id | Per-event analytics |
| GET | /api/invites?eventId= | List invites |
| POST | /api/invites | Create invite |
| GET | /api/invites/view/:slug | Public invite view |
| GET | /api/qr?eventId= | List QR codes |
| POST | /api/qr | Create QR code |
| POST | /api/qr/:id/scan | Track QR scan |
| GET | /api/team | List team members |
| POST | /api/team/invite | Invite team member |
| GET | /api/storage | Storage overview |
| POST | /api/storage/transfer | Transfer event to client |
| GET | /api/store/orders | List orders |
| POST | /api/store/orders | Place order (public) |
| GET | /api/pixels | List tracking pixels |
| POST | /api/pixels | Add pixel |
| POST | /api/pixels/fire | Fire pixel (public) |

## Architecture

```
backend/
├── prisma/
│   └── schema.prisma       # Full DB schema (20+ models)
├── src/
│   ├── index.js            # Express app entry
│   ├── middleware/
│   │   └── auth.js         # JWT authentication
│   └── routes/
│       ├── auth.js         # Signup / login
│       ├── events.js       # Event CRUD
│       ├── subEvents.js    # Sub-event CRUD
│       ├── guests.js       # Guest management + face embedding
│       ├── media.js        # Upload + AI processing
│       ├── whatsapp.js     # WhatsApp Business API
│       ├── analytics.js    # Stats and reporting
│       ├── invites.js      # Digital invite builder
│       ├── qr.js           # QR code management
│       ├── team.js         # Team roles
│       ├── storage.js      # Storage + client transfer
│       ├── store.js        # Print store orders
│       └── pixels.js       # Meta/Google pixel tracking
└── .env.example
```
