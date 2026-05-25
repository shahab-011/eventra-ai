/**
 * Face recognition admin routes — mounted at /api/events
 *
 * Review workflow    GET  /:id/face-review
 *                    POST /:id/face-review/:tagId/confirm
 *                    POST /:id/face-review/:tagId/reject
 *
 * Tuning            PATCH /:id/face-threshold
 *
 * Re-scan           POST  /:id/face-scan   (re-enqueues all READY images)
 *
 * Gallery token     GET   /gallery/:token  (public — validate a guest token)
 */

import { Router }    from 'express';
import { z }         from 'zod';
import prisma        from '../lib/prisma.js';
import { authenticate } from '../middleware/auth.js';
import { validate }  from '../lib/validate.js';
import { parsePagination } from '../lib/pagination.js';
import { notFound, forbidden, badRequest } from '../lib/errors.js';
import { faceDetectQueue } from '../lib/queues.js';

const router = Router();

// ─── Shared access guard ──────────────────────────────────────

async function guardEvent(eventId, userId, { writeAccess = false, ownerOnly = false } = {}) {
  const event = await prisma.event.findUnique({
    where:   { id: eventId },
    include: { studio: { select: { id: true, ownerId: true } } },
  });
  if (!event) throw notFound('Event not found');
  if (event.studio.ownerId === userId) return event;
  if (ownerOnly) throw forbidden('Only the studio owner can perform this action');

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

// ─── Schemas ─────────────────────────────────────────────────

const reviewQuerySchema = z.object({
  confidence_max: z.coerce.number().min(0).max(1).default(0.65),
  status:         z.enum(['PENDING', 'CONFIRMED', 'REJECTED']).default('PENDING'),
  page:           z.coerce.number().int().positive().optional(),
  limit:          z.coerce.number().int().positive().optional(),
});

const confirmSchema = z.object({
  guestId: z.string().uuid().optional(),  // optionally override the suggested guest
});

const thresholdSchema = z.object({
  threshold: z.coerce.number().min(0.1).max(0.99),
});

// ─── GET /:id/face-review — unreviewed / low-confidence tags ──

router.get('/:id/face-review', authenticate, validate(reviewQuerySchema, 'query'), async (req, res, next) => {
  try {
    await guardEvent(req.params.id, req.user.userId);

    const { confidence_max, status } = req.query;
    const { page, skip, take } = parsePagination(req.query);

    const where = {
      media:       { eventId: req.params.id },
      reviewStatus: status,
      confidence:  { lte: Number(confidence_max) },
      guestId:     { not: null },  // only show auto-assigned tags
    };

    const [tags, total] = await Promise.all([
      prisma.faceTag.findMany({
        where,
        include: {
          media: { select: { id: true, thumbnailUrl: true, processedUrl: true, filename: true } },
          guest: { select: { id: true, name: true, phone: true, selfieUrl: true } },
        },
        orderBy: { confidence: 'asc' },
        skip,
        take,
      }),
      prisma.faceTag.count({ where }),
    ]);

    res.json({
      data: tags,
      meta: { page, limit: take, total, pages: Math.ceil(total / take) },
    });
  } catch (err) { next(err); }
});

// ─── POST /:id/face-review/:tagId/confirm ─────────────────────

router.post('/:id/face-review/:tagId/confirm', authenticate, validate(confirmSchema), async (req, res, next) => {
  try {
    await guardEvent(req.params.id, req.user.userId, { writeAccess: true });

    const tag = await prisma.faceTag.findUnique({
      where:   { id: req.params.tagId },
      include: { media: { select: { eventId: true } } },
    });
    if (!tag) return next(notFound('Face tag not found'));
    if (tag.media.eventId !== req.params.id) return next(forbidden('Tag does not belong to this event'));

    const guestId = req.body.guestId ?? tag.guestId;
    if (!guestId) return next(badRequest('guestId required when tag has no existing suggestion'));

    const wasConfirmed = tag.reviewStatus === 'CONFIRMED';

    await prisma.faceTag.update({
      where: { id: tag.id },
      data:  { guestId, reviewStatus: 'CONFIRMED' },
    });

    // Increment photosReceived only if this tag wasn't already confirmed
    if (!wasConfirmed) {
      await prisma.guest.update({
        where: { id: guestId },
        data:  { photosReceived: { increment: 1 } },
      });
    }

    res.json({ data: { confirmed: true, tagId: tag.id, guestId } });
  } catch (err) { next(err); }
});

// ─── POST /:id/face-review/:tagId/reject ─────────────────────

router.post('/:id/face-review/:tagId/reject', authenticate, async (req, res, next) => {
  try {
    await guardEvent(req.params.id, req.user.userId, { writeAccess: true });

    const tag = await prisma.faceTag.findUnique({
      where:   { id: req.params.tagId },
      include: { media: { select: { eventId: true } } },
    });
    if (!tag) return next(notFound('Face tag not found'));
    if (tag.media.eventId !== req.params.id) return next(forbidden('Tag does not belong to this event'));

    // If this was previously confirmed, roll back photosReceived
    if (tag.reviewStatus === 'CONFIRMED' && tag.guestId) {
      await prisma.guest.update({
        where: { id: tag.guestId },
        data:  { photosReceived: { decrement: 1 } },
      });
    }

    await prisma.faceTag.update({
      where: { id: tag.id },
      data:  { reviewStatus: 'REJECTED', guestId: null },
    });

    res.json({ data: { rejected: true, tagId: tag.id } });
  } catch (err) { next(err); }
});

// ─── PATCH /:id/face-threshold — per-event cosine threshold ───

router.patch('/:id/face-threshold', authenticate, validate(thresholdSchema), async (req, res, next) => {
  try {
    await guardEvent(req.params.id, req.user.userId, { writeAccess: true });

    const updated = await prisma.event.update({
      where: { id: req.params.id },
      data:  { faceThreshold: req.body.threshold },
      select: { id: true, faceThreshold: true },
    });

    res.json({ data: updated });
  } catch (err) { next(err); }
});

// ─── POST /:id/face-scan — re-run detection on all READY images ──
//
// Clears existing FaceVector + FaceTag rows, resets aiProcessed,
// then re-enqueues every image in the event.

router.post('/:id/face-scan', authenticate, async (req, res, next) => {
  try {
    await guardEvent(req.params.id, req.user.userId, { writeAccess: true });

    const imageMedia = await prisma.media.findMany({
      where: {
        eventId: req.params.id,
        status:  'READY',
        mimeType: {
          in: ['image/jpeg','image/jpg','image/png','image/gif','image/webp','image/heic','image/heif'],
        },
      },
      select: { id: true },
    });

    if (imageMedia.length === 0) {
      return res.json({ data: { queued: 0, message: 'No READY images found' } });
    }

    // Clear existing detection data for this event
    await prisma.$transaction([
      prisma.faceTag.deleteMany({ where: { media: { eventId: req.params.id } } }),
      prisma.media.updateMany({
        where: { eventId: req.params.id },
        data:  { aiProcessed: false },
      }),
    ]);

    // FaceVector rows use raw SQL, so delete them separately (outside transaction)
    await prisma.$executeRaw`
      DELETE FROM "FaceVector" WHERE "eventId" = ${req.params.id}::uuid
    `;

    // Re-enqueue all images in batches to avoid overflowing the queue
    for (const m of imageMedia) {
      await faceDetectQueue.add('detect-faces', {
        mediaId: m.id,
        eventId: req.params.id,
      }, { jobId: `rescan-${m.id}` });
    }

    res.json({ data: { queued: imageMedia.length } });
  } catch (err) { next(err); }
});

// ─── GET /:id/face-stats — detection summary for the event ────

router.get('/:id/face-stats', authenticate, async (req, res, next) => {
  try {
    await guardEvent(req.params.id, req.user.userId);

    const [total, confirmed, pending, rejected, unassigned] = await Promise.all([
      prisma.faceTag.count({ where: { media: { eventId: req.params.id } } }),
      prisma.faceTag.count({ where: { media: { eventId: req.params.id }, reviewStatus: 'CONFIRMED' } }),
      prisma.faceTag.count({ where: { media: { eventId: req.params.id }, reviewStatus: 'PENDING', guestId: { not: null } } }),
      prisma.faceTag.count({ where: { media: { eventId: req.params.id }, reviewStatus: 'REJECTED' } }),
      prisma.faceTag.count({ where: { media: { eventId: req.params.id }, guestId: null } }),
    ]);

    const guestCount = await prisma.guestFaceVector.count({ where: { eventId: req.params.id } });

    res.json({
      data: {
        totalFacesDetected: total,
        confirmed,
        pendingReview:      pending,
        rejected,
        unmatched:          unassigned,
        guestsWithSelfie:   guestCount,
      },
    });
  } catch (err) { next(err); }
});

// ─── GET /gallery/:token — validate a GalleryToken (public) ──
//
// The frontend uses this to bootstrap the personalized gallery view.
// No authentication — the opaque token IS the credential.

router.get('/gallery/:token', async (req, res, next) => {
  try {
    const tokenRow = await prisma.galleryToken.findUnique({
      where:   { token: req.params.token },
      include: {
        guest: { select: { id: true, name: true, phone: true, guestType: true, photosReceived: true } },
        event: { select: { id: true, name: true, status: true, galleryTheme: true, downloadEnabled: true } },
      },
    });

    if (!tokenRow) return next(notFound('Gallery token not found'));
    if (tokenRow.expiresAt < new Date()) return next(badRequest('Gallery token has expired'));

    res.json({
      data: {
        token:     tokenRow.token,
        expiresAt: tokenRow.expiresAt,
        scope:     tokenRow.scope,
        guest:     tokenRow.guest,
        event:     tokenRow.event,
      },
    });
  } catch (err) { next(err); }
});

export default router;
