/**
 * AI Worker — face detection + selfie matching.
 *
 * Exports:
 *   processAI(job)   — processor for workers/index.js
 *   cleanup()        — closes the Redis publisher
 *
 * Standalone: node src/workers/aiWorker.js
 */

import '../config/env.js';

import { randomUUID }    from 'node:crypto';
import { fileURLToPath } from 'node:url';

import prisma            from '../lib/prisma.js';
import { bullConnection, whatsappQueue } from '../lib/queues.js';
import { publishToEvent } from '../lib/realtime.js';
import env               from '../config/env.js';
import logger            from '../lib/logger.js';

// No local Redis publisher — all events go through lib/realtime.js
export function cleanup() { return Promise.resolve(); }

// ─── AI service helper ────────────────────────────────────────

async function callAI(path, body) {
  const res = await fetch(`${env.AI_SERVICE_URL}${path}`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(body),
    signal:  AbortSignal.timeout(45_000),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(`AI ${path} → HTTP ${res.status}: ${err.detail ?? JSON.stringify(err)}`);
  }
  return res.json();
}

const embStr = arr => `[${arr.join(',')}]`;

async function getThreshold(eventId) {
  const ev = await prisma.event.findUnique({ where: { id: eventId }, select: { faceThreshold: true } });
  return ev?.faceThreshold ?? 0.38;
}

// ─── detect-faces ─────────────────────────────────────────────

async function detectFaces({ mediaId, eventId }) {
  const media = await prisma.media.findUnique({
    where:  { id: mediaId },
    select: { thumbnailUrl: true, processedUrl: true, status: true, aiProcessed: true },
  });

  if (!media)              { logger.warn({ mediaId }, '[aiWorker] media not found, skipping'); return; }
  if (media.aiProcessed)   { logger.info({ mediaId }, '[aiWorker] already processed, skipping'); return; }
  if (media.status !== 'READY') throw new Error(`Media not READY (status=${media.status}) — will retry`);

  const imageUrl = media.thumbnailUrl ?? media.processedUrl;
  if (!imageUrl) throw new Error(`No delivery URL for media ${mediaId}`);

  const { faces } = await callAI('/detect', { imageUrl });

  if (faces.length === 0) {
    await prisma.media.update({ where: { id: mediaId }, data: { aiProcessed: true } });
    await publishToEvent(eventId, 'face:progress', { mediaId, facesDetected: 0 });
    return;
  }

  const threshold = await getThreshold(eventId);
  const vectorIds = [];

  for (const face of faces) {
    const fvId = randomUUID();
    let faceVectorId = null;

    if (face.embedding) {
      const es = embStr(face.embedding);
      await prisma.$executeRaw`
        INSERT INTO "FaceVector" (id, "mediaId", "eventId", bbox, quality, "detScore", embedding, "createdAt")
        VALUES (${fvId}::uuid, ${mediaId}::uuid, ${eventId}::uuid,
                ${JSON.stringify(face.bbox)}::jsonb, ${face.quality}::float8,
                ${face.det_score}::float8, ${es}::vector, now())
      `;
      faceVectorId = fvId;
      vectorIds.push({ fvId, embedding: face.embedding });
    }

    await prisma.faceTag.create({
      data: { mediaId, faceVectorId, boundingBox: face.bbox, confidence: face.det_score, reviewStatus: 'PENDING' },
    });
  }

  for (const { fvId, embedding } of vectorIds) {
    const es      = embStr(embedding);
    const matches = await prisma.$queryRaw`
      SELECT gfv."guestId", (1 - (gfv.embedding <=> ${es}::vector))::float8 AS sim
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
    const tag = await prisma.faceTag.findFirst({ where: { faceVectorId: fvId }, select: { id: true } });
    if (!tag) continue;

    await prisma.faceTag.update({
      where: { id: tag.id },
      data:  { guestId, confidence, reviewStatus: autoConfirm ? 'CONFIRMED' : 'PENDING' },
    });
    if (autoConfirm) {
      await prisma.guest.update({ where: { id: guestId }, data: { photosReceived: { increment: 1 } } });
    }
  }

  await prisma.media.update({ where: { id: mediaId }, data: { aiProcessed: true } });
  await publishToEvent(eventId, 'face:progress', { mediaId, facesDetected: faces.length, embeddings: vectorIds.length });
  logger.info({ mediaId, eventId, faces: faces.length }, '[aiWorker] detect-faces done');
}

// ─── match-selfie ─────────────────────────────────────────────

async function matchSelfie({ guestId, eventId }) {
  const guest = await prisma.guest.findUnique({ where: { id: guestId }, select: { selfieUrl: true } });
  if (!guest?.selfieUrl) throw new Error(`Guest ${guestId} has no selfieUrl`);

  const { embedding, quality, det_score: detScore } = await callAI('/embed-selfie', { imageUrl: guest.selfieUrl });
  const es = embStr(embedding);

  await prisma.$executeRaw`
    INSERT INTO "GuestFaceVector" (id, "guestId", "eventId", embedding, "createdAt", "updatedAt")
    VALUES (${randomUUID()}::uuid, ${guestId}::uuid, ${eventId}::uuid, ${es}::vector, now(), now())
    ON CONFLICT ("guestId") DO UPDATE SET embedding = EXCLUDED.embedding, "updatedAt" = now()
  `;

  const threshold = await getThreshold(eventId);

  const matches = await prisma.$queryRaw`
    SET ivfflat.probes = 10;
    SELECT fv.id AS "faceVectorId", fv."mediaId",
           (1 - (fv.embedding <=> ${es}::vector))::float8 AS sim
    FROM   "FaceVector" fv
    WHERE  fv."eventId" = ${eventId}::uuid
    AND    (1 - (fv.embedding <=> ${es}::vector)) > ${threshold}::float8
    ORDER  BY fv.embedding <=> ${es}::vector
    LIMIT  500
  `;

  let newAutoConfirmed = 0, newPending = 0;

  for (const m of matches) {
    const confidence  = Number(m.sim);
    const autoConfirm = confidence >= threshold + 0.10;
    const tag = await prisma.faceTag.findFirst({ where: { faceVectorId: m.faceVectorId, guestId: null }, select: { id: true } });
    if (!tag) continue;

    await prisma.faceTag.update({
      where: { id: tag.id },
      data:  { guestId, confidence, reviewStatus: autoConfirm ? 'CONFIRMED' : 'PENDING' },
    });
    if (autoConfirm) newAutoConfirmed++;
    else newPending++;
  }

  if (newAutoConfirmed > 0) {
    await prisma.guest.update({ where: { id: guestId }, data: { photosReceived: { increment: newAutoConfirmed } } });
  }

  // Upsert gallery token (7-day validity)
  const expiresAt      = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const existingToken  = await prisma.galleryToken.findFirst({ where: { guestId, eventId }, select: { id: true, token: true } });
  const galleryToken   = existingToken
    ? await prisma.galleryToken.update({ where: { id: existingToken.id }, data: { expiresAt } }).then(() => existingToken)
    : await prisma.galleryToken.create({ data: { eventId, guestId, expiresAt } });

  // Queue WhatsApp PHOTO_READY notification if photos confirmed
  if (newAutoConfirmed > 0) {
    const optedIn = await prisma.guest.findUnique({ where: { id: guestId }, select: { whatsappOptIn: true } });
    if (optedIn?.whatsappOptIn) {
      const msg = await prisma.whatsAppMessage.create({
        data: { guestId, eventId, type: 'PHOTO_READY', status: 'QUEUED' },
      });
      await whatsappQueue.add('photo-ready', { messageId: msg.id, guestId, eventId });
    }
  }

  await publishToEvent(eventId, 'match:complete', { guestId, eventId, confirmed: newAutoConfirmed, pending: newPending, token: galleryToken.token });
  logger.info({ guestId, eventId, newAutoConfirmed, newPending }, '[aiWorker] match-selfie done');
}

// ─── Exported processor ───────────────────────────────────────

export async function processAI(job) {
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
}

// ─── Standalone runner ────────────────────────────────────────

const __file = fileURLToPath(import.meta.url).replace(/\\/g, '/');
const isMain = process.argv[1] && process.argv[1].replace(/\\/g, '/') === __file;

if (isMain) {
  const { Worker } = await import('bullmq');

  const worker = new Worker('detect-faces', processAI, {
    connection:  bullConnection,
    concurrency: 2,
  });

  worker.on('completed', job => logger.info({ jobId: job.id, name: job.name }, '[aiWorker] completed'));
  worker.on('failed',    (job, err) => logger.error({ jobId: job?.id, name: job?.name, err }, '[aiWorker] failed'));
  worker.on('error',     err => logger.error({ err }, '[aiWorker] worker error'));
  logger.info('[aiWorker] started standalone — listening on detect-faces');

  const shutdown = async signal => {
    logger.info(`[aiWorker] ${signal} — draining`);
    await worker.close();
    await cleanup();
    await prisma.$disconnect();
    process.exit(0);
  };
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT',  () => shutdown('SIGINT'));
}
