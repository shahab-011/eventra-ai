/**
 * AI Worker — face detection + selfie matching
 * Run as a separate process: node src/workers/aiWorker.js
 *
 * Processes two job types from the 'detect-faces' BullMQ queue:
 *
 *   detect-faces { mediaId, eventId }
 *     → calls Python /detect, bulk-inserts FaceVector + FaceTag rows,
 *       auto-matches against existing guest selfie embeddings.
 *
 *   match-selfie { guestId, eventId }
 *     → calls Python /embed-selfie, stores GuestFaceVector,
 *       runs ANN cosine-distance search against all event FaceVectors,
 *       upserts FaceTags, creates GalleryToken, queues WhatsApp notification.
 */

import '../config/env.js';

import { Worker }     from 'bullmq';
import { randomUUID } from 'node:crypto';
import IORedis        from 'ioredis';

import prisma         from '../lib/prisma.js';
import { bullConnection } from '../lib/queues.js';
import env            from '../config/env.js';
import logger         from '../lib/logger.js';

// ─── Redis publisher for Socket.IO inter-process relay ────────
const publisher = new IORedis(env.REDIS_URL, { maxRetriesPerRequest: null });
publisher.on('error', err => logger.warn({ err }, '[aiWorker] Redis error'));

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
    signal:  AbortSignal.timeout(45_000),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(`AI service ${path} → HTTP ${res.status}: ${err.detail ?? JSON.stringify(err)}`);
  }
  return res.json();
}

// ─── Helpers ─────────────────────────────────────────────────

/** Format a 512-d float array as the pgvector literal '[f1,f2,…]'. */
const embStr = arr => `[${arr.join(',')}]`;

/**
 * Get the per-event detection threshold (with a fallback default).
 * Caches one Prisma call per job by passing the value from the parent.
 */
async function getThreshold(eventId) {
  const ev = await prisma.event.findUnique({
    where:  { id: eventId },
    select: { faceThreshold: true },
  });
  return ev?.faceThreshold ?? 0.38;
}

// ─── detect-faces ─────────────────────────────────────────────

async function detectFaces({ mediaId, eventId }) {
  const media = await prisma.media.findUnique({
    where:  { id: mediaId },
    select: { thumbnailUrl: true, processedUrl: true, status: true, aiProcessed: true },
  });

  if (!media)                  { logger.warn({ mediaId }, 'media not found, skipping'); return; }
  if (media.aiProcessed)       { logger.info({ mediaId }, 'already processed, skipping'); return; }
  if (media.status !== 'READY') throw new Error(`Media not READY (status=${media.status}) — will retry`);

  const imageUrl = media.thumbnailUrl ?? media.processedUrl;
  if (!imageUrl) throw new Error(`No delivery URL for media ${mediaId}`);

  const { faces } = await callAI('/detect', { imageUrl });

  if (faces.length === 0) {
    await prisma.media.update({ where: { id: mediaId }, data: { aiProcessed: true } });
    await emit(eventId, 'face:progress', { mediaId, facesDetected: 0 });
    return;
  }

  const threshold = await getThreshold(eventId);

  // Insert FaceVector + FaceTag for each detected face
  const vectorIds = [];
  for (const face of faces) {
    const fvId = randomUUID();
    let faceVectorId = null;

    if (face.embedding) {
      const es = embStr(face.embedding);
      await prisma.$executeRaw`
        INSERT INTO "FaceVector" (id, "mediaId", "eventId", bbox, quality, "detScore", embedding, "createdAt")
        VALUES (${fvId}::uuid, ${mediaId}::uuid, ${eventId}::uuid,
                ${JSON.stringify(face.bbox)}::jsonb,
                ${face.quality}::float8, ${face.det_score}::float8,
                ${es}::vector, now())
      `;
      faceVectorId = fvId;
      vectorIds.push({ fvId, embedding: face.embedding });
    }

    await prisma.faceTag.create({
      data: {
        mediaId,
        faceVectorId,
        boundingBox: face.bbox,
        confidence:  face.det_score,
        reviewStatus: 'PENDING',
      },
    });
  }

  // Auto-match each new FaceVector against existing guest selfie embeddings
  for (const { fvId, embedding } of vectorIds) {
    const es = embStr(embedding);

    // Compare this face against all GuestFaceVectors in the event
    const matches = await prisma.$queryRaw`
      SELECT gfv."guestId",
             (1 - (gfv.embedding <=> ${es}::vector))::float8 AS sim
      FROM   "GuestFaceVector" gfv
      WHERE  gfv."eventId" = ${eventId}::uuid
      ORDER  BY gfv.embedding <=> ${es}::vector
      LIMIT  1
    `;

    if (!matches.length) continue;
    const { guestId, sim } = matches[0];
    const confidence = Number(sim);
    if (confidence < threshold) continue;

    const autoConfirm = confidence >= threshold + 0.10;

    const tag = await prisma.faceTag.findFirst({
      where:  { faceVectorId: fvId },
      select: { id: true },
    });
    if (!tag) continue;

    await prisma.faceTag.update({
      where: { id: tag.id },
      data:  {
        guestId,
        confidence,
        reviewStatus: autoConfirm ? 'CONFIRMED' : 'PENDING',
      },
    });

    if (autoConfirm) {
      await prisma.guest.update({
        where: { id: guestId },
        data:  { photosReceived: { increment: 1 } },
      });
    }
  }

  await prisma.media.update({ where: { id: mediaId }, data: { aiProcessed: true } });

  await emit(eventId, 'face:progress', {
    mediaId,
    facesDetected: faces.length,
    embeddings:    vectorIds.length,
  });

  logger.info({ mediaId, eventId, faces: faces.length }, '[aiWorker] detect-faces done');
}

// ─── match-selfie ─────────────────────────────────────────────

async function matchSelfie({ guestId, eventId }) {
  const guest = await prisma.guest.findUnique({
    where:  { id: guestId },
    select: { selfieUrl: true, eventId: true },
  });
  if (!guest?.selfieUrl) throw new Error(`Guest ${guestId} has no selfieUrl`);

  // Embed the selfie via the Python service
  const { embedding, quality, det_score: detScore } = await callAI('/embed-selfie', {
    imageUrl: guest.selfieUrl,
  });

  const es = embStr(embedding);

  // Upsert GuestFaceVector (one row per guest, updated on re-selfie)
  await prisma.$executeRaw`
    INSERT INTO "GuestFaceVector" (id, "guestId", "eventId", embedding, "createdAt", "updatedAt")
    VALUES (${randomUUID()}::uuid, ${guestId}::uuid, ${eventId}::uuid, ${es}::vector, now(), now())
    ON CONFLICT ("guestId")
    DO UPDATE SET embedding = EXCLUDED.embedding, "updatedAt" = now()
  `;

  const threshold = await getThreshold(eventId);

  // ANN search — find all media faces in this event that match the selfie
  const matches = await prisma.$queryRaw`
    SET ivfflat.probes = 10;
    SELECT fv.id            AS "faceVectorId",
           fv."mediaId",
           (1 - (fv.embedding <=> ${es}::vector))::float8 AS sim
    FROM   "FaceVector" fv
    WHERE  fv."eventId" = ${eventId}::uuid
    AND    (1 - (fv.embedding <=> ${es}::vector)) > ${threshold}::float8
    ORDER  BY fv.embedding <=> ${es}::vector
    LIMIT  500
  `;

  let newAutoConfirmed = 0;
  let newPending       = 0;

  for (const m of matches) {
    const confidence   = Number(m.sim);
    const autoConfirm  = confidence >= threshold + 0.10;

    // Only tag if the FaceTag is currently unassigned
    const tag = await prisma.faceTag.findFirst({
      where:  { faceVectorId: m.faceVectorId, guestId: null },
      select: { id: true },
    });
    if (!tag) continue;

    await prisma.faceTag.update({
      where: { id: tag.id },
      data:  {
        guestId,
        confidence,
        reviewStatus: autoConfirm ? 'CONFIRMED' : 'PENDING',
      },
    });

    if (autoConfirm) newAutoConfirmed++;
    else newPending++;
  }

  if (newAutoConfirmed > 0) {
    await prisma.guest.update({
      where: { id: guestId },
      data:  { photosReceived: { increment: newAutoConfirmed } },
    });
  }

  // Create or refresh a 7-day GalleryToken for this guest
  const existingToken = await prisma.galleryToken.findFirst({
    where:  { guestId, eventId },
    select: { id: true, token: true },
  });

  let galleryToken;
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  if (existingToken) {
    galleryToken = await prisma.galleryToken.update({
      where: { id: existingToken.id },
      data:  { expiresAt },
    });
    galleryToken = existingToken;
  } else {
    galleryToken = await prisma.galleryToken.create({
      data: { eventId, guestId, expiresAt },
    });
  }

  // Queue WhatsApp PHOTO_READY notification if new photos confirmed
  if (newAutoConfirmed > 0) {
    const optedIn = await prisma.guest.findUnique({
      where:  { id: guestId },
      select: { whatsappOptIn: true },
    });
    if (optedIn?.whatsappOptIn) {
      await prisma.whatsAppMessage.create({
        data: {
          guestId,
          type:   'PHOTO_READY',
          status: 'QUEUED',
          body:   `Your event photos are ready! You've been matched in ${newAutoConfirmed} photo(s). View your gallery.`,
        },
      });
    }
  }

  await emit(eventId, 'match:complete', {
    guestId,
    eventId,
    confirmed: newAutoConfirmed,
    pending:   newPending,
    token:     galleryToken.token,
  });

  logger.info(
    { guestId, eventId, newAutoConfirmed, newPending },
    '[aiWorker] match-selfie done',
  );
}

// ─── Worker ──────────────────────────────────────────────────

const worker = new Worker(
  'detect-faces',
  async job => {
    logger.info({ jobId: job.id, name: job.name }, '[aiWorker] processing');
    switch (job.name) {
      case 'detect-faces':
      case 'detect':
        return detectFaces(job.data);
      case 'match-selfie':
        return matchSelfie(job.data);
      default:
        logger.warn({ name: job.name }, '[aiWorker] unknown job name, skipping');
    }
  },
  {
    connection:  bullConnection,
    concurrency: 2,
  },
);

worker.on('completed', job =>
  logger.info({ jobId: job.id, name: job.name }, '[aiWorker] job completed'),
);
worker.on('failed', (job, err) =>
  logger.error({ jobId: job?.id, name: job?.name, err }, '[aiWorker] job failed'),
);
worker.on('error', err =>
  logger.error({ err }, '[aiWorker] worker error'),
);

logger.info('[aiWorker] started — listening on detect-faces queue');

async function shutdown(signal) {
  logger.info(`[aiWorker] ${signal} — draining`);
  await worker.close();
  await publisher.quit();
  await prisma.$disconnect();
  process.exit(0);
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT',  () => shutdown('SIGINT'));
