/**
 * WhatsApp Outbound Worker
 * Run as: node src/workers/whatsappWorker.js
 *
 * Consumes the 'whatsapp-jobs' BullMQ queue.
 * Each job has a name matching a MessageType (lowercase-hyphenated) and carries:
 *   { messageId, guestId, eventId }
 *
 * Job types:
 *   invite               — RSVP invite; interactive buttons in session, template outside
 *   rsvp-confirmation    — post-RSVP confirmation (always template)
 *   photo-ready          — photos matched; gallery link
 *   itinerary-reminder   — event reminder N hours before start
 *   gallery-link         — on-demand gallery link
 *   custom               — free text in session, or named template outside
 *
 * Session window (Meta rule):
 *   If the guest messaged us within the last 24 h, we can send free-form text.
 *   Otherwise we MUST use a Meta-approved template.
 */

import '../config/env.js';

import { Worker } from 'bullmq';

import prisma             from '../lib/prisma.js';
import { bullConnection } from '../lib/queues.js';
import * as wa            from '../services/whatsappApi.js';
import { isInSession, setState } from '../lib/whatsappState.js';
import env                from '../config/env.js';
import logger             from '../lib/logger.js';

// ─── Context helpers ─────────────────────────────────────────

function fmtDate(d) {
  if (!d) return 'TBD';
  return new Date(d).toLocaleDateString('en-IN', {
    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
    timeZone: 'Asia/Kolkata',
  });
}

async function loadContext(messageId) {
  const msg = await prisma.whatsAppMessage.findUnique({
    where:   { id: messageId },
    include: {
      guest: { select: { id:true, name:true, phone:true, whatsappOptIn:true, eventId:true } },
    },
  });

  if (!msg) throw new Error(`WhatsAppMessage ${messageId} not found`);

  if (msg.status !== 'QUEUED') {
    logger.info({ messageId, status: msg.status }, '[whatsappWorker] skipping — not QUEUED');
    return null;
  }

  if (!msg.guest?.whatsappOptIn) {
    await prisma.whatsAppMessage.update({
      where: { id: messageId },
      data:  { status: 'FAILED', errorData: { reason: 'Guest not opted in' } },
    });
    return null;
  }

  const eventId = msg.eventId ?? msg.guest.eventId;
  const event   = eventId
    ? await prisma.event.findUnique({
        where:  { id: eventId },
        select: { id:true, name:true, startDate:true, endDate:true, venue:true },
      })
    : null;

  return { msg, guest: msg.guest, event, eventId };
}

async function markSent(messageId, result) {
  await prisma.whatsAppMessage.update({
    where: { id: messageId },
    data:  {
      status:      'SENT',
      waMessageId: result?.messages?.[0]?.id ?? null,
      sentAt:      new Date(),
    },
  });
}

async function markFailed(messageId, err) {
  await prisma.whatsAppMessage.update({
    where: { id: messageId },
    data:  {
      status:    'FAILED',
      errorData: { message: err.message, status: err.status, code: err.data?.code },
    },
  });
}

// ─── Job handlers ─────────────────────────────────────────────

async function handleInvite({ messageId }) {
  const ctx = await loadContext(messageId);
  if (!ctx) return;
  const { msg, guest, event, eventId } = ctx;

  const eventName = event?.name ?? 'your upcoming event';
  const eventDate = fmtDate(event?.startDate);
  const inSession = await isInSession(guest.phone);
  const tplName   = msg.templateName ?? 'eventra_invite_v1';

  let result;
  if (inSession) {
    result = await wa.sendInteractive(
      guest.phone,
      `Hi ${guest.name ?? 'there'}! You're invited to *${eventName}* on ${eventDate}.\n\nWill you be attending?`,
      [
        { id: 'rsvp_yes', title: "Yes, I'll attend ✓" },
        { id: 'rsvp_no',  title: "Sorry, can't make it" },
      ],
      `Invitation: ${eventName}`,
    );
  } else {
    result = await wa.sendTemplate(guest.phone, tplName, 'en_US', [
      { type: 'body', parameters: [
        { type: 'text', text: guest.name ?? 'Guest' },
        { type: 'text', text: eventName },
        { type: 'text', text: eventDate },
      ]},
    ]);
  }

  await markSent(messageId, result);
  await setState(guest.phone, 'awaiting_rsvp', { eventId, guestId: guest.id });
}

async function handleRsvpConfirmation({ messageId }) {
  const ctx = await loadContext(messageId);
  if (!ctx) return;
  const { msg, guest, event } = ctx;

  const result = await wa.sendTemplate(
    guest.phone, msg.templateName ?? 'eventra_rsvp_confirm_v1', 'en_US',
    [{ type: 'body', parameters: [
      { type: 'text', text: guest.name ?? 'Guest' },
      { type: 'text', text: event?.name ?? 'your event' },
      { type: 'text', text: fmtDate(event?.startDate) },
      { type: 'text', text: event?.venue ?? 'the venue' },
    ]}],
  );
  await markSent(messageId, result);
}

async function handlePhotoReady({ messageId }) {
  const ctx = await loadContext(messageId);
  if (!ctx) return;
  const { msg, guest, event, eventId } = ctx;

  const tokenRow = await prisma.galleryToken.findFirst({
    where:  { guestId: guest.id, eventId },
    select: { token: true },
  });
  const galleryUrl = tokenRow
    ? `${env.FRONTEND_URL}/gallery/${tokenRow.token}`
    : `${env.FRONTEND_URL}/gallery`;

  const inSession = await isInSession(guest.phone);
  let result;

  if (inSession) {
    result = await wa.sendText(
      guest.phone,
      `🎉 Your event photos are ready, ${guest.name ?? 'there'}!\n\nView your personalised gallery:\n${galleryUrl}\n\nLink valid for 7 days.`,
    );
  } else {
    result = await wa.sendTemplate(
      guest.phone, msg.templateName ?? 'eventra_photo_ready_v1', 'en_US',
      [
        { type: 'body', parameters: [
          { type: 'text', text: guest.name ?? 'Guest' },
          { type: 'text', text: event?.name ?? 'your event' },
        ]},
        { type: 'button', sub_type: 'url', index: '0',
          parameters: [{ type: 'text', text: tokenRow?.token ?? '' }] },
      ],
    );
  }
  await markSent(messageId, result);
}

async function handleItineraryReminder({ messageId }) {
  const ctx = await loadContext(messageId);
  if (!ctx) return;
  const { msg, guest, event } = ctx;

  const result = await wa.sendTemplate(
    guest.phone, msg.templateName ?? 'eventra_itinerary_v1', 'en_US',
    [{ type: 'body', parameters: [
      { type: 'text', text: guest.name ?? 'Guest' },
      { type: 'text', text: event?.name ?? 'your event' },
      { type: 'text', text: fmtDate(event?.startDate) },
      { type: 'text', text: event?.venue ?? 'the venue' },
    ]}],
  );
  await markSent(messageId, result);
}

async function handleGalleryLink({ messageId }) {
  const ctx = await loadContext(messageId);
  if (!ctx) return;
  const { msg, guest, event, eventId } = ctx;

  const tokenRow = await prisma.galleryToken.findFirst({
    where:  { guestId: guest.id, eventId },
    select: { token: true },
  });
  const galleryUrl = tokenRow
    ? `${env.FRONTEND_URL}/gallery/${tokenRow.token}`
    : `${env.FRONTEND_URL}/gallery`;

  const inSession = await isInSession(guest.phone);
  let result;

  if (inSession) {
    result = await wa.sendText(
      guest.phone,
      `Hi ${guest.name ?? 'there'}! Here's your gallery for *${event?.name ?? 'the event'}*:\n${galleryUrl}`,
    );
  } else {
    result = await wa.sendTemplate(
      guest.phone, msg.templateName ?? 'eventra_gallery_link_v1', 'en_US',
      [
        { type: 'body', parameters: [
          { type: 'text', text: guest.name ?? 'Guest' },
          { type: 'text', text: event?.name ?? 'your event' },
        ]},
        { type: 'button', sub_type: 'url', index: '0',
          parameters: [{ type: 'text', text: tokenRow?.token ?? '' }] },
      ],
    );
  }
  await markSent(messageId, result);
}

async function handleCustom({ messageId }) {
  const ctx = await loadContext(messageId);
  if (!ctx) return;
  const { msg, guest } = ctx;

  const inSession = await isInSession(guest.phone);
  let result;

  if (inSession && msg.body) {
    result = await wa.sendText(guest.phone, msg.body);
  } else if (msg.templateName) {
    result = await wa.sendTemplate(
      guest.phone, msg.templateName, 'en_US',
      msg.templateComponents ?? [],
    );
  } else {
    await markFailed(messageId, new Error('No session window and no template configured'));
    return;
  }
  await markSent(messageId, result);
}

// ─── Dispatch table ───────────────────────────────────────────

const HANDLERS = {
  'invite':              handleInvite,
  'rsvp-confirmation':   handleRsvpConfirmation,
  'rsvp_confirmation':   handleRsvpConfirmation,
  'photo-ready':         handlePhotoReady,
  'photo_ready':         handlePhotoReady,
  'itinerary-reminder':  handleItineraryReminder,
  'itinerary_reminder':  handleItineraryReminder,
  'gallery-link':        handleGalleryLink,
  'gallery_link':        handleGalleryLink,
  'custom':              handleCustom,
};

// ─── Worker ──────────────────────────────────────────────────

const worker = new Worker(
  'whatsapp-jobs',
  async job => {
    logger.info({ jobId: job.id, name: job.name }, '[whatsappWorker] processing');
    const handler = HANDLERS[job.name];
    if (!handler) {
      logger.warn({ name: job.name }, '[whatsappWorker] unknown job type, skipping');
      return;
    }
    try {
      await handler(job.data);
    } catch (err) {
      // Persist failure so the UI can show it even if BullMQ retries
      if (job.data?.messageId) {
        await markFailed(job.data.messageId, err).catch(() => {});
      }
      throw err; // re-throw so BullMQ retries according to job options
    }
  },
  { connection: bullConnection, concurrency: 3 },
);

worker.on('completed', job =>
  logger.info({ jobId: job.id, name: job.name }, '[whatsappWorker] completed'),
);
worker.on('failed', (job, err) =>
  logger.error({ jobId: job?.id, name: job?.name, err }, '[whatsappWorker] failed'),
);
worker.on('error', err =>
  logger.error({ err }, '[whatsappWorker] worker error'),
);

logger.info('[whatsappWorker] started — listening on whatsapp-jobs queue');

async function shutdown(signal) {
  logger.info(`[whatsappWorker] ${signal} — draining`);
  await worker.close();
  await prisma.$disconnect();
  process.exit(0);
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT',  () => shutdown('SIGINT'));
