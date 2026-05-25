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

## Error Envelope

Every error response follows a single shape:

```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "Event not found",
    "details": [{ "path": "email", "message": "Invalid email" }]
  }
}
```

`details` is only present for `VALIDATION_ERROR`. Known codes:

| Code | Status | Meaning |
|------|--------|---------|
| `VALIDATION_ERROR` | 400 | Zod schema failed; `details` has field-level errors |
| `BAD_REQUEST` | 400 | Malformed request |
| `UNAUTHORIZED` | 401 | Missing or invalid JWT |
| `FORBIDDEN` | 403 | Insufficient role |
| `NOT_FOUND` | 404 | Resource does not exist |
| `CONFLICT` | 409 | Duplicate resource |
| `INTERNAL_ERROR` | 500 | Unhandled server error |

## Pagination Contract

List endpoints accept these query params:

| Param | Default | Max | Description |
|-------|---------|-----|-------------|
| `page` | `1` | — | 1-based page number |
| `limit` | `20` | `100` | Items per page |
| `sort` | none | — | `field:asc` or `field:desc` (e.g. `createdAt:desc`) |

Use `parsePagination(req.query)` from `src/lib/pagination.js`:

```js
import { parsePagination } from '../lib/pagination.js';

const { page, skip, take, orderBy } = parsePagination(req.query);
const [items, total] = await Promise.all([
  prisma.model.findMany({ where, skip, take, orderBy }),
  prisma.model.count({ where }),
]);
res.json({ data: items, meta: { page, limit: take, total, pages: Math.ceil(total / take) } });
```

## Architecture

```
backend/
├── prisma/
│   └── schema.prisma           # Full DB schema (20+ models)
├── src/
│   ├── index.js                # Express app entry + global error handler
│   ├── config/
│   │   └── env.js              # Zod env validation (exits on missing vars)
│   ├── lib/
│   │   ├── prisma.js           # PrismaClient singleton
│   │   ├── logger.js           # Pino structured logger
│   │   ├── errors.js           # AppError + notFound/forbidden/etc helpers
│   │   ├── validate.js         # validate(schema, target) middleware factory
│   │   └── pagination.js       # parsePagination(query) → {skip,take,orderBy}
│   ├── middleware/
│   │   ├── auth.js             # JWT authentication + requireRole
│   │   └── requestContext.js   # requestId, X-Request-Id header, request logging
│   └── routes/
│       ├── auth.js             # Signup / login
│       ├── events.js           # Event CRUD
│       ├── subEvents.js        # Sub-event CRUD
│       ├── guests.js           # Guest management + face embedding
│       ├── media.js            # Upload + AI processing
│       ├── whatsapp.js         # WhatsApp Business API
│       ├── analytics.js        # Stats and reporting
│       ├── invites.js          # Digital invite builder
│       ├── qr.js               # QR code management
│       ├── team.js             # Team roles
│       ├── storage.js          # Storage + client transfer
│       ├── store.js            # Print store orders
│       └── pixels.js           # Meta/Google pixel tracking
└── .env.example
```
