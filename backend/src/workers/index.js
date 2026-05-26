/**
 * Worker bootstrap — runs ALL queue consumers in a single process.
 *
 * Start with:   npm run worker   (or: node src/workers/index.js)
 *
 * Concurrency per queue:
 *   process-media      4   — CPU-bound image/video pipeline
 *   detect-faces       2   — GPU-bound AI inference
 *   edit-jobs          2   — GPU-bound LUT + cull scoring
 *   whatsapp-jobs     10   — I/O-bound; rate-capped at 80 req/s
 *   report-jobs        1   — I/O-bound; serialised to avoid DB contention
 *   notification-jobs  5   — I/O-bound push/email
 *
 * Dead-letter queue:
 *   After a job exhausts all attempts, it is moved to the 'dead-letter-jobs'
 *   queue via moveToDLQ(). Inspect via GET /api/admin/jobs/dlq.
 *
 * Graceful shutdown:
 *   SIGTERM/SIGINT waits for in-flight jobs to finish (BullMQ worker.close()),
 *   then closes all Redis connections and the Prisma pool before exiting.
 */

import '../config/env.js';   // validate env at process start

import { Worker }   from 'bullmq';
import prisma       from '../lib/prisma.js';
import { bullConnection, moveToDLQ } from '../lib/queues.js';
import { closePublisher } from '../lib/realtime.js';
import logger       from '../lib/logger.js';

// ─── Processor imports ────────────────────────────────────────
// Each module exports its processor function and a cleanup() for its
// Redis publisher. Importing also lazy-inits the publisher connection.

import { processMedia,    cleanup as cleanupMedia    } from './mediaWorker.js';
import { processAI,       cleanup as cleanupAI       } from './aiWorker.js';
import { processEdit,     cleanup as cleanupEdit     } from './editWorker.js';
import { processWhatsApp, cleanup as cleanupWhatsApp } from './whatsappWorker.js';
import { processReport,   cleanup as cleanupReport   } from './reportsWorker.js';

// ─── Attach standard event handlers ──────────────────────────

function wire(worker, queueName) {
  worker.on('completed', job =>
    logger.info({ queueName, jobId: job.id, name: job.name }, '[workers] completed'),
  );
  worker.on('failed', async (job, err) => {
    logger.error({ queueName, jobId: job?.id, name: job?.name, err }, '[workers] failed');
    // Move to DLQ only after all retry attempts are exhausted
    if (job && job.attemptsMade >= (job.opts?.attempts ?? 3)) {
      await moveToDLQ(job, err).catch(dlqErr =>
        logger.error({ dlqErr }, '[workers] DLQ write failed'),
      );
    }
  });
  worker.on('error', err => logger.error({ queueName, err }, '[workers] worker error'));
  return worker;
}

// ─── Worker instances ─────────────────────────────────────────

const workers = [
  wire(new Worker('process-media', processMedia, {
    connection:  bullConnection,
    concurrency: 4,
  }), 'process-media'),

  wire(new Worker('detect-faces', processAI, {
    connection:  bullConnection,
    concurrency: 2,
  }), 'detect-faces'),

  wire(new Worker('edit-jobs', processEdit, {
    connection:  bullConnection,
    concurrency: 2,
  }), 'edit-jobs'),

  wire(new Worker('whatsapp-jobs', processWhatsApp, {
    connection:  bullConnection,
    concurrency: 10,
    // 80 messages per second — well under Meta's 1 000/s limit
    limiter:     { max: 80, duration: 1_000 },
  }), 'whatsapp-jobs'),

  wire(new Worker('report-jobs', processReport, {
    connection:  bullConnection,
    concurrency: 1,
  }), 'report-jobs'),

  // notification-jobs: lightweight push/email stub
  wire(new Worker('notification-jobs', async job => {
    logger.info({ jobId: job.id, name: job.name }, '[notificationWorker] received (stub)');
  }, {
    connection:  bullConnection,
    concurrency: 5,
  }), 'notification-jobs'),
];

logger.info('[workers] all workers started', {
  queues: ['process-media', 'detect-faces', 'edit-jobs', 'whatsapp-jobs', 'report-jobs', 'notification-jobs'],
});

// ─── Graceful shutdown ────────────────────────────────────────

async function shutdown(signal) {
  logger.info(`[workers] ${signal} received — draining all workers`);

  // Wait for in-flight jobs to finish (BullMQ default timeout 30s per worker)
  await Promise.allSettled(workers.map(w => w.close()));

  // Close the shared realtime publisher (used by all workers via lib/realtime.js)
  await closePublisher().catch(() => {});

  // These are now all no-ops but kept for future use
  await Promise.allSettled([
    cleanupMedia(),
    cleanupAI(),
    cleanupEdit(),
    cleanupWhatsApp(),
    cleanupReport(),
  ]);

  await bullConnection.quit().catch(() => {});
  await prisma.$disconnect().catch(() => {});

  logger.info('[workers] shutdown complete');
  process.exit(0);
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT',  () => shutdown('SIGINT'));

// Unhandled rejections should not crash silently
process.on('unhandledRejection', (reason, promise) => {
  logger.error({ reason, promise }, '[workers] unhandledRejection');
});
