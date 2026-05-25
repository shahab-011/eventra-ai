import 'dotenv/config';
import { z } from 'zod';

const schema = z.object({
  DATABASE_URL:           z.string().url(),
  JWT_SECRET:             z.string().min(32),
  JWT_REFRESH_SECRET:     z.string().min(32),
  REDIS_URL:              z.string().url(),
  R2_ACCOUNT_ID:          z.string().min(1),
  R2_ACCESS_KEY:          z.string().min(1),
  R2_SECRET:              z.string().min(1),
  R2_BUCKET:              z.string().min(1),
  R2_PUBLIC_BASE:         z.string().url(),
  WHATSAPP_PHONE_ID:      z.string().min(1),
  WHATSAPP_TOKEN:         z.string().min(1),
  WHATSAPP_VERIFY_TOKEN:  z.string().min(1),
  WHATSAPP_APP_SECRET:    z.string().min(1),
  AI_SERVICE_URL:         z.string().url(),
  RAZORPAY_KEY_ID:        z.string().min(1),
  RAZORPAY_KEY_SECRET:    z.string().min(1),
  FRONTEND_URL:           z.string().url(),
  PORT:                   z.coerce.number().int().positive().default(3001),
});

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  const missing = parsed.error.errors
    .map(e => `  ${e.path.join('.')}: ${e.message}`)
    .join('\n');
  console.error(`\n[env] Missing or invalid environment variables:\n${missing}\n`);
  process.exit(1);
}

export const env = parsed.data;
export default env;
