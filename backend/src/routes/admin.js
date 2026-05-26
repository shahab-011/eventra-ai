/**
 * Admin routes — mounted at /api/admin
 * Requires: authenticated + UserRole.SUPER_ADMIN
 *
 * GET  /jobs/failed?queue=&offset=&limit=   — inspect BullMQ failed jobs
 * GET  /jobs/dlq?offset=&limit=             — inspect dead-letter queue
 * POST /jobs/failed/:id/retry               — re-queue a specific failed job
 * DELETE /jobs/failed/:id                   — discard a failed job
 * DELETE /jobs/dlq/:id                      — discard a dead-letter entry
 */

import { Router }   from 'express';
import { z }        from 'zod';

import prisma       from '../lib/prisma.js';
import { authenticate } from '../middleware/auth.js';
import { forbidden, notFound, badRequest } from '../lib/errors.js';
import {
  processMediaQueue, faceDetectQueue, editQueue,
  whatsappQueue, reportQueue, notificationQueue, dlq,
} from '../lib/queues.js';
import logger       from '../lib/logger.js';

const router = Router();

// ─── Auth: SUPER_ADMIN only ───────────────────────────────────

function requireSuperAdmin(req, res, next) {
  if (req.user?.role !== 'SUPER_ADMIN') return next(forbidden('Restricted to super admins'));
  next();
}

// ─── Queue name → Queue instance map ─────────────────────────

const QUEUES = {
  'process-media':     processMediaQueue,
  'detect-faces':      faceDetectQueue,
  'edit-jobs':         editQueue,
  'whatsapp-jobs':     whatsappQueue,
  'report-jobs':       reportQueue,
  'notification-jobs': notificationQueue,
  'dead-letter-jobs':  dlq,
};
const QUEUE_NAMES = Object.keys(QUEUES).filter(k => k !== 'dead-letter-jobs');

function serializeJob(job) {
  return {
    id:           job.id,
    name:         job.name,
    queue:        job.queueName,
    data:         job.data,
    opts:         job.opts,
    attemptsMade: job.attemptsMade,
    failedReason: job.failedReason,
    stacktrace:   job.stacktrace,
    timestamp:    job.timestamp,
    processedOn:  job.processedOn,
    finishedOn:   job.finishedOn,
  };
}

// ─── GET /jobs/failed ─────────────────────────────────────────

router.get('/jobs/failed',
  authenticate, requireSuperAdmin,
  async (req, res, next) => {
    try {
      const queueName = req.query.queue;
      const offset    = Math.max(0, parseInt(req.query.offset ?? '0', 10));
      const limit     = Math.min(100, Math.max(1, parseInt(req.query.limit ?? '50', 10)));

      let jobs;

      if (queueName) {
        const q = QUEUES[queueName];
        if (!q) return next(badRequest(`Unknown queue: ${queueName}. Valid: ${QUEUE_NAMES.join(', ')}`));
        jobs = (await q.getFailed(offset, offset + limit - 1)).map(j => ({ ...serializeJob(j), queue: queueName }));
      } else {
        // Aggregate failed jobs across all queues
        const perQueue = await Promise.all(
          QUEUE_NAMES.map(async name => {
            const failed = await QUEUES[name].getFailed(0, 49);
            return failed.map(j => ({ ...serializeJob(j), queue: name }));
          }),
        );
        const all = perQueue.flat().sort((a, b) => b.finishedOn - a.finishedOn);
        jobs = all.slice(offset, offset + limit);
      }

      res.json({ data: jobs, meta: { offset, limit, count: jobs.length } });
    } catch (err) { next(err); }
  },
);

// ─── GET /jobs/dlq ────────────────────────────────────────────

router.get('/jobs/dlq',
  authenticate, requireSuperAdmin,
  async (req, res, next) => {
    try {
      const offset = Math.max(0, parseInt(req.query.offset ?? '0', 10));
      const limit  = Math.min(100, Math.max(1, parseInt(req.query.limit ?? '50', 10)));

      // DLQ jobs land as 'waiting' in the dead-letter-jobs queue
      const jobs = await dlq.getJobs(['waiting'], offset, offset + limit - 1);

      res.json({
        data: jobs.map(j => ({
          id:          j.id,
          sourceQueue: j.data.sourceQueue,
          sourceJobId: j.data.sourceJobId,
          jobName:     j.data.jobName,
          data:        j.data.data,
          error:       j.data.error,
          failedAt:    j.data.failedAt,
          attemptsMade: j.data.attemptsMade,
          enqueuedAt:  j.timestamp,
        })),
        meta: { offset, limit, count: jobs.length },
      });
    } catch (err) { next(err); }
  },
);

// ─── POST /jobs/failed/:id/retry ─────────────────────────────
// Re-enqueues a failed BullMQ job. Requires ?queue= param.

router.post('/jobs/failed/:id/retry',
  authenticate, requireSuperAdmin,
  async (req, res, next) => {
    try {
      const queueName = req.query.queue;
      if (!queueName) return next(badRequest('?queue= parameter is required'));

      const q = QUEUES[queueName];
      if (!q) return next(badRequest(`Unknown queue: ${queueName}`));

      const job = await q.getJob(req.params.id);
      if (!job) return next(notFound('Job not found'));

      await job.retry();
      logger.info({ jobId: job.id, queue: queueName }, '[admin] job retried');
      res.json({ data: { retried: true, jobId: job.id } });
    } catch (err) { next(err); }
  },
);

// ─── DELETE /jobs/failed/:id ──────────────────────────────────

router.delete('/jobs/failed/:id',
  authenticate, requireSuperAdmin,
  async (req, res, next) => {
    try {
      const queueName = req.query.queue;
      if (!queueName) return next(badRequest('?queue= parameter is required'));

      const q = QUEUES[queueName];
      if (!q) return next(badRequest(`Unknown queue: ${queueName}`));

      const job = await q.getJob(req.params.id);
      if (!job) return next(notFound('Job not found'));

      await job.remove();
      logger.info({ jobId: job.id, queue: queueName }, '[admin] failed job removed');
      res.json({ data: { removed: true } });
    } catch (err) { next(err); }
  },
);

// ─── DELETE /jobs/dlq/:id ─────────────────────────────────────

router.delete('/jobs/dlq/:id',
  authenticate, requireSuperAdmin,
  async (req, res, next) => {
    try {
      const job = await dlq.getJob(req.params.id);
      if (!job) return next(notFound('DLQ entry not found'));

      await job.remove();
      logger.info({ jobId: job.id }, '[admin] DLQ entry removed');
      res.json({ data: { removed: true } });
    } catch (err) { next(err); }
  },
);

// ─── GET /jobs/counts — queue health overview ─────────────────

router.get('/jobs/counts',
  authenticate, requireSuperAdmin,
  async (req, res, next) => {
    try {
      const counts = await Promise.all(
        [...QUEUE_NAMES, 'dead-letter-jobs'].map(async name => {
          const q      = QUEUES[name];
          const active    = await q.getActiveCount();
          const waiting   = await q.getWaitingCount();
          const completed = await q.getCompletedCount();
          const failed    = await q.getFailedCount();
          const delayed   = await q.getDelayedCount();
          return { name, active, waiting, completed, failed, delayed };
        }),
      );
      res.json({ data: counts });
    } catch (err) { next(err); }
  },
);

export default router;
