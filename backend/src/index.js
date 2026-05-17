import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

import authRoutes from './routes/auth.js';
import eventRoutes from './routes/events.js';
import subEventRoutes from './routes/subEvents.js';
import guestRoutes from './routes/guests.js';
import mediaRoutes from './routes/media.js';
import whatsappRoutes from './routes/whatsapp.js';
import analyticsRoutes from './routes/analytics.js';
import inviteRoutes from './routes/invites.js';
import qrRoutes from './routes/qr.js';
import teamRoutes from './routes/team.js';
import storageRoutes from './routes/storage.js';
import storeRoutes from './routes/store.js';
import pixelRoutes from './routes/pixels.js';

const app = express();
const PORT = process.env.PORT || 3001;

// ─── Middleware ────────────────────────────────────────────────
app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173', credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 200, standardHeaders: true, legacyHeaders: false });
app.use('/api/', limiter);

// ─── Routes ───────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/events', subEventRoutes);
app.use('/api/guests', guestRoutes);
app.use('/api/media', mediaRoutes);
app.use('/api/whatsapp', whatsappRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/invites', inviteRoutes);
app.use('/api/qr', qrRoutes);
app.use('/api/team', teamRoutes);
app.use('/api/storage', storageRoutes);
app.use('/api/store', storeRoutes);
app.use('/api/pixels', pixelRoutes);

// ─── Health check ─────────────────────────────────────────────
app.get('/health', (req, res) => res.json({ status: 'ok', version: '1.0.0', service: 'eventra-api' }));

// ─── 404 ──────────────────────────────────────────────────────
app.use((req, res) => res.status(404).json({ error: 'Route not found' }));

// ─── Error handler ────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

app.listen(PORT, () => console.log(`Eventra API running on http://localhost:${PORT}`));

export default app;
