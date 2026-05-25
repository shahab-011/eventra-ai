import './config/env.js'; // validates all env vars at boot — exits on failure
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';

import { requestContext } from './middleware/requestContext.js';
import { AppError } from './lib/errors.js';
import logger from './lib/logger.js';

import authRoutes from './routes/auth.js';
import studioRoutes, { publicRouter as publicStudioRoutes } from './routes/studio.js';
import eventRoutes from './routes/events.js';
import subEventRoutes from './routes/subEvents.js';
import guestRoutes, { eventGuestRouter, publicGuestRouter } from './routes/guests.js';
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

// ─── Security & compression ───────────────────────────────────
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'blob:', process.env.R2_PUBLIC_BASE].filter(Boolean),
      connectSrc: ["'self'"],
    },
  },
}));
app.use(compression());
app.use(cors({ origin: process.env.FRONTEND_URL, credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ─── Request context (requestId + structured logging) ─────────
app.use(requestContext);

// ─── Rate limiters ────────────────────────────────────────────
const globalLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 200, standardHeaders: true, legacyHeaders: false });
const authLimiter   = rateLimit({ windowMs: 15 * 60 * 1000, max: 10,  standardHeaders: true, legacyHeaders: false });
const galleryLimiter = rateLimit({ windowMs: 60 * 1000,      max: 60,  standardHeaders: true, legacyHeaders: false });
const webhookLimiter = rateLimit({ windowMs: 60 * 1000,      max: 5000, standardHeaders: true, legacyHeaders: false });

app.use('/api/', globalLimiter);
app.use('/api/auth', authLimiter);
app.use('/api/invites/view', galleryLimiter);
app.use('/api/whatsapp/webhook', webhookLimiter);
app.use('/api/qr/:id/scan', webhookLimiter);
app.use('/api/pixels/fire', webhookLimiter);

// ─── Routes ───────────────────────────────────────────────────
app.use('/api/auth',   authRoutes);
app.use('/api/studio', studioRoutes);
app.use('/api/public', publicStudioRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/events', subEventRoutes);
app.use('/api/guests', guestRoutes);
app.use('/api/events', eventGuestRouter);
app.use('/api/public', publicGuestRouter);
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
app.use((req, res) => {
  res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Route not found' } });
});

// ─── Global error handler ────────────────────────────────────
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({ error: { code: err.code, message: err.message } });
  }

  if (err instanceof z.ZodError) {
    return res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Validation failed',
        details: err.errors.map(e => ({ path: e.path.join('.'), message: e.message })),
      },
    });
  }

  const log = req.log ?? logger;
  log.error({ err, requestId: req.requestId }, 'unhandled error');
  res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } });
});

app.listen(PORT, () => logger.info(`Eventra API running on http://localhost:${PORT}`));

export default app;
