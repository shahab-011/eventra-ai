# Eventra AI — Complete Backend Build Specification

> Full backend build prompt for Eventra — an AI-powered event photo sharing platform competing with Samaro.ai.
> Stack: Node.js 20 + Express 5 + PostgreSQL 15 + Prisma 5 + Redis 7 + BullMQ + Python FastAPI + Cloudflare R2

---

## Section 1 — Product Context

Eventra serves three actor types:

| Actor | Description |
|-------|-------------|
| **Studio** | Photography studio owner — creates events, manages team, uploads media, sends deliveries |
| **Guest** | Wedding/event attendee — views gallery, selects photos, places print orders, receives WhatsApp messages |
| **Team Member** | Shooter/editor/admin — assigned role-based access per studio, manages sub-events and uploads |

Core value proposition: **AI face recognition** matches every guest to their own photos automatically. Guests register a selfie once, receive a WhatsApp link, and see only their photos — no searching required.

---

## Section 2 — Feature Specifications

### 2.1 Authentication & Studio Setup

- Email + password signup (bcrypt, 10 rounds)
- JWT access tokens (15 min) + refresh tokens (7 days, httpOnly cookie)
- On signup: auto-create `Studio` record linked to user
- `requireRole()` middleware for OWNER / ADMIN / SHOOTER / EDITOR / VIEWER
- Rate limiting: 10 req/15min on auth routes, 200 req/15min globally
- Input validation with Zod schemas on all mutation endpoints

### 2.2 Event Management

- Full CRUD for events (name, type, date range, venue, coverPhoto)
- `EventType` enum: WEDDING / BIRTHDAY / CORPORATE / CONCERT / SPORTS / OTHER
- `EventStatus` enum: DRAFT / LIVE / COMPLETED / ARCHIVED
- Auto-generate unique `gallerySlug` (nanoid 8 chars) on event creation
- Events scoped to studio — all queries filter by `studioId`
- Soft archival on client storage transfer

### 2.3 Sub-Event (Ceremony) Management

- Multiple ceremonies per event (Haldi, Mehendi, Sangeet, Wedding, Reception, Engagement, Roka, Custom)
- `GuestAccess` enum: ALL / VIP / PRIVATE per sub-event
- Timeline ordering with `startTime` / `endTime`
- Media linked to specific sub-events

### 2.4 Guest Management

- CRUD guests (name, phone, email, role: BRIDE/GROOM/FAMILY/FRIEND/COLLEAGUE/VIP)
- Bulk import via CSV (multipart upload, Papa Parse server-side)
- Per-guest `galleryAccessToken` (UUID) for magic-link gallery access
- `faceEmbedding` stored as JSON array (512-dim ArcFace vector) in PostgreSQL
- `photosMatchedCount` counter incremented as face matching runs

### 2.5 Camera2Cloud (FTP Ingest)

- Built-in FTP server using `ftp-srv` npm package, port 2121
- Per-camera FTP credentials stored in `CameraAccount` model
- On file upload: auto-detect which camera/event, create `Media` record with `uploadSource: CAMERA2CLOUD`
- Queue thumbnail generation job to BullMQ `media-processing` queue
- Queue face-matching job to BullMQ `ai-jobs` queue
- Support Canon, Nikon, Sony, Fuji direct camera WiFi upload

### 2.6 Face Recognition Pipeline

**Enrollment (Guest Selfie):**
1. Guest uploads selfie via `POST /api/guests/:id/selfie`
2. Multer receives file, uploads to R2 at `selfies/{guestId}.jpg`
3. HTTP call to Python FastAPI `/embed` endpoint → returns 512-dim float array
4. Store embedding in `guest.faceEmbedding`

**Matching (Per Photo):**
1. BullMQ job `face-match` dequeues for each new photo
2. HTTP call to Python FastAPI `/match` with photo URL + studio's guest embeddings
3. FastAPI uses InsightFace ArcFace R100 model, cosine similarity threshold 0.4
4. Returns array of `{ guestId, confidence }` matches
5. Create `FaceTag` records for each match above threshold
6. Increment `guest.photosMatchedCount`

**Python FastAPI AI Service (`/ai-service/main.py`):**
```python
from fastapi import FastAPI
from insightface.app import FaceAnalysis
import numpy as np

app = FastAPI()
fa = FaceAnalysis(name='buffalo_l')
fa.prepare(ctx_id=0)

@app.post("/embed")
async def embed(file: UploadFile):
    img = cv2.imdecode(np.frombuffer(await file.read(), np.uint8), cv2.IMREAD_COLOR)
    faces = fa.get(img)
    return {"embedding": faces[0].embedding.tolist() if faces else None}

@app.post("/match")
async def match(payload: MatchPayload):
    # Compare uploaded photo embeddings against all guest embeddings
    # Return matches above cosine similarity threshold 0.4
    ...
```

### 2.7 AI Photo Editing

- Sharp.js for all image processing (no ImageMagick dependency)
- **Auto-enhance:** brightness/contrast/saturation normalization
- **3D LUT application:** `.cube` LUT files loaded, per-channel lookup table applied pixel-by-pixel
- **Preset styles:** Moody, Airy, Film, B&W, Golden Hour, Cool Tones
- **Auto-crop (Portrait):** Face-detected bounding box → smart crop to 4:5 ratio
- **Batch processing:** BullMQ `ai-edit` queue, 4 concurrent workers
- Output: optimised JPEG (quality 90) + WebP thumbnail (width 800)
- Store edited URL in `media.editedUrl`

### 2.8 WhatsApp Business Integration

**Full conversation flow with 5 templates:**

| Template | Trigger | Content |
|----------|---------|---------|
| `gallery_ready` | Studio marks event live | "Hi {name}, your photos from {event} are ready! View: {link}" |
| `selfie_request` | Guest added without face embedding | "Hi {name}, register your face to find your photos: {link}" |
| `selection_reminder` | 48h after gallery opened, no selections | "Don't forget to select your favourite photos from {event}!" |
| `delivery_ready` | Edited photos exported | "Your {count} selected photos are ready to download: {link}" |
| `order_confirmed` | Print order placed | "Order confirmed! Your prints from {event} will arrive in 5-7 days." |

**Implementation:**
- Meta Cloud API (`graph.facebook.com/v18.0/{phoneNumberId}/messages`)
- BullMQ `whatsapp` queue with retry (3 attempts, exponential backoff)
- Webhook `GET /api/whatsapp/webhook` — verify token challenge
- Webhook `POST /api/whatsapp/webhook` — handle incoming messages, status updates
- Store all messages in `WhatsAppMessage` model with status: QUEUED / SENT / DELIVERED / READ / FAILED
- Incoming guest replies stored and flagged for studio review

### 2.9 Guest Gallery (Public Endpoints)

- `GET /gallery/:slug` — public event gallery, no auth required
- `GET /gallery/:slug/guest/:token` — personalised gallery (face-matched photos only)
- SSE endpoint `GET /gallery/:slug/stream` — real-time new photo push as events are uploaded
- Photo selection: `POST /gallery/:slug/select` — create `PhotoSelection` record
- Guest selfie registration: `POST /gallery/:slug/selfie` — triggers face embedding + matching

### 2.10 Real-time (Socket.io + SSE)

**Socket.io (Studio Dashboard):**
- Namespace `/studio`
- Events: `upload:progress`, `ai:complete`, `guest:matched`, `whatsapp:status`, `order:new`
- Auth via JWT on socket handshake
- Room per studio ID

**SSE (Guest Gallery):**
- `GET /gallery/:slug/stream`
- Push `photo:new` event as photos are processed
- No auth required, public gallery support

### 2.11 Storage & CDN

**Cloudflare R2 structure:**
```
bucket/
├── studios/{studioId}/
│   ├── events/{eventId}/
│   │   ├── originals/          # Full-res RAW/JPEG/Video
│   │   ├── edited/             # AI-processed outputs
│   │   ├── thumbnails/         # 800px WebP
│   │   └── selfies/            # Guest face images
│   └── branding/               # Logo, watermark, cover
```

- Upload: presigned PUT URL flow (backend generates, frontend uploads direct to R2)
- Serve: `r2.public.url/{path}` via Cloudflare CDN
- Track `storageUsedGB` per event and studio
- Client transfer: archives event, decrements studio storage, sends client download link

### 2.12 QR Code Management

- Create QR codes for studio / specific event / specific sub-event
- Each QR has unique `slug` (nanoid 6 chars)
- Public scan endpoint `GET /api/qr/:slug/scan` → redirect to target URL + increment `scanCount`
- QR image generated server-side using `qrcode` npm package
- Serve QR as PNG or SVG
- Embed UTM parameters in target URL for tracking

### 2.13 Digital Invite Builder

- Create invite with template (CLASSIC / MODERN / MINIMAL / FLORAL / ROYAL)
- Fields: title, subtitle, venue, dateTime, coverImageUrl, rsvpLink, customHtml
- Public view `GET /api/invites/view/:slug` — increment `viewCount`
- RSVP tracking via pixel fire or direct endpoint
- WhatsApp share integration

### 2.14 White Label

- Per-studio branding: logo, primaryColor, accentColor, fontFamily, watermarkUrl
- Guest gallery injects studio branding CSS variables
- Email notifications use studio logo + colors
- Custom subdomain support (store `customDomain` on `Studio`)
- Watermark application: Sharp.js composite overlay on exported photos

### 2.15 Analytics & Meta Conversions API

**Studio-level metrics:**
- Total events, guests, photos, WhatsApp messages sent
- Storage used vs limit
- Revenue from print orders
- Team activity log

**Per-event metrics:**
- Guest registration rate (selfies / total guests)
- Face match rate (photos matched / total photos)
- Gallery view count, unique visitors
- Selection rate (photos selected / total photos)
- WhatsApp delivery / read rates
- Print order conversion rate

**Meta Pixel / Conversions API:**
- `TrackingPixel` model stores `pixelId` and `accessToken`
- Client-side pixel fires via `POST /api/pixels/fire` (anonymous, no auth)
- Server-side Conversions API call for `ViewContent`, `Purchase` events
- `EventPixel` join table — assign specific pixels to specific events

**Export:**
- PDF report: html-pdf-node or puppeteer
- CSV export: all guest data, selection data, order data

### 2.16 Plan Enforcement

| Plan | Price | Storage | Events | Guests | AI Edits |
|------|-------|---------|--------|--------|----------|
| FREE | ₹0 | 10 GB | 1 | 100 | 50 |
| MINI | ₹999/mo | 100 GB | 5 | 500 | 500 |
| SMALL | ₹2,499/mo | 300 GB | 15 | 2,000 | 2,000 |
| MID | ₹4,999/mo | 750 GB | 40 | 10,000 | 10,000 |
| LARGE | ₹9,999/mo | 2 TB | 150 | 50,000 | Unlimited |
| ENTERPRISE | Custom | Custom | Unlimited | Unlimited | Unlimited |

- Check limits before creating events, guests, processing AI jobs
- Return 402 Payment Required with `{ error: 'Plan limit reached', upgradeUrl: '...' }` when exceeded
- Track usage in `Studio` model fields

### 2.17 Print Store & Razorpay

**Products:** Prints (4x6 to 24x36), Canvas, Albums, Photo Books, Digital Downloads, Gifts
- Studio sets profit markup (0–100% over base cost)
- `sellingPrice = baseCost * (1 + markup / 100)`
- Guest orders via public `POST /api/store/orders`
- Order lifecycle: PENDING → CONFIRMED → PROCESSING → SHIPPED → DELIVERED → CANCELLED
- Razorpay integration: create order, verify payment signature, update order status
- Webhook: `POST /api/razorpay/webhook` — handle payment events

---

## Section 3 — System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    CLIENT LAYER                          │
│  React 19 SPA (Netlify CDN)   Guest Gallery (Public)    │
└──────────────────────┬──────────────────────────────────┘
                       │ HTTPS / WebSocket
┌──────────────────────▼──────────────────────────────────┐
│                  NODE.JS API SERVER                      │
│  Express 5 · JWT Auth · Zod Validation · Rate Limiting  │
│  Socket.io /studio namespace (real-time dashboard)      │
│  SSE /gallery/:slug/stream (guest live feed)            │
└──────┬──────────┬──────────┬──────────┬────────────────┘
       │          │          │          │
       ▼          ▼          ▼          ▼
┌────────┐  ┌─────────┐  ┌──────┐  ┌────────────┐
│Postgres│  │  Redis  │  │  R2  │  │  Meta API  │
│  +pgv  │  │ BullMQ  │  │ CDN  │  │ WhatsApp   │
└────────┘  └────┬────┘  └──────┘  └────────────┘
                 │
        ┌────────▼────────┐
        │   BullMQ Workers │
        │  ┌─────────────┐ │
        │  │ media-proc  │ │  Sharp.js thumbnails, 3D LUT
        │  │ ai-jobs     │ │  Face recognition pipeline
        │  │ whatsapp    │ │  Message delivery + retry
        │  │ pdf-export  │ │  Report generation
        │  └──────┬──────┘ │
        └─────────┼────────┘
                  │ HTTP
        ┌─────────▼────────┐
        │  Python FastAPI  │
        │  InsightFace     │
        │  ArcFace R100    │
        │  512-dim embed   │
        └──────────────────┘

┌──────────────────────────────────────────────────────────┐
│                  FTP SERVER (port 2121)                   │
│  ftp-srv · per-camera credentials · auto-ingest to R2    │
└──────────────────────────────────────────────────────────┘
```

---

## Section 4 — Complete Database Schema

```prisma
// backend/prisma/schema.prisma

generator client {
  provider        = "prisma-client-js"
  previewFeatures = ["postgresqlExtensions"]
}

datasource db {
  provider   = "postgresql"
  url        = env("DATABASE_URL")
  extensions = [pgvector(map: "vector")]
}

// ─── ENUMS ───────────────────────────────────────────────

enum PlanTier {
  FREE MINI SMALL MID LARGE ENTERPRISE
}

enum TeamRole {
  OWNER ADMIN SHOOTER EDITOR VIEWER
}

enum TeamStatus {
  PENDING ACTIVE SUSPENDED
}

enum EventType {
  WEDDING BIRTHDAY CORPORATE CONCERT SPORTS OTHER
}

enum EventStatus {
  DRAFT LIVE COMPLETED ARCHIVED
}

enum CeremonyType {
  HALDI MEHENDI SANGEET WEDDING RECEPTION ENGAGEMENT ROKA CUSTOM
}

enum GuestAccess {
  ALL VIP PRIVATE
}

enum GuestRole {
  BRIDE GROOM FAMILY FRIEND COLLEAGUE VIP
}

enum CameraStatus {
  ACTIVE INACTIVE
}

enum UploadSource {
  CAMERA2CLOUD DESKTOP_UPLOADER GUEST_UPLOAD MANUAL
}

enum MediaStatus {
  UPLOADING PROCESSING READY FAILED DELETED
}

enum MessageType {
  GALLERY_READY SELFIE_REQUEST SELECTION_REMINDER DELIVERY_READY ORDER_CONFIRMED CUSTOM
}

enum MessageStatus {
  QUEUED SENT DELIVERED READ FAILED
}

enum InviteTemplate {
  CLASSIC MODERN MINIMAL FLORAL ROYAL
}

enum SelectionType {
  SELECTED FAVORITED FLAGGED
}

enum OrderStatus {
  PENDING CONFIRMED PROCESSING SHIPPED DELIVERED CANCELLED REFUNDED
}

// ─── MODELS ──────────────────────────────────────────────

model User {
  id           String        @id @default(cuid())
  email        String        @unique
  name         String
  passwordHash String
  createdAt    DateTime      @default(now())
  updatedAt    DateTime      @updatedAt
  studio       Studio?
  sessions     Session[]
  teamMember   TeamMember[]
}

model Session {
  id        String   @id @default(cuid())
  userId    String
  token     String   @unique
  expiresAt DateTime
  createdAt DateTime @default(now())
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model Studio {
  id               String          @id @default(cuid())
  ownerId          String          @unique
  name             String
  slug             String          @unique
  planTier         PlanTier        @default(FREE)
  storageUsedGB    Float           @default(0)
  storageLimitGB   Float           @default(10)
  logoUrl          String?
  watermarkUrl     String?
  primaryColor     String?
  accentColor      String?
  fontFamily       String?
  customDomain     String?
  whatsappPhoneId  String?
  whatsappToken    String?
  razorpayKeyId    String?
  razorpaySecret   String?
  createdAt        DateTime        @default(now())
  updatedAt        DateTime        @updatedAt
  owner            User            @relation(fields: [ownerId], references: [id])
  events           Event[]
  teamMembers      TeamMember[]
  cameraAccounts   CameraAccount[]
  trackingPixels   TrackingPixel[]
}

model TeamMember {
  id        String     @id @default(cuid())
  studioId  String
  userId    String
  role      TeamRole   @default(VIEWER)
  status    TeamStatus @default(PENDING)
  createdAt DateTime   @default(now())
  studio    Studio     @relation(fields: [studioId], references: [id], onDelete: Cascade)
  user      User       @relation(fields: [userId], references: [id])

  @@unique([studioId, userId])
}

model Event {
  id              String      @id @default(cuid())
  studioId        String
  name            String
  type            EventType   @default(WEDDING)
  status          EventStatus @default(DRAFT)
  gallerySlug     String      @unique
  startDate       DateTime
  endDate         DateTime?
  venue           String?
  coverPhotoUrl   String?
  description     String?
  storageUsedGB   Float       @default(0)
  storageAllocGB  Float       @default(50)
  galleryViewCount Int        @default(0)
  transferredAt   DateTime?
  transferredTo   String?
  createdAt       DateTime    @default(now())
  updatedAt       DateTime    @updatedAt
  studio          Studio      @relation(fields: [studioId], references: [id], onDelete: Cascade)
  subEvents       SubEvent[]
  guests          Guest[]
  media           Media[]
  qrCodes         QRCode[]
  whatsappMsgs    WhatsAppMessage[]
  invites         Invite[]
  orders          Order[]
  eventPixels     EventPixel[]
}

model SubEvent {
  id           String       @id @default(cuid())
  eventId      String
  name         String
  ceremonyType CeremonyType @default(CUSTOM)
  guestAccess  GuestAccess  @default(ALL)
  startTime    DateTime?
  endTime      DateTime?
  venue        String?
  colorTag     String?
  sortOrder    Int          @default(0)
  createdAt    DateTime     @default(now())
  event        Event        @relation(fields: [eventId], references: [id], onDelete: Cascade)
  media        Media[]
}

model Guest {
  id                  String           @id @default(cuid())
  eventId             String
  name                String
  phone               String?
  email               String?
  role                GuestRole        @default(FRIEND)
  selfieUrl           String?
  faceEmbedding       Json?
  galleryAccessToken  String           @unique @default(cuid())
  photosMatchedCount  Int              @default(0)
  whatsappOptIn       Boolean          @default(true)
  createdAt           DateTime         @default(now())
  event               Event            @relation(fields: [eventId], references: [id], onDelete: Cascade)
  faceTags            FaceTag[]
  selections          PhotoSelection[]
  whatsappMsgs        WhatsAppMessage[]
}

model CameraAccount {
  id           String       @id @default(cuid())
  studioId     String
  name         String
  ftpUsername  String       @unique
  ftpPassword  String
  status       CameraStatus @default(ACTIVE)
  lastUploadAt DateTime?
  uploadCount  Int          @default(0)
  createdAt    DateTime     @default(now())
  studio       Studio       @relation(fields: [studioId], references: [id], onDelete: Cascade)
  media        Media[]
}

model Media {
  id              String     @id @default(cuid())
  eventId         String
  subEventId      String?
  cameraAccountId String?
  originalUrl     String
  editedUrl       String?
  thumbnailUrl    String?
  fileName        String
  mimeType        String
  sizeBytes       BigInt
  width           Int?
  height          Int?
  takenAt         DateTime?
  uploadSource    UploadSource @default(DESKTOP_UPLOADER)
  status          MediaStatus  @default(UPLOADING)
  aiEditApplied   String?
  createdAt       DateTime   @default(now())
  event           Event      @relation(fields: [eventId], references: [id], onDelete: Cascade)
  subEvent        SubEvent?  @relation(fields: [subEventId], references: [id])
  cameraAccount   CameraAccount? @relation(fields: [cameraAccountId], references: [id])
  faceTags        FaceTag[]
  selections      PhotoSelection[]
}

model FaceTag {
  id           String  @id @default(cuid())
  mediaId      String
  guestId      String
  confidence   Float
  boundingBox  Json
  createdAt    DateTime @default(now())
  media        Media    @relation(fields: [mediaId], references: [id], onDelete: Cascade)
  guest        Guest    @relation(fields: [guestId], references: [id], onDelete: Cascade)

  @@unique([mediaId, guestId])
}

model PhotoSelection {
  id            String        @id @default(cuid())
  mediaId       String
  guestId       String
  selectionType SelectionType @default(SELECTED)
  comment       String?
  createdAt     DateTime      @default(now())
  media         Media         @relation(fields: [mediaId], references: [id], onDelete: Cascade)
  guest         Guest         @relation(fields: [guestId], references: [id], onDelete: Cascade)

  @@unique([mediaId, guestId, selectionType])
}

model QRCode {
  id          String   @id @default(cuid())
  eventId     String
  label       String
  slug        String   @unique
  targetUrl   String
  qrImageUrl  String?
  scanCount   Int      @default(0)
  createdAt   DateTime @default(now())
  event       Event    @relation(fields: [eventId], references: [id], onDelete: Cascade)
}

model WhatsAppMessage {
  id          String        @id @default(cuid())
  eventId     String
  guestId     String?
  phone       String
  type        MessageType
  status      MessageStatus @default(QUEUED)
  templateId  String?
  body        String?
  waMessageId String?
  sentAt      DateTime?
  deliveredAt DateTime?
  readAt      DateTime?
  createdAt   DateTime      @default(now())
  event       Event         @relation(fields: [eventId], references: [id], onDelete: Cascade)
  guest       Guest?        @relation(fields: [guestId], references: [id])
}

model Invite {
  id           String         @id @default(cuid())
  eventId      String
  slug         String         @unique
  title        String
  subtitle     String?
  template     InviteTemplate @default(MODERN)
  venue        String?
  dateTime     DateTime?
  coverImageUrl String?
  rsvpLink     String?
  customHtml   String?
  viewCount    Int            @default(0)
  createdAt    DateTime       @default(now())
  event        Event          @relation(fields: [eventId], references: [id], onDelete: Cascade)
}

model TrackingPixel {
  id          String       @id @default(cuid())
  studioId    String
  name        String
  pixelId     String
  platform    String
  accessToken String?
  fireCount   Int          @default(0)
  active      Boolean      @default(true)
  createdAt   DateTime     @default(now())
  studio      Studio       @relation(fields: [studioId], references: [id], onDelete: Cascade)
  eventPixels EventPixel[]
}

model EventPixel {
  id       String        @id @default(cuid())
  eventId  String
  pixelId  String
  event    Event         @relation(fields: [eventId], references: [id], onDelete: Cascade)
  pixel    TrackingPixel @relation(fields: [pixelId], references: [id], onDelete: Cascade)

  @@unique([eventId, pixelId])
}

model Order {
  id            String      @id @default(cuid())
  eventId       String
  guestName     String
  guestPhone    String?
  guestEmail    String?
  items         Json
  totalAmount   Float
  status        OrderStatus @default(PENDING)
  razorpayOrderId String?
  razorpayPaymentId String?
  shippingAddress Json?
  notes         String?
  createdAt     DateTime    @default(now())
  updatedAt     DateTime    @updatedAt
  event         Event       @relation(fields: [eventId], references: [id], onDelete: Cascade)
}
```

---

## Section 5 — Complete API Routes

### Authentication
```
POST   /api/auth/signup              Register studio (Zod: email, password, name, studioName)
POST   /api/auth/login               Login → JWT access + refresh cookie
POST   /api/auth/refresh             Rotate refresh token
POST   /api/auth/logout              Clear refresh cookie
GET    /api/auth/me                  Current user + studio info
```

### Events
```
GET    /api/events                   List studio events (filter: status, type)
POST   /api/events                   Create event (auto-generate gallerySlug)
GET    /api/events/:id               Get single event (include counts)
PATCH  /api/events/:id               Update event
DELETE /api/events/:id               Delete event
GET    /api/events/:id/subevents     List sub-events
POST   /api/events/:id/subevents     Add sub-event
PATCH  /api/events/:id/subevents/:sid Update sub-event
DELETE /api/events/:id/subevents/:sid Delete sub-event
```

### Guests
```
GET    /api/guests?eventId=          List guests (include faceEmbedding: false)
POST   /api/guests                   Add guest
POST   /api/guests/bulk              Bulk import CSV (multipart)
GET    /api/guests/:id               Get guest + matched photos
PATCH  /api/guests/:id               Update guest
DELETE /api/guests/:id               Delete guest
POST   /api/guests/:id/selfie        Upload selfie → embed → queue face match
```

### Media
```
GET    /api/media?eventId=           List media (filter: subEventId, source, status)
POST   /api/media/upload             Multipart upload → R2 → thumbnail job
GET    /api/media/:id                Get single media + face tags
PATCH  /api/media/:id                Update media metadata
DELETE /api/media/:id                Delete media + R2 cleanup
POST   /api/media/:id/ai-edit        Queue AI edit job (body: { preset })
POST   /api/media/:id/face-match     Queue face match job
GET    /api/media/presign            Get presigned PUT URL for direct R2 upload
```

### WhatsApp
```
POST   /api/whatsapp/send            Queue message(s) (body: { guestIds, type, eventId })
GET    /api/whatsapp/webhook         Verify webhook (challenge)
POST   /api/whatsapp/webhook         Receive status updates + inbound messages
GET    /api/whatsapp/stats?eventId=  Delivery stats per event
```

### Analytics
```
GET    /api/analytics/overview       Studio-level aggregates
GET    /api/analytics/event/:id      Per-event breakdown
GET    /api/analytics/export/:id     Export PDF/CSV report (query: format)
```

### Invites
```
GET    /api/invites?eventId=         List invites
POST   /api/invites                  Create invite (auto-generate slug)
GET    /api/invites/:id              Get invite
PATCH  /api/invites/:id              Update invite
DELETE /api/invites/:id              Delete invite
GET    /api/invites/view/:slug       Public view → increment viewCount (no auth)
```

### QR Codes
```
GET    /api/qr?eventId=              List QR codes
POST   /api/qr                       Create QR (generates image, stores slug)
PATCH  /api/qr/:id                   Update QR
DELETE /api/qr/:id                   Delete QR
GET    /api/qr/:slug/scan            Public scan → redirect + increment (no auth)
```

### Team
```
GET    /api/team                     List team members
POST   /api/team/invite              Invite by email (upsert user + teamMember)
PATCH  /api/team/:id                 Update role / status
DELETE /api/team/:id                 Remove member
```

### Storage
```
GET    /api/storage                  Studio storage overview + per-event breakdown
POST   /api/storage/transfer         Transfer event to client (archive + free GB)
```

### Print Store
```
GET    /api/store/orders?eventId=    List orders
POST   /api/store/orders             Public: guest places order
PATCH  /api/store/orders/:id         Update order status (studio/admin)
POST   /api/razorpay/webhook         Razorpay payment webhook
```

### Tracking Pixels
```
GET    /api/pixels                   List studio pixels
POST   /api/pixels                   Add pixel
PATCH  /api/pixels/:id               Update pixel
DELETE /api/pixels/:id               Delete pixel
POST   /api/pixels/fire              Public: increment fireCount (no auth)
```

### Public Gallery
```
GET    /gallery/:slug                Event gallery (public)
GET    /gallery/:slug/guest/:token   Personalised gallery (face-matched)
GET    /gallery/:slug/stream         SSE real-time photo feed
POST   /gallery/:slug/selfie         Guest selfie registration
POST   /gallery/:slug/select         Guest photo selection
```

### Camera2Cloud
```
GET    /api/cameras                  List camera accounts
POST   /api/cameras                  Add camera (generate FTP credentials)
PATCH  /api/cameras/:id              Update camera
DELETE /api/cameras/:id              Remove camera
```

### Health
```
GET    /health                       { status: 'ok', db: 'connected', redis: 'connected' }
```

---

## Section 6 — Tech Stack

| Layer | Technology | Version | Purpose |
|-------|-----------|---------|---------|
| Runtime | Node.js | 20 LTS | API server |
| Framework | Express | 5.x | HTTP routing |
| ORM | Prisma | 5.x | Database queries |
| Database | PostgreSQL | 15 | Primary data store |
| Vector search | pgvector | 0.5+ | Face embedding similarity |
| Cache / Queue | Redis | 7 | BullMQ job queues |
| Job processing | BullMQ | 4.x | Background workers |
| Object storage | Cloudflare R2 | — | Photos / videos (~$6/TB) |
| AI microservice | Python FastAPI | 0.104 | Face recognition |
| Face model | InsightFace ArcFace R100 | — | 512-dim embeddings |
| Image processing | Sharp.js | 0.33 | Thumbnails, LUTs, watermarks |
| Real-time | Socket.io | 4.x | Studio dashboard |
| Messaging | Meta Cloud API | v18 | WhatsApp Business |
| Payments | Razorpay | — | Print store orders |
| FTP server | ftp-srv | 4.x | Camera2Cloud ingest |
| Auth | jsonwebtoken | 9.x | JWT access tokens |
| Hashing | bcryptjs | 2.x | Password hashing |
| Validation | Zod | 3.x | Input schemas |
| Rate limiting | express-rate-limit | 7.x | DDoS protection |
| Security headers | helmet | 7.x | HTTP security |
| File upload | multer | 1.x | Multipart handler |
| QR generation | qrcode | 1.5 | QR PNG/SVG output |
| PDF export | html-pdf-node | 1.x | Analytics reports |

---

## Section 7 — Implementation Order

### Phase 1 — Foundation (Week 1)
- [ ] PostgreSQL setup with pgvector extension
- [ ] Prisma schema + migrations
- [ ] Redis + BullMQ worker scaffold
- [ ] Express app with helmet, cors, rate-limit
- [ ] Auth: signup, login, JWT middleware, refresh tokens
- [ ] Studio creation on signup

### Phase 2 — Core CRUD (Week 2)
- [ ] Events + Sub-events routes
- [ ] Guests CRUD + bulk CSV import
- [ ] Media upload (multer → R2 presigned)
- [ ] Thumbnail generation worker (Sharp.js)
- [ ] Team invite system

### Phase 3 — AI Pipeline (Week 3)
- [ ] Python FastAPI `/embed` endpoint (InsightFace ArcFace R100)
- [ ] Python FastAPI `/match` endpoint (cosine similarity)
- [ ] Guest selfie enrollment flow
- [ ] BullMQ `ai-jobs` worker for face matching
- [ ] FaceTag creation + guest counter increment
- [ ] AI photo editing worker (3D LUTs, presets)
- [ ] FTP server (Camera2Cloud auto-ingest)

### Phase 4 — Delivery (Week 4)
- [ ] WhatsApp send queue + all 5 templates
- [ ] WhatsApp webhook (verify + receive)
- [ ] Public guest gallery endpoints
- [ ] SSE real-time photo stream
- [ ] Socket.io studio dashboard events
- [ ] QR code generation + scan tracking
- [ ] Digital invite builder

### Phase 5 — Business (Week 5)
- [ ] Analytics aggregation queries
- [ ] PDF / CSV export
- [ ] Meta Conversions API integration
- [ ] Tracking pixel fire endpoint
- [ ] Print store orders
- [ ] Razorpay payment + webhook
- [ ] Storage transfer flow
- [ ] White label branding injection

### Phase 6 — Monetisation (Week 6)
- [ ] Plan tier enforcement middleware
- [ ] Usage counters on Studio model
- [ ] Plan limit checks on create operations
- [ ] 402 responses with upgrade links
- [ ] Subscription webhook handling (Razorpay Subscriptions)

---

## Section 8 — Security Requirements

### Input Validation
- All `POST` / `PATCH` bodies validated with Zod schemas before touching Prisma
- File uploads: MIME type whitelist (`image/jpeg`, `image/png`, `image/webp`, `video/mp4`)
- File size limits: 30 MB photos, 2 GB video
- SQL injection: Prisma parameterised queries only — never raw template literals with user input

### Authentication & Authorisation
- JWT signed with `HS256`, secret min 64 chars, rotate on breach
- Refresh tokens stored server-side in `Session` table — can be revoked
- All studio routes verify `studio.ownerId === req.user.userId`
- Team role checked with `requireRole()` middleware before sensitive operations
- Guest gallery access validated via `galleryAccessToken` UUID — cryptographically random

### HTTP Security
- `helmet()` sets: CSP, HSTS, X-Frame-Options, X-Content-Type-Options
- CORS: allow only `FRONTEND_URL` origin
- Rate limiting: 10/15min on auth, 200/15min global, 30/min on public gallery
- No stack traces in production error responses

### Storage
- R2 bucket: private by default, serve only via signed URLs or CDN with access rules
- Presigned upload URLs expire in 15 minutes
- Guest selfies stored separately from gallery photos, never publicly indexed

### WhatsApp Webhook
- Verify `X-Hub-Signature-256` header on all incoming webhook POSTs
- Token stored in env, never logged

### Secrets Management
- All secrets in environment variables, never committed to git
- `.env` in `.gitignore`
- Use separate `.env.production` for deployment

---

## Quick Start

```bash
# 1. Clone and install
cd backend && npm install

# 2. Copy env template
cp .env.example .env
# Fill in: DATABASE_URL, JWT_SECRET, STORAGE_*, WHATSAPP_*, FACE_RECOGNITION_*

# 3. Start PostgreSQL with pgvector
docker run -d -e POSTGRES_PASSWORD=postgres -p 5432:5432 ankane/pgvector

# 4. Start Redis
docker run -d -p 6379:6379 redis:7-alpine

# 5. Run migrations
npm run db:migrate

# 6. Start Python AI service
cd ai-service && pip install fastapi insightface uvicorn python-multipart
uvicorn main:app --port 8001

# 7. Start Node API
npm run dev
```

---

*Generated for Eventra AI — competing with Samaro.ai on AI-powered event photo delivery.*
