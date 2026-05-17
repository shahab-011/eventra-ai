# Eventra AI — Extreme Full-Stack Build Specification

> **For AI code generation:** Read every section. Build exactly what is described. Do not skip features. Do not simplify. Every code block is the exact implementation expected.

---

## 1. Product Vision

Eventra is a B2B SaaS platform sold to photography studios. Studios use it to manage weddings and events end-to-end — from guest management to AI photo delivery via WhatsApp. It competes directly with Samaro.ai.

**Three actors:**
- **Studio Owner** — buys a plan, creates events, manages team, reviews analytics, gets paid via print store
- **Team Member** — shooter/editor assigned to events, uploads photos via FTP or browser
- **Guest** — receives WhatsApp link, registers selfie, views only their own photos, selects favourites, orders prints

**Core differentiator:** Face-recognition pipeline runs automatically. A guest registers one selfie → every photo of them across the entire event is found and delivered. No manual tagging. Works at 5,000+ photos/event.

---

## 2. Complete Tech Stack (Every Package, Every Reason)

### 2.1 Frontend

| Package | Version | Why |
|---------|---------|-----|
| React | 19.x | Concurrent rendering, use() hook for async |
| Vite | 5.x | Sub-second HMR, ESM-native bundler |
| react-router-dom | 7.x | File-based routing, nested layouts |
| Framer Motion | 11.x | GPU-accelerated animations, layoutId shared transitions |
| Tailwind CSS | 3.x | Utility-first, JIT, no runtime cost |
| @tanstack/react-query | 5.x | Server state, caching, background refetch |
| zustand | 4.x | Lightweight global state (auth, sidebar) |
| axios | 1.x | HTTP client with interceptors for JWT refresh |
| socket.io-client | 4.x | Real-time studio dashboard updates |
| react-dropzone | 14.x | Drag-and-drop photo upload |
| react-hot-toast | 2.x | Non-blocking notifications |
| date-fns | 3.x | Date formatting, no Moment.js bloat |
| lucide-react | 0.x | Consistent icon set (MIT) |
| recharts | 2.x | Analytics charts (Bar, Line, Pie) |
| qrcode.react | 3.x | Client-side QR rendering |
| html5-qrcode | 2.x | Camera QR scanner for mobile |

### 2.2 Backend (Node.js)

| Package | Version | Why |
|---------|---------|-----|
| express | 5.x | Async error propagation built-in |
| @prisma/client | 5.x | Type-safe queries, migration system |
| prisma | 5.x | CLI for schema push/migrate |
| bcryptjs | 2.x | Pure-JS bcrypt (no native dep issues) |
| jsonwebtoken | 9.x | JWT sign/verify |
| zod | 3.x | Runtime schema validation |
| helmet | 7.x | 11 HTTP security headers in one call |
| cors | 2.x | CORS with origin whitelist |
| express-rate-limit | 7.x | Per-IP rate limiting |
| multer | 1.x | multipart/form-data parser |
| @aws-sdk/client-s3 | 3.x | R2 uses S3-compatible API |
| @aws-sdk/s3-request-presigner | 3.x | Presigned PUT URLs |
| bullmq | 4.x | Redis-backed job queues |
| ioredis | 5.x | Redis client (BullMQ peer dep) |
| socket.io | 4.x | WebSocket server |
| sharp | 0.33.x | Image processing (thumbnails, LUTs, watermarks) |
| ftp-srv | 4.x | Built-in FTP server for Camera2Cloud |
| qrcode | 1.5.x | Server-side QR PNG/SVG generation |
| nanoid | 5.x | URL-safe unique IDs for slugs |
| nodemailer | 6.x | Transactional email |
| uuid | 9.x | Gallery access tokens |
| dotenv | 16.x | Environment variables |
| axios | 1.x | HTTP calls to Python AI service |

### 2.3 Database Layer

| Technology | Version | Why |
|-----------|---------|-----|
| PostgreSQL | 15 | JSONB for embeddings (fallback), pgvector for cosine similarity |
| pgvector | 0.5+ | Native vector similarity search — 10× faster than app-level cosine |
| Redis | 7 | BullMQ queues, session cache, rate-limit counters |
| Prisma | 5 | Type-safe ORM, auto-migrations, relation queries |

### 2.4 AI Service (Python)

| Package | Version | Why |
|---------|---------|-----|
| fastapi | 0.104 | Async HTTP, auto OpenAPI docs |
| uvicorn | 0.24 | ASGI server |
| insightface | 0.7 | ArcFace R100 model — best open-source face recognition |
| numpy | 1.26 | Embedding math |
| opencv-python-headless | 4.8 | Image decode (no GUI dep) |
| python-multipart | 0.0.6 | File upload parsing |
| Pillow | 10.x | Image pre-processing |

### 2.5 Infrastructure

| Service | Purpose | Cost |
|---------|---------|------|
| Cloudflare R2 | Object storage | $0/GB storage, $0 egress |
| Netlify | Frontend hosting | Free tier sufficient |
| Railway / Render | Node API + Redis | ~$10/mo |
| fly.io | Python AI service | Free tier (256 MB RAM) |
| Meta Cloud API | WhatsApp Business | Free tier: 1000 conversations/mo |
| Razorpay | Indian payments | 2% per transaction |

---

## 3. Project File Structure

```
eventra-ai/
├── frontend/                        # React 19 + Vite SPA
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   ├── AppSidebar.jsx       # Collapsible nav with navGroups
│   │   │   ├── PageWrapper.jsx      # AnimatePresence page transitions
│   │   │   ├── StatCard.jsx         # Reusable KPI card
│   │   │   ├── PhotoGrid.jsx        # Masonry photo grid
│   │   │   ├── UploadDropzone.jsx   # react-dropzone wrapper
│   │   │   └── Modal.jsx            # Accessible modal wrapper
│   │   ├── context/
│   │   │   └── AuthContext.jsx      # JWT + user state
│   │   ├── hooks/
│   │   │   ├── useEvents.js         # React Query event hooks
│   │   │   ├── useGuests.js
│   │   │   └── useSocket.js         # Socket.io connection
│   │   ├── lib/
│   │   │   ├── api.js               # Axios instance + interceptors
│   │   │   └── constants.js
│   │   ├── pages/
│   │   │   ├── Login.jsx            # ← MISSING, build this
│   │   │   ├── Signup.jsx           # ← MISSING, build this
│   │   │   ├── Dashboard.jsx        # Studio overview
│   │   │   ├── Events.jsx           # Event list + create
│   │   │   ├── EventDetail.jsx      # ← MISSING, build this
│   │   │   ├── SubEventManager.jsx  # ✓ exists
│   │   │   ├── Guests.jsx           # Guest list + import
│   │   │   ├── MediaLibrary.jsx     # ← MISSING, build this
│   │   │   ├── Camera2Cloud.jsx     # ← MISSING, build this
│   │   │   ├── AIFaceRec.jsx        # ← MISSING, build this
│   │   │   ├── AIEditing.jsx        # ← MISSING, build this
│   │   │   ├── ClientProofing.jsx   # ✓ exists
│   │   │   ├── WhatsAppBot.jsx      # ← MISSING, build this
│   │   │   ├── InviteBuilder.jsx    # ← MISSING, build this
│   │   │   ├── GuestGallery.jsx     # ← MISSING (public page)
│   │   │   ├── QRCodeManager.jsx    # ✓ exists
│   │   │   ├── LiveSlideshow.jsx    # ✓ exists
│   │   │   ├── WhiteLabel.jsx       # ← MISSING, build this
│   │   │   ├── PrintStore.jsx       # ✓ exists
│   │   │   ├── Analytics.jsx        # ✓ exists (with tabs)
│   │   │   ├── TeamManagement.jsx   # ✓ exists
│   │   │   ├── StorageManager.jsx   # ✓ exists
│   │   │   └── Billing.jsx          # ← MISSING, build this
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── index.html
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── netlify.toml
│
├── backend/                         # Node.js + Express API
│   ├── prisma/
│   │   └── schema.prisma
│   ├── src/
│   │   ├── index.js                 # Express app entry
│   │   ├── middleware/
│   │   │   ├── auth.js              # JWT authenticate + requireRole
│   │   │   ├── validate.js          # Zod middleware factory
│   │   │   └── planCheck.js         # Plan limit enforcement
│   │   ├── routes/
│   │   │   ├── auth.js
│   │   │   ├── events.js
│   │   │   ├── subEvents.js
│   │   │   ├── guests.js
│   │   │   ├── media.js
│   │   │   ├── cameras.js           # Camera2Cloud FTP management
│   │   │   ├── whatsapp.js
│   │   │   ├── analytics.js
│   │   │   ├── invites.js
│   │   │   ├── qr.js
│   │   │   ├── team.js
│   │   │   ├── storage.js
│   │   │   ├── store.js
│   │   │   ├── pixels.js
│   │   │   ├── billing.js           # Plan + Razorpay subscriptions
│   │   │   └── gallery.js           # Public guest gallery endpoints
│   │   ├── workers/
│   │   │   ├── mediaWorker.js       # Thumbnail generation
│   │   │   ├── aiWorker.js          # Face match + AI edit jobs
│   │   │   ├── whatsappWorker.js    # Message delivery
│   │   │   └── exportWorker.js      # PDF/CSV reports
│   │   ├── services/
│   │   │   ├── r2.js                # R2/S3 upload helpers
│   │   │   ├── faceApi.js           # Python AI service HTTP client
│   │   │   ├── whatsappApi.js       # Meta Cloud API wrapper
│   │   │   ├── razorpay.js          # Payment helpers
│   │   │   └── email.js             # Nodemailer
│   │   ├── queues.js                # BullMQ queue definitions
│   │   ├── socket.js                # Socket.io server setup
│   │   └── ftpServer.js             # ftp-srv Camera2Cloud server
│   ├── .env.example
│   └── package.json
│
└── ai-service/                      # Python FastAPI
    ├── main.py
    ├── requirements.txt
    └── Dockerfile
```

---

## 4. Environment Variables (Complete)

```bash
# backend/.env.example

# ── Database ──────────────────────────────────────────
DATABASE_URL="postgresql://user:password@localhost:5432/eventra?schema=public"

# ── Auth ──────────────────────────────────────────────
JWT_SECRET="minimum-64-character-random-string-generate-with-openssl-rand-base64-48"
JWT_EXPIRES_IN="15m"
REFRESH_TOKEN_SECRET="another-64-char-secret"
REFRESH_EXPIRES_IN="7d"

# ── Server ────────────────────────────────────────────
PORT=3001
NODE_ENV=development
FRONTEND_URL="http://localhost:5173"

# ── Cloudflare R2 ─────────────────────────────────────
STORAGE_ENDPOINT="https://<account-id>.r2.cloudflarestorage.com"
STORAGE_ACCESS_KEY="your-r2-access-key-id"
STORAGE_SECRET="your-r2-secret-access-key"
STORAGE_BUCKET="eventra-media"
STORAGE_PUBLIC_URL="https://media.yourdomain.com"

# ── WhatsApp (Meta Cloud API) ─────────────────────────
WHATSAPP_API_URL="https://graph.facebook.com/v18.0"
WHATSAPP_PHONE_NUMBER_ID="your-phone-number-id"
WHATSAPP_ACCESS_TOKEN="your-permanent-access-token"
WHATSAPP_WEBHOOK_VERIFY_TOKEN="random-string-you-choose"
WHATSAPP_APP_SECRET="your-meta-app-secret"

# ── Face Recognition AI Service ───────────────────────
FACE_API_URL="http://localhost:8001"
FACE_API_KEY="shared-secret-key"

# ── Redis ─────────────────────────────────────────────
REDIS_URL="redis://localhost:6379"

# ── Razorpay ──────────────────────────────────────────
RAZORPAY_KEY_ID="rzp_test_xxxxxxxxxxxx"
RAZORPAY_SECRET="your-razorpay-secret"
RAZORPAY_WEBHOOK_SECRET="your-webhook-secret"

# ── Email ─────────────────────────────────────────────
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="your@gmail.com"
SMTP_PASS="your-app-password"
EMAIL_FROM="Eventra <noreply@eventra.ai>"

# ── FTP Server (Camera2Cloud) ─────────────────────────
FTP_PORT=2121
FTP_PASV_URL="your-server-public-ip"
FTP_PASV_MIN=3000
FTP_PASV_MAX=3100
```

---

## 5. Database Schema (Complete Prisma)

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

enum PlanTier { FREE MINI SMALL MID LARGE ENTERPRISE }
enum TeamRole { OWNER ADMIN SHOOTER EDITOR VIEWER }
enum TeamStatus { PENDING ACTIVE SUSPENDED }
enum EventType { WEDDING BIRTHDAY CORPORATE CONCERT SPORTS OTHER }
enum EventStatus { DRAFT LIVE COMPLETED ARCHIVED }
enum CeremonyType { HALDI MEHENDI SANGEET WEDDING RECEPTION ENGAGEMENT ROKA CUSTOM }
enum GuestAccess { ALL VIP PRIVATE }
enum GuestRole { BRIDE GROOM FAMILY FRIEND COLLEAGUE VIP }
enum CameraStatus { ACTIVE INACTIVE }
enum UploadSource { CAMERA2CLOUD DESKTOP_UPLOADER GUEST_UPLOAD MANUAL }
enum MediaStatus { UPLOADING PROCESSING READY FAILED DELETED }
enum MessageType { GALLERY_READY SELFIE_REQUEST SELECTION_REMINDER DELIVERY_READY ORDER_CONFIRMED CUSTOM }
enum MessageStatus { QUEUED SENT DELIVERED READ FAILED }
enum InviteTemplate { CLASSIC MODERN MINIMAL FLORAL ROYAL }
enum SelectionType { SELECTED FAVORITED FLAGGED }
enum OrderStatus { PENDING CONFIRMED PROCESSING SHIPPED DELIVERED CANCELLED REFUNDED }
enum SubscriptionStatus { ACTIVE PAUSED CANCELLED EXPIRED }

model User {
  id           String       @id @default(cuid())
  email        String       @unique
  name         String
  passwordHash String
  avatarUrl    String?
  createdAt    DateTime     @default(now())
  updatedAt    DateTime     @updatedAt
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
  id              String        @id @default(cuid())
  ownerId         String        @unique
  name            String
  slug            String        @unique
  planTier        PlanTier      @default(FREE)
  storageUsedGB   Float         @default(0)
  storageLimitGB  Float         @default(10)
  eventsUsed      Int           @default(0)
  guestsUsed      Int           @default(0)
  aiEditsUsed     Int           @default(0)
  logoUrl         String?
  watermarkUrl    String?
  primaryColor    String        @default("#6750A4")
  accentColor     String        @default("#625B71")
  fontFamily      String        @default("Inter")
  customDomain    String?
  whatsappPhoneId String?
  whatsappToken   String?
  razorpayKeyId   String?
  razorpaySecret  String?
  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt
  owner           User          @relation(fields: [ownerId], references: [id])
  events          Event[]
  teamMembers     TeamMember[]
  cameraAccounts  CameraAccount[]
  trackingPixels  TrackingPixel[]
  subscription    Subscription?
}

model Subscription {
  id                   String             @id @default(cuid())
  studioId             String             @unique
  planTier             PlanTier
  status               SubscriptionStatus @default(ACTIVE)
  razorpaySubId        String?
  currentPeriodStart   DateTime
  currentPeriodEnd     DateTime
  createdAt            DateTime           @default(now())
  studio               Studio             @relation(fields: [studioId], references: [id])
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
  id               String      @id @default(cuid())
  studioId         String
  name             String
  type             EventType   @default(WEDDING)
  status           EventStatus @default(DRAFT)
  gallerySlug      String      @unique
  startDate        DateTime
  endDate          DateTime?
  venue            String?
  coverPhotoUrl    String?
  description      String?
  storageUsedGB    Float       @default(0)
  storageAllocGB   Float       @default(50)
  galleryViewCount Int         @default(0)
  transferredAt    DateTime?
  transferredTo    String?
  createdAt        DateTime    @default(now())
  updatedAt        DateTime    @updatedAt
  studio           Studio      @relation(fields: [studioId], references: [id], onDelete: Cascade)
  subEvents        SubEvent[]
  guests           Guest[]
  media            Media[]
  qrCodes          QRCode[]
  whatsappMsgs     WhatsAppMessage[]
  invites          Invite[]
  orders           Order[]
  eventPixels      EventPixel[]
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
  id                 String           @id @default(cuid())
  eventId            String
  name               String
  phone              String?
  email              String?
  role               GuestRole        @default(FRIEND)
  selfieUrl          String?
  faceEmbedding      Json?
  galleryAccessToken String           @unique @default(uuid())
  photosMatchedCount Int              @default(0)
  whatsappOptIn      Boolean          @default(true)
  createdAt          DateTime         @default(now())
  event              Event            @relation(fields: [eventId], references: [id], onDelete: Cascade)
  faceTags           FaceTag[]
  selections         PhotoSelection[]
  whatsappMsgs       WhatsAppMessage[]
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
  id              String        @id @default(cuid())
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
  uploadSource    UploadSource  @default(DESKTOP_UPLOADER)
  status          MediaStatus   @default(UPLOADING)
  aiEditApplied   String?
  createdAt       DateTime      @default(now())
  event           Event         @relation(fields: [eventId], references: [id], onDelete: Cascade)
  subEvent        SubEvent?     @relation(fields: [subEventId], references: [id])
  cameraAccount   CameraAccount? @relation(fields: [cameraAccountId], references: [id])
  faceTags        FaceTag[]
  selections      PhotoSelection[]
}

model FaceTag {
  id          String   @id @default(cuid())
  mediaId     String
  guestId     String
  confidence  Float
  boundingBox Json
  createdAt   DateTime @default(now())
  media       Media    @relation(fields: [mediaId], references: [id], onDelete: Cascade)
  guest       Guest    @relation(fields: [guestId], references: [id], onDelete: Cascade)
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
  id         String   @id @default(cuid())
  eventId    String
  label      String
  slug       String   @unique
  targetUrl  String
  qrImageUrl String?
  scanCount  Int      @default(0)
  createdAt  DateTime @default(now())
  event      Event    @relation(fields: [eventId], references: [id], onDelete: Cascade)
}

model WhatsAppMessage {
  id          String        @id @default(cuid())
  eventId     String
  guestId     String?
  phone       String
  type        MessageType
  status      MessageStatus @default(QUEUED)
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
  id            String         @id @default(cuid())
  eventId       String
  slug          String         @unique
  title         String
  subtitle      String?
  template      InviteTemplate @default(MODERN)
  venue         String?
  dateTime      DateTime?
  coverImageUrl String?
  rsvpLink      String?
  customHtml    String?
  viewCount     Int            @default(0)
  createdAt     DateTime       @default(now())
  event         Event          @relation(fields: [eventId], references: [id], onDelete: Cascade)
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
  id      String        @id @default(cuid())
  eventId String
  pixelId String
  event   Event         @relation(fields: [eventId], references: [id], onDelete: Cascade)
  pixel   TrackingPixel @relation(fields: [pixelId], references: [id], onDelete: Cascade)
  @@unique([eventId, pixelId])
}

model Order {
  id                String      @id @default(cuid())
  eventId           String
  guestName         String
  guestPhone        String?
  guestEmail        String?
  items             Json
  totalAmount       Float
  status            OrderStatus @default(PENDING)
  razorpayOrderId   String?
  razorpayPaymentId String?
  shippingAddress   Json?
  notes             String?
  createdAt         DateTime    @default(now())
  updatedAt         DateTime    @updatedAt
  event             Event       @relation(fields: [eventId], references: [id], onDelete: Cascade)
}
```


---

## 6. Frontend — Missing Pages (Build These)

### 6.1 src/lib/api.js — Axios Instance with JWT Refresh

```js
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3001/api',
  withCredentials: true,
});

api.interceptors.request.use(cfg => {
  const token = localStorage.getItem('token');
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

api.interceptors.response.use(
  r => r.data,
  async err => {
    const orig = err.config;
    if (err.response?.status === 401 && !orig._retry) {
      orig._retry = true;
      try {
        const { token } = await axios.post('/api/auth/refresh', {}, { withCredentials: true });
        localStorage.setItem('token', token);
        orig.headers.Authorization = `Bearer ${token}`;
        return api(orig);
      } catch {
        localStorage.removeItem('token');
        window.location.href = '/login';
      }
    }
    return Promise.reject(err.response?.data || err);
  }
);

export default api;
```

### 6.2 src/context/AuthContext.jsx

```jsx
import { createContext, useContext, useState, useEffect } from 'react';
import api from '../lib/api';

const Ctx = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [studio, setStudio] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { setLoading(false); return; }
    api.get('/auth/me')
      .then(d => { setUser(d.user); setStudio(d.studio); })
      .catch(() => localStorage.removeItem('token'))
      .finally(() => setLoading(false));
  }, []);

  function login(token, userData, studioData) {
    localStorage.setItem('token', token);
    setUser(userData);
    setStudio(studioData);
  }

  function logout() {
    localStorage.removeItem('token');
    setUser(null); setStudio(null);
  }

  return <Ctx.Provider value={{ user, studio, loading, login, logout }}>{children}</Ctx.Provider>;
}

export const useAuth = () => useContext(Ctx);
```

### 6.3 src/pages/Login.jsx

```jsx
import { motion } from 'framer-motion';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { Camera, Eye, EyeOff } from 'lucide-react';

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const nav = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const d = await api.post('/auth/login', form);
      login(d.token, d.user, d.studio);
      nav('/dashboard');
    } catch (err) {
      setError(err.error || 'Invalid credentials');
    } finally { setLoading(false); }
  }

  return (
    <div className="min-h-screen bg-[var(--md-sys-color-surface)] flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
        className="glass-card w-full max-w-md p-8 space-y-6">
        <div className="flex flex-col items-center gap-3">
          <div className="w-14 h-14 rounded-2xl bg-[var(--md-sys-color-primary-container)] flex items-center justify-center">
            <Camera className="w-7 h-7 text-[var(--md-sys-color-on-primary-container)]" />
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-bold text-[var(--md-sys-color-on-surface)]">Welcome back</h1>
            <p className="text-sm text-[var(--md-sys-color-on-surface-variant)] mt-1">Sign in to your Eventra studio</p>
          </div>
        </div>
        {error && <div className="p-3 rounded-xl bg-red-500/10 border border-red-400/20 text-red-400 text-sm">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-sm font-medium text-[var(--md-sys-color-on-surface)]">Email</label>
            <input type="email" required value={form.email}
              onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
              placeholder="studio@example.com"
              className="w-full px-4 py-3 rounded-xl bg-[var(--md-sys-color-surface-container)] border border-white/10 text-[var(--md-sys-color-on-surface)] placeholder:text-[var(--md-sys-color-on-surface-variant)] focus:outline-none focus:ring-2 focus:ring-[var(--md-sys-color-primary)]" />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-[var(--md-sys-color-on-surface)]">Password</label>
            <div className="relative">
              <input type={showPw ? 'text' : 'password'} required value={form.password}
                onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                placeholder="••••••••"
                className="w-full px-4 py-3 pr-12 rounded-xl bg-[var(--md-sys-color-surface-container)] border border-white/10 text-[var(--md-sys-color-on-surface)] focus:outline-none focus:ring-2 focus:ring-[var(--md-sys-color-primary)]" />
              <button type="button" onClick={() => setShowPw(p => !p)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--md-sys-color-on-surface-variant)]">
                {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <button type="submit" disabled={loading}
            className="w-full py-3 rounded-xl bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] font-semibold hover:opacity-90 transition-opacity disabled:opacity-50">
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
        <p className="text-center text-sm text-[var(--md-sys-color-on-surface-variant)]">
          No account?{' '}
          <Link to="/signup" className="text-[var(--md-sys-color-primary)] hover:underline font-medium">Create studio free</Link>
        </p>
      </motion.div>
    </div>
  );
}
```

### 6.4 src/pages/Signup.jsx

```jsx
import { motion } from 'framer-motion';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { Camera } from 'lucide-react';

export default function Signup() {
  const [form, setForm] = useState({ name: '', email: '', password: '', studioName: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const nav = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const d = await api.post('/auth/signup', form);
      login(d.token, d.user, d.studio);
      nav('/dashboard');
    } catch (err) {
      setError(err.error || 'Signup failed');
    } finally { setLoading(false); }
  }

  const field = (key, label, type = 'text', placeholder = '') => (
    <div className="space-y-1">
      <label className="text-sm font-medium text-[var(--md-sys-color-on-surface)]">{label}</label>
      <input type={type} required value={form[key]}
        onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))}
        placeholder={placeholder}
        className="w-full px-4 py-3 rounded-xl bg-[var(--md-sys-color-surface-container)] border border-white/10 text-[var(--md-sys-color-on-surface)] focus:outline-none focus:ring-2 focus:ring-[var(--md-sys-color-primary)]" />
    </div>
  );

  return (
    <div className="min-h-screen bg-[var(--md-sys-color-surface)] flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
        className="glass-card w-full max-w-md p-8 space-y-6">
        <div className="flex flex-col items-center gap-3">
          <div className="w-14 h-14 rounded-2xl bg-[var(--md-sys-color-primary-container)] flex items-center justify-center">
            <Camera className="w-7 h-7 text-[var(--md-sys-color-on-primary-container)]" />
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-bold text-[var(--md-sys-color-on-surface)]">Create your studio</h1>
            <p className="text-sm text-[var(--md-sys-color-on-surface-variant)] mt-1">Free forever — no credit card needed</p>
          </div>
        </div>
        {error && <div className="p-3 rounded-xl bg-red-500/10 border border-red-400/20 text-red-400 text-sm">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          {field('studioName', 'Studio name', 'text', 'Sharma Photography')}
          {field('name', 'Your name', 'text', 'Rahul Sharma')}
          {field('email', 'Email', 'email', 'rahul@sharma.photography')}
          {field('password', 'Password', 'password', 'Min 8 characters')}
          <button type="submit" disabled={loading}
            className="w-full py-3 rounded-xl bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] font-semibold hover:opacity-90 transition-opacity disabled:opacity-50">
            {loading ? 'Creating studio…' : "Create studio — it's free"}
          </button>
        </form>
        <p className="text-center text-sm text-[var(--md-sys-color-on-surface-variant)]">
          Already have an account?{' '}
          <Link to="/login" className="text-[var(--md-sys-color-primary)] hover:underline font-medium">Sign in</Link>
        </p>
      </motion.div>
    </div>
  );
}
```

### 6.5 src/pages/MediaLibrary.jsx

```jsx
import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import AppSidebar from '../components/AppSidebar';
import api from '../lib/api';
import { Upload, Grid3X3, List, Wand2, ChevronDown } from 'lucide-react';
import toast from 'react-hot-toast';

export default function MediaLibrary() {
  const [eventId, setEventId] = useState('');
  const [view, setView] = useState('grid');
  const [filter, setFilter] = useState('All');
  const [uploading, setUploading] = useState([]);
  const qc = useQueryClient();

  const { data: events } = useQuery({ queryKey: ['events'], queryFn: () => api.get('/events') });
  const { data: media } = useQuery({
    queryKey: ['media', eventId],
    queryFn: () => api.get(`/media?eventId=${eventId}`),
    enabled: !!eventId,
  });

  const onDrop = useCallback(async (files) => {
    if (!eventId) { toast.error('Select an event first'); return; }
    for (const file of files) {
      const id = crypto.randomUUID();
      setUploading(p => [...p, { id, name: file.name, progress: 0 }]);
      const fd = new FormData();
      fd.append('file', file);
      fd.append('eventId', eventId);
      try {
        await api.post('/media/upload', fd, {
          onUploadProgress: e => {
            const pct = Math.round((e.loaded / e.total) * 100);
            setUploading(p => p.map(u => u.id === id ? { ...u, progress: pct } : u));
          },
        });
        setUploading(p => p.filter(u => u.id !== id));
        qc.invalidateQueries(['media', eventId]);
      } catch { toast.error(`Failed: ${file.name}`); setUploading(p => p.filter(u => u.id !== id)); }
    }
  }, [eventId]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, accept: { 'image/*': [], 'video/*': [] } });
  const faceMatch = useMutation({ mutationFn: (id) => api.post(`/media/${id}/face-match`), onSuccess: () => toast.success('Queued') });

  const filtered = (media ?? []).filter(m => filter === 'All' || m.status === filter.toUpperCase());

  return (
    <AppSidebar>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-[var(--md-sys-color-on-surface)]">Media Library</h1>
          <button onClick={() => setView(v => v === 'grid' ? 'list' : 'grid')}
            className="p-2 rounded-xl bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface-variant)]">
            {view === 'grid' ? <List className="w-4 h-4" /> : <Grid3X3 className="w-4 h-4" />}
          </button>
        </div>
        <div className="relative w-64">
          <select value={eventId} onChange={e => setEventId(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-[var(--md-sys-color-surface-container)] border border-white/10 text-[var(--md-sys-color-on-surface)] appearance-none focus:outline-none focus:ring-2 focus:ring-[var(--md-sys-color-primary)]">
            <option value="">Select event</option>
            {events?.map(ev => <option key={ev.id} value={ev.id}>{ev.name}</option>)}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none text-[var(--md-sys-color-on-surface-variant)]" />
        </div>
        <div {...getRootProps()} className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-colors ${isDragActive ? 'border-[var(--md-sys-color-primary)] bg-[var(--md-sys-color-primary-container)]/20' : 'border-white/20 hover:border-white/40'}`}>
          <input {...getInputProps()} />
          <Upload className="w-8 h-8 mx-auto mb-3 text-[var(--md-sys-color-primary)]" />
          <p className="font-medium text-[var(--md-sys-color-on-surface)]">{isDragActive ? 'Drop photos here' : 'Drag & drop or click to browse'}</p>
          <p className="text-sm text-[var(--md-sys-color-on-surface-variant)] mt-1">JPEG, PNG, WebP, RAW, MP4 · max 2GB</p>
        </div>
        {uploading.length > 0 && (
          <div className="glass-card p-4 space-y-2">
            {uploading.map(u => (
              <div key={u.id}>
                <div className="flex justify-between text-xs text-[var(--md-sys-color-on-surface-variant)] mb-1">
                  <span className="truncate max-w-xs">{u.name}</span><span>{u.progress}%</span>
                </div>
                <div className="h-1.5 rounded-full bg-white/10">
                  <motion.div className="h-full rounded-full bg-[var(--md-sys-color-primary)]" animate={{ width: `${u.progress}%` }} />
                </div>
              </div>
            ))}
          </div>
        )}
        <div className="flex gap-2">
          {['All','Ready','Processing'].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium ${filter === f ? 'bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)]' : 'bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface-variant)]'}`}>{f}</button>
          ))}
          <span className="ml-auto text-sm text-[var(--md-sys-color-on-surface-variant)] self-center">{filtered.length} items</span>
        </div>
        <div className={view === 'grid' ? 'grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-2' : 'space-y-2'}>
          {filtered.map(m => (
            <motion.div key={m.id} layout className={view === 'grid' ? 'relative aspect-square rounded-xl overflow-hidden group' : 'glass-card p-3 flex items-center gap-3'}>
              {view === 'grid' ? (
                <>
                  <img src={m.thumbnailUrl || m.originalUrl} alt="" className="w-full h-full object-cover" loading="lazy" />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <button onClick={() => faceMatch.mutate(m.id)} className="p-2 rounded-lg bg-white/20 text-white"><Wand2 className="w-4 h-4" /></button>
                  </div>
                </>
              ) : (
                <>
                  <img src={m.thumbnailUrl || m.originalUrl} alt="" className="w-12 h-12 rounded-lg object-cover" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate text-[var(--md-sys-color-on-surface)]">{m.fileName}</p>
                    <p className="text-xs text-[var(--md-sys-color-on-surface-variant)]">{(Number(m.sizeBytes)/1024/1024).toFixed(1)} MB</p>
                  </div>
                  <button onClick={() => faceMatch.mutate(m.id)} className="p-2 rounded-lg text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-primary)]"><Wand2 className="w-4 h-4" /></button>
                </>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </AppSidebar>
  );
}
```

### 6.6 src/pages/Camera2Cloud.jsx

```jsx
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import AppSidebar from '../components/AppSidebar';
import api from '../lib/api';
import { Camera, Plus, Wifi, WifiOff, Copy, Check, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Camera2Cloud() {
  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState('');
  const [copied, setCopied] = useState('');
  const qc = useQueryClient();

  const { data: cameras } = useQuery({ queryKey: ['cameras'], queryFn: () => api.get('/cameras') });
  const { data: ftpInfo } = useQuery({ queryKey: ['ftp-info'], queryFn: () => api.get('/cameras/ftp-info') });

  const add = useMutation({
    mutationFn: () => api.post('/cameras', { name }),
    onSuccess: () => { qc.invalidateQueries(['cameras']); setShowAdd(false); setName(''); toast.success('Camera added'); },
  });
  const del = useMutation({ mutationFn: id => api.delete(`/cameras/${id}`), onSuccess: () => qc.invalidateQueries(['cameras']) });

  const copy = (text, key) => { navigator.clipboard.writeText(text); setCopied(key); setTimeout(() => setCopied(''), 2000); };
  const CopyBtn = ({ text, id }) => (
    <button onClick={() => copy(text, id)} className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20">
      {copied === id ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5 text-[var(--md-sys-color-on-surface-variant)]" />}
    </button>
  );

  return (
    <AppSidebar>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[var(--md-sys-color-on-surface)]">Camera2Cloud</h1>
            <p className="text-sm text-[var(--md-sys-color-on-surface-variant)] mt-1">Direct FTP upload from camera WiFi</p>
          </div>
          <button onClick={() => setShowAdd(true)} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] font-medium">
            <Plus className="w-4 h-4" /> Add camera
          </button>
        </div>
        <div className="glass-card p-5 border border-[var(--md-sys-color-primary)]/20">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-sm font-medium text-green-400">FTP Server Active</span>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {[['FTP Host', ftpInfo?.host || 'your-server-ip', 'host'], ['Port', ftpInfo?.port || '2121', 'port'], ['Mode', 'Passive (PASV)', 'mode']].map(([label, value, id]) => (
              <div key={label} className="bg-[var(--md-sys-color-surface-container)] rounded-xl p-3">
                <p className="text-xs text-[var(--md-sys-color-on-surface-variant)] mb-1">{label}</p>
                <div className="flex items-center justify-between gap-2">
                  <code className="text-sm font-mono text-[var(--md-sys-color-on-surface)] truncate">{value}</code>
                  <CopyBtn text={value} id={id} />
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="space-y-3">
          {cameras?.map(cam => (
            <div key={cam.id} className="glass-card p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${cam.status === 'ACTIVE' ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
                    {cam.status === 'ACTIVE' ? <Wifi className="w-5 h-5 text-green-400" /> : <WifiOff className="w-5 h-5 text-red-400" />}
                  </div>
                  <div>
                    <p className="font-semibold text-[var(--md-sys-color-on-surface)]">{cam.name}</p>
                    <p className="text-xs text-[var(--md-sys-color-on-surface-variant)]">{cam.uploadCount} photos</p>
                  </div>
                </div>
                <button onClick={() => del.mutate(cam.id)} className="p-2 rounded-lg text-red-400/50 hover:text-red-400"><Trash2 className="w-4 h-4" /></button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[['Username', cam.ftpUsername, `u-${cam.id}`], ['Password', cam.ftpPassword, `p-${cam.id}`]].map(([label, value, id]) => (
                  <div key={label} className="bg-[var(--md-sys-color-surface-container)] rounded-xl p-3">
                    <p className="text-xs text-[var(--md-sys-color-on-surface-variant)] mb-1">{label}</p>
                    <div className="flex items-center justify-between gap-2">
                      <code className="text-sm font-mono text-[var(--md-sys-color-on-surface)] truncate">{value}</code>
                      <CopyBtn text={value} id={id} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        <AnimatePresence>
          {showAdd && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} className="glass-card w-full max-w-sm p-6 space-y-4">
                <h3 className="text-lg font-bold text-[var(--md-sys-color-on-surface)]">Add Camera</h3>
                <input value={name} onChange={e => setName(e.target.value)} placeholder="Sony A7R V — Body 1"
                  className="w-full px-4 py-3 rounded-xl bg-[var(--md-sys-color-surface-container)] border border-white/10 text-[var(--md-sys-color-on-surface)] focus:outline-none focus:ring-2 focus:ring-[var(--md-sys-color-primary)]" />
                <div className="flex gap-3">
                  <button onClick={() => setShowAdd(false)} className="flex-1 py-2.5 rounded-xl bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface-variant)]">Cancel</button>
                  <button onClick={() => add.mutate()} disabled={!name || add.isPending} className="flex-1 py-2.5 rounded-xl bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] font-medium disabled:opacity-50">
                    {add.isPending ? 'Adding…' : 'Add'}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </AppSidebar>
  );
}
```

### 6.7 src/pages/AIFaceRec.jsx

```jsx
import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import AppSidebar from '../components/AppSidebar';
import api from '../lib/api';
import { ScanFace, Play, Users, Image, ChevronDown } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AIFaceRec() {
  const [eventId, setEventId] = useState('');
  const { data: events } = useQuery({ queryKey: ['events'], queryFn: () => api.get('/events') });
  const { data: guests } = useQuery({ queryKey: ['guests', eventId], queryFn: () => api.get(`/guests?eventId=${eventId}`), enabled: !!eventId });
  const { data: media } = useQuery({ queryKey: ['media', eventId], queryFn: () => api.get(`/media?eventId=${eventId}`), enabled: !!eventId });
  const runAll = useMutation({ mutationFn: () => api.post('/media/face-match-all', { eventId }), onSuccess: () => toast.success('Face matching queued') });
  const registered = (guests ?? []).filter(g => g.faceEmbedding);
  const stats = [
    { label: 'Total guests', value: guests?.length ?? '–', icon: Users, color: 'text-blue-400 bg-blue-500/10' },
    { label: 'Faces registered', value: registered.length, icon: ScanFace, color: 'text-green-400 bg-green-500/10' },
    { label: 'Unregistered', value: (guests?.length ?? 0) - registered.length, icon: Users, color: 'text-yellow-400 bg-yellow-500/10' },
    { label: 'Photos total', value: media?.length ?? '–', icon: Image, color: 'text-purple-400 bg-purple-500/10' },
  ];
  return (
    <AppSidebar>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[var(--md-sys-color-on-surface)]">AI Face Recognition</h1>
            <p className="text-sm text-[var(--md-sys-color-on-surface-variant)] mt-1">ArcFace R100 · 512-dim embeddings · cosine similarity ≥ 0.4</p>
          </div>
          <button onClick={() => runAll.mutate()} disabled={!eventId || runAll.isPending}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] font-medium disabled:opacity-50">
            <Play className="w-4 h-4" />{runAll.isPending ? 'Queuing…' : 'Run on all photos'}
          </button>
        </div>
        <div className="relative w-64">
          <select value={eventId} onChange={e => setEventId(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-[var(--md-sys-color-surface-container)] border border-white/10 text-[var(--md-sys-color-on-surface)] appearance-none focus:outline-none focus:ring-2 focus:ring-[var(--md-sys-color-primary)]">
            <option value="">Select event</option>
            {events?.map(ev => <option key={ev.id} value={ev.id}>{ev.name}</option>)}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none text-[var(--md-sys-color-on-surface-variant)]" />
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map(s => (
            <div key={s.label} className="glass-card p-4 flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${s.color}`}><s.icon className="w-5 h-5" /></div>
              <div>
                <p className="text-xl font-bold text-[var(--md-sys-color-on-surface)]">{s.value}</p>
                <p className="text-xs text-[var(--md-sys-color-on-surface-variant)]">{s.label}</p>
              </div>
            </div>
          ))}
        </div>
        {guests?.length > 0 && (
          <div className="glass-card p-5">
            <h3 className="font-semibold text-[var(--md-sys-color-on-surface)] mb-4">Guest Face Status</h3>
            <div className="space-y-2 max-h-72 overflow-y-auto">
              {guests.map(g => (
                <div key={g.id} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                  <div className="flex items-center gap-3">
                    {g.selfieUrl
                      ? <img src={g.selfieUrl} alt="" className="w-8 h-8 rounded-full object-cover" />
                      : <div className="w-8 h-8 rounded-full bg-[var(--md-sys-color-surface-container-high)] flex items-center justify-center text-sm font-bold text-[var(--md-sys-color-on-surface-variant)]">{g.name[0]}</div>
                    }
                    <div>
                      <p className="text-sm font-medium text-[var(--md-sys-color-on-surface)]">{g.name}</p>
                      <p className="text-xs text-[var(--md-sys-color-on-surface-variant)]">{g.photosMatchedCount} photos found</p>
                    </div>
                  </div>
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${g.faceEmbedding ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                    {g.faceEmbedding ? '✓ Registered' : '⚠ No selfie'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
        <div className="glass-card p-5">
          <h3 className="font-semibold text-[var(--md-sys-color-on-surface)] mb-4">How it works</h3>
          <div className="grid grid-cols-4 gap-4">
            {[['01','Selfie','Guest registers via WhatsApp or gallery'],['02','Embed','ArcFace converts selfie to 512-dim vector'],['03','Scan','Each photo scanned, all faces detected'],['04','Match','Cosine similarity > 0.4 links photo to guest']].map(([step,title,desc]) => (
              <div key={step} className="text-center">
                <div className="w-10 h-10 rounded-xl bg-[var(--md-sys-color-primary-container)] flex items-center justify-center mx-auto mb-2">
                  <span className="text-xs font-bold text-[var(--md-sys-color-on-primary-container)]">{step}</span>
                </div>
                <p className="text-sm font-medium text-[var(--md-sys-color-on-surface)]">{title}</p>
                <p className="text-xs text-[var(--md-sys-color-on-surface-variant)] mt-1">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppSidebar>
  );
}
```

### 6.8 src/pages/AIEditing.jsx

```jsx
import { useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery, useMutation } from '@tanstack/react-query';
import AppSidebar from '../components/AppSidebar';
import api from '../lib/api';
import { Wand2, ChevronDown } from 'lucide-react';
import toast from 'react-hot-toast';

const PRESETS = [
  { id: 'moody', label: 'Moody', preview: '🌑', desc: 'Deep shadows, rich tones' },
  { id: 'airy', label: 'Airy', preview: '☁️', desc: 'Bright, soft, minimal contrast' },
  { id: 'film', label: 'Film', preview: '🎞', desc: 'Faded highlights, warm shadows' },
  { id: 'bw', label: 'B&W', preview: '◐', desc: 'High-contrast monochrome' },
  { id: 'golden', label: 'Golden Hour', preview: '🌅', desc: 'Warm amber glow' },
  { id: 'cool', label: 'Cool Tones', preview: '❄️', desc: 'Blue-tinted, cinematic' },
  { id: 'auto', label: 'Auto Enhance', preview: '✨', desc: 'AI brightness + contrast' },
];

export default function AIEditing() {
  const [eventId, setEventId] = useState('');
  const [preset, setPreset] = useState('');
  const { data: events } = useQuery({ queryKey: ['events'], queryFn: () => api.get('/events') });
  const { data: media } = useQuery({ queryKey: ['media', eventId], queryFn: () => api.get(`/media?eventId=${eventId}`), enabled: !!eventId });
  const batch = useMutation({
    mutationFn: () => api.post('/media/ai-edit-batch', { eventId, preset }),
    onSuccess: () => toast.success(`AI editing queued for ${media?.length} photos`),
    onError: () => toast.error('Failed to queue'),
  });
  return (
    <AppSidebar>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-[var(--md-sys-color-on-surface)]">AI Photo Editing</h1>
          <p className="text-sm text-[var(--md-sys-color-on-surface-variant)] mt-1">3D LUT processing · Sharp.js · batch mode · originals preserved</p>
        </div>
        <div className="relative w-64">
          <select value={eventId} onChange={e => setEventId(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-[var(--md-sys-color-surface-container)] border border-white/10 text-[var(--md-sys-color-on-surface)] appearance-none focus:outline-none focus:ring-2 focus:ring-[var(--md-sys-color-primary)]">
            <option value="">Select event</option>
            {events?.map(ev => <option key={ev.id} value={ev.id}>{ev.name}</option>)}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none text-[var(--md-sys-color-on-surface-variant)]" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
          {PRESETS.map(p => (
            <button key={p.id} onClick={() => setPreset(p.id)}
              className={`glass-card p-3 text-center transition-all ${preset === p.id ? 'ring-2 ring-[var(--md-sys-color-primary)]' : 'hover:bg-white/5'}`}>
              <div className="text-2xl mb-1">{p.preview}</div>
              <p className="text-xs font-semibold text-[var(--md-sys-color-on-surface)]">{p.label}</p>
              <p className="text-[10px] text-[var(--md-sys-color-on-surface-variant)] mt-0.5 leading-tight">{p.desc}</p>
            </button>
          ))}
        </div>
        {eventId && preset && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            className="glass-card p-5 flex items-center justify-between">
            <div>
              <p className="font-medium text-[var(--md-sys-color-on-surface)]">
                Apply <span className="text-[var(--md-sys-color-primary)]">{PRESETS.find(p => p.id === preset)?.label}</span>
              </p>
              <p className="text-sm text-[var(--md-sys-color-on-surface-variant)]">{media?.length ?? 0} photos · originals preserved</p>
            </div>
            <button onClick={() => batch.mutate()} disabled={batch.isPending}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] font-medium disabled:opacity-50">
              <Wand2 className="w-4 h-4" />{batch.isPending ? 'Queuing…' : 'Run batch'}
            </button>
          </motion.div>
        )}
      </div>
    </AppSidebar>
  );
}
```

### 6.9 src/pages/WhatsAppBot.jsx

```jsx
import { useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery, useMutation } from '@tanstack/react-query';
import AppSidebar from '../components/AppSidebar';
import api from '../lib/api';
import { MessageCircle, Send, ChevronDown } from 'lucide-react';
import toast from 'react-hot-toast';

const TEMPLATES = [
  { id: 'GALLERY_READY', label: 'Gallery Ready', icon: '🖼', desc: 'Send guests their personal gallery link' },
  { id: 'SELFIE_REQUEST', label: 'Selfie Request', icon: '🤳', desc: 'Ask guests to register their face' },
  { id: 'SELECTION_REMINDER', label: 'Selection Reminder', icon: '⭐', desc: 'Remind guests to pick favourites' },
  { id: 'DELIVERY_READY', label: 'Delivery Ready', icon: '📦', desc: 'Notify photos are ready to download' },
  { id: 'ORDER_CONFIRMED', label: 'Order Confirmed', icon: '🖨', desc: 'Print order confirmation' },
];

export default function WhatsAppBot() {
  const [eventId, setEventId] = useState('');
  const [template, setTemplate] = useState('');
  const [tab, setTab] = useState('send');
  const { data: events } = useQuery({ queryKey: ['events'], queryFn: () => api.get('/events') });
  const { data: stats } = useQuery({ queryKey: ['wa-stats', eventId], queryFn: () => api.get(`/whatsapp/stats?eventId=${eventId}`), enabled: !!eventId });
  const { data: msgs } = useQuery({ queryKey: ['wa-msgs', eventId], queryFn: () => api.get(`/whatsapp/messages?eventId=${eventId}`), enabled: !!eventId && tab === 'history' });
  const send = useMutation({
    mutationFn: () => api.post('/whatsapp/send', { eventId, type: template, guestIds: 'all' }),
    onSuccess: d => toast.success(`${d.queued} messages queued`),
    onError: () => toast.error('Failed to queue'),
  });
  const STATUS_COLOR = { QUEUED: 'text-yellow-400', SENT: 'text-blue-400', DELIVERED: 'text-blue-400', READ: 'text-green-400', FAILED: 'text-red-400' };
  return (
    <AppSidebar>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[var(--md-sys-color-on-surface)]">WhatsApp Bot</h1>
            <p className="text-sm text-[var(--md-sys-color-on-surface-variant)] mt-1">Meta Cloud API · auto-delivery · read receipts</p>
          </div>
          <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" /><span className="text-sm text-green-400 font-medium">Connected</span></div>
        </div>
        <div className="relative w-64">
          <select value={eventId} onChange={e => setEventId(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-[var(--md-sys-color-surface-container)] border border-white/10 text-[var(--md-sys-color-on-surface)] appearance-none focus:outline-none focus:ring-2 focus:ring-[var(--md-sys-color-primary)]">
            <option value="">Select event</option>
            {events?.map(ev => <option key={ev.id} value={ev.id}>{ev.name}</option>)}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none text-[var(--md-sys-color-on-surface-variant)]" />
        </div>
        {stats && (
          <div className="grid grid-cols-4 gap-4">
            {[['Sent', stats.sent, 'text-blue-400'],['Delivered', stats.delivered, 'text-blue-400'],['Read', stats.read, 'text-green-400'],['Failed', stats.failed, 'text-red-400']].map(([label, val, color]) => (
              <div key={label} className="glass-card p-4 text-center">
                <p className={`text-2xl font-bold ${color}`}>{val}</p>
                <p className="text-xs text-[var(--md-sys-color-on-surface-variant)] mt-1">{label}</p>
              </div>
            ))}
          </div>
        )}
        <div className="flex gap-1 p-1 bg-[var(--md-sys-color-surface-container)] rounded-xl w-fit">
          {['send','history'].map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-lg text-sm font-medium capitalize ${tab === t ? 'bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)]' : 'text-[var(--md-sys-color-on-surface-variant)]'}`}>{t}</button>
          ))}
        </div>
        {tab === 'send' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {TEMPLATES.map(t => (
                <button key={t.id} onClick={() => setTemplate(t.id)}
                  className={`glass-card p-4 text-left transition-all ${template === t.id ? 'ring-2 ring-[var(--md-sys-color-primary)]' : 'hover:bg-white/5'}`}>
                  <div className="text-2xl mb-2">{t.icon}</div>
                  <p className="font-medium text-[var(--md-sys-color-on-surface)]">{t.label}</p>
                  <p className="text-xs text-[var(--md-sys-color-on-surface-variant)] mt-1">{t.desc}</p>
                </button>
              ))}
            </div>
            {template && eventId && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                className="glass-card p-4 flex items-center justify-between">
                <p className="font-medium text-[var(--md-sys-color-on-surface)]">Send to all guests</p>
                <button onClick={() => send.mutate()} disabled={send.isPending}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-green-600 text-white font-medium disabled:opacity-50">
                  <Send className="w-4 h-4" />{send.isPending ? 'Sending…' : 'Send now'}
                </button>
              </motion.div>
            )}
          </div>
        )}
        {tab === 'history' && (
          <div className="space-y-2">
            {msgs?.map(m => (
              <div key={m.id} className="glass-card p-4 flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center"><MessageCircle className="w-5 h-5 text-green-400" /></div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[var(--md-sys-color-on-surface)]">{m.guest?.name ?? m.phone}</p>
                  <p className="text-xs text-[var(--md-sys-color-on-surface-variant)]">{m.type} · {new Date(m.createdAt).toLocaleString()}</p>
                </div>
                <span className={`text-xs font-medium ${STATUS_COLOR[m.status]}`}>{m.status}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppSidebar>
  );
}
```

### 6.10 src/pages/WhiteLabel.jsx

```jsx
import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import AppSidebar from '../components/AppSidebar';
import api from '../lib/api';
import { Palette, Globe, Check } from 'lucide-react';
import toast from 'react-hot-toast';

const FONTS = ['Inter', 'Playfair Display', 'Cormorant Garamond', 'Josefin Sans', 'Montserrat'];

export default function WhiteLabel() {
  const { data: me } = useQuery({ queryKey: ['me'], queryFn: () => api.get('/auth/me') });
  const [form, setForm] = useState({ primaryColor: '#6750A4', accentColor: '#625B71', fontFamily: 'Inter', customDomain: '' });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (me?.studio) setForm({ primaryColor: me.studio.primaryColor || '#6750A4', accentColor: me.studio.accentColor || '#625B71', fontFamily: me.studio.fontFamily || 'Inter', customDomain: me.studio.customDomain || '' });
  }, [me]);

  const save = useMutation({
    mutationFn: () => api.patch('/studio/branding', form),
    onSuccess: () => { setSaved(true); setTimeout(() => setSaved(false), 2000); toast.success('Branding saved'); },
  });

  return (
    <AppSidebar>
      <div className="p-6 space-y-6 max-w-2xl">
        <div>
          <h1 className="text-2xl font-bold text-[var(--md-sys-color-on-surface)]">White Label</h1>
          <p className="text-sm text-[var(--md-sys-color-on-surface-variant)] mt-1">Customise your guest gallery with your brand</p>
        </div>
        <div className="glass-card p-5 space-y-4">
          <div className="flex items-center gap-2 mb-1"><Palette className="w-5 h-5 text-[var(--md-sys-color-primary)]" /><h3 className="font-semibold text-[var(--md-sys-color-on-surface)]">Brand Colours</h3></div>
          <div className="grid grid-cols-2 gap-4">
            {[['primaryColor','Primary colour'],['accentColor','Accent colour']].map(([key, label]) => (
              <div key={key} className="space-y-2">
                <label className="text-sm font-medium text-[var(--md-sys-color-on-surface)]">{label}</label>
                <div className="flex items-center gap-3">
                  <input type="color" value={form[key]} onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))} className="w-12 h-12 rounded-xl cursor-pointer border-0 bg-transparent" />
                  <input value={form[key]} onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))} className="flex-1 px-3 py-2.5 rounded-xl bg-[var(--md-sys-color-surface-container)] border border-white/10 text-[var(--md-sys-color-on-surface)] font-mono text-sm focus:outline-none focus:ring-2 focus:ring-[var(--md-sys-color-primary)]" />
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="glass-card p-5">
          <h3 className="font-semibold text-[var(--md-sys-color-on-surface)] mb-4">Typography</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {FONTS.map(f => (
              <button key={f} onClick={() => setForm(p => ({ ...p, fontFamily: f }))} style={{ fontFamily: f }}
                className={`p-3 rounded-xl text-sm text-left ${form.fontFamily === f ? 'ring-2 ring-[var(--md-sys-color-primary)] bg-[var(--md-sys-color-primary-container)]/20 text-[var(--md-sys-color-on-surface)]' : 'bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface-variant)]'}`}>{f}</button>
            ))}
          </div>
        </div>
        <div className="glass-card p-5">
          <div className="flex items-center gap-2 mb-3"><Globe className="w-5 h-5 text-[var(--md-sys-color-primary)]" /><h3 className="font-semibold text-[var(--md-sys-color-on-surface)]">Custom Domain</h3></div>
          <input value={form.customDomain} onChange={e => setForm(p => ({ ...p, customDomain: e.target.value }))} placeholder="gallery.yourphotography.com"
            className="w-full px-4 py-3 rounded-xl bg-[var(--md-sys-color-surface-container)] border border-white/10 text-[var(--md-sys-color-on-surface)] focus:outline-none focus:ring-2 focus:ring-[var(--md-sys-color-primary)]" />
          <p className="text-xs text-[var(--md-sys-color-on-surface-variant)] mt-2">Add a CNAME → <code className="text-[var(--md-sys-color-primary)]">gallery.eventra.ai</code> with your DNS provider</p>
        </div>
        <button onClick={() => save.mutate()} disabled={save.isPending}
          className="flex items-center gap-2 px-6 py-3 rounded-xl bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] font-semibold disabled:opacity-50">
          {saved && <Check className="w-4 h-4" />}{save.isPending ? 'Saving…' : saved ? 'Saved!' : 'Save branding'}
        </button>
      </div>
    </AppSidebar>
  );
}
```

### 6.11 src/pages/Billing.jsx

```jsx
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import AppSidebar from '../components/AppSidebar';
import api from '../lib/api';
import { Check, Crown } from 'lucide-react';

const PLANS = [
  { tier: 'FREE', price: '₹0', period: '/mo', storage: '10 GB', events: '1', guests: '100', ai: '50' },
  { tier: 'MINI', price: '₹999', period: '/mo', storage: '100 GB', events: '5', guests: '500', ai: '500' },
  { tier: 'SMALL', price: '₹2,499', period: '/mo', storage: '300 GB', events: '15', guests: '2,000', ai: '2,000', hot: true },
  { tier: 'MID', price: '₹4,999', period: '/mo', storage: '750 GB', events: '40', guests: '10,000', ai: '10,000' },
  { tier: 'LARGE', price: '₹9,999', period: '/mo', storage: '2 TB', events: '150', guests: '50,000', ai: 'Unlimited' },
  { tier: 'ENTERPRISE', price: 'Custom', period: '', storage: 'Custom', events: '∞', guests: '∞', ai: '∞' },
];

export default function Billing() {
  const { data: me } = useQuery({ queryKey: ['me'], queryFn: () => api.get('/auth/me') });
  const current = me?.studio?.planTier || 'FREE';

  async function upgrade(tier) {
    if (tier === 'ENTERPRISE') { window.open('mailto:sales@eventra.ai'); return; }
    const res = await api.post('/billing/upgrade', { tier });
    if (res.checkoutUrl) window.location.href = res.checkoutUrl;
  }

  return (
    <AppSidebar>
      <div className="p-6 space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-[var(--md-sys-color-on-surface)]">Choose your plan</h1>
          <p className="text-[var(--md-sys-color-on-surface-variant)] mt-2">Currently on <span className="text-[var(--md-sys-color-primary)] font-semibold">{current}</span></p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {PLANS.map(plan => (
            <motion.div key={plan.tier} whileHover={{ y: -4 }} className={`glass-card p-6 relative ${plan.hot ? 'ring-2 ring-[var(--md-sys-color-primary)]' : ''}`}>
              {plan.hot && <div className="absolute -top-3 left-1/2 -translate-x-1/2"><span className="px-3 py-1 rounded-full bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] text-xs font-bold">Most Popular</span></div>}
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-1">
                  {plan.tier === 'ENTERPRISE' && <Crown className="w-4 h-4 text-yellow-400" />}
                  <h3 className="font-bold text-[var(--md-sys-color-on-surface)]">{plan.tier}</h3>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold text-[var(--md-sys-color-on-surface)]">{plan.price}</span>
                  <span className="text-sm text-[var(--md-sys-color-on-surface-variant)]">{plan.period}</span>
                </div>
              </div>
              <ul className="space-y-2 mb-6">
                {[['Storage', plan.storage],['Events', plan.events],['Guests', plan.guests],['AI edits', plan.ai]].map(([label, val]) => (
                  <li key={label} className="flex items-center gap-2 text-sm text-[var(--md-sys-color-on-surface-variant)]">
                    <Check className="w-4 h-4 text-green-400 shrink-0" />
                    <span><strong className="text-[var(--md-sys-color-on-surface)]">{val}</strong> {label}</span>
                  </li>
                ))}
              </ul>
              <button onClick={() => upgrade(plan.tier)} disabled={current === plan.tier}
                className={`w-full py-2.5 rounded-xl font-medium text-sm ${current === plan.tier ? 'bg-green-500/20 text-green-400 cursor-default' : plan.hot ? 'bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)]' : 'bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface)] hover:bg-white/10'}`}>
                {current === plan.tier ? '✓ Current plan' : plan.tier === 'ENTERPRISE' ? 'Contact sales' : `Upgrade to ${plan.tier}`}
              </button>
            </motion.div>
          ))}
        </div>
      </div>
    </AppSidebar>
  );
}
```

### 6.12 src/pages/GuestGallery.jsx (Public — no auth, no AppSidebar)

```jsx
import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation } from '@tanstack/react-query';
import api from '../lib/api';
import { Heart, Star, Download, X, ScanFace, Share2 } from 'lucide-react';

export default function GuestGallery() {
  const { slug, token } = useParams();
  const [selected, setSelected] = useState(null);
  const [selfieMode, setSelfieMode] = useState(false);
  const videoRef = useRef(null);
  const [stream, setStream] = useState(null);

  const { data: gallery } = useQuery({
    queryKey: ['gallery', slug, token],
    queryFn: () => token ? api.get(`/gallery/${slug}/guest/${token}`) : api.get(`/gallery/${slug}`),
  });

  const selectPhoto = useMutation({
    mutationFn: ({ mediaId, type }) => api.post(`/gallery/${slug}/select`, { mediaId, selectionType: type, token }),
  });

  useEffect(() => {
    const es = new EventSource(`/api/gallery/${slug}/stream`);
    return () => es.close();
  }, [slug]);

  async function startCamera() {
    const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
    setStream(s); if (videoRef.current) videoRef.current.srcObject = s; setSelfieMode(true);
  }

  async function captureSelfie() {
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth; canvas.height = videoRef.current.videoHeight;
    canvas.getContext('2d').drawImage(videoRef.current, 0, 0);
    canvas.toBlob(async blob => {
      const fd = new FormData(); fd.append('selfie', blob, 'selfie.jpg'); if (token) fd.append('token', token);
      await api.post(`/gallery/${slug}/selfie`, fd);
      stream?.getTracks().forEach(t => t.stop()); setSelfieMode(false);
    }, 'image/jpeg', 0.9);
  }

  const brand = gallery?.studio;
  const primary = brand?.primaryColor || '#6750A4';

  return (
    <div className="min-h-screen bg-[#0a0a0a]" style={{ fontFamily: brand?.fontFamily || 'Inter' }}>
      <div className="sticky top-0 z-10 bg-[#0a0a0a]/90 backdrop-blur-sm border-b border-white/5 px-4 py-3 flex items-center justify-between">
        {brand?.logoUrl ? <img src={brand.logoUrl} alt="" className="h-8" /> : <span className="font-bold text-white">{brand?.name}</span>}
        <div className="flex items-center gap-2">
          {!token && (
            <button onClick={startCamera} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-white" style={{ backgroundColor: primary }}>
              <ScanFace className="w-4 h-4" /> Find my photos
            </button>
          )}
          <button className="p-2 rounded-xl bg-white/10 text-white"><Share2 className="w-4 h-4" /></button>
        </div>
      </div>
      {gallery?.event && (
        <div className="px-4 py-6 text-center">
          <h1 className="text-2xl font-bold text-white">{gallery.event.name}</h1>
          {token && gallery.guest && <p className="text-white/60 mt-1 text-sm">Your photos · {gallery.media?.length} matched</p>}
        </div>
      )}
      <AnimatePresence>
        {selfieMode && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 z-50 flex flex-col items-center justify-center gap-4 p-4">
            <p className="text-white text-lg font-semibold">Take a selfie to find your photos</p>
            <div className="w-64 h-64 rounded-full overflow-hidden border-4 border-white/30">
              <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover scale-x-[-1]" />
            </div>
            <div className="flex gap-3">
              <button onClick={() => { stream?.getTracks().forEach(t => t.stop()); setSelfieMode(false); }} className="px-5 py-3 rounded-full bg-white/20 text-white">Cancel</button>
              <button onClick={captureSelfie} className="px-8 py-3 rounded-full text-white font-bold" style={{ backgroundColor: primary }}>Take selfie</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <div className="px-2 pb-8">
        <div className="columns-2 sm:columns-3 md:columns-4 gap-2 space-y-2">
          {gallery?.media?.map(photo => (
            <motion.div key={photo.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="break-inside-avoid relative group cursor-pointer rounded-xl overflow-hidden"
              onClick={() => setSelected(photo)}>
              <img src={photo.thumbnailUrl || photo.originalUrl} alt="" className="w-full rounded-xl object-cover" loading="lazy" />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-end justify-end p-2">
                <button onClick={e => { e.stopPropagation(); selectPhoto.mutate({ mediaId: photo.id, type: 'FAVORITED' }); }}
                  className="p-2 rounded-lg bg-white/20 text-white"><Heart className="w-4 h-4" /></button>
              </div>
            </motion.div>
          ))}
        </div>
        {!gallery?.media?.length && <div className="text-center py-20 text-white/40"><p className="text-lg">No photos yet</p></div>}
      </div>
      <AnimatePresence>
        {selected && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4" onClick={() => setSelected(null)}>
            <motion.img src={selected.editedUrl || selected.originalUrl} alt="" initial={{ scale: 0.8 }} animate={{ scale: 1 }}
              className="max-w-full max-h-full rounded-xl object-contain" onClick={e => e.stopPropagation()} />
            <div className="absolute top-4 right-4 flex gap-2">
              <button onClick={() => selectPhoto.mutate({ mediaId: selected.id, type: 'SELECTED' })} className="p-3 rounded-xl bg-white/20 text-white"><Star className="w-5 h-5" /></button>
              <a href={selected.originalUrl} download className="p-3 rounded-xl bg-white/20 text-white"><Download className="w-5 h-5" /></a>
              <button onClick={() => setSelected(null)} className="p-3 rounded-xl bg-white/20 text-white"><X className="w-5 h-5" /></button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
```

### 6.13 src/App.jsx — Complete Route Configuration

```jsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Toaster } from 'react-hot-toast';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import Events from './pages/Events';
import EventDetail from './pages/EventDetail';
import SubEventManager from './pages/SubEventManager';
import Guests from './pages/Guests';
import MediaLibrary from './pages/MediaLibrary';
import Camera2Cloud from './pages/Camera2Cloud';
import AIFaceRec from './pages/AIFaceRec';
import AIEditing from './pages/AIEditing';
import ClientProofing from './pages/ClientProofing';
import WhatsAppBot from './pages/WhatsAppBot';
import InviteBuilder from './pages/InviteBuilder';
import GuestGallery from './pages/GuestGallery';
import QRCodeManager from './pages/QRCodeManager';
import LiveSlideshow from './pages/LiveSlideshow';
import WhiteLabel from './pages/WhiteLabel';
import PrintStore from './pages/PrintStore';
import Analytics from './pages/Analytics';
import TeamManagement from './pages/TeamManagement';
import StorageManager from './pages/StorageManager';
import Billing from './pages/Billing';

const qc = new QueryClient({ defaultOptions: { queries: { retry: 1, staleTime: 30_000 } } });

function Guard({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-2 border-[var(--md-sys-color-primary)] border-t-transparent rounded-full animate-spin" /></div>;
  return user ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <QueryClientProvider client={qc}>
      <AuthProvider>
        <BrowserRouter>
          <Toaster position="top-right" toastOptions={{ style: { background: '#1e1e2e', color: '#cdd6f4', border: '1px solid rgba(255,255,255,0.1)' } }} />
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/gallery/:slug" element={<GuestGallery />} />
            <Route path="/gallery/:slug/guest/:token" element={<GuestGallery />} />
            <Route path="*" element={<Guard><Routes>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/events" element={<Events />} />
              <Route path="/events/:id" element={<EventDetail />} />
              <Route path="/subevents" element={<SubEventManager />} />
              <Route path="/guests" element={<Guests />} />
              <Route path="/media" element={<MediaLibrary />} />
              <Route path="/camera2cloud" element={<Camera2Cloud />} />
              <Route path="/ai-face" element={<AIFaceRec />} />
              <Route path="/ai-editing" element={<AIEditing />} />
              <Route path="/clientproofing" element={<ClientProofing />} />
              <Route path="/whatsapp" element={<WhatsAppBot />} />
              <Route path="/invites" element={<InviteBuilder />} />
              <Route path="/qrcodes" element={<QRCodeManager />} />
              <Route path="/slideshow" element={<LiveSlideshow />} />
              <Route path="/whitelabel" element={<WhiteLabel />} />
              <Route path="/printstore" element={<PrintStore />} />
              <Route path="/analytics" element={<Analytics />} />
              <Route path="/team" element={<TeamManagement />} />
              <Route path="/storage" element={<StorageManager />} />
              <Route path="/billing" element={<Billing />} />
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
            </Routes></Guard>} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}
```

### 6.14 Updated AppSidebar navGroups (add new routes)

```jsx
// In AppSidebar.jsx — replace navGroups with this
const navGroups = [
  { label: 'Events', items: [
    { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/events', icon: Calendar, label: 'Events' },
    { path: '/subevents', icon: Layers, label: 'Sub-Events' },
    { path: '/qrcodes', icon: QrCode, label: 'QR Codes' },
    { path: '/slideshow', icon: Monitor, label: 'Live Slideshow' },
  ]},
  { label: 'Media', items: [
    { path: '/media', icon: Image, label: 'Media Library' },
    { path: '/camera2cloud', icon: Camera, label: 'Camera2Cloud' },
    { path: '/ai-face', icon: ScanFace, label: 'AI Face Rec.' },
    { path: '/ai-editing', icon: Wand2, label: 'AI Editing' },
    { path: '/clientproofing', icon: CheckSquare, label: 'Client Proofing' },
  ]},
  { label: 'Guests', items: [
    { path: '/guests', icon: Users, label: 'Guests' },
    { path: '/whatsapp', icon: MessageCircle, label: 'WhatsApp Bot' },
    { path: '/invites', icon: Mail, label: 'Invite Builder' },
  ]},
  { label: 'Business', items: [
    { path: '/whitelabel', icon: Palette, label: 'White Label' },
    { path: '/printstore', icon: Printer, label: 'Print Store' },
    { path: '/analytics', icon: BarChart2, label: 'Analytics' },
    { path: '/team', icon: UserPlus, label: 'Team' },
    { path: '/storage', icon: HardDrive, label: 'Storage' },
    { path: '/billing', icon: CreditCard, label: 'Billing' },
  ]},
];
```


---

## 7. Backend — Complete Route Implementations

### 7.1 backend/src/index.js

```js
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { createServer } from 'http';
import { Server } from 'socket.io';
import 'dotenv/config';

import authRouter from './routes/auth.js';
import eventsRouter from './routes/events.js';
import subEventsRouter from './routes/subEvents.js';
import guestsRouter from './routes/guests.js';
import mediaRouter from './routes/media.js';
import camerasRouter from './routes/cameras.js';
import whatsappRouter from './routes/whatsapp.js';
import analyticsRouter from './routes/analytics.js';
import invitesRouter from './routes/invites.js';
import qrRouter from './routes/qr.js';
import teamRouter from './routes/team.js';
import storageRouter from './routes/storage.js';
import storeRouter from './routes/store.js';
import pixelsRouter from './routes/pixels.js';
import billingRouter from './routes/billing.js';
import galleryRouter from './routes/gallery.js';
import studioRouter from './routes/studio.js';
import { setupSocket } from './socket.js';
import { startFtpServer } from './ftpServer.js';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, { cors: { origin: process.env.FRONTEND_URL, credentials: true } });

app.set('trust proxy', 1);
app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_URL, credentials: true }));
app.use(express.json({ limit: '10mb' }));

const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 200 });
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 10, message: { error: 'Too many attempts' } });

app.use('/api/auth', authLimiter, authRouter);
app.use('/api/events', eventsRouter);
app.use('/api/events', subEventsRouter);
app.use('/api/guests', guestsRouter);
app.use('/api/media', mediaRouter);
app.use('/api/cameras', camerasRouter);
app.use('/api/whatsapp', whatsappRouter);
app.use('/api/analytics', analyticsRouter);
app.use('/api/invites', invitesRouter);
app.use('/api/qr', qrRouter);
app.use('/api/team', teamRouter);
app.use('/api/storage', storageRouter);
app.use('/api/store', storeRouter);
app.use('/api/pixels', pixelsRouter);
app.use('/api/billing', billingRouter);
app.use('/api/gallery', galleryRouter);
app.use('/api/studio', studioRouter);
app.use(limiter);

app.get('/health', async (req, res) => {
  res.json({ status: 'ok', ts: new Date().toISOString() });
});

app.use((req, res) => res.status(404).json({ error: 'Not found' }));
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: process.env.NODE_ENV === 'production' ? 'Internal error' : err.message });
});

setupSocket(io);

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`API running on :${PORT}`);
  startFtpServer();
});
```

### 7.2 backend/src/middleware/auth.js

```js
import jwt from 'jsonwebtoken';

export function authenticate(req, res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) return res.status(401).json({ error: 'Missing token' });
  try {
    req.user = jwt.verify(header.slice(7), process.env.JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user?.role)) return res.status(403).json({ error: 'Insufficient permissions' });
    next();
  };
}
```

### 7.3 backend/src/middleware/planCheck.js

```js
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const PLAN_LIMITS = {
  FREE:       { events: 1,   guests: 100,    aiEdits: 50,    storageGB: 10 },
  MINI:       { events: 5,   guests: 500,    aiEdits: 500,   storageGB: 100 },
  SMALL:      { events: 15,  guests: 2000,   aiEdits: 2000,  storageGB: 300 },
  MID:        { events: 40,  guests: 10000,  aiEdits: 10000, storageGB: 750 },
  LARGE:      { events: 150, guests: 50000,  aiEdits: null,  storageGB: 2048 },
  ENTERPRISE: { events: null, guests: null,  aiEdits: null,  storageGB: null },
};

export function checkPlanLimit(resource) {
  return async (req, res, next) => {
    const studio = await prisma.studio.findUnique({ where: { ownerId: req.user.userId } });
    const limits = PLAN_LIMITS[studio.planTier];
    const limit = limits[resource];
    if (limit !== null && studio[`${resource}Used`] >= limit) {
      return res.status(402).json({
        error: `Plan limit reached: ${resource}`,
        current: studio[`${resource}Used`],
        limit,
        upgradeUrl: '/billing',
      });
    }
    req.studio = studio;
    next();
  };
}
```

### 7.4 backend/src/routes/auth.js

```js
import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { authenticate } from '../middleware/auth.js';

const router = Router();
const prisma = new PrismaClient();

const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(1),
  studioName: z.string().min(1),
});

function signToken(userId) {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '15m' });
}

function signRefresh(userId) {
  return jwt.sign({ userId }, process.env.REFRESH_TOKEN_SECRET, { expiresIn: '7d' });
}

router.post('/signup', async (req, res) => {
  const result = signupSchema.safeParse(req.body);
  if (!result.success) return res.status(400).json({ error: result.error.flatten() });
  const { email, password, name, studioName } = result.data;

  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) return res.status(409).json({ error: 'Email already registered' });

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({ data: { email, name, passwordHash } });

  const slug = studioName.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Date.now().toString(36);
  const studio = await prisma.studio.create({ data: { ownerId: user.id, name: studioName, slug } });

  const token = signToken(user.id);
  const refresh = signRefresh(user.id);
  await prisma.session.create({ data: { userId: user.id, token: refresh, expiresAt: new Date(Date.now() + 7*24*60*60*1000) } });

  res.cookie('refresh', refresh, { httpOnly: true, sameSite: 'strict', secure: process.env.NODE_ENV === 'production', maxAge: 7*24*60*60*1000 });
  res.status(201).json({ token, user: { id: user.id, email: user.email, name: user.name }, studio });
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !await bcrypt.compare(password, user.passwordHash))
    return res.status(401).json({ error: 'Invalid credentials' });

  const studio = await prisma.studio.findUnique({ where: { ownerId: user.id } });
  const token = signToken(user.id);
  const refresh = signRefresh(user.id);
  await prisma.session.create({ data: { userId: user.id, token: refresh, expiresAt: new Date(Date.now() + 7*24*60*60*1000) } });

  res.cookie('refresh', refresh, { httpOnly: true, sameSite: 'strict', secure: process.env.NODE_ENV === 'production', maxAge: 7*24*60*60*1000 });
  res.json({ token, user: { id: user.id, email: user.email, name: user.name }, studio });
});

router.post('/refresh', async (req, res) => {
  const refresh = req.cookies?.refresh;
  if (!refresh) return res.status(401).json({ error: 'No refresh token' });
  try {
    const payload = jwt.verify(refresh, process.env.REFRESH_TOKEN_SECRET);
    const session = await prisma.session.findUnique({ where: { token: refresh } });
    if (!session || session.expiresAt < new Date()) return res.status(401).json({ error: 'Session expired' });
    const token = signToken(payload.userId);
    res.json({ token });
  } catch {
    res.status(401).json({ error: 'Invalid refresh token' });
  }
});

router.post('/logout', async (req, res) => {
  const refresh = req.cookies?.refresh;
  if (refresh) await prisma.session.deleteMany({ where: { token: refresh } }).catch(() => {});
  res.clearCookie('refresh');
  res.status(204).end();
});

router.get('/me', authenticate, async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.user.userId }, select: { id: true, email: true, name: true, avatarUrl: true } });
  const studio = await prisma.studio.findUnique({ where: { ownerId: req.user.userId } });
  res.json({ user, studio });
});

export default router;
```

### 7.5 backend/src/routes/events.js

```js
import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate } from '../middleware/auth.js';
import { checkPlanLimit } from '../middleware/planCheck.js';
import { nanoid } from 'nanoid';

const router = Router();
const prisma = new PrismaClient();

router.get('/', authenticate, async (req, res) => {
  const studio = await prisma.studio.findUnique({ where: { ownerId: req.user.userId } });
  const { status, type } = req.query;
  const events = await prisma.event.findMany({
    where: { studioId: studio.id, ...(status && { status }), ...(type && { type }) },
    orderBy: { startDate: 'desc' },
    include: { _count: { select: { guests: true, media: true, subEvents: true } } },
  });
  res.json(events);
});

router.post('/', authenticate, checkPlanLimit('events'), async (req, res) => {
  const studio = req.studio;
  const { name, type, startDate, endDate, venue, description } = req.body;
  if (!name || !startDate) return res.status(400).json({ error: 'name and startDate required' });

  const event = await prisma.event.create({
    data: {
      studioId: studio.id,
      name,
      type: type || 'WEDDING',
      startDate: new Date(startDate),
      endDate: endDate ? new Date(endDate) : null,
      venue,
      description,
      gallerySlug: nanoid(8),
    },
  });
  await prisma.studio.update({ where: { id: studio.id }, data: { eventsUsed: { increment: 1 } } });
  res.status(201).json(event);
});

router.get('/:id', authenticate, async (req, res) => {
  const studio = await prisma.studio.findUnique({ where: { ownerId: req.user.userId } });
  const event = await prisma.event.findFirst({
    where: { id: req.params.id, studioId: studio.id },
    include: { subEvents: { orderBy: { sortOrder: 'asc' } }, _count: { select: { guests: true, media: true, subEvents: true } } },
  });
  if (!event) return res.status(404).json({ error: 'Event not found' });
  res.json(event);
});

router.patch('/:id', authenticate, async (req, res) => {
  const studio = await prisma.studio.findUnique({ where: { ownerId: req.user.userId } });
  const event = await prisma.event.findFirst({ where: { id: req.params.id, studioId: studio.id } });
  if (!event) return res.status(404).json({ error: 'Event not found' });
  const allowed = ['name','type','status','startDate','endDate','venue','description','coverPhotoUrl'];
  const data = Object.fromEntries(Object.entries(req.body).filter(([k]) => allowed.includes(k)));
  if (data.startDate) data.startDate = new Date(data.startDate);
  if (data.endDate) data.endDate = new Date(data.endDate);
  res.json(await prisma.event.update({ where: { id: req.params.id }, data }));
});

router.delete('/:id', authenticate, async (req, res) => {
  const studio = await prisma.studio.findUnique({ where: { ownerId: req.user.userId } });
  const event = await prisma.event.findFirst({ where: { id: req.params.id, studioId: studio.id } });
  if (!event) return res.status(404).json({ error: 'Event not found' });
  await prisma.event.delete({ where: { id: req.params.id } });
  await prisma.studio.update({ where: { id: studio.id }, data: { eventsUsed: { decrement: 1 } } });
  res.status(204).end();
});

export default router;
```

### 7.6 backend/src/routes/media.js

```js
import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import multer from 'multer';
import { authenticate } from '../middleware/auth.js';
import { uploadToR2, getPresignedUrl } from '../services/r2.js';
import { aiQueue } from '../queues.js';

const router = Router();
const prisma = new PrismaClient();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 2 * 1024 * 1024 * 1024 } });

router.get('/', authenticate, async (req, res) => {
  const { eventId, subEventId, status } = req.query;
  if (!eventId) return res.status(400).json({ error: 'eventId required' });
  const media = await prisma.media.findMany({
    where: { eventId, ...(subEventId && { subEventId }), ...(status && { status }) },
    orderBy: { createdAt: 'desc' },
    include: { _count: { select: { faceTags: true } } },
  });
  res.json(media);
});

router.post('/upload', authenticate, upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file' });
  const { eventId, subEventId } = req.body;
  if (!eventId) return res.status(400).json({ error: 'eventId required' });

  const key = `studios/events/${eventId}/originals/${Date.now()}-${req.file.originalname}`;
  const url = await uploadToR2(key, req.file.buffer, req.file.mimetype);

  const media = await prisma.media.create({
    data: {
      eventId,
      subEventId: subEventId || null,
      originalUrl: url,
      fileName: req.file.originalname,
      mimeType: req.file.mimetype,
      sizeBytes: req.file.size,
      status: 'PROCESSING',
      uploadSource: 'DESKTOP_UPLOADER',
    },
  });

  // Queue thumbnail + face match
  await aiQueue.add('thumbnail', { mediaId: media.id, key, mimeType: req.file.mimetype });
  await aiQueue.add('face-match', { mediaId: media.id, eventId });

  res.status(201).json(media);
});

router.get('/presign', authenticate, async (req, res) => {
  const { filename, contentType, eventId } = req.query;
  const key = `studios/events/${eventId}/originals/${Date.now()}-${filename}`;
  const url = await getPresignedUrl(key, contentType);
  res.json({ url, key });
});

router.post('/:id/face-match', authenticate, async (req, res) => {
  const media = await prisma.media.findUnique({ where: { id: req.params.id } });
  if (!media) return res.status(404).json({ error: 'Not found' });
  await aiQueue.add('face-match', { mediaId: media.id, eventId: media.eventId });
  res.json({ queued: true });
});

router.post('/:id/ai-edit', authenticate, async (req, res) => {
  const { preset } = req.body;
  const media = await prisma.media.findUnique({ where: { id: req.params.id } });
  if (!media) return res.status(404).json({ error: 'Not found' });
  await aiQueue.add('ai-edit', { mediaId: media.id, preset });
  res.json({ queued: true });
});

router.post('/face-match-all', authenticate, async (req, res) => {
  const { eventId } = req.body;
  const allMedia = await prisma.media.findMany({ where: { eventId, status: 'READY', mimeType: { startsWith: 'image' } }, select: { id: true } });
  for (const m of allMedia) await aiQueue.add('face-match', { mediaId: m.id, eventId });
  res.json({ queued: allMedia.length });
});

router.post('/ai-edit-batch', authenticate, async (req, res) => {
  const { eventId, preset } = req.body;
  const allMedia = await prisma.media.findMany({ where: { eventId, status: 'READY', mimeType: { startsWith: 'image' } }, select: { id: true } });
  for (const m of allMedia) await aiQueue.add('ai-edit', { mediaId: m.id, preset });
  res.json({ queued: allMedia.length });
});

router.delete('/:id', authenticate, async (req, res) => {
  await prisma.media.delete({ where: { id: req.params.id } });
  res.status(204).end();
});

export default router;
```

### 7.7 backend/src/routes/cameras.js

```js
import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate } from '../middleware/auth.js';
import { nanoid } from 'nanoid';

const router = Router();
const prisma = new PrismaClient();

router.get('/ftp-info', authenticate, (req, res) => {
  res.json({ host: process.env.FTP_PASV_URL || 'your-server-ip', port: process.env.FTP_PORT || 2121 });
});

router.get('/', authenticate, async (req, res) => {
  const studio = await prisma.studio.findUnique({ where: { ownerId: req.user.userId } });
  res.json(await prisma.cameraAccount.findMany({ where: { studioId: studio.id }, orderBy: { createdAt: 'desc' } }));
});

router.post('/', authenticate, async (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: 'name required' });
  const studio = await prisma.studio.findUnique({ where: { ownerId: req.user.userId } });
  const camera = await prisma.cameraAccount.create({
    data: {
      studioId: studio.id,
      name,
      ftpUsername: `cam-${nanoid(8)}`,
      ftpPassword: nanoid(16),
    },
  });
  res.status(201).json(camera);
});

router.patch('/:id', authenticate, async (req, res) => {
  res.json(await prisma.cameraAccount.update({ where: { id: req.params.id }, data: req.body }));
});

router.delete('/:id', authenticate, async (req, res) => {
  await prisma.cameraAccount.delete({ where: { id: req.params.id } });
  res.status(204).end();
});

export default router;
```

### 7.8 backend/src/routes/gallery.js (Public)

```js
import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import multer from 'multer';
import { uploadToR2 } from '../services/r2.js';
import { aiQueue } from '../queues.js';

const router = Router();
const prisma = new PrismaClient();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

// Public gallery
router.get('/:slug', async (req, res) => {
  const event = await prisma.event.findFirst({
    where: { gallerySlug: req.params.slug, status: 'LIVE' },
    include: { studio: { select: { name: true, logoUrl: true, primaryColor: true, accentColor: true, fontFamily: true } } },
  });
  if (!event) return res.status(404).json({ error: 'Gallery not found' });
  await prisma.event.update({ where: { id: event.id }, data: { galleryViewCount: { increment: 1 } } });
  const media = await prisma.media.findMany({ where: { eventId: event.id, status: 'READY' }, orderBy: { createdAt: 'desc' }, select: { id: true, thumbnailUrl: true, originalUrl: true, editedUrl: true } });
  res.json({ event, studio: event.studio, media });
});

// Personalised gallery
router.get('/:slug/guest/:token', async (req, res) => {
  const event = await prisma.event.findFirst({ where: { gallerySlug: req.params.slug } });
  if (!event) return res.status(404).json({ error: 'Gallery not found' });
  const guest = await prisma.guest.findFirst({ where: { galleryAccessToken: req.params.token, eventId: event.id } });
  if (!guest) return res.status(404).json({ error: 'Invalid access token' });

  const faceTags = await prisma.faceTag.findMany({ where: { guestId: guest.id }, include: { media: { select: { id: true, thumbnailUrl: true, originalUrl: true, editedUrl: true } } } });
  const media = faceTags.map(ft => ft.media);

  const studio = await prisma.studio.findUnique({ where: { id: event.studioId }, select: { name: true, logoUrl: true, primaryColor: true, accentColor: true, fontFamily: true } });
  res.json({ event, guest: { id: guest.id, name: guest.name }, studio, media });
});

// SSE real-time stream
router.get('/:slug/stream', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.write('data: connected\n\n');
  const interval = setInterval(() => res.write(': ping\n\n'), 25000);
  req.on('close', () => clearInterval(interval));
});

// Guest selfie registration
router.post('/:slug/selfie', upload.single('selfie'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file' });
  const { token } = req.body;
  const event = await prisma.event.findFirst({ where: { gallerySlug: req.params.slug } });
  if (!event) return res.status(404).json({ error: 'Not found' });

  const guest = token
    ? await prisma.guest.findFirst({ where: { galleryAccessToken: token, eventId: event.id } })
    : null;

  const guestId = guest?.id;
  if (!guestId) return res.status(400).json({ error: 'token required to register selfie' });

  const key = `studios/events/${event.id}/selfies/${guestId}.jpg`;
  const url = await uploadToR2(key, req.file.buffer, req.file.mimetype);
  await prisma.guest.update({ where: { id: guestId }, data: { selfieUrl: url } });
  await aiQueue.add('embed-selfie', { guestId, selfieUrl: url, eventId: event.id });
  res.json({ queued: true });
});

// Guest photo selection
router.post('/:slug/select', async (req, res) => {
  const { mediaId, selectionType, token } = req.body;
  if (!mediaId || !token) return res.status(400).json({ error: 'mediaId and token required' });
  const guest = await prisma.guest.findFirst({ where: { galleryAccessToken: token } });
  if (!guest) return res.status(403).json({ error: 'Invalid token' });
  const sel = await prisma.photoSelection.upsert({
    where: { mediaId_guestId_selectionType: { mediaId, guestId: guest.id, selectionType: selectionType || 'SELECTED' } },
    update: {},
    create: { mediaId, guestId: guest.id, selectionType: selectionType || 'SELECTED' },
  });
  res.json(sel);
});

export default router;
```

### 7.9 backend/src/routes/studio.js (Branding patch)

```js
import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate } from '../middleware/auth.js';

const router = Router();
const prisma = new PrismaClient();

router.patch('/branding', authenticate, async (req, res) => {
  const allowed = ['primaryColor','accentColor','fontFamily','customDomain','logoUrl','watermarkUrl'];
  const data = Object.fromEntries(Object.entries(req.body).filter(([k]) => allowed.includes(k)));
  const studio = await prisma.studio.update({ where: { ownerId: req.user.userId }, data });
  res.json(studio);
});

export default router;
```

### 7.10 backend/src/services/r2.js

```js
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const s3 = new S3Client({
  region: 'auto',
  endpoint: process.env.STORAGE_ENDPOINT,
  credentials: {
    accessKeyId: process.env.STORAGE_ACCESS_KEY,
    secretAccessKey: process.env.STORAGE_SECRET,
  },
});

export async function uploadToR2(key, buffer, contentType) {
  await s3.send(new PutObjectCommand({
    Bucket: process.env.STORAGE_BUCKET,
    Key: key,
    Body: buffer,
    ContentType: contentType,
  }));
  return `${process.env.STORAGE_PUBLIC_URL}/${key}`;
}

export async function getPresignedUrl(key, contentType) {
  return getSignedUrl(s3, new PutObjectCommand({
    Bucket: process.env.STORAGE_BUCKET,
    Key: key,
    ContentType: contentType,
  }), { expiresIn: 900 });
}
```

### 7.11 backend/src/queues.js

```js
import { Queue } from 'bullmq';
const connection = { url: process.env.REDIS_URL };

export const aiQueue = new Queue('ai-jobs', { connection });
export const waQueue = new Queue('whatsapp', { connection });
export const mediaQueue = new Queue('media-processing', { connection });
export const exportQueue = new Queue('pdf-export', { connection });
```

### 7.12 backend/src/workers/aiWorker.js

```js
import { Worker } from 'bullmq';
import { PrismaClient } from '@prisma/client';
import sharp from 'sharp';
import axios from 'axios';
import { uploadToR2 } from '../services/r2.js';

const prisma = new PrismaClient();

const worker = new Worker('ai-jobs', async job => {
  if (job.name === 'thumbnail') await handleThumbnail(job.data);
  if (job.name === 'face-match') await handleFaceMatch(job.data);
  if (job.name === 'embed-selfie') await handleEmbedSelfie(job.data);
  if (job.name === 'ai-edit') await handleAiEdit(job.data);
}, {
  connection: { url: process.env.REDIS_URL },
  concurrency: 4,
});

async function handleThumbnail({ mediaId, key, mimeType }) {
  if (!mimeType.startsWith('image')) {
    await prisma.media.update({ where: { id: mediaId }, data: { status: 'READY' } });
    return;
  }
  const media = await prisma.media.findUnique({ where: { id: mediaId } });
  const res = await axios.get(media.originalUrl, { responseType: 'arraybuffer' });
  const buf = Buffer.from(res.data);
  const thumbBuf = await sharp(buf).resize(800, null, { withoutEnlargement: true }).webp({ quality: 80 }).toBuffer();
  const thumbKey = key.replace('/originals/', '/thumbnails/').replace(/\.[^.]+$/, '.webp');
  const thumbUrl = await uploadToR2(thumbKey, thumbBuf, 'image/webp');
  const meta = await sharp(buf).metadata();
  await prisma.media.update({ where: { id: mediaId }, data: { thumbnailUrl: thumbUrl, width: meta.width, height: meta.height, status: 'READY' } });
}

async function handleEmbedSelfie({ guestId, selfieUrl, eventId }) {
  try {
    const imgRes = await axios.get(selfieUrl, { responseType: 'arraybuffer' });
    const formData = new FormData();
    formData.append('file', new Blob([imgRes.data], { type: 'image/jpeg' }), 'selfie.jpg');
    const aiRes = await axios.post(`${process.env.FACE_API_URL}/embed`, formData, {
      headers: { 'X-API-Key': process.env.FACE_API_KEY },
    });
    if (!aiRes.data.embedding) return;
    await prisma.guest.update({ where: { id: guestId }, data: { faceEmbedding: aiRes.data.embedding } });
    // Now match this guest against all existing event photos
    const allMedia = await prisma.media.findMany({ where: { eventId, status: 'READY', mimeType: { startsWith: 'image' } } });
    for (const m of allMedia) {
      await matchPhotoToGuest(m, guestId, aiRes.data.embedding);
    }
  } catch (err) { console.error('embed-selfie failed', err.message); }
}

async function handleFaceMatch({ mediaId, eventId }) {
  const media = await prisma.media.findUnique({ where: { id: mediaId } });
  if (!media || !media.originalUrl) return;
  const guests = await prisma.guest.findMany({ where: { eventId, faceEmbedding: { not: null } } });
  if (!guests.length) return;
  try {
    const imgRes = await axios.get(media.thumbnailUrl || media.originalUrl, { responseType: 'arraybuffer' });
    const formData = new FormData();
    formData.append('file', new Blob([imgRes.data], { type: 'image/jpeg' }), 'photo.jpg');
    formData.append('embeddings', JSON.stringify(guests.map(g => ({ id: g.id, embedding: g.faceEmbedding }))));
    const aiRes = await axios.post(`${process.env.FACE_API_URL}/match`, formData, {
      headers: { 'X-API-Key': process.env.FACE_API_KEY },
    });
    for (const match of aiRes.data.matches || []) {
      if (match.confidence >= 0.4) {
        await prisma.faceTag.upsert({
          where: { mediaId_guestId: { mediaId, guestId: match.guestId } },
          update: { confidence: match.confidence },
          create: { mediaId, guestId: match.guestId, confidence: match.confidence, boundingBox: match.bbox || {} },
        });
        await prisma.guest.update({ where: { id: match.guestId }, data: { photosMatchedCount: { increment: 1 } } });
      }
    }
  } catch (err) { console.error('face-match failed', err.message); }
}

async function handleAiEdit({ mediaId, preset }) {
  const media = await prisma.media.findUnique({ where: { id: mediaId } });
  if (!media) return;
  try {
    const res = await axios.get(media.originalUrl, { responseType: 'arraybuffer' });
    let pipeline = sharp(Buffer.from(res.data));
    switch (preset) {
      case 'moody': pipeline = pipeline.modulate({ brightness: 0.9, saturation: 1.2 }).gamma(1.2); break;
      case 'airy': pipeline = pipeline.modulate({ brightness: 1.15, saturation: 0.8 }).gamma(0.9); break;
      case 'bw': pipeline = pipeline.grayscale(); break;
      case 'golden': pipeline = pipeline.tint({ r: 255, g: 220, b: 160 }); break;
      case 'cool': pipeline = pipeline.tint({ r: 160, g: 200, b: 255 }); break;
      case 'auto': pipeline = pipeline.normalize(); break;
      default: pipeline = pipeline.normalize();
    }
    const editedBuf = await pipeline.jpeg({ quality: 90 }).toBuffer();
    const editKey = media.originalUrl.replace('/originals/', '/edited/');
    const editedUrl = await uploadToR2(editKey.split('/').slice(-1)[0], editedBuf, 'image/jpeg');
    await prisma.media.update({ where: { id: mediaId }, data: { editedUrl, aiEditApplied: preset } });
  } catch (err) { console.error('ai-edit failed', err.message); }
}

export default worker;
```

### 7.13 backend/src/workers/whatsappWorker.js

```js
import { Worker } from 'bullmq';
import { PrismaClient } from '@prisma/client';
import { sendWhatsAppMessage } from '../services/whatsappApi.js';

const prisma = new PrismaClient();

const worker = new Worker('whatsapp', async job => {
  const { messageId } = job.data;
  const msg = await prisma.whatsAppMessage.findUnique({ where: { id: messageId } });
  if (!msg) return;

  try {
    const waId = await sendWhatsAppMessage(msg.phone, msg.type, msg.body);
    await prisma.whatsAppMessage.update({ where: { id: messageId }, data: { status: 'SENT', waMessageId: waId, sentAt: new Date() } });
  } catch (err) {
    await prisma.whatsAppMessage.update({ where: { id: messageId }, data: { status: 'FAILED' } });
    throw err;
  }
}, {
  connection: { url: process.env.REDIS_URL },
  concurrency: 5,
  defaultJobOptions: { attempts: 3, backoff: { type: 'exponential', delay: 5000 } },
});

export default worker;
```

### 7.14 backend/src/services/whatsappApi.js

```js
import axios from 'axios';

export async function sendWhatsAppMessage(phone, type, bodyText) {
  const url = `${process.env.WHATSAPP_API_URL}/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`;
  const res = await axios.post(url, {
    messaging_product: 'whatsapp',
    to: phone,
    type: 'text',
    text: { body: bodyText },
  }, {
    headers: { Authorization: `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`, 'Content-Type': 'application/json' },
  });
  return res.data.messages?.[0]?.id;
}

export function buildMessageBody(type, data) {
  const { guestName, eventName, galleryUrl, downloadUrl, orderNumber } = data;
  switch (type) {
    case 'GALLERY_READY':
      return `Hi ${guestName}! 📸 Your photos from *${eventName}* are ready.\n\nView your personalized gallery: ${galleryUrl}`;
    case 'SELFIE_REQUEST':
      return `Hi ${guestName}! 🤳 Register your face to find all your photos from *${eventName}*:\n\n${galleryUrl}`;
    case 'SELECTION_REMINDER':
      return `Hi ${guestName}! ⭐ Don't forget to select your favourite photos from *${eventName}*:\n\n${galleryUrl}`;
    case 'DELIVERY_READY':
      return `Hi ${guestName}! 📦 Your selected photos from *${eventName}* are ready to download:\n\n${downloadUrl}`;
    case 'ORDER_CONFIRMED':
      return `Hi ${guestName}! 🖨 Order #${orderNumber} confirmed. Your prints will arrive in 5–7 days.`;
    default:
      return bodyText || '';
  }
}
```

### 7.15 backend/src/routes/whatsapp.js (updated)

```js
import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';
import { authenticate } from '../middleware/auth.js';
import { waQueue } from '../queues.js';
import { buildMessageBody } from '../services/whatsappApi.js';

const router = Router();
const prisma = new PrismaClient();

router.post('/send', authenticate, async (req, res) => {
  const { eventId, type, guestIds } = req.body;
  const event = await prisma.event.findUnique({ where: { id: eventId }, include: { studio: true } });
  if (!event) return res.status(404).json({ error: 'Event not found' });

  const guests = guestIds === 'all'
    ? await prisma.guest.findMany({ where: { eventId, whatsappOptIn: true, phone: { not: null } } })
    : await prisma.guest.findMany({ where: { id: { in: guestIds }, phone: { not: null } } });

  let queued = 0;
  for (const guest of guests) {
    const galleryUrl = `${process.env.FRONTEND_URL}/gallery/${event.gallerySlug}/guest/${guest.galleryAccessToken}`;
    const body = buildMessageBody(type, { guestName: guest.name, eventName: event.name, galleryUrl });
    const msg = await prisma.whatsAppMessage.create({
      data: { eventId, guestId: guest.id, phone: guest.phone, type, body, status: 'QUEUED' },
    });
    await waQueue.add('send', { messageId: msg.id });
    queued++;
  }
  res.json({ queued });
});

router.get('/webhook', (req, res) => {
  const { 'hub.mode': mode, 'hub.verify_token': token, 'hub.challenge': challenge } = req.query;
  if (mode === 'subscribe' && token === process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN) {
    res.status(200).send(challenge);
  } else {
    res.status(403).end();
  }
});

router.post('/webhook', (req, res) => {
  const sig = req.headers['x-hub-signature-256'];
  const expected = 'sha256=' + crypto.createHmac('sha256', process.env.WHATSAPP_APP_SECRET).update(JSON.stringify(req.body)).digest('hex');
  if (sig !== expected) return res.status(403).end();

  const entry = req.body?.entry?.[0];
  const changes = entry?.changes?.[0]?.value;

  // Handle status updates
  changes?.statuses?.forEach(async s => {
    const field = s.status === 'delivered' ? { status: 'DELIVERED', deliveredAt: new Date() }
      : s.status === 'read' ? { status: 'READ', readAt: new Date() }
      : null;
    if (field) await prisma.whatsAppMessage.updateMany({ where: { waMessageId: s.id }, data: field });
  });

  res.status(200).end();
});

router.get('/stats', authenticate, async (req, res) => {
  const { eventId } = req.query;
  const [sent, delivered, read, failed] = await Promise.all([
    prisma.whatsAppMessage.count({ where: { eventId, status: 'SENT' } }),
    prisma.whatsAppMessage.count({ where: { eventId, status: 'DELIVERED' } }),
    prisma.whatsAppMessage.count({ where: { eventId, status: 'READ' } }),
    prisma.whatsAppMessage.count({ where: { eventId, status: 'FAILED' } }),
  ]);
  res.json({ sent, delivered, read, failed });
});

router.get('/messages', authenticate, async (req, res) => {
  const { eventId } = req.query;
  const msgs = await prisma.whatsAppMessage.findMany({
    where: { eventId },
    orderBy: { createdAt: 'desc' },
    include: { guest: { select: { name: true } } },
    take: 100,
  });
  res.json(msgs);
});

export default router;
```

### 7.16 backend/src/socket.js

```js
import jwt from 'jsonwebtoken';

export function setupSocket(io) {
  const studio = io.of('/studio');

  studio.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error('Unauthorized'));
    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = payload.userId;
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  studio.on('connection', socket => {
    socket.join(`user:${socket.userId}`);
    socket.on('join:studio', studioId => socket.join(`studio:${studioId}`));
    socket.on('disconnect', () => {});
  });

  // Export emitter for use in workers
  io.studioNs = studio;
}

// Called from workers to push events to studio dashboard
export function emitToStudio(io, studioId, event, data) {
  io.studioNs?.to(`studio:${studioId}`).emit(event, data);
}
```

### 7.17 backend/src/ftpServer.js

```js
import { FtpSrv } from 'ftp-srv';
import { PrismaClient } from '@prisma/client';
import { Writable } from 'stream';
import { aiQueue } from './queues.js';

const prisma = new PrismaClient();

export function startFtpServer() {
  const ftpServer = new FtpSrv({
    url: `ftp://0.0.0.0:${process.env.FTP_PORT || 2121}`,
    pasv_url: process.env.FTP_PASV_URL,
    pasv_min: parseInt(process.env.FTP_PASV_MIN) || 3000,
    pasv_max: parseInt(process.env.FTP_PASV_MAX) || 3100,
    anonymous: false,
  });

  ftpServer.on('login', async ({ connection, username, password }, resolve, reject) => {
    const camera = await prisma.cameraAccount.findFirst({
      where: { ftpUsername: username, ftpPassword: password, status: 'ACTIVE' },
      include: { studio: { include: { events: { where: { status: 'LIVE' }, take: 1 } } } },
    });
    if (!camera) return reject(new Error('Invalid credentials'));

    // Find the active event for this studio
    const activeEvent = camera.studio.events[0];

    resolve({
      fs: {
        get: () => {},
        list: () => [],
        write: (fileName) => {
          const chunks = [];
          const stream = new Writable({
            write(chunk, encoding, cb) { chunks.push(chunk); cb(); },
            async final(cb) {
              const buffer = Buffer.concat(chunks);
              if (activeEvent) {
                // Store in-memory, then process
                const { uploadToR2 } = await import('./services/r2.js');
                const key = `studios/events/${activeEvent.id}/originals/ftp-${Date.now()}-${fileName}`;
                const url = await uploadToR2(key, buffer, 'image/jpeg');

                const media = await prisma.media.create({
                  data: {
                    eventId: activeEvent.id,
                    cameraAccountId: camera.id,
                    originalUrl: url,
                    fileName,
                    mimeType: 'image/jpeg',
                    sizeBytes: buffer.length,
                    status: 'PROCESSING',
                    uploadSource: 'CAMERA2CLOUD',
                  },
                });
                await aiQueue.add('thumbnail', { mediaId: media.id, key, mimeType: 'image/jpeg' });
                await aiQueue.add('face-match', { mediaId: media.id, eventId: activeEvent.id });
                await prisma.cameraAccount.update({ where: { id: camera.id }, data: { uploadCount: { increment: 1 }, lastUploadAt: new Date() } });
              }
              cb();
            },
          });
          return { stream };
        },
      },
    });
  });

  ftpServer.listen().then(() => console.log(`FTP server on :${process.env.FTP_PORT || 2121}`));
}
```

---

## 8. Python AI Service — Complete Code

### 8.1 ai-service/requirements.txt

```
fastapi==0.104.1
uvicorn==0.24.0
insightface==0.7.3
numpy==1.26.2
opencv-python-headless==4.8.1.78
python-multipart==0.0.6
Pillow==10.1.0
onnxruntime==1.16.3
```

### 8.2 ai-service/main.py

```python
from fastapi import FastAPI, UploadFile, File, HTTPException, Header
from pydantic import BaseModel
from typing import List, Optional
import numpy as np
import cv2
import os
from insightface.app import FaceAnalysis

app = FastAPI(title="Eventra Face Recognition Service")
API_KEY = os.getenv("FACE_API_KEY", "dev-key")

# Load ArcFace R100 model at startup
face_analyzer = FaceAnalysis(name='buffalo_l', providers=['CPUExecutionProvider'])
face_analyzer.prepare(ctx_id=0, det_size=(640, 640))


def verify_key(x_api_key: str = Header(None)):
    if x_api_key != API_KEY:
        raise HTTPException(status_code=403, detail="Invalid API key")


def cosine_similarity(a, b):
    return float(np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b)))


class GuestEmbedding(BaseModel):
    id: str
    embedding: List[float]


class MatchRequest(BaseModel):
    guests: List[GuestEmbedding]
    threshold: float = 0.4


@app.post("/embed")
async def embed_face(file: UploadFile = File(...), x_api_key: str = Header(None)):
    verify_key(x_api_key)
    contents = await file.read()
    nparr = np.frombuffer(contents, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    if img is None:
        raise HTTPException(400, detail="Invalid image")
    faces = face_analyzer.get(img)
    if not faces:
        return {"embedding": None, "faces_detected": 0}
    # Return embedding of largest face
    largest = max(faces, key=lambda f: (f.bbox[2]-f.bbox[0]) * (f.bbox[3]-f.bbox[1]))
    return {"embedding": largest.embedding.tolist(), "faces_detected": len(faces)}


@app.post("/match")
async def match_faces(
    file: UploadFile = File(...),
    guests: str = "",
    x_api_key: str = Header(None)
):
    verify_key(x_api_key)
    import json
    guest_list = json.loads(guests) if guests else []

    contents = await file.read()
    nparr = np.frombuffer(contents, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    if img is None:
        raise HTTPException(400, detail="Invalid image")

    faces = face_analyzer.get(img)
    if not faces:
        return {"matches": [], "faces_in_photo": 0}

    matches = []
    for face in faces:
        photo_emb = face.embedding
        bbox = face.bbox.tolist()
        for guest in guest_list:
            guest_emb = np.array(guest["embedding"])
            sim = cosine_similarity(photo_emb, guest_emb)
            if sim >= 0.4:
                matches.append({
                    "guestId": guest["id"],
                    "confidence": sim,
                    "bbox": {"x": bbox[0], "y": bbox[1], "w": bbox[2]-bbox[0], "h": bbox[3]-bbox[1]},
                })

    return {"matches": matches, "faces_in_photo": len(faces)}


@app.get("/health")
def health():
    return {"status": "ok", "model": "buffalo_l (ArcFace R100)"}
```

### 8.3 ai-service/Dockerfile

```dockerfile
FROM python:3.11-slim

RUN apt-get update && apt-get install -y libglib2.0-0 libsm6 libxext6 libxrender-dev libgl1-mesa-glx && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY main.py .

# Pre-download model at build time
RUN python -c "from insightface.app import FaceAnalysis; fa = FaceAnalysis(name='buffalo_l', providers=['CPUExecutionProvider']); fa.prepare(ctx_id=0)"

EXPOSE 8001
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8001"]
```

---

## 9. Deployment Guide

### 9.1 Frontend (Netlify)

```toml
# netlify.toml
[build]
  command = "npm run build"
  publish = "dist"

[build.environment]
  VITE_API_URL = "https://your-api.railway.app/api"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

### 9.2 Backend (Railway)

1. Connect GitHub repo, set root to `/backend`
2. Add env vars from `.env.example`
3. Railway auto-provisions PostgreSQL + Redis — copy DATABASE_URL and REDIS_URL
4. Enable `pgvector`: run `CREATE EXTENSION IF NOT EXISTS vector;` in Railway DB console
5. Set start command: `node src/index.js`
6. Expose port 3001

### 9.3 AI Service (fly.io)

```bash
cd ai-service
fly launch --name eventra-ai-service
fly secrets set FACE_API_KEY=your-key
fly deploy
```

### 9.4 Database Migration

```bash
cd backend
npx prisma migrate deploy    # production
npx prisma migrate dev       # development (interactive)
npx prisma db seed           # optional seed data
```

### 9.5 Local Development

```bash
# Terminal 1 — PostgreSQL + Redis via Docker
docker run -d --name eventra-pg -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=eventra -p 5432:5432 ankane/pgvector
docker run -d --name eventra-redis -p 6379:6379 redis:7-alpine

# Terminal 2 — Backend API
cd backend && npm install && npm run dev

# Terminal 3 — BullMQ Workers
cd backend && node src/workers/aiWorker.js

# Terminal 4 — Python AI service
cd ai-service && pip install -r requirements.txt && uvicorn main:app --port 8001 --reload

# Terminal 5 — Frontend
cd frontend && npm install && npm run dev
```

---

## 10. Implementation Order (6 Phases)

### Phase 1 — Foundation (Days 1–3)
- [ ] PostgreSQL + pgvector + Redis running
- [ ] Prisma schema push + migrate
- [ ] Express server with helmet, cors, rate-limit
- [ ] Auth: signup, login, refresh, logout, /me
- [ ] Studio auto-create on signup
- [ ] Frontend: Login + Signup pages wired to API

### Phase 2 — Core CRUD (Days 4–7)
- [ ] Events CRUD + gallerySlug auto-gen
- [ ] Sub-events CRUD
- [ ] Guests CRUD + bulk CSV import
- [ ] Media upload → R2 → thumbnail worker
- [ ] Frontend: Events, Guests, MediaLibrary pages

### Phase 3 — AI Pipeline (Days 8–12)
- [ ] Python FastAPI /embed + /match endpoints
- [ ] Guest selfie enrollment + face-embedding storage
- [ ] BullMQ face-match worker (per-photo)
- [ ] FaceTag creation + guest counter
- [ ] AI editing worker (Sharp.js presets)
- [ ] FTP server (Camera2Cloud auto-ingest)
- [ ] Frontend: AIFaceRec, AIEditing, Camera2Cloud pages

### Phase 4 — Delivery (Days 13–17)
- [ ] WhatsApp send queue + 5 templates
- [ ] WhatsApp webhook (verify + status updates)
- [ ] Public gallery endpoints (GET /gallery/:slug)
- [ ] Personalised gallery (GET /gallery/:slug/guest/:token)
- [ ] SSE real-time photo stream
- [ ] Socket.io studio dashboard
- [ ] QR code generation + scan tracking
- [ ] Digital invite builder
- [ ] Frontend: WhatsAppBot, GuestGallery (public), QRCodeManager, InviteBuilder

### Phase 5 — Business (Days 18–22)
- [ ] Analytics aggregation queries
- [ ] Meta Pixel fire endpoint + Conversions API
- [ ] Print store orders + Razorpay checkout
- [ ] Storage transfer flow
- [ ] White label branding injection
- [ ] Frontend: Analytics, PrintStore, StorageManager, WhiteLabel

### Phase 6 — Monetisation (Days 23–26)
- [ ] Plan tier enforcement (checkPlanLimit middleware)
- [ ] Usage counters on Studio
- [ ] 402 responses with upgradeUrl
- [ ] Razorpay Subscriptions webhook
- [ ] Billing page + upgrade flow
- [ ] Frontend: Billing page

---

## 11. Security Checklist

- [ ] All POST/PATCH bodies validated with Zod
- [ ] File uploads: MIME whitelist (image/*, video/mp4)
- [ ] File size limit: 30MB photos, 2GB video
- [ ] Prisma parameterised queries only (no raw with user input)
- [ ] JWT: HS256, secret ≥ 64 chars
- [ ] Refresh tokens stored in DB (revocable)
- [ ] All studio routes verify studioId ownership
- [ ] Guest gallery: UUID token — cryptographically random
- [ ] helmet() enabled in production
- [ ] CORS: only FRONTEND_URL allowed
- [ ] Rate limit: 10/15min auth, 200/15min global
- [ ] WhatsApp webhook: X-Hub-Signature-256 verified
- [ ] R2 bucket: private, serve only via CDN/signed URLs
- [ ] No stack traces in production error responses
- [ ] Secrets only in env vars, never in code or logs
