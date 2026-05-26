/**
 * Meta WhatsApp Business Cloud API v18 client.
 * Docs: https://developers.facebook.com/docs/whatsapp/cloud-api
 *
 * All functions are stateless — credentials come from env at call time
 * so the file can be imported in both the API process and the worker.
 */

import env    from '../config/env.js';
import logger from '../lib/logger.js';

const BASE = 'https://graph.facebook.com/v18.0';

const sleep = ms => new Promise(r => setTimeout(r, ms));

// ─── Error type ───────────────────────────────────────────────

export class WhatsAppError extends Error {
  constructor(status, message, data = {}) {
    super(message);
    this.name   = 'WhatsAppError';
    this.status = status;
    this.data   = data;
  }
}

// ─── Core request helper ──────────────────────────────────────

async function _request(payload, { retries = 3 } = {}) {
  const url = `${BASE}/${env.WHATSAPP_PHONE_ID}/messages`;

  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const res = await fetch(url, {
        method:  'POST',
        headers: {
          'Content-Type':  'application/json',
          'Authorization': `Bearer ${env.WHATSAPP_TOKEN}`,
        },
        body:   JSON.stringify({ messaging_product: 'whatsapp', ...payload }),
        signal: AbortSignal.timeout(15_000),
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok) return data;

      // Rate limited — back off per Retry-After header
      if (res.status === 429) {
        const after = parseInt(res.headers.get('Retry-After') ?? '5', 10);
        const delay = after * 1000 * (attempt + 1);
        logger.warn({ attempt, delay }, '[whatsappApi] rate limited');
        await sleep(delay);
        continue;
      }

      // Transient server error — exponential backoff
      if (res.status >= 500 && attempt < retries - 1) {
        await sleep(1_000 * 2 ** attempt);
        continue;
      }

      const msg = data?.error?.message ?? `HTTP ${res.status}`;
      throw new WhatsAppError(res.status, msg, data?.error ?? {});

    } catch (err) {
      if (err instanceof WhatsAppError) throw err;
      if (attempt < retries - 1) { await sleep(1_000 * 2 ** attempt); continue; }
      throw err;
    }
  }

  throw new WhatsAppError(503, 'Max retries exceeded');
}

// ─── Send functions ───────────────────────────────────────────

/**
 * Send a Meta-approved template message.
 *
 * components: array following Meta's component spec:
 *   [{ type: 'header'|'body'|'button', parameters: [...] }]
 */
export async function sendTemplate(to, templateName, language = 'en_US', components = []) {
  return _request({
    to,
    type: 'template',
    template: { name: templateName, language: { code: language }, components },
  });
}

/**
 * Send free-form text.
 * ONLY valid within the 24-hour customer-service window.
 * Outside that window, Meta will reject with error code 131026.
 */
export async function sendText(to, body) {
  return _request({ to, type: 'text', text: { body, preview_url: false } });
}

/**
 * Send media (image, document, audio, video).
 *
 * source: { link: 'https://…' }   — public URL
 *       | { id:   'wamid.xxx' }   — previously uploaded media ID
 */
export async function sendMedia(to, type, source, caption = '', filename = '') {
  const entry = { ...source };
  if (caption)  entry.caption  = caption;
  if (filename && type === 'document') entry.filename = filename;
  return _request({ to, type, [type]: entry });
}

/**
 * Send an interactive reply-button message (max 3 buttons).
 *
 * buttons: [{ id: string, title: string }]
 */
export async function sendInteractive(to, bodyText, buttons, headerText = '', footerText = '') {
  const interactive = {
    type:   'button',
    body:   { text: bodyText },
    action: {
      buttons: buttons.map(b => ({
        type:  'reply',
        reply: { id: b.id, title: b.title.slice(0, 20) },
      })),
    },
  };
  if (headerText) interactive.header = { type: 'text', text: headerText };
  if (footerText) interactive.footer = { text: footerText };
  return _request({ to, type: 'interactive', interactive });
}

/**
 * Mark an inbound message as read.
 * Causes the customer's "sent ticks" to turn blue.
 */
export async function markRead(waMessageId) {
  return _request({ status: 'read', message_id: waMessageId });
}

// ─── Media download ───────────────────────────────────────────

/**
 * Step 1: resolve a WhatsApp media ID to a temporary download URL.
 * Returns { url, mime_type, sha256, file_size, id }.
 */
export async function getMediaUrl(mediaId) {
  const res = await fetch(`${BASE}/${mediaId}`, {
    headers: { Authorization: `Bearer ${env.WHATSAPP_TOKEN}` },
    signal:  AbortSignal.timeout(10_000),
  });
  if (!res.ok) throw new WhatsAppError(res.status, `getMediaUrl HTTP ${res.status}`);
  return res.json();
}

/**
 * Step 2: download media bytes from the resolved URL.
 * Returns a Buffer.
 */
export async function downloadMedia(mediaUrl) {
  const res = await fetch(mediaUrl, {
    headers: { Authorization: `Bearer ${env.WHATSAPP_TOKEN}` },
    signal:  AbortSignal.timeout(60_000),
  });
  if (!res.ok) throw new WhatsAppError(res.status, `downloadMedia HTTP ${res.status}`);
  return Buffer.from(await res.arrayBuffer());
}
