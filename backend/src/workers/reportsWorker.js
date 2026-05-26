/**
 * Reports Worker — async report generation.
 *
 * Exports:
 *   processReport(job)  — processor for workers/index.js
 *   cleanup()           — no-op
 *
 * Standalone: node src/workers/reportsWorker.js
 *
 * Supported job names:
 *   generate  — { jobId, studioId, eventId?, reportType, params? }
 *
 * reportType values:
 *   guest-csv       — CSV export of all guests for an event
 *   media-stats     — media counts, upload sources, processing status
 *   delivery-report — WhatsApp delivery stats summary
 *
 * The Job row (id = jobId) must already exist in the DB before enqueueing.
 * The worker updates status → RUNNING/DONE/FAILED and stores result JSON.
 */

import '../config/env.js';

import { fileURLToPath } from 'node:url';

import prisma            from '../lib/prisma.js';
import { bullConnection } from '../lib/queues.js';
import { putObject, cdnUrl } from '../services/r2.js';
import logger            from '../lib/logger.js';

export function cleanup() { return Promise.resolve(); }

// ─── Report generators ────────────────────────────────────────

async function guestCsv({ jobId, studioId, eventId }) {
  const guests = await prisma.guest.findMany({
    where:   { eventId, deletedAt: null },
    select:  { name: true, phone: true, rsvpStatus: true, guestType: true, photosReceived: true, createdAt: true },
    orderBy: { createdAt: 'asc' },
  });

  const header = 'Name,Phone,RSVP,Type,Photos,RegisteredAt';
  const rows   = guests.map(g =>
    [g.name ?? '', g.phone, g.rsvpStatus, g.guestType, g.photosReceived, g.createdAt.toISOString()]
      .map(v => `"${String(v).replace(/"/g, '""')}"`)
      .join(','),
  );
  const csv = [header, ...rows].join('\n');

  const key = `reports/${studioId}/${eventId}/guests-${Date.now()}.csv`;
  await putObject(key, Buffer.from(csv, 'utf8'), 'text/csv');
  return { downloadUrl: cdnUrl(key), rowCount: guests.length };
}

async function mediaStats({ eventId }) {
  const [total, bySource, byStatus] = await Promise.all([
    prisma.media.count({ where: { eventId } }),
    prisma.media.groupBy({ by: ['uploadSource'], where: { eventId }, _count: { id: true } }),
    prisma.media.groupBy({ by: ['status'],       where: { eventId }, _count: { id: true } }),
  ]);
  return {
    total,
    bySource: Object.fromEntries(bySource.map(r => [r.uploadSource, r._count.id])),
    byStatus: Object.fromEntries(byStatus.map(r => [r.status,       r._count.id])),
  };
}

async function deliveryReport({ eventId }) {
  const counts = await Promise.all(
    ['QUEUED', 'SENT', 'DELIVERED', 'READ', 'FAILED'].map(s =>
      prisma.whatsAppMessage.count({ where: { eventId, status: s } }).then(n => [s, n]),
    ),
  );
  const stats  = Object.fromEntries(counts);
  const total  = Object.values(stats).reduce((a, b) => a + b, 0);
  return {
    ...stats,
    total,
    deliveryRate: total > 0 ? Math.round(((stats.DELIVERED + stats.READ) / total) * 100) : 0,
    readRate:     total > 0 ? Math.round((stats.READ / total) * 100) : 0,
  };
}

const GENERATORS = {
  'guest-csv':       guestCsv,
  'media-stats':     mediaStats,
  'delivery-report': deliveryReport,
};

// ─── Exported processor ───────────────────────────────────────

export async function processReport(job) {
  const { jobId, reportType, studioId, eventId, params = {} } = job.data;
  logger.info({ jobId, reportType }, '[reportsWorker] processing');

  // Update Job status → RUNNING
  if (jobId) {
    await prisma.job.update({ where: { id: jobId }, data: { status: 'RUNNING' } }).catch(() => {});
  }

  const generator = GENERATORS[reportType];
  if (!generator) {
    const err = new Error(`Unknown reportType: ${reportType}`);
    if (jobId) {
      await prisma.job.update({ where: { id: jobId }, data: { status: 'FAILED', error: err.message } }).catch(() => {});
    }
    throw err;
  }

  try {
    const result = await generator({ jobId, studioId, eventId, ...params });

    if (jobId) {
      await prisma.job.update({
        where: { id: jobId },
        data:  { status: 'DONE', done: 1, total: 1, result },
      }).catch(() => {});
    }

    logger.info({ jobId, reportType }, '[reportsWorker] done');
    return result;

  } catch (err) {
    logger.error({ err, jobId, reportType }, '[reportsWorker] failed');
    if (jobId) {
      await prisma.job.update({ where: { id: jobId }, data: { status: 'FAILED', error: err.message } }).catch(() => {});
    }
    throw err;
  }
}

// ─── Standalone runner ────────────────────────────────────────

const __file = fileURLToPath(import.meta.url).replace(/\\/g, '/');
const isMain = process.argv[1] && process.argv[1].replace(/\\/g, '/') === __file;

if (isMain) {
  const { Worker } = await import('bullmq');

  const worker = new Worker('report-jobs', processReport, {
    connection:  bullConnection,
    concurrency: 1,
  });

  worker.on('completed', job => logger.info({ jobId: job.id, name: job.name }, '[reportsWorker] completed'));
  worker.on('failed',    (job, err) => logger.error({ jobId: job?.id, name: job?.name, err }, '[reportsWorker] failed'));
  worker.on('error',     err => logger.error({ err }, '[reportsWorker] worker error'));
  logger.info('[reportsWorker] started standalone — listening on report-jobs');

  const shutdown = async signal => {
    logger.info(`[reportsWorker] ${signal} — draining`);
    await worker.close();
    await prisma.$disconnect();
    process.exit(0);
  };
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT',  () => shutdown('SIGINT'));
}
