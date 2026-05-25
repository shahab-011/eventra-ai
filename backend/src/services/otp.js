import crypto from 'crypto';
import redis from '../lib/redis.js';
import logger from '../lib/logger.js';

const OTP_TTL = 300;     // 5 minutes
const MAX_ATTEMPTS = 3;

const key = (phone, eventId) => `otp:${phone}:${eventId}`;

function generate() {
  // crypto.randomInt is uniformly distributed; pad to guarantee 6 digits
  return String(crypto.randomInt(100000, 1000000));
}

export async function createOtp(phone, eventId) {
  const code = generate();
  await redis.set(key(phone, eventId), JSON.stringify({ code, attempts: 0 }), 'EX', OTP_TTL);
  return code;
}

/**
 * Stub: in production this calls the WhatsApp worker (module B10).
 * Logs the code at warn level so it is visible in dev without a real WA connection.
 */
export async function sendOtpWhatsApp(phone, code) {
  logger.warn({ phone, code }, '[STUB] WhatsApp OTP — wire to B10 worker when ready');
}

export async function verifyOtp(phone, eventId, inputCode) {
  const raw = await redis.get(key(phone, eventId));
  if (!raw) return { valid: false, reason: 'expired' };

  const { code, attempts } = JSON.parse(raw);

  if (attempts >= MAX_ATTEMPTS) {
    await redis.del(key(phone, eventId));
    return { valid: false, reason: 'max_attempts' };
  }

  if (code !== inputCode) {
    // increment attempts, preserve remaining TTL
    await redis.set(
      key(phone, eventId),
      JSON.stringify({ code, attempts: attempts + 1 }),
      'KEEPTTL',
    );
    return { valid: false, reason: 'invalid' };
  }

  await redis.del(key(phone, eventId));
  return { valid: true };
}
