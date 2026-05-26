/**
 * WhatsApp routes — mounted at /api/whatsapp
 *
 * Public (no JWT — Meta-verified):
 *   GET  /webhook            — Meta hub verification challenge
 *   POST /webhook            — inbound messages & status updates (sig verified)
 *
 * Studio-owner authenticated:
 *   GET  /templates          — list studio templates
 *   POST /templates          — create template mapping
 *   PATCH  /templates/:id    — update template
 *   DELETE /templates/:id    — delete template
 *
 *   GET  /automation-rules   — list automation rules
 *   POST /automation-rules   — create rule + schedule delayed jobs
 *   PATCH  /automation-rules/:id
 *   DELETE /automation-rules/:id
 *
 *   GET  /log                — message send-log (paginated, filterable)
 *   GET  /stats              — delivery stats for an event
 *   POST /send               — manual bulk-send to a list of guests
 *   POST /test-send          — send a one-off test message to any phone
 */

import crypto    from 'node:crypto';
import { Router } from 'express';
import { z }     from 'zod';
import { randomUUID } from 'node:crypto';

import prisma          from '../lib/prisma.js';
import { authenticate } from '../middleware/auth.js';
import { validate }    from '../lib/validate.js';
import { notFound, forbidden, badRequest, AppError } from '../lib/errors.js';
import { parsePagination } from '../lib/pagination.js';
import { whatsappQueue }   from '../lib/queues.js';
import { faceDetectQueue, processMediaQueue } from '../lib/queues.js';
import { getState, setState, clearState, touchSession, isInSession } from '../lib/whatsappState.js';
import * as wa from '../services/whatsappApi.js';
import { putObject, cdnUrl } from '../services/r2.js';
import env from '../config/env.js';
import logger from '../lib/logger.js';

const router = Router();

// ─── Auth helpers ─────────────────────────────────────────────

async function guardStudio(userId) {
  const studio = await prisma.studio.findUnique({
    where:  { ownerId: userId },
    select: { id: true },
  });
  if (!studio) throw new AppError(403, 'FORBIDDEN', 'Studio not found');
  return studio;
}

// ─── Schemas ─────────────────────────────────────────────────

const templateSchema = z.object({
  name:        z.string().min(1).max(100),
  displayName: z.string().min(1).max(100),
  language:    z.string().default('en_US'),
  category:    z.enum(['MARKETING', 'UTILITY', 'AUTHENTICATION']).default('UTILITY'),
  headerText:  z.string().max(60).optional(),
  body:        z.string().min(1).max(1024),
  footerText:  z.string().max(60).optional(),
  variables:   z.array(z.string()).default([]),
  isActive:    z.boolean().default(true),
});

const automationRuleSchema = z.object({
  name:         z.string().min(1).max(100),
  trigger:      z.enum(['GUEST_ADDED', 'EVENT_START', 'AFTER_EVENT', 'PHOTO_READY']),
  messageType:  z.enum(['INVITE','RSVP_CONFIRMATION','PHOTO_READY','ITINERARY_REMINDER','GALLERY_LINK','CUSTOM']).default('INVITE'),
  templateName: z.string().max(100).optional(),
  offsetHours:  z.number().int().min(0).max(8760).default(0),
  isActive:     z.boolean().default(true),
});

const sendSchema = z.object({
  eventId:      z.string().uuid(),
  guestIds:     z.array(z.string().uuid()).min(1).max(1000),
  type:         z.enum(['INVITE','RSVP_CONFIRMATION','PHOTO_READY','ITINERARY_REMINDER','GALLERY_LINK','CUSTOM']),
  templateName: z.string().max(100).optional(),
  body:         z.string().max(4096).optional(),
  scheduleAt:   z.coerce.date().optional(),
});

const testSendSchema = z.object({
  phone:        z.string().min(7).max(20),
  type:         z.enum(['text', 'template']).default('text'),
  body:         z.string().max(4096).optional(),
  templateName: z.string().max(100).optional(),
  language:     z.string().default('en_US'),
  components:   z.array(z.any()).default([]),
});

const logQuerySchema = z.object({
  eventId:  z.string().uuid().optional(),
  guestId:  z.string().uuid().optional(),
  status:   z.enum(['QUEUED','SENT','DELIVERED','READ','FAILED']).optional(),
  type:     z.enum(['INVITE','RSVP_CONFIRMATION','PHOTO_READY','ITINERARY_REMINDER','GALLERY_LINK','CUSTOM']).optional(),
  page:     z.coerce.number().int().positive().optional(),
  limit:    z.coerce.number().int().positive().max(200).optional(),
});

// ─── GET /webhook — Meta hub verification ────────────────────

router.get('/webhook', (req, res) => {
  const mode      = req.query['hub.mode'];
  const token     = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === env.WHATSAPP_VERIFY_TOKEN) {
    return res.status(200).send(challenge);
  }
  res.sendStatus(403);
});

// ─── POST /webhook — inbound messages & delivery receipts ─────

router.post('/webhook', (req, res) => {
  // Verify X-Hub-Signature-256 — uses the raw body captured in index.js
  const sig = req.headers['x-hub-signature-256'] ?? '';
  if (!verifyWebhookSignature(req.rawBody, sig)) {
    logger.warn({ sig }, '[webhook] invalid signature');
    return res.sendStatus(401);
  }

  // Respond 200 immediately — Meta will retry if we time out (>15 s)
  res.sendStatus(200);

  processWebhookPayload(req.body).catch(err =>
    logger.error({ err }, '[webhook] processing error'),
  );
});

// ─── Templates CRUD ───────────────────────────────────────────

router.get('/templates', authenticate, async (req, res, next) => {
  try {
    const studio = await guardStudio(req.user.userId);
    const templates = await prisma.whatsAppTemplate.findMany({
      where:   { studioId: studio.id },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ data: templates });
  } catch (err) { next(err); }
});

router.post('/templates', authenticate, validate(templateSchema), async (req, res, next) => {
  try {
    const studio = await guardStudio(req.user.userId);
    const tpl = await prisma.whatsAppTemplate.create({
      data: { ...req.body, studioId: studio.id },
    });
    res.status(201).json({ data: tpl });
  } catch (err) { next(err); }
});

router.patch('/templates/:id', authenticate, validate(templateSchema.partial()), async (req, res, next) => {
  try {
    const studio = await guardStudio(req.user.userId);
    const tpl = await prisma.whatsAppTemplate.findUnique({ where: { id: req.params.id } });
    if (!tpl) return next(notFound('Template not found'));
    if (tpl.studioId !== studio.id) return next(forbidden('Not your template'));

    const updated = await prisma.whatsAppTemplate.update({
      where: { id: tpl.id },
      data:  req.body,
    });
    res.json({ data: updated });
  } catch (err) { next(err); }
});

router.delete('/templates/:id', authenticate, async (req, res, next) => {
  try {
    const studio = await guardStudio(req.user.userId);
    const tpl = await prisma.whatsAppTemplate.findUnique({ where: { id: req.params.id } });
    if (!tpl) return next(notFound('Template not found'));
    if (tpl.studioId !== studio.id) return next(forbidden('Not your template'));

    await prisma.whatsAppTemplate.delete({ where: { id: tpl.id } });
    res.json({ data: { deleted: true } });
  } catch (err) { next(err); }
});

// ─── Automation Rules CRUD ────────────────────────────────────

router.get('/automation-rules', authenticate, async (req, res, next) => {
  try {
    const studio = await guardStudio(req.user.userId);
    const rules = await prisma.automationRule.findMany({
      where:   { studioId: studio.id },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ data: rules });
  } catch (err) { next(err); }
});

router.post('/automation-rules', authenticate, validate(automationRuleSchema), async (req, res, next) => {
  try {
    const studio = await guardStudio(req.user.userId);
    const rule = await prisma.automationRule.create({
      data: { ...req.body, studioId: studio.id },
    });
    res.status(201).json({ data: rule });
  } catch (err) { next(err); }
});

router.patch('/automation-rules/:id', authenticate, validate(automationRuleSchema.partial()), async (req, res, next) => {
  try {
    const studio = await guardStudio(req.user.userId);
    const rule = await prisma.automationRule.findUnique({ where: { id: req.params.id } });
    if (!rule) return next(notFound('Automation rule not found'));
    if (rule.studioId !== studio.id) return next(forbidden('Not your rule'));

    const updated = await prisma.automationRule.update({
      where: { id: rule.id },
      data:  req.body,
    });
    res.json({ data: updated });
  } catch (err) { next(err); }
});

router.delete('/automation-rules/:id', authenticate, async (req, res, next) => {
  try {
    const studio = await guardStudio(req.user.userId);
    const rule = await prisma.automationRule.findUnique({ where: { id: req.params.id } });
    if (!rule) return next(notFound('Automation rule not found'));
    if (rule.studioId !== studio.id) return next(forbidden('Not your rule'));

    await prisma.automationRule.delete({ where: { id: rule.id } });
    res.json({ data: { deleted: true } });
  } catch (err) { next(err); }
});

// ─── GET /log — message send-log ─────────────────────────────

router.get('/log', authenticate, validate(logQuerySchema, 'query'), async (req, res, next) => {
  try {
    const studio = await guardStudio(req.user.userId);
    const { page, skip, take } = parsePagination(req.query);

    // Scope to this studio's events only
    const { eventId, guestId, status, type } = req.query;

    const where = {
      ...(eventId && { eventId }),
      ...(guestId && { guestId }),
      ...(status  && { status }),
      ...(type    && { type }),
      // Ensure messages belong to this studio
      guest: { event: { studioId: studio.id } },
    };

    const [messages, total] = await Promise.all([
      prisma.whatsAppMessage.findMany({
        where,
        include: { guest: { select: { id:true, name:true, phone:true } } },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      prisma.whatsAppMessage.count({ where }),
    ]);

    res.json({
      data: messages,
      meta: { page, limit: take, total, pages: Math.ceil(total / take) },
    });
  } catch (err) { next(err); }
});

// ─── GET /stats ───────────────────────────────────────────────

router.get('/stats', authenticate, async (req, res, next) => {
  try {
    const { eventId } = req.query;
    if (!eventId) return next(badRequest('eventId is required'));

    const studio = await guardStudio(req.user.userId);
    const event  = await prisma.event.findFirst({
      where: { id: eventId, studioId: studio.id },
    });
    if (!event) return next(notFound('Event not found'));

    const [queued, sent, delivered, read, failed] = await Promise.all([
      prisma.whatsAppMessage.count({ where: { eventId, status: 'QUEUED'    } }),
      prisma.whatsAppMessage.count({ where: { eventId, status: 'SENT'      } }),
      prisma.whatsAppMessage.count({ where: { eventId, status: 'DELIVERED' } }),
      prisma.whatsAppMessage.count({ where: { eventId, status: 'READ'      } }),
      prisma.whatsAppMessage.count({ where: { eventId, status: 'FAILED'    } }),
    ]);

    const total = queued + sent + delivered + read + failed;
    res.json({
      data: {
        total, queued, sent, delivered, read, failed,
        deliveryRate: total > 0 ? Math.round(((delivered + read) / total) * 100) : 0,
        readRate:     total > 0 ? Math.round((read / total) * 100)               : 0,
      },
    });
  } catch (err) { next(err); }
});

// ─── POST /send — manual bulk send ───────────────────────────

router.post('/send', authenticate, validate(sendSchema), async (req, res, next) => {
  try {
    const studio = await guardStudio(req.user.userId);
    const { eventId, guestIds, type, templateName, body, scheduleAt } = req.body;

    const event = await prisma.event.findFirst({
      where: { id: eventId, studioId: studio.id },
    });
    if (!event) return next(notFound('Event not found'));

    const delay = scheduleAt ? Math.max(0, new Date(scheduleAt) - Date.now()) : 0;

    const messages = await prisma.$transaction(
      guestIds.map(guestId =>
        prisma.whatsAppMessage.create({
          data: { guestId, eventId, type, templateName, body, status: 'QUEUED' },
        }),
      ),
    );

    await Promise.all(
      messages.map(msg =>
        whatsappQueue.add(
          type.toLowerCase().replace('_', '-'),
          { messageId: msg.id, guestId: msg.guestId, eventId },
          { delay, jobId: `manual-${msg.id}` },
        ),
      ),
    );

    res.status(202).json({ data: { queued: messages.length } });
  } catch (err) { next(err); }
});

// ─── POST /test-send ──────────────────────────────────────────

router.post('/test-send', authenticate, validate(testSendSchema), async (req, res, next) => {
  try {
    await guardStudio(req.user.userId);
    const { phone, type, body, templateName, language, components } = req.body;

    // Normalise phone — add + if missing
    const to = phone.startsWith('+') ? phone : `+${phone}`;

    let result;
    if (type === 'text') {
      if (!body) return next(badRequest('body required for text test-send'));
      result = await wa.sendText(to, body);
    } else {
      if (!templateName) return next(badRequest('templateName required for template test-send'));
      result = await wa.sendTemplate(to, templateName, language, components);
    }

    res.json({ data: { waMessageId: result?.messages?.[0]?.id, sent: true } });
  } catch (err) { next(err); }
});

// ─── Webhook helpers ──────────────────────────────────────────

function verifyWebhookSignature(rawBody, signature) {
  if (!rawBody || !signature) return false;
  const expected = 'sha256=' + crypto
    .createHmac('sha256', env.WHATSAPP_APP_SECRET)
    .update(rawBody)
    .digest('hex');
  try {
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
  } catch {
    return false;
  }
}

// ─── Inbound payload processor (async, after 200 is sent) ────

async function processWebhookPayload(body) {
  if (body?.object !== 'whatsapp_business_account') return;

  for (const entry of body.entry ?? []) {
    for (const change of entry.changes ?? []) {
      if (change.field !== 'messages') continue;
      const value = change.value;

      // Status updates (delivery/read receipts)
      for (const status of value.statuses ?? []) {
        await processStatusUpdate(status).catch(err =>
          logger.error({ err, statusId: status.id }, '[webhook] status update failed'),
        );
      }

      // Inbound messages
      for (const message of value.messages ?? []) {
        const contact = value.contacts?.[0];
        await processInboundMessage(message, contact).catch(err =>
          logger.error({ err, waId: message.id }, '[webhook] inbound message failed'),
        );
      }
    }
  }
}

// ─── Delivery/read status update ─────────────────────────────

async function processStatusUpdate(status) {
  const statusMap = {
    sent:      'SENT',
    delivered: 'DELIVERED',
    read:      'READ',
    failed:    'FAILED',
  };
  const msgStatus = statusMap[status.status];
  if (!msgStatus) return;

  const ts     = new Date(parseInt(status.timestamp, 10) * 1000);
  const update = { status: msgStatus };
  if (msgStatus === 'DELIVERED') update.deliveredAt = ts;
  if (msgStatus === 'READ')      update.readAt      = ts;
  if (msgStatus === 'FAILED')    update.errorData   = status.errors?.[0] ?? { code: 'UNKNOWN' };

  await prisma.whatsAppMessage.updateMany({
    where: { waMessageId: status.id },
    data:  update,
  });
}

// ─── Inbound message dispatcher ──────────────────────────────

async function processInboundMessage(message, contact) {
  // WhatsApp sends phone without '+'; our DB stores it with '+'
  const phone = '+' + message.from;

  // Refresh the 24-h free-form session window
  await touchSession(phone);

  // Mark as read (turns double-tick blue) — fire-and-forget
  wa.markRead(message.id).catch(() => {});

  // Look up guest — prefer the state's guestId, fall back to most-recent registration
  const state = await getState(phone);
  let guest;

  if (state.guestId) {
    guest = await prisma.guest.findUnique({
      where:   { id: state.guestId },
      include: { event: { select: { id:true, name:true, studioId:true } } },
    });
  }

  if (!guest) {
    guest = await prisma.guest.findFirst({
      where:   { phone, deletedAt: null },
      orderBy: { createdAt: 'desc' },
      include: { event: { select: { id:true, name:true, studioId:true } } },
    });
  }

  if (!guest) {
    await wa.sendText(
      phone,
      "Hi! I don't recognise your number. Please ask your event organiser to register you.",
    ).catch(() => {});
    return;
  }

  // Ensure state has guestId/eventId set
  if (!state.guestId) {
    await setState(phone, state.state ?? 'idle', { eventId: guest.eventId, guestId: guest.id });
  }

  const guestId = state.guestId ?? guest.id;
  const eventId = state.eventId ?? guest.eventId;

  switch (message.type) {
    case 'text':
      await handleInboundText(phone, message.text.body, guestId, eventId, state);
      break;
    case 'image':
      await handleInboundImage(phone, message.image, guestId, eventId, state);
      break;
    case 'interactive':
      await handleInboundInteractive(phone, message.interactive, guestId, eventId);
      break;
    case 'video':
    case 'audio':
    case 'document':
      await handleInboundMedia(phone, message[message.type], message.type, guestId, eventId);
      break;
    default:
      await wa.sendText(phone, menuText()).catch(() => {});
  }

  // Update last-contact timestamp
  await prisma.guest.update({
    where: { id: guestId },
    data:  { lastNotifiedAt: new Date() },
  }).catch(() => {});
}

// ─── Inbound handlers ─────────────────────────────────────────

const YES_WORDS  = new Set(['YES', 'Y', '1', 'CONFIRM', 'ATTENDING', 'HANJI', 'HA']);
const NO_WORDS   = new Set(['NO', 'N', '0', 'DECLINE', 'CANT', 'SORRY', 'CANNOT', 'NAHI']);
const STOP_WORDS = new Set(['STOP', 'UNSUBSCRIBE', 'OPT-OUT', 'OPTOUT', 'REMOVE']);
const START_WORDS = new Set(['START', 'SUBSCRIBE', 'OPT-IN', 'OPTIN', 'JOIN', 'REGISTER']);

async function handleInboundText(phone, text, guestId, eventId, state) {
  const cmd = text.trim().toUpperCase();

  if (YES_WORDS.has(cmd)) {
    await prisma.guest.update({
      where: { id: guestId },
      data:  { rsvpStatus: 'CONFIRMED', whatsappOptIn: true },
    });
    await clearState(phone);
    await wa.sendText(phone, '✅ Great! Your attendance has been confirmed. See you there!');

    const msg = await prisma.whatsAppMessage.create({
      data: { guestId, eventId, type: 'RSVP_CONFIRMATION', status: 'QUEUED' },
    });
    await whatsappQueue.add('rsvp-confirmation', { messageId: msg.id, guestId, eventId });

  } else if (NO_WORDS.has(cmd)) {
    await prisma.guest.update({
      where: { id: guestId },
      data:  { rsvpStatus: 'DECLINED' },
    });
    await clearState(phone);
    await wa.sendText(phone, "We're sorry you can't make it. We hope to see you at future events! 😊");

  } else if (STOP_WORDS.has(cmd)) {
    await prisma.guest.update({
      where: { id: guestId },
      data:  { whatsappOptIn: false },
    });
    await clearState(phone);
    await wa.sendText(
      phone,
      "You've been unsubscribed from event notifications. Reply START to re-subscribe.",
    );

  } else if (START_WORDS.has(cmd)) {
    await prisma.guest.update({
      where: { id: guestId },
      data:  { whatsappOptIn: true },
    });
    await wa.sendText(phone, "You're now subscribed to event notifications. 🎉");

  } else if (['GALLERY', 'PHOTOS', 'PICS', 'LINK'].includes(cmd)) {
    const msg = await prisma.whatsAppMessage.create({
      data: { guestId, eventId, type: 'GALLERY_LINK', status: 'QUEUED' },
    });
    await whatsappQueue.add('gallery-link', { messageId: msg.id, guestId, eventId });

  } else if (state.state === 'awaiting_selfie' && ['SKIP', 'LATER'].includes(cmd)) {
    await clearState(phone);
    await wa.sendText(phone, "No problem! You can upload your selfie later through the event link.");

  } else {
    await wa.sendText(phone, menuText());
  }
}

async function handleInboundImage(phone, imagePayload, guestId, eventId, state) {
  try {
    const { url: mediaUrl, mime_type: mimeType } = await wa.getMediaUrl(imagePayload.id);
    const buf = await wa.downloadMedia(mediaUrl);
    const ext = mimeType.includes('png') ? 'png' : 'jpg';

    if (state.state === 'awaiting_selfie') {
      // Treat as selfie — embed + match faces
      const key = `events/${eventId}/selfies/${guestId}.${ext}`;
      await putObject(key, buf, mimeType);
      const selfieUrl = cdnUrl(key);

      await prisma.guest.update({ where: { id: guestId }, data: { selfieUrl } });
      await faceDetectQueue.add('match-selfie', { guestId, eventId });
      await clearState(phone);

      await wa.sendText(
        phone,
        "📸 Got it! We're matching your face with the event photos. You'll be notified when your gallery is ready!",
      );
    } else {
      // Guest media contribution — add to gallery
      const mediaId = randomUUID();
      const key     = `events/${eventId}/originals/${mediaId}.${ext}`;

      await putObject(key, buf, mimeType);
      await prisma.media.create({
        data: {
          id:           mediaId,
          eventId,
          filename:     `wa_${mediaId}.${ext}`,
          key,
          mimeType,
          sizeBytes:    BigInt(buf.length),
          status:       'PROCESSING',
          uploadSource: 'GUEST_UPLOAD',
          processedUrl: cdnUrl(key),
        },
      });
      await processMediaQueue.add('process-media', { mediaId, eventId, key, mimeType });
      await wa.sendText(phone, '📷 Photo received and added to the event gallery. Thank you!');
    }
  } catch (err) {
    logger.error({ err, guestId }, '[webhook] inbound image processing failed');
    await wa.sendText(phone, 'Sorry, there was a problem processing your photo. Please try again.').catch(() => {});
  }
}

async function handleInboundInteractive(phone, interactive, guestId, eventId) {
  if (interactive.type !== 'button_reply') return;
  const buttonId = interactive.button_reply?.id;

  if (buttonId === 'rsvp_yes') {
    await prisma.guest.update({ where: { id: guestId }, data: { rsvpStatus: 'CONFIRMED' } });
    await clearState(phone);
    await wa.sendText(phone, '✅ Attendance confirmed! See you there!');

    const msg = await prisma.whatsAppMessage.create({
      data: { guestId, eventId, type: 'RSVP_CONFIRMATION', status: 'QUEUED' },
    });
    await whatsappQueue.add('rsvp-confirmation', { messageId: msg.id, guestId, eventId });

  } else if (buttonId === 'rsvp_no') {
    await prisma.guest.update({ where: { id: guestId }, data: { rsvpStatus: 'DECLINED' } });
    await clearState(phone);
    await wa.sendText(phone, "We're sorry to hear that. Hope to see you next time!");
  }
}

async function handleInboundMedia(phone, _payload, _type, _guestId, _eventId) {
  // Non-image media — acknowledge but don't store (easy to extend later)
  await wa.sendText(phone, 'Thanks for sharing! Only photos can be added to the gallery right now.');
}

function menuText() {
  return (
    `Hi! Here's what you can do:\n\n` +
    `📸 Send a *selfie photo* — get matched to your event pictures\n` +
    `📷 Reply *GALLERY* — get your gallery link\n` +
    `✅ Reply *YES* — confirm attendance\n` +
    `❌ Reply *NO* — decline attendance\n` +
    `🚫 Reply *STOP* — unsubscribe from notifications`
  );
}

export default router;
