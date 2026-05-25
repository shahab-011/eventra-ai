import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma.js';

const ACCESS_EXPIRY = '15m';
const REFRESH_EXPIRY_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

// ─── Access tokens ────────────────────────────────────────────

export function signAccessToken(payload) {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: ACCESS_EXPIRY });
}

export function verifyAccessToken(token) {
  return jwt.verify(token, process.env.JWT_SECRET);
}

/** Build the access-token payload for a business/admin user. */
export async function buildUserPayload(user) {
  const studio = await prisma.studio.findUnique({
    where: { ownerId: user.id },
    select: { id: true },
  });
  return {
    userId:   user.id,
    email:    user.email,
    role:     user.role,
    studioId: studio?.id ?? null,
    type:     'access',
  };
}

/** Build the access-token payload for a guest. */
export function buildGuestPayload(guest, eventId) {
  return {
    guestId: guest.id,
    eventId,
    role:    'GUEST',
    type:    'guest',
  };
}

// ─── Refresh tokens ───────────────────────────────────────────

export function generateRawToken() {
  return crypto.randomBytes(48).toString('hex');
}

export function hashToken(raw) {
  return crypto.createHash('sha256').update(raw).digest('hex');
}

export async function createSession(userId, { ip, userAgent } = {}) {
  const raw = generateRawToken();
  await prisma.session.create({
    data: {
      userId,
      token:     hashToken(raw),
      expiresAt: new Date(Date.now() + REFRESH_EXPIRY_MS),
      ip,
      userAgent,
    },
  });
  return raw;
}

/**
 * Exchange an old refresh token for a new one (rotation).
 * Returns { raw, userId } or null if the token is invalid/expired.
 */
export async function rotateSession(rawToken, { ip, userAgent } = {}) {
  const session = await prisma.session.findUnique({
    where: { token: hashToken(rawToken) },
  });

  if (!session) return null;

  // Delete regardless — expired tokens must not be reused
  await prisma.session.delete({ where: { id: session.id } });

  if (session.expiresAt < new Date()) return null;

  const raw = generateRawToken();
  await prisma.session.create({
    data: {
      userId:    session.userId,
      token:     hashToken(raw),
      expiresAt: new Date(Date.now() + REFRESH_EXPIRY_MS),
      ip,
      userAgent,
    },
  });

  return { raw, userId: session.userId };
}

export async function deleteSession(rawToken) {
  const hash = hashToken(rawToken);
  await prisma.session.deleteMany({ where: { token: hash } });
}
