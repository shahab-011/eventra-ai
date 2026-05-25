import { Router }      from 'express';
import { randomUUID }  from 'node:crypto';
import { z }           from 'zod';
import prisma          from '../lib/prisma.js';
import { authenticate } from '../middleware/auth.js';
import { validate }    from '../lib/validate.js';
import { parsePagination } from '../lib/pagination.js';
import { notFound, forbidden, badRequest } from '../lib/errors.js';
import { audit }       from '../lib/audit.js';
import { getIO }       from '../lib/socket.js';
import { processMediaQueue } from '../lib/queues.js';
import {
  presignUpload,
  presignMultipartPart,
  createMultipartUpload,
  completeMultipart,
  abortMultipart,
  headObject,
  getSignedReadUrl,
  deleteObjects,
  cdnUrl,
} from '../services/r2.js';
import {
  assertStorageAvailable,
  incrementStorage,
  decrementStorage,
} from '../services/storage.js';

const router = Router();

// ─── Constants ────────────────────────────────────────────────

const IMAGE_MIMES = new Set([
  'image/jpeg', 'image/jpg', 'image/png',
  'image/gif',  'image/webp', 'image/heic', 'image/heif',
]);
const VIDEO_MIMES = new Set(['video/mp4', 'video/quicktime']);
const ALLOWED_MIMES = new Set([...IMAGE_MIMES, ...VIDEO_MIMES]);

const MULTIPART_THRESHOLD = 100 * 1024 * 1024; // 100 MB

// ─── Schemas ──────────────────────────────────────────────────

const presignSchema = z.object({
  eventId:      z.string().uuid(),
  subEventId:   z.string().uuid().optional().nullable(),
  filename:     z.string().min(1).max(255),
  contentType:  z.string().min(1),
  sizeBytes:    z.coerce.number().int().positive(),
  uploadSource: z.enum(['CAMERA2CLOUD', 'DESKTOP_UPLOADER', 'GUEST_UPLOAD', 'MANUAL']).default('MANUAL'),
});

const completeMultipartSchema = z.object({
  uploadId: z.string().min(1),
  parts:    z.array(z.object({
    PartNumber: z.number().int().positive(),
    ETag:       z.string().min(1),
  })).min(1),
});

const partSchema = z.object({
  uploadId:    z.string().min(1),
  partNumber:  z.coerce.number().int().min(1).max(10000),
});

const patchSchema = z.object({
  subEventId:  z.string().uuid().optional().nullable(),
  isPrivate:   z.boolean().optional(),
  takenAt:     z.string().optional().nullable(),
});

const downloadSchema = z.object({
  pin: z.string().optional(),
});

const listQuerySchema = z.object({
  eventId:    z.string().uuid().optional(),
  subEventId: z.string().uuid().optional(),
  status:     z.enum(['UPLOADING', 'PROCESSING', 'READY', 'FAILED']).optional(),
  mimeType:   z.string().optional(),
  page:       z.coerce.number().int().positive().optional(),
  limit:      z.coerce.number().int().positive().optional(),
  sort:       z.string().optional(),
});

// ─── Helpers ──────────────────────────────────────────────────

/** Returns the full event + studio row; throws on missing access. */
async function guardEvent(eventId, userId, { writeAccess = false } = {}) {
  const event = await prisma.event.findUnique({
    where:   { id: eventId },
    include: {
      studio: {
        select: {
          id: true, ownerId: true, planTier: true,
          watermarkEnabled: true, watermarkUrl: true, name: true,
        },
      },
    },
  });
  if (!event) throw notFound('Event not found');
  if (event.studio.ownerId === userId) return event;

  const member = await prisma.teamMember.findFirst({
    where:  { studioId: event.studioId, userId, status: 'ACTIVE' },
    select: { role: true },
  });
  if (!member) throw forbidden('Access denied');
  if (writeAccess && !['ADMIN', 'SHOOTER', 'EDITOR'].includes(member.role)) {
    throw forbidden('Insufficient team permissions');
  }
  return event;
}

/** Derive the extension from a filename or fall back from MIME type. */
function resolveExt(filename, contentType) {
  const fromName = filename.split('.').pop().toLowerCase();
  if (fromName && fromName.length <= 5) return fromName;
  const mimeMap = {
    'image/jpeg':     'jpg',
    'image/jpg':      'jpg',
    'image/png':      'png',
    'image/gif':      'gif',
    'image/webp':     'webp',
    'image/heic':     'heic',
    'image/heif':     'heif',
    'video/mp4':      'mp4',
    'video/quicktime': 'mov',
  };
  return mimeMap[contentType] ?? 'bin';
}

/** Serialize a Media row — BigInt sizeBytes → Number for JSON transport. */
function serializeMedia(m) {
  if (!m) return m;
  return { ...m, sizeBytes: m.sizeBytes !== undefined ? Number(m.sizeBytes) : undefined };
}

// ─── ClamAV hook — replace body with: await clamscan.scanBuffer(data) ────────
// eslint-disable-next-line no-unused-vars
async function virusScan(_buffer) { /* stub — wire to ClamAV in production */ }

// ─── POST /presign — single-part upload ──────────────────────
//
// 1. Validates MIME, guards event, asserts storage headroom.
// 2. Creates a Media row (status=UPLOADING) with a pre-computed R2 key.
// 3. Returns a presigned PUT URL.  The browser uploads directly to R2.

router.post('/presign', authenticate, validate(presignSchema), async (req, res, next) => {
  try {
    const { eventId, subEventId, filename, contentType, sizeBytes, uploadSource } = req.body;

    if (!ALLOWED_MIMES.has(contentType)) {
      return next(badRequest(`File type not allowed: ${contentType}. Accepted: jpg/png/gif/webp/heic/mp4/mov`));
    }
    if (sizeBytes > MULTIPART_THRESHOLD) {
      return next(badRequest('File > 100 MB — use POST /media/presign-multipart instead'));
    }

    const event = await guardEvent(eventId, req.user.userId, { writeAccess: true });
    await assertStorageAvailable(event.studioId, sizeBytes);

    const mediaId = randomUUID();
    const ext     = resolveExt(filename, contentType);
    const key     = `events/${eventId}/originals/${mediaId}.${ext}`;
    const uploadUrl = await presignUpload(key, contentType, 3600);

    const media = await prisma.media.create({
      data: {
        id:           mediaId,
        eventId,
        subEventId:   subEventId || null,
        uploadedBy:   req.user.userId,
        filename,
        key,
        originalUrl:  cdnUrl(key),
        mimeType:     contentType,
        sizeBytes:    BigInt(sizeBytes),
        status:       'UPLOADING',
        uploadSource,
      },
    });

    res.json({ data: { uploadUrl, mediaId: media.id, key, expiresIn: 3600 } });
  } catch (err) { next(err); }
});

// ─── POST /presign-multipart — large file (> 100 MB) ─────────
//
// Returns uploadId so the client can presign individual parts.

router.post('/presign-multipart', authenticate, validate(presignSchema), async (req, res, next) => {
  try {
    const { eventId, subEventId, filename, contentType, sizeBytes, uploadSource } = req.body;

    if (!ALLOWED_MIMES.has(contentType)) {
      return next(badRequest(`File type not allowed: ${contentType}`));
    }

    const event = await guardEvent(eventId, req.user.userId, { writeAccess: true });
    await assertStorageAvailable(event.studioId, sizeBytes);

    const mediaId  = randomUUID();
    const ext      = resolveExt(filename, contentType);
    const key      = `events/${eventId}/originals/${mediaId}.${ext}`;
    const uploadId = await createMultipartUpload(key, contentType);

    const media = await prisma.media.create({
      data: {
        id:          mediaId,
        eventId,
        subEventId:  subEventId || null,
        uploadedBy:  req.user.userId,
        filename,
        key,
        originalUrl: cdnUrl(key),
        mimeType:    contentType,
        sizeBytes:   BigInt(sizeBytes),
        status:      'UPLOADING',
        uploadSource,
      },
    });

    res.json({ data: { mediaId: media.id, key, uploadId } });
  } catch (err) { next(err); }
});

// ─── POST /:id/part — presign a single multipart chunk ───────

router.post('/:id/part', authenticate, validate(partSchema), async (req, res, next) => {
  try {
    const media = await prisma.media.findUnique({ where: { id: req.params.id } });
    if (!media || media.status !== 'UPLOADING') return next(notFound('Upload session not found'));
    await guardEvent(media.eventId, req.user.userId, { writeAccess: true });

    const { uploadId, partNumber } = req.body;
    const presignedUrl = await presignMultipartPart(media.key, uploadId, partNumber, 3600);
    res.json({ data: { presignedUrl, partNumber } });
  } catch (err) { next(err); }
});

// ─── POST /:id/complete-multipart — assemble parts ───────────

router.post('/:id/complete-multipart', authenticate, validate(completeMultipartSchema), async (req, res, next) => {
  try {
    const media = await prisma.media.findUnique({
      where:   { id: req.params.id },
      include: { event: { include: { studio: true } } },
    });
    if (!media || media.status !== 'UPLOADING') return next(notFound('Upload session not found'));
    await guardEvent(media.eventId, req.user.userId, { writeAccess: true });

    const { uploadId, parts } = req.body;
    await completeMultipart(media.key, uploadId, parts);

    // Fall through to the same completion logic
    return finaliseUpload(media, req.user.userId, res, next);
  } catch (err) {
    // Attempt cleanup on failure
    if (req.body?.uploadId) {
      abortMultipart(req.params.id, req.body.uploadId).catch(() => {});
    }
    next(err);
  }
});

// ─── POST /:id/complete — confirm single-part upload ─────────
//
// headObject verifies the file actually landed in R2 before we bill storage.

router.post('/:id/complete', authenticate, async (req, res, next) => {
  try {
    const media = await prisma.media.findUnique({
      where:   { id: req.params.id },
      include: { event: { include: { studio: true } } },
    });
    if (!media || media.status !== 'UPLOADING') return next(notFound('Upload session not found'));
    await guardEvent(media.eventId, req.user.userId, { writeAccess: true });

    return finaliseUpload(media, req.user.userId, res, next);
  } catch (err) { next(err); }
});

/** Shared completion logic used by both single-part and multipart paths. */
async function finaliseUpload(media, userId, res, next) {
  try {
    // Confirm R2 received the file
    const head = await headObject(media.key);
    if (!head) {
      return next(badRequest('File not found in R2 — the upload may not have completed'));
    }

    // Increment studio storage with the actual size from R2
    await incrementStorage(media.event.studioId, head.sizeBytes);

    const updated = await prisma.media.update({
      where: { id: media.id },
      data:  {
        status:    'PROCESSING',
        sizeBytes: BigInt(head.sizeBytes),
      },
    });

    // Enqueue media-processing job
    await processMediaQueue.add('process', {
      mediaId:          media.id,
      eventId:          media.eventId,
      studioId:         media.event.studioId,
      key:              media.key,
      mimeType:         media.mimeType,
      filename:         media.filename,
      watermarkEnabled: media.event.studio.watermarkEnabled,
      watermarkUrl:     media.event.studio.watermarkUrl,
      studioName:       media.event.studio.name,
    }, { jobId: media.id });

    // Notify connected clients in the event room
    getIO()?.to(`event:${media.eventId}`).emit('media:uploaded', {
      mediaId:  media.id,
      eventId:  media.eventId,
      status:   'PROCESSING',
      filename: media.filename,
    });

    res.json({ data: serializeMedia(updated) });
  } catch (err) { next(err); }
}

// ─── GET / — list media ───────────────────────────────────────

router.get('/', authenticate, validate(listQuerySchema, 'query'), async (req, res, next) => {
  try {
    const { eventId, subEventId, status = 'READY', mimeType } = req.query;
    if (!eventId) return next(badRequest('eventId query param required'));

    await guardEvent(eventId, req.user.userId);

    const { page, skip, take } = parsePagination(req.query);

    const where = {
      eventId,
      ...(subEventId ? { subEventId }   : {}),
      ...(status     ? { status }        : {}),
      ...(mimeType   ? { mimeType: { contains: mimeType } } : {}),
    };

    const [media, total] = await Promise.all([
      prisma.media.findMany({
        where,
        select: {
          id: true, filename: true, mimeType: true, sizeBytes: true,
          key: true, status: true, originalUrl: true, thumbnailUrl: true,
          processedUrl: true, wmUrl: true, width: true, height: true,
          takenAt: true, isPrivate: true, subEventId: true, uploadSource: true,
          aiProcessed: true, createdAt: true,
        },
        orderBy: [{ takenAt: 'desc' }, { createdAt: 'desc' }],
        skip,
        take,
      }),
      prisma.media.count({ where }),
    ]);

    res.json({
      data: media.map(serializeMedia),
      meta: { page, limit: take, total, pages: Math.ceil(total / take) },
    });
  } catch (err) { next(err); }
});

// ─── GET /:id — 302 redirect to CDN / signed URL ─────────────
//
// Guests get the watermarked web variant (PRIVATE sub-event blocks them).
// Authenticated users get the web variant (or original if no web yet).

router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const media = await prisma.media.findUnique({
      where:   { id: req.params.id },
      include: {
        event:    { include: { studio: { select: { watermarkEnabled: true, watermarkUrl: true, name: true } } } },
        subEvent: { select: { guestAccess: true } },
      },
    });
    if (!media) return next(notFound('Media not found'));

    // ─── Access control ──────────────────────────────────────
    if (req.user.type === 'guest') {
      if (req.user.eventId !== media.eventId) return next(forbidden('Access denied'));
      if (media.subEvent?.guestAccess === 'PRIVATE') return next(forbidden('Access denied'));
    } else {
      await guardEvent(media.eventId, req.user.userId);
    }

    if (media.status === 'UPLOADING') {
      return next(badRequest('Media is still uploading'));
    }

    // ─── Delivery URL ────────────────────────────────────────
    const studio = media.event.studio;
    let url;

    if (media.status !== 'READY' || (!media.processedUrl && !media.wmUrl)) {
      // Not processed yet — serve original (signed, private)
      url = await getSignedReadUrl(media.key, 3600);
    } else if (studio.watermarkEnabled) {
      url = media.wmUrl ?? media.processedUrl ?? await getSignedReadUrl(media.key, 3600);
    } else {
      url = media.processedUrl ?? await getSignedReadUrl(media.key, 3600);
    }

    res.redirect(302, url);
  } catch (err) { next(err); }
});

// ─── GET /:id/download — original file (PIN-gated, audit-logged) ──────

router.get('/:id/download', authenticate, validate(downloadSchema, 'query'), async (req, res, next) => {
  try {
    const media = await prisma.media.findUnique({
      where:   { id: req.params.id },
      include: { event: { select: { id: true, studioId: true, downloadEnabled: true, downloadPin: true } } },
    });
    if (!media) return next(notFound('Media not found'));

    // Guests cannot download originals
    if (req.user.type === 'guest') return next(forbidden('Guests cannot download originals'));

    await guardEvent(media.eventId, req.user.userId);

    if (!media.event.downloadEnabled) {
      return next(forbidden('Downloads are disabled for this event'));
    }

    if (media.event.downloadPin) {
      const { pin } = req.query;
      if (!pin) return next(badRequest('Download PIN required'));
      if (pin !== media.event.downloadPin) return next(forbidden('Incorrect download PIN'));
    }

    // 15-minute signed URL for the original
    const downloadUrl = await getSignedReadUrl(media.key, 900);

    // Fire-and-forget audit
    audit('MEDIA_DOWNLOAD', {
      userId:   req.user.userId,
      ip:       req.ip,
      metadata: { mediaId: media.id, eventId: media.eventId, filename: media.filename },
    });

    res.redirect(302, downloadUrl);
  } catch (err) { next(err); }
});

// ─── PATCH /:id — update metadata ────────────────────────────

router.patch('/:id', authenticate, validate(patchSchema), async (req, res, next) => {
  try {
    const media = await prisma.media.findUnique({ where: { id: req.params.id } });
    if (!media) return next(notFound('Media not found'));
    await guardEvent(media.eventId, req.user.userId, { writeAccess: true });

    const { takenAt, ...rest } = req.body;
    const updated = await prisma.media.update({
      where: { id: req.params.id },
      data:  { ...rest, ...(takenAt !== undefined ? { takenAt: takenAt ? new Date(takenAt) : null } : {}) },
    });
    res.json({ data: serializeMedia(updated) });
  } catch (err) { next(err); }
});

// ─── DELETE /:id ──────────────────────────────────────────────
//
// Deletes the original + all derived variants from R2, decrements storage.

router.delete('/:id', authenticate, async (req, res, next) => {
  try {
    const media = await prisma.media.findUnique({
      where:   { id: req.params.id },
      include: { event: { select: { studioId: true } } },
    });
    if (!media) return next(notFound('Media not found'));
    await guardEvent(media.eventId, req.user.userId, { writeAccess: true });

    // Collect all R2 keys for this media item
    const keysToDelete = [media.key];
    const ext    = 'jpg';
    const base   = `events/${media.eventId}`;
    const mid    = media.id;

    // Derived variants (may or may not exist — deleteObjects ignores missing keys)
    keysToDelete.push(
      `${base}/thumbs/${mid}.${ext}`,
      `${base}/web/${mid}.${ext}`,
      `${base}/wm/${mid}.${ext}`,
      `${base}/thumbs/${mid}.jpg`,  // video poster
      `${base}/web/${mid}.mp4`,     // 720p video
    );

    await deleteObjects([...new Set(keysToDelete)]);

    const sizeBytes = Number(media.sizeBytes);
    if (sizeBytes > 0) await decrementStorage(media.event.studioId, sizeBytes);

    await prisma.media.delete({ where: { id: req.params.id } });
    res.status(204).end();
  } catch (err) { next(err); }
});

export default router;
