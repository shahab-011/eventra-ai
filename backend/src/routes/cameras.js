/**
 * Camera2Cloud routes — mounted at /api/cameras
 *
 * Studio-authenticated endpoints (JWT):
 *   POST   /                      — create (pair) a new CameraAccount
 *   GET    /                      — list all cameras for the studio
 *   GET    /:id                   — get one camera
 *   PATCH  /:id                   — update name / model / eventId / subEventId
 *   DELETE /:id                   — remove camera
 *   GET    /:id/status            — live status + recent upload info
 *   POST   /:id/rotate-key        — regenerate apiKey (security)
 *
 * Camera-authenticated endpoints (X-Camera-Key: <apiKey>):
 *   POST   /:id/heartbeat         — camera pings every 30s; sets status CONNECTED
 *   POST   /:id/ingest/start      — presign a direct R2 upload (single or multipart)
 *   POST   /:id/ingest/complete   — finalise upload, create Media, enqueue worker
 */

import { Router }   from 'express';
import { z }        from 'zod';
import bcrypt       from 'bcryptjs';
import { randomUUID } from 'node:crypto';

import prisma       from '../lib/prisma.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../lib/validate.js';
import { notFound, forbidden, badRequest, AppError } from '../lib/errors.js';
import { presignUpload, headObject, cdnUrl } from '../services/r2.js';
import { processMediaQueue } from '../lib/queues.js';
import { getIO }    from '../lib/socket.js';

const router = Router();

// ─── Max cameras per studio (plan enforcement stub) ──────────

const MAX_CAMERAS = 10;

// ─── Shared access guards ─────────────────────────────────────

async function guardStudio(userId) {
  const studio = await prisma.studio.findUnique({
    where:  { ownerId: userId },
    select: { id: true },
  });
  if (!studio) throw new AppError(403, 'FORBIDDEN', 'Studio not found');
  return studio;
}

async function guardCamera(cameraId, studioId) {
  const camera = await prisma.cameraAccount.findUnique({ where: { id: cameraId } });
  if (!camera)                     throw notFound('Camera not found');
  if (camera.studioId !== studioId) throw forbidden('Camera does not belong to your studio');
  return camera;
}

// ─── Camera API-key middleware ────────────────────────────────

async function cameraAuth(req, res, next) {
  const apiKey = req.headers['x-camera-key'];
  if (!apiKey) return next(new AppError(401, 'UNAUTHORIZED', 'Missing X-Camera-Key header'));

  const camera = await prisma.cameraAccount.findUnique({
    where:  { apiKey },
    select: { id: true, studioId: true, eventId: true, subEventId: true, name: true, apiKey: true },
  });
  if (!camera) return next(new AppError(401, 'UNAUTHORIZED', 'Invalid camera key'));

  req.camera = camera;
  next();
}

// ─── Schemas ─────────────────────────────────────────────────

const createSchema = z.object({
  name:       z.string().min(1).max(100),
  model:      z.string().max(100).optional(),
  eventId:    z.string().uuid().optional(),
  subEventId: z.string().uuid().optional(),
  ftpUsername: z.string().min(3).max(64).regex(/^[a-z0-9_-]+$/i),
  ftpPassword: z.string().min(8).max(128),
});

const updateSchema = z.object({
  name:       z.string().min(1).max(100).optional(),
  model:      z.string().max(100).optional(),
  eventId:    z.string().uuid().nullable().optional(),
  subEventId: z.string().uuid().nullable().optional(),
});

const ingestStartSchema = z.object({
  filename:     z.string().min(1),
  contentType:  z.string().min(1),
  sizeBytes:    z.number().int().positive().optional(),
  multipart:    z.boolean().default(false),
});

const ingestCompleteSchema = z.object({
  mediaId:      z.string().uuid(),
  key:          z.string().min(1),
  parts:        z.array(z.object({
    PartNumber: z.number().int().positive(),
    ETag:       z.string(),
  })).optional(),
});

// ─── POST / — create CameraAccount ───────────────────────────

router.post('/', authenticate, validate(createSchema), async (req, res, next) => {
  try {
    const studio = await guardStudio(req.user.userId);

    const count = await prisma.cameraAccount.count({ where: { studioId: studio.id } });
    if (count >= MAX_CAMERAS) return next(badRequest(`Studio camera limit (${MAX_CAMERAS}) reached`));

    // Check ftpUsername uniqueness
    const existing = await prisma.cameraAccount.findUnique({
      where: { ftpUsername: req.body.ftpUsername },
    });
    if (existing) return next(badRequest('FTP username already taken'));

    // Validate eventId belongs to studio
    if (req.body.eventId) {
      const ev = await prisma.event.findFirst({
        where: { id: req.body.eventId, studio: { ownerId: req.user.userId } },
      });
      if (!ev) return next(notFound('Event not found or not yours'));
    }

    const camera = await prisma.cameraAccount.create({
      data: {
        studioId:    studio.id,
        eventId:     req.body.eventId ?? null,
        subEventId:  req.body.subEventId ?? null,
        name:        req.body.name,
        model:       req.body.model ?? null,
        ftpUsername: req.body.ftpUsername,
        ftpPassword: req.body.ftpPassword,  // stored plain — FTP requires plaintext compare
        status:      'PAIRING',
      },
    });

    res.status(201).json({ data: serializeCamera(camera) });
  } catch (err) { next(err); }
});

// ─── GET / — list cameras for studio ────────────────────────

router.get('/', authenticate, async (req, res, next) => {
  try {
    const studio  = await guardStudio(req.user.userId);
    const cameras = await prisma.cameraAccount.findMany({
      where:   { studioId: studio.id },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ data: cameras.map(serializeCamera) });
  } catch (err) { next(err); }
});

// ─── GET /:id — single camera ─────────────────────────────────

router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const studio = await guardStudio(req.user.userId);
    const camera = await guardCamera(req.params.id, studio.id);
    res.json({ data: serializeCamera(camera) });
  } catch (err) { next(err); }
});

// ─── PATCH /:id — update metadata ─────────────────────────────

router.patch('/:id', authenticate, validate(updateSchema), async (req, res, next) => {
  try {
    const studio = await guardStudio(req.user.userId);
    await guardCamera(req.params.id, studio.id);

    if (req.body.eventId) {
      const ev = await prisma.event.findFirst({
        where: { id: req.body.eventId, studio: { ownerId: req.user.userId } },
      });
      if (!ev) return next(notFound('Event not found or not yours'));
    }

    const updated = await prisma.cameraAccount.update({
      where: { id: req.params.id },
      data: {
        ...(req.body.name       !== undefined && { name: req.body.name }),
        ...(req.body.model      !== undefined && { model: req.body.model }),
        ...(req.body.eventId    !== undefined && { eventId: req.body.eventId }),
        ...(req.body.subEventId !== undefined && { subEventId: req.body.subEventId }),
      },
    });

    res.json({ data: serializeCamera(updated) });
  } catch (err) { next(err); }
});

// ─── DELETE /:id ──────────────────────────────────────────────

router.delete('/:id', authenticate, async (req, res, next) => {
  try {
    const studio = await guardStudio(req.user.userId);
    await guardCamera(req.params.id, studio.id);
    await prisma.cameraAccount.delete({ where: { id: req.params.id } });
    res.json({ data: { deleted: true } });
  } catch (err) { next(err); }
});

// ─── GET /:id/status — live status ───────────────────────────

router.get('/:id/status', authenticate, async (req, res, next) => {
  try {
    const studio = await guardStudio(req.user.userId);
    const camera = await guardCamera(req.params.id, studio.id);

    const recentMedia = await prisma.media.findMany({
      where:   { uploadSource: 'CAMERA2CLOUD', eventId: camera.eventId ?? undefined },
      orderBy: { createdAt: 'desc' },
      take:    5,
      select:  { id: true, filename: true, status: true, createdAt: true, thumbnailUrl: true },
    });

    res.json({
      data: {
        ...serializeCamera(camera),
        recentMedia,
      },
    });
  } catch (err) { next(err); }
});

// ─── POST /:id/rotate-key ─────────────────────────────────────

router.post('/:id/rotate-key', authenticate, async (req, res, next) => {
  try {
    const studio = await guardStudio(req.user.userId);
    await guardCamera(req.params.id, studio.id);

    const updated = await prisma.cameraAccount.update({
      where: { id: req.params.id },
      data:  { apiKey: randomUUID() },
    });

    res.json({ data: { apiKey: updated.apiKey } });
  } catch (err) { next(err); }
});

// ─── POST /:id/heartbeat (camera auth) ───────────────────────

router.post('/:id/heartbeat', cameraAuth, async (req, res, next) => {
  try {
    if (req.camera.id !== req.params.id) {
      return next(forbidden('Camera ID mismatch'));
    }

    await prisma.cameraAccount.update({
      where: { id: req.camera.id },
      data:  {
        status:          'CONNECTED',
        lastHeartbeatAt: new Date(),
      },
    });

    const io = getIO();
    if (io && req.camera.eventId) {
      io.to(`event:${req.camera.eventId}`).emit('camera:heartbeat', {
        cameraId:   req.camera.id,
        cameraName: req.camera.name,
        ts:         Date.now(),
      });
    }

    res.json({ data: { ok: true, ts: Date.now() } });
  } catch (err) { next(err); }
});

// ─── POST /:id/ingest/start (camera auth) ────────────────────
//
// Returns a presigned R2 URL for direct upload.
// For files < 100MB: single PUT URL.
// For larger files or when multipart: uploadId + first part URL.

const MULTIPART_THRESHOLD = 100 * 1024 * 1024;

router.post('/:id/ingest/start', cameraAuth, validate(ingestStartSchema), async (req, res, next) => {
  try {
    if (req.camera.id !== req.params.id) return next(forbidden('Camera ID mismatch'));
    if (!req.camera.eventId) return next(badRequest('Camera not assigned to an event'));

    const { filename, contentType, sizeBytes, multipart } = req.body;
    const ext     = filename.split('.').pop()?.toLowerCase() ?? 'bin';
    const mediaId = randomUUID();
    const key     = `events/${req.camera.eventId}/originals/${mediaId}.${ext}`;

    const useMultipart = multipart || (sizeBytes && sizeBytes > MULTIPART_THRESHOLD);

    if (useMultipart) {
      const { createMultipartUpload, presignMultipartPart } = await import('../services/r2.js');
      const uploadId = await createMultipartUpload(key, contentType);
      const partUrl  = await presignMultipartPart(key, uploadId, 1);
      return res.json({ data: { mediaId, key, uploadId, partUrl, multipart: true } });
    }

    const uploadUrl = await presignUpload(key, contentType);
    res.json({ data: { mediaId, key, uploadUrl, multipart: false } });
  } catch (err) { next(err); }
});

// ─── POST /:id/ingest/complete (camera auth) ──────────────────
//
// Called after the camera has PUT all bytes to R2.
// Creates Media row + enqueues processing.

router.post('/:id/ingest/complete', cameraAuth, validate(ingestCompleteSchema), async (req, res, next) => {
  try {
    if (req.camera.id !== req.params.id) return next(forbidden('Camera ID mismatch'));
    if (!req.camera.eventId) return next(badRequest('Camera not assigned to an event'));

    const { mediaId, key, parts } = req.body;
    const eventId   = req.camera.eventId;
    const subEventId = req.camera.subEventId ?? undefined;

    // Complete multipart if parts supplied
    if (parts?.length) {
      const { completeMultipart } = await import('../services/r2.js');
      await completeMultipart(key, req.body.uploadId, parts);
    }

    // Head to get real size + contentType
    const head = await headObject(key);
    if (!head) return next(badRequest('Object not found in R2 — upload may have failed'));

    const ext      = key.split('.').pop()?.toLowerCase() ?? 'bin';
    const filename = key.split('/').pop() ?? `${mediaId}.${ext}`;

    const media = await prisma.media.create({
      data: {
        id:           mediaId,
        eventId,
        subEventId,
        filename,
        key,
        mimeType:     head.contentType ?? 'application/octet-stream',
        sizeBytes:    BigInt(head.sizeBytes),
        status:       'PROCESSING',
        uploadSource: 'CAMERA2CLOUD',
        processedUrl: cdnUrl(key),
      },
    });

    // Bump camera stats
    await prisma.cameraAccount.update({
      where: { id: req.camera.id },
      data:  {
        uploadCount:  { increment: 1 },
        lastUploadAt: new Date(),
        status:       'CONNECTED',
      },
    });

    // Enqueue media processing
    await processMediaQueue.add('process-media', {
      mediaId,
      eventId,
      key,
      mimeType: media.mimeType,
    }, { jobId: `camera-${mediaId}` });

    // Live tick
    const io = getIO();
    if (io) {
      io.to(`event:${eventId}`).emit('camera:upload', {
        cameraId:   req.camera.id,
        cameraName: req.camera.name,
        mediaId,
        filename,
      });
    }

    res.json({ data: { mediaId, status: 'PROCESSING' } });
  } catch (err) { next(err); }
});

// ─── Serializer — strip ftpPassword from responses ────────────

function serializeCamera(c) {
  const { ftpPassword, ...rest } = c;   // eslint-disable-line no-unused-vars
  return rest;
}

export default router;
