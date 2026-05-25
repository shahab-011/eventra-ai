import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { OAuth2Client } from 'google-auth-library';

import prisma from '../lib/prisma.js';
import redis from '../lib/redis.js';
import { audit } from '../lib/audit.js';
import { AppError, conflict, unauthorized, notFound, badRequest } from '../lib/errors.js';
import { validate } from '../lib/validate.js';
import { authenticate } from '../middleware/auth.js';
import {
  signAccessToken,
  buildUserPayload,
  buildGuestPayload,
  createSession,
  rotateSession,
  deleteSession,
} from '../services/token.js';
import { createOtp, sendOtpWhatsApp, verifyOtp } from '../services/otp.js';

const router = Router();

// ─── Zod schemas ──────────────────────────────────────────────

const signupSchema = z.object({
  name:       z.string().min(2).max(80),
  email:      z.string().email().toLowerCase(),
  password:   z.string().min(8).max(128),
  studioName: z.string().min(2).max(80),
  // subdomain auto-derived from studioName; can be overridden
  subdomain:  z.string().min(3).max(40).regex(/^[a-z0-9-]+$/).optional(),
});

const loginSchema = z.object({
  email:    z.string().email().toLowerCase(),
  password: z.string().min(1),
});

const refreshSchema = z.object({
  refreshToken: z.string().min(1),
});

const logoutSchema = z.object({
  refreshToken: z.string().min(1),
});

const requestOtpSchema = z.object({
  phone:   z.string().min(7).max(20),
  eventId: z.string().uuid(),
});

const verifyOtpSchema = z.object({
  phone:   z.string().min(7).max(20),
  eventId: z.string().uuid(),
  code:    z.string().length(6).regex(/^\d{6}$/),
});

// ─── Login lockout helpers (Redis) ────────────────────────────

const FAIL_KEY   = email => `auth:fails:${email}`;
const MAX_FAILS  = 5;
const LOCKOUT_S  = 15 * 60; // 15 minutes

async function isLocked(email) {
  const v = await redis.get(FAIL_KEY(email));
  return v !== null && parseInt(v, 10) >= MAX_FAILS;
}

async function recordFail(email, ctx) {
  const k = FAIL_KEY(email);
  const count = await redis.incr(k);
  if (count === 1) await redis.expire(k, LOCKOUT_S);
  if (count >= MAX_FAILS) {
    audit('ACCOUNT_LOCKED', { ...ctx, metadata: { email } });
  }
}

async function clearFails(email) {
  await redis.del(FAIL_KEY(email));
}

// ─── Subdomain helper ─────────────────────────────────────────

function slugify(str) {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 35);
}

async function resolveSubdomain(name, tx) {
  const base = slugify(name);
  for (let i = 0; i <= 10; i++) {
    const candidate = i === 0 ? base : `${base}-${i}`;
    const taken = await tx.studio.findUnique({ where: { subdomain: candidate } });
    if (!taken) return candidate;
  }
  return `${base}-${Date.now()}`;
}

// ─── Google OAuth client ──────────────────────────────────────

const GOOGLE_SCOPES  = ['openid', 'email', 'profile'];
const GOOGLE_CALLBACK = `${process.env.BACKEND_URL ?? `http://localhost:${process.env.PORT ?? 3001}`}/api/auth/google/callback`;

const googleClient = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  GOOGLE_CALLBACK,
);

function requestCtx(req) {
  return {
    ip:        req.ip,
    userAgent: req.headers['user-agent'],
  };
}

// ─── A) Register ──────────────────────────────────────────────

router.post('/signup', validate(signupSchema), async (req, res, next) => {
  const { name, email, password, studioName, subdomain: preferredSubdomain } = req.body;
  try {
    const result = await prisma.$transaction(async tx => {
      const existing = await tx.user.findUnique({ where: { email } });
      if (existing) throw conflict('Email already registered');

      const [passwordHash, subdomain] = await Promise.all([
        bcrypt.hash(password, 12),
        resolveSubdomain(preferredSubdomain ?? studioName, tx),
      ]);

      return tx.user.create({
        data: {
          name, email, passwordHash,
          studio: { create: { name: studioName, subdomain } },
        },
        include: { studio: { select: { id: true, name: true, subdomain: true, planTier: true } } },
      });
    });

    const payload      = await buildUserPayload(result);
    const accessToken  = signAccessToken(payload);
    const refreshToken = await createSession(result.id, requestCtx(req));

    audit('SIGNUP', { userId: result.id, ...requestCtx(req) });

    res.status(201).json({
      data: {
        accessToken,
        refreshToken,
        user: { id: result.id, name: result.name, email: result.email, role: result.role, studio: result.studio },
      },
    });
  } catch (err) {
    next(err);
  }
});

// ─── A) Login ─────────────────────────────────────────────────

router.post('/login', validate(loginSchema), async (req, res, next) => {
  const { email, password } = req.body;
  const ctx = requestCtx(req);

  try {
    // Generic error for all failures — no user enumeration
    const FAIL = () => unauthorized('Invalid credentials');

    if (await isLocked(email)) {
      audit('LOGIN_FAILED', { ...ctx, metadata: { email, reason: 'locked' } });
      return next(FAIL());
    }

    const user = await prisma.user.findUnique({
      where: { email },
      include: { studio: { select: { id: true, name: true, subdomain: true, planTier: true } } },
    });

    const passwordOk = user?.passwordHash
      ? await bcrypt.compare(password, user.passwordHash)
      : false;

    if (!user || !passwordOk) {
      await recordFail(email, ctx);
      audit('LOGIN_FAILED', { userId: user?.id, ...ctx, metadata: { email } });
      return next(FAIL());
    }

    await clearFails(email);

    const payload      = await buildUserPayload(user);
    const accessToken  = signAccessToken(payload);
    const refreshToken = await createSession(user.id, ctx);

    audit('LOGIN', { userId: user.id, ...ctx });

    res.json({
      data: {
        accessToken,
        refreshToken,
        user: { id: user.id, name: user.name, email: user.email, role: user.role, studio: user.studio },
      },
    });
  } catch (err) {
    next(err);
  }
});

// ─── B) Refresh ───────────────────────────────────────────────

router.post('/refresh', validate(refreshSchema), async (req, res, next) => {
  try {
    const rotated = await rotateSession(req.body.refreshToken, requestCtx(req));
    if (!rotated) return next(unauthorized('Invalid or expired refresh token'));

    const user = await prisma.user.findUnique({ where: { id: rotated.userId } });
    if (!user) return next(unauthorized('Invalid or expired refresh token'));

    const payload     = await buildUserPayload(user);
    const accessToken = signAccessToken(payload);

    audit('TOKEN_REFRESH', { userId: user.id, ...requestCtx(req) });

    res.json({ data: { accessToken, refreshToken: rotated.raw } });
  } catch (err) {
    next(err);
  }
});

// ─── B) Logout ────────────────────────────────────────────────

router.post('/logout', validate(logoutSchema), async (req, res, next) => {
  try {
    await deleteSession(req.body.refreshToken);

    // Best-effort: attach userId from access token if present
    const header = req.headers.authorization;
    let userId;
    if (header?.startsWith('Bearer ')) {
      try {
        const { verifyAccessToken } = await import('../services/token.js');
        userId = verifyAccessToken(header.slice(7))?.userId;
      } catch { /* expired is fine */ }
    }

    audit('LOGOUT', { userId, ...requestCtx(req) });
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

// ─── B) GET /me ───────────────────────────────────────────────

router.get('/me', authenticate, async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: {
        id: true, name: true, email: true, role: true,
        phone: true, emailVerified: true,
        studio: {
          select: {
            id: true, name: true, subdomain: true, logoUrl: true,
            planTier: true, storageUsedGB: true, storageLimitGB: true,
            primaryColor: true, accentColor: true,
          },
        },
      },
    });
    if (!user) return next(notFound('User not found'));
    res.json({ data: user });
  } catch (err) {
    next(err);
  }
});

// ─── C) Google OAuth — initiate ───────────────────────────────

router.get('/google', async (req, res, next) => {
  try {
    if (!process.env.GOOGLE_CLIENT_ID) return next(badRequest('Google OAuth not configured'));

    const state = crypto.randomUUID?.() ?? Math.random().toString(36).slice(2);
    await redis.set(`oauth:state:${state}`, '1', 'EX', 600); // 10-minute window

    const url = googleClient.generateAuthUrl({
      access_type: 'offline',
      scope:       GOOGLE_SCOPES,
      state,
      prompt:      'select_account',
    });

    res.redirect(url);
  } catch (err) {
    next(err);
  }
});

// ─── C) Google OAuth — callback ───────────────────────────────

router.get('/google/callback', async (req, res, next) => {
  const { code, state, error } = req.query;
  const frontendBase = process.env.FRONTEND_URL;

  try {
    if (error) return res.redirect(`${frontendBase}/auth/callback?error=oauth_denied`);
    if (!code || !state) return res.redirect(`${frontendBase}/auth/callback?error=oauth_invalid`);

    // Verify CSRF state (one-time use)
    const stateKey = `oauth:state:${state}`;
    const valid = await redis.get(stateKey);
    if (!valid) return res.redirect(`${frontendBase}/auth/callback?error=oauth_state_mismatch`);
    await redis.del(stateKey);

    // Exchange code for tokens + profile
    const { tokens } = await googleClient.getToken(code);
    const ticket     = await googleClient.verifyIdToken({
      idToken:  tokens.id_token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const profile = ticket.getPayload();
    const { sub: googleId, email, name, email_verified } = profile;

    if (!email) return res.redirect(`${frontendBase}/auth/callback?error=no_email`);

    // Find or create user — link by verified email
    let user = await prisma.user.findFirst({
      where: { OR: [{ googleId }, { email }] },
      include: { studio: { select: { id: true, name: true, subdomain: true, planTier: true } } },
    });

    if (user && !user.googleId) {
      // Existing email-password account — link Google ID
      user = await prisma.user.update({
        where: { id: user.id },
        data:  { googleId, emailVerified: email_verified ?? true },
        include: { studio: { select: { id: true, name: true, subdomain: true, planTier: true } } },
      });
    }

    if (!user) {
      // First-ever Google login — create user + studio in a transaction
      user = await prisma.$transaction(async tx => {
        const subdomain = await resolveSubdomain(name ?? email.split('@')[0], tx);
        return tx.user.create({
          data: {
            email,
            name:         name ?? email.split('@')[0],
            passwordHash: '', // no password for OAuth-only accounts
            googleId,
            emailVerified: email_verified ?? true,
            studio: { create: { name: `${name ?? email.split('@')[0]}'s Studio`, subdomain } },
          },
          include: { studio: { select: { id: true, name: true, subdomain: true, planTier: true } } },
        });
      });
    }

    const payload      = await buildUserPayload(user);
    const accessToken  = signAccessToken(payload);
    const refreshToken = await createSession(user.id, requestCtx(req));

    audit('OAUTH_LOGIN', { userId: user.id, ...requestCtx(req), metadata: { provider: 'google' } });

    res.redirect(
      `${frontendBase}/auth/callback?accessToken=${accessToken}&refreshToken=${refreshToken}`,
    );
  } catch (err) {
    next(err);
  }
});

// ─── D) Guest OTP — request ───────────────────────────────────

router.post('/guest/request-otp', validate(requestOtpSchema), async (req, res, next) => {
  const { phone, eventId } = req.body;
  try {
    const guest = await prisma.guest.findUnique({ where: { eventId_phone: { eventId, phone } } });
    if (!guest) return next(notFound('Guest not registered for this event'));

    const code = await createOtp(phone, eventId);
    await sendOtpWhatsApp(phone, code);

    audit('OTP_REQUESTED', { ...requestCtx(req), metadata: { phone: phone.slice(-4), eventId } });

    res.json({ data: { message: 'OTP sent via WhatsApp', expiresInSeconds: 300 } });
  } catch (err) {
    next(err);
  }
});

// ─── D) Guest OTP — verify ────────────────────────────────────

router.post('/guest/verify-otp', validate(verifyOtpSchema), async (req, res, next) => {
  const { phone, eventId, code } = req.body;
  try {
    const result = await verifyOtp(phone, eventId, code);

    if (!result.valid) {
      audit('OTP_FAILED', { ...requestCtx(req), metadata: { phone: phone.slice(-4), eventId, reason: result.reason } });

      const msg =
        result.reason === 'expired'      ? 'OTP expired, please request a new one' :
        result.reason === 'max_attempts' ? 'Too many attempts, please request a new OTP' :
        'Invalid OTP';
      return next(unauthorized(msg));
    }

    const guest = await prisma.guest.findUnique({ where: { eventId_phone: { eventId, phone } } });
    if (!guest) return next(notFound('Guest not found'));

    const accessToken = signAccessToken(buildGuestPayload(guest, eventId));

    audit('OTP_VERIFIED', { ...requestCtx(req), metadata: { guestId: guest.id, eventId } });

    res.json({ data: { accessToken, guest: { id: guest.id, name: guest.name, phone: guest.phone, eventId } } });
  } catch (err) {
    next(err);
  }
});

export default router;
