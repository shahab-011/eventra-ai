/**
 * BullMQ queue instances shared between the API server (job producers)
 * and the media worker (job consumers).
 *
 * Both processes import from this file; the Queue class is safe to instantiate
 * in multiple processes pointing at the same Redis keys.
 */
import { Queue } from 'bullmq';
import IORedis    from 'ioredis';
import env        from '../config/env.js';

// BullMQ requires maxRetriesPerRequest: null on its own connection.
export const bullConnection = new IORedis(env.REDIS_URL, {
  maxRetriesPerRequest: null,
  enableReadyCheck:     false,
});

bullConnection.on('error', err => {
  // Avoid unhandled rejection on transient connect failures
  console.error('[BullMQ Redis] connection error:', err.message);
});

const defaultJobOptions = {
  attempts:    3,
  backoff: { type: 'exponential', delay: 5000 },
  removeOnComplete: { count: 100 },
  removeOnFail:     { count: 200 },
};

/** Processes images and videos: generates thumb + web variant + watermark, extracts EXIF. */
export const processMediaQueue = new Queue('process-media', {
  connection:      bullConnection,
  defaultJobOptions,
});

/**
 * Queues face-detection tasks (module B7).
 * Worker reads this queue and calls the AI service.
 */
export const faceDetectQueue = new Queue('detect-faces', {
  connection:      bullConnection,
  defaultJobOptions,
});

/** Queues AI photo editing and culling tasks (module B10). */
export const editQueue = new Queue('edit-jobs', {
  connection:      bullConnection,
  defaultJobOptions,
});

/**
 * Queues outbound WhatsApp messages (module B11).
 * Lower concurrency in the worker to respect Meta rate limits.
 */
export const whatsappQueue = new Queue('whatsapp-jobs', {
  connection:      bullConnection,
  defaultJobOptions: {
    ...defaultJobOptions,
    attempts: 5,
    backoff: { type: 'exponential', delay: 10_000 },
  },
});
