/**
 * Per-guest WhatsApp conversation state machine — Redis-backed.
 *
 * State object (stored as JSON):
 *   { state, eventId, guestId, data?, updatedAt }
 *
 * States:
 *   idle            — no active conversation
 *   awaiting_selfie — selfie-request sent; next photo = selfie
 *   awaiting_rsvp   — RSVP invite sent via template (buttons cover the interactive path)
 *
 * Session window (Meta's 24-hour rule):
 *   A guest contacting us opens a free-form window for 24 h.
 *   Outside that window, only template messages are allowed.
 *   wa:session:{phone}  — presence key, 24-hour TTL.
 */

import IORedis from 'ioredis';
import env     from '../config/env.js';

const redis = new IORedis(env.REDIS_URL, {
  maxRetriesPerRequest: null,
  enableReadyCheck:     false,
  lazyConnect:          true,
});

redis.on('error', err =>
  console.error('[whatsappState] Redis error:', err.message),
);

const STATE_TTL   = 48 * 60 * 60;  // 48 h
const SESSION_TTL = 24 * 60 * 60;  // 24 h — Meta's free-form window

const stateKey   = phone => `wa:state:${phone}`;
const sessionKey = phone => `wa:session:${phone}`;

// ─── Conversation state ───────────────────────────────────────

export async function getState(phone) {
  const raw = await redis.get(stateKey(phone));
  if (!raw) return { state: 'idle', eventId: null, guestId: null };
  try { return JSON.parse(raw); } catch { return { state: 'idle', eventId: null, guestId: null }; }
}

export async function setState(phone, state, data = {}) {
  const payload = JSON.stringify({ state, ...data, updatedAt: Date.now() });
  await redis.setex(stateKey(phone), STATE_TTL, payload);
}

export async function clearState(phone) {
  await redis.del(stateKey(phone));
}

// ─── Session window (24-hour free-form rule) ──────────────────

/** Call whenever an inbound message is received — refreshes the 24-h window. */
export async function touchSession(phone) {
  await redis.setex(sessionKey(phone), SESSION_TTL, '1');
}

/** True if we can send free-form text to this number right now. */
export async function isInSession(phone) {
  return (await redis.exists(sessionKey(phone))) === 1;
}

export { redis as whatsappRedis };
