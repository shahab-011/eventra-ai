/**
 * Edit Worker — AI photo editing + culling
 * Run as a separate process: node src/workers/editWorker.js
 *
 * Processes two job types from the 'edit-jobs' BullMQ queue:
 *
 *   auto-edit-batch { editJobId, eventId, mediaIds[], lut, params }
 *     → calls Python /auto-edit for each image, uploads result to R2,
 *       sets Media.processedUrl + aiEdited=true, tracks progress via EditJob.
 *
 *   auto-cull { editJobId, eventId }
 *     → calls Python /cull-score for every READY image, groups near-duplicates
 *       by perceptual hash (Hamming distance < 10), keeps the highest-scoring
 *       image per cluster, marks the rest SUGGESTED_REJECT. Does NOT delete.
 */

import '../config/env.js';

import { Worker }     from 'bullmq';
import IORedis        from 'ioredis';

import prisma         from '../lib/prisma.js';
import { bullConnection } from '../lib/queues.js';
import { putObject, cdnUrl } from '../services/r2.js';
import env            from '../config/env.js';
import logger         from '../lib/logger.js';

// ─── Redis publisher for Socket.IO inter-process relay ────────
const publisher = new IORedis(env.REDIS_URL, { maxRetriesPerRequest: null });
publisher.on('error', err => logger.warn({ err }, '[editWorker] Redis error'));

async function emit(eventId, event, data) {
  await publisher.publish('media:events', JSON.stringify({ room: `event:${eventId}`, event, data }));
}

// ─── HTTP helper — calls the Python AI service ────────────────

async function callAI(path, body) {
  const url = `${env.AI_SERVICE_URL}${path}`;
  const res  = await fetch(url, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(body),
    signal:  AbortSignal.timeout(60_000),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(`AI service ${path} → HTTP ${res.status}: ${err.detail ?? JSON.stringify(err)}`);
  }
  return res.json();
}

// ─── Perceptual hash helpers ──────────────────────────────────

/** Count differing bits between two 16-char hex dHash strings (Hamming distance). */
function hammingDistance(a, b) {
  if (!a || !b || a.length !== b.length) return 64;
  let dist = 0;
  const lenWords = a.length / 16;  // process in 64-bit words
  for (let i = 0; i < a.length; i += 16) {
    const wa = BigInt('0x' + a.slice(i, i + 16));
    const wb = BigInt('0x' + b.slice(i, i + 16));
    let xor = wa ^ wb;
    while (xor > 0n) { dist += Number(xor & 1n); xor >>= 1n; }
  }
  return dist;
}

/** Union-Find (disjoint-set) for clustering near-duplicate images. */
class UnionFind {
  constructor(n) { this.parent = Array.from({ length: n }, (_, i) => i); }
  find(x) {
    if (this.parent[x] !== x) this.parent[x] = this.find(this.parent[x]);
    return this.parent[x];
  }
  union(x, y) { this.parent[this.find(x)] = this.find(y); }
}

// ─── auto-edit-batch ─────────────────────────────────────────

async function autoEditBatch({ editJobId, eventId, mediaIds, lut = 'natural', params = {} }) {
  await prisma.editJob.update({
    where: { id: editJobId },
    data:  { status: 'RUNNING', total: mediaIds.length },
  });

  let done = 0, failed = 0;

  for (const mediaId of mediaIds) {
    try {
      const media = await prisma.media.findUnique({
        where:  { id: mediaId },
        select: { processedUrl: true, thumbnailUrl: true, mimeType: true, eventId: true },
      });
      if (!media || media.eventId !== eventId) {
        logger.warn({ mediaId }, '[editWorker] media not found or wrong event, skipping');
        failed++;
        continue;
      }

      const imageUrl = media.processedUrl ?? media.thumbnailUrl;
      if (!imageUrl) { failed++; continue; }

      const result = await callAI('/auto-edit', { imageUrl, lut, params });

      // Decode base64 JPEG and upload to R2
      const buf      = Buffer.from(result.imageData, 'base64');
      const editedKey = `events/${eventId}/edited/${mediaId}.jpg`;
      await putObject(editedKey, buf, 'image/jpeg');
      const editedUrl = cdnUrl(editedKey);

      await prisma.media.update({
        where: { id: mediaId },
        data:  { processedUrl: editedUrl, aiEdited: true },
      });

      done++;
      await prisma.editJob.update({
        where: { id: editJobId },
        data:  { done, failed },
      });

      await emit(eventId, 'edit:progress', {
        editJobId,
        mediaId,
        done,
        total: mediaIds.length,
        editedUrl,
      });

    } catch (err) {
      logger.error({ err, mediaId }, '[editWorker] auto-edit failed for image');
      failed++;
      await prisma.editJob.update({ where: { id: editJobId }, data: { failed } });
    }
  }

  await prisma.editJob.update({
    where: { id: editJobId },
    data:  { status: failed === mediaIds.length ? 'FAILED' : 'DONE', done, failed },
  });

  await emit(eventId, 'edit:done', { editJobId, done, failed, total: mediaIds.length });
  logger.info({ editJobId, eventId, done, failed }, '[editWorker] auto-edit-batch done');
}

// ─── auto-cull ────────────────────────────────────────────────

async function autoCull({ editJobId, eventId }) {
  await prisma.editJob.update({
    where: { id: editJobId },
    data:  { status: 'RUNNING' },
  });

  // Fetch all READY images in the event
  const images = await prisma.media.findMany({
    where:    {
      eventId,
      status:   'READY',
      mimeType: { in: ['image/jpeg','image/jpg','image/png','image/gif','image/webp','image/heic','image/heif'] },
    },
    select:   { id: true, thumbnailUrl: true, processedUrl: true },
    orderBy:  { createdAt: 'asc' },
  });

  if (images.length === 0) {
    await prisma.editJob.update({ where: { id: editJobId }, data: { status: 'DONE', total: 0, done: 0 } });
    return;
  }

  await prisma.editJob.update({ where: { id: editJobId }, data: { total: images.length } });

  // Score all images
  const scores = [];
  let done = 0;

  for (const img of images) {
    try {
      const imageUrl = img.thumbnailUrl ?? img.processedUrl;
      if (!imageUrl) { scores.push({ id: img.id, score: 0, pHash: null }); continue; }

      const s = await callAI('/cull-score', { imageUrl });

      // Combined quality score — weight blur heavily
      const score = (
        0.35 * (s.blur       ?? 0) +
        0.25 * (s.exposure   ?? 0) +
        0.15 * (s.eyesOpen   ? 1 : 0) +
        0.10 * (s.smile      ?? 0) +
        0.15 * (s.compositionScore ?? 0)
      );

      scores.push({ id: img.id, score, pHash: s.pHash ?? null });

      // Cache pHash in DB for future cull runs
      if (s.pHash) {
        await prisma.media.update({ where: { id: img.id }, data: { pHash: s.pHash } });
      }

    } catch (err) {
      logger.warn({ err, mediaId: img.id }, '[editWorker] cull-score failed, using zero');
      scores.push({ id: img.id, score: 0, pHash: null });
    }

    done++;
    if (done % 10 === 0) {
      await prisma.editJob.update({ where: { id: editJobId }, data: { done } });
      await emit(eventId, 'cull:progress', { editJobId, done, total: images.length });
    }
  }

  // ─── Cluster near-duplicates by pHash ───────────────────────

  const HAMMING_THRESHOLD = 10;
  const uf = new UnionFind(scores.length);

  for (let i = 0; i < scores.length; i++) {
    for (let j = i + 1; j < scores.length; j++) {
      if (
        scores[i].pHash &&
        scores[j].pHash &&
        hammingDistance(scores[i].pHash, scores[j].pHash) <= HAMMING_THRESHOLD
      ) {
        uf.union(i, j);
      }
    }
  }

  // For each cluster: keep the highest-scoring image, suggest-reject the rest
  const clusters = new Map(); // root → [ index ]
  for (let i = 0; i < scores.length; i++) {
    const root = uf.find(i);
    if (!clusters.has(root)) clusters.set(root, []);
    clusters.get(root).push(i);
  }

  const keepIds    = new Set();
  const rejectIds  = [];

  for (const members of clusters.values()) {
    if (members.length === 1) {
      keepIds.add(scores[members[0]].id);
      continue;
    }
    // Best scoring member in this cluster
    const best = members.reduce((a, b) => scores[a].score >= scores[b].score ? a : b);
    keepIds.add(scores[best].id);
    for (const idx of members) {
      if (idx !== best) rejectIds.push(scores[idx].id);
    }
  }

  // Batch-update culled images in chunks of 100
  const CHUNK = 100;
  for (let i = 0; i < rejectIds.length; i += CHUNK) {
    await prisma.media.updateMany({
      where: { id: { in: rejectIds.slice(i, i + CHUNK) } },
      data:  { cullStatus: 'SUGGESTED_REJECT' },
    });
  }

  await prisma.editJob.update({
    where: { id: editJobId },
    data:  {
      status: 'DONE',
      done:   images.length,
      params: { kept: keepIds.size, suggestedReject: rejectIds.length },
    },
  });

  await emit(eventId, 'cull:done', {
    editJobId,
    total:            images.length,
    kept:             keepIds.size,
    suggestedReject:  rejectIds.length,
  });

  logger.info(
    { editJobId, eventId, kept: keepIds.size, suggestedReject: rejectIds.length },
    '[editWorker] auto-cull done',
  );
}

// ─── Worker ──────────────────────────────────────────────────

const worker = new Worker(
  'edit-jobs',
  async job => {
    logger.info({ jobId: job.id, name: job.name }, '[editWorker] processing');
    switch (job.name) {
      case 'auto-edit-batch': return autoEditBatch(job.data);
      case 'auto-cull':       return autoCull(job.data);
      default:
        logger.warn({ name: job.name }, '[editWorker] unknown job name, skipping');
    }
  },
  {
    connection:  bullConnection,
    concurrency: 2,
  },
);

worker.on('completed', job =>
  logger.info({ jobId: job.id, name: job.name }, '[editWorker] job completed'),
);
worker.on('failed', (job, err) =>
  logger.error({ jobId: job?.id, name: job?.name, err }, '[editWorker] job failed'),
);
worker.on('error', err =>
  logger.error({ err }, '[editWorker] worker error'),
);

logger.info('[editWorker] started — listening on edit-jobs queue');

async function shutdown(signal) {
  logger.info(`[editWorker] ${signal} — draining`);
  await worker.close();
  await publisher.quit();
  await prisma.$disconnect();
  process.exit(0);
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT',  () => shutdown('SIGINT'));
