/**
 * BullMQ queue definitions and typed enqueue helpers.
 *
 * Import Queue objects for direct use, or call the enqueue*() helpers
 * which embed job-name conventions and sensible jobId dedup keys.
 *
 * Dead-letter queue (DLQ):
 *   After a job exhausts all attempts the worker calls moveToDLQ(),
 *   which writes a permanent record to the 'dead-letter-jobs' queue.
 *   Inspect via GET /api/admin/jobs/dlq.
 */

import { Queue } from 'bullmq';
import IORedis    from 'ioredis';
import env        from '../config/env.js';

// ─── Shared Redis connection ──────────────────────────────────

export const bullConnection = new IORedis(env.REDIS_URL, {
  maxRetriesPerRequest: null,
  enableReadyCheck:     false,
});
bullConnection.on('error', err =>
  console.error('[BullMQ Redis] connection error:', err.message),
);

// ─── Default job options ──────────────────────────────────────

const base = {
  attempts:         3,
  backoff:          { type: 'exponential', delay: 5_000 },
  removeOnComplete: { count: 200 },
  removeOnFail:     { count: 500 },   // keep for inspection; DLQ gets a copy too
};

// ─── Queues ───────────────────────────────────────────────────

/** Images/videos: thumb + web variant + watermark + EXIF. */
export const processMediaQueue = new Queue('process-media', {
  connection:      bullConnection,
  defaultJobOptions: base,
});

/** Face detection + selfie matching (AI service). */
export const faceDetectQueue = new Queue('detect-faces', {
  connection:      bullConnection,
  defaultJobOptions: base,
});

/** AI photo editing (LUT apply) + auto-cull. */
export const editQueue = new Queue('edit-jobs', {
  connection:      bullConnection,
  defaultJobOptions: base,
});

/**
 * Outbound WhatsApp messages.
 * 5 attempts with a longer backoff to survive transient Meta errors.
 */
export const whatsappQueue = new Queue('whatsapp-jobs', {
  connection:      bullConnection,
  defaultJobOptions: {
    ...base,
    attempts: 5,
    backoff:  { type: 'exponential', delay: 10_000 },
  },
});

/** Async report generation (CSV exports, analytics PDFs). */
export const reportQueue = new Queue('report-jobs', {
  connection:      bullConnection,
  defaultJobOptions: { ...base, attempts: 2 },
});

/** Push / email notifications not covered by WhatsApp. */
export const notificationQueue = new Queue('notification-jobs', {
  connection:      bullConnection,
  defaultJobOptions: base,
});

/**
 * Dead-letter queue — permanent store for jobs that failed after all retries.
 * Jobs are never removed from this queue automatically (removeOnFail: false).
 */
export const dlq = new Queue('dead-letter-jobs', {
  connection:      bullConnection,
  defaultJobOptions: {
    removeOnComplete: false,
    removeOnFail:     false,
  },
});

// ─── Typed enqueue helpers ────────────────────────────────────

/**
 * Enqueue image/video processing.
 * @param {{ mediaId, eventId, key, mimeType, watermarkEnabled?, watermarkUrl?, studioName? }} data
 */
export const enqueueMediaProcess = (data, opts = {}) =>
  processMediaQueue.add('process', data, {
    jobId: `media-${data.mediaId}`,
    ...opts,
  });

/**
 * Enqueue face detection on a processed media thumbnail.
 * @param {{ mediaId, eventId, key, thumbnailUrl }} data
 */
export const enqueueFaceDetect = (data, opts = {}) =>
  faceDetectQueue.add('detect-faces', data, {
    jobId: `face-${data.mediaId}`,
    ...opts,
  });

/**
 * Enqueue selfie → face-match for a guest.
 * @param {{ guestId, eventId }} data
 */
export const enqueueMatchSelfie = (data, opts = {}) =>
  faceDetectQueue.add('match-selfie', data, {
    jobId: `selfie-${data.guestId}-${data.eventId}`,
    ...opts,
  });

/**
 * Enqueue a batch AI edit job.
 * @param {{ editJobId, eventId, mediaIds, lut, params }} data
 */
export const enqueueAutoEdit = (data, opts = {}) =>
  editQueue.add('auto-edit-batch', data, opts);

/**
 * Enqueue an auto-cull job for an event.
 * @param {{ editJobId, eventId }} data
 */
export const enqueueAutoCull = (data, opts = {}) =>
  editQueue.add('auto-cull', data, {
    jobId: `cull-${data.eventId}`,
    ...opts,
  });

/**
 * Enqueue an outbound WhatsApp message.
 * @param {'invite'|'rsvp-confirmation'|'photo-ready'|'itinerary-reminder'|'gallery-link'|'custom'} type
 * @param {{ messageId, guestId, eventId }} data
 */
export const enqueueWhatsApp = (type, data, opts = {}) =>
  whatsappQueue.add(type, data, opts);

/**
 * Enqueue an async report generation job.
 * @param {{ jobId, studioId, eventId?, reportType, params? }} data
 */
export const enqueueReport = (data, opts = {}) =>
  reportQueue.add('generate', data, {
    jobId: `report-${data.jobId}`,
    ...opts,
  });

/**
 * Enqueue a notification (push/email).
 * @param {string} type  e.g. 'push', 'email'
 * @param {{ jobId?, userId?, payload }} data
 */
export const enqueueNotification = (type, data, opts = {}) =>
  notificationQueue.add(type, data, opts);

// ─── Dead-letter queue helper ─────────────────────────────────

/**
 * Move a failed job into the DLQ after all retries are exhausted.
 * Call from worker 'failed' event handlers.
 */
export async function moveToDLQ(job, err) {
  await dlq.add('failed', {
    sourceQueue:  job.queueName,
    sourceJobId:  job.id,
    jobName:      job.name,
    data:         job.data,
    attemptsMade: job.attemptsMade,
    error:        { message: err?.message, stack: err?.stack },
    failedAt:     new Date().toISOString(),
  });
}
