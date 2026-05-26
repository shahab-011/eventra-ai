/**
 * AI Photo Editing routes — mounted at /api/editing
 *
 * GET  /luts               — list all 12 built-in colour grade presets
 * POST /apply              — enqueue an auto-edit-batch job for selected images
 * GET  /jobs/:id           — get EditJob progress (polls friendly)
 * POST /cull               — enqueue an auto-cull job for the whole event
 * POST /cull/:id/accept    — mark a SUGGESTED_REJECT image as KEEP (override)
 * POST /cull/:id/reject    — confirm a SUGGESTED_REJECT as REJECTED
 * DELETE /cull/:id         — reset cullStatus to NONE
 */

import { Router } from 'express';
import { z }      from 'zod';

import prisma     from '../lib/prisma.js';
import { authenticate } from '../middleware/auth.js';
import { validate }     from '../lib/validate.js';
import { notFound, forbidden, badRequest } from '../lib/errors.js';
import { editQueue } from '../lib/queues.js';

const router = Router();

// ─── LUT metadata (mirrors ai-service/edit.py — single source of truth) ──

const LUTS = [
  { id: 'identity',       name: 'Identity',        description: 'No grade applied — pass-through' },
  { id: 'natural',        name: 'Natural',         description: 'Balanced tones with mild warmth and contrast' },
  { id: 'warm_wedding',   name: 'Warm Wedding',    description: 'Golden warmth, lifted shadows, soft saturation' },
  { id: 'cool_corporate', name: 'Cool Corporate',  description: 'Clean blue-neutral with crisp contrast' },
  { id: 'vivid',          name: 'Vivid',           description: 'Punchy saturation and deep blacks' },
  { id: 'bw_classic',     name: 'B&W Classic',     description: 'Silver-toned monochrome with filmic S-curve' },
  { id: 'cinematic',      name: 'Cinematic',       description: 'Orange-teal film look — teal shadows, orange highlights' },
  { id: 'film_fade',      name: 'Film Fade',       description: 'Lifted blacks, muted palette, analogue feel' },
  { id: 'sunset',         name: 'Sunset',          description: 'Warm pinks and oranges for outdoor events' },
  { id: 'golden_hour',    name: 'Golden Hour',     description: 'Rich golden cast — perfect for outdoor ceremonies' },
  { id: 'matte',          name: 'Matte',           description: 'Soft lifted shadows and gentle gradients' },
  { id: 'high_key',       name: 'High Key',        description: 'Bright, airy look — great for white-dress portraits' },
];

const LUT_IDS = new Set(LUTS.map(l => l.id));

// ─── Shared access guard ─────────────────────────────────────

async function guardEvent(eventId, userId) {
  const event = await prisma.event.findUnique({
    where:   { id: eventId },
    include: { studio: { select: { ownerId: true } } },
  });
  if (!event) throw notFound('Event not found');
  if (event.studio.ownerId === userId) return event;

  const member = await prisma.teamMember.findFirst({
    where:  { studioId: event.studioId, userId, status: 'ACTIVE' },
    select: { role: true },
  });
  if (!member) throw forbidden('Access denied');
  return event;
}

// ─── Schemas ─────────────────────────────────────────────────

const applySchema = z.object({
  eventId:  z.string().uuid(),
  mediaIds: z.array(z.string().uuid()).min(1).max(500),
  lut:      z.string().refine(v => LUT_IDS.has(v), { message: 'Invalid LUT id' }).default('natural'),
  params:   z.object({
    auto_exposure: z.boolean().default(true),
    auto_wb:       z.boolean().default(true),
    auto_contrast: z.boolean().default(false),
    skin_smooth:   z.number().min(0).max(1).default(0),
  }).default({}),
});

const cullSchema = z.object({
  eventId: z.string().uuid(),
});

// ─── GET /luts ────────────────────────────────────────────────

router.get('/luts', (req, res) => {
  res.json({ data: LUTS });
});

// ─── POST /apply — enqueue auto-edit-batch ────────────────────

router.post('/apply', authenticate, validate(applySchema), async (req, res, next) => {
  try {
    const { eventId, mediaIds, lut, params } = req.body;
    await guardEvent(eventId, req.user.userId);

    // Verify all mediaIds belong to this event
    const count = await prisma.media.count({
      where: { id: { in: mediaIds }, eventId, status: 'READY' },
    });
    if (count !== mediaIds.length) {
      return next(badRequest('One or more mediaIds not found or not READY in this event'));
    }

    const editJob = await prisma.editJob.create({
      data: {
        eventId,
        type:  'AUTO_EDIT',
        total: mediaIds.length,
        lut,
        params,
      },
    });

    const bullJob = await editQueue.add('auto-edit-batch', {
      editJobId: editJob.id,
      eventId,
      mediaIds,
      lut,
      params,
    }, { jobId: `edit-${editJob.id}` });

    await prisma.editJob.update({
      where: { id: editJob.id },
      data:  { bullJobId: bullJob.id },
    });

    res.status(202).json({ data: { editJobId: editJob.id, queued: mediaIds.length } });
  } catch (err) { next(err); }
});

// ─── GET /jobs/:id — progress ─────────────────────────────────

router.get('/jobs/:id', authenticate, async (req, res, next) => {
  try {
    const job = await prisma.editJob.findUnique({ where: { id: req.params.id } });
    if (!job) return next(notFound('Edit job not found'));

    await guardEvent(job.eventId, req.user.userId);

    const percent = job.total > 0
      ? Math.round(((job.done + job.failed) / job.total) * 100)
      : 0;

    res.json({
      data: {
        id:        job.id,
        type:      job.type,
        status:    job.status,
        total:     job.total,
        done:      job.done,
        failed:    job.failed,
        percent,
        lut:       job.lut,
        params:    job.params,
        createdAt: job.createdAt,
        updatedAt: job.updatedAt,
      },
    });
  } catch (err) { next(err); }
});

// ─── POST /cull — enqueue auto-cull ──────────────────────────
//
// Note: this feature is marked UPCOMING in the UI.
// The backend is fully implemented; the front-end surfaces
// it behind a feature flag.

router.post('/cull', authenticate, validate(cullSchema), async (req, res, next) => {
  try {
    const { eventId } = req.body;
    await guardEvent(eventId, req.user.userId);

    // Block concurrent cull jobs for the same event
    const running = await prisma.editJob.findFirst({
      where: { eventId, type: 'AUTO_CULL', status: { in: ['PENDING', 'RUNNING'] } },
    });
    if (running) {
      return next(badRequest(`A cull job is already running for this event (${running.id})`));
    }

    const editJob = await prisma.editJob.create({
      data: { eventId, type: 'AUTO_CULL' },
    });

    const bullJob = await editQueue.add('auto-cull', {
      editJobId: editJob.id,
      eventId,
    }, { jobId: `cull-${editJob.id}` });

    await prisma.editJob.update({
      where: { id: editJob.id },
      data:  { bullJobId: bullJob.id },
    });

    res.status(202).json({ data: { editJobId: editJob.id } });
  } catch (err) { next(err); }
});

// ─── POST /cull/:id/accept — override SUGGESTED_REJECT → KEEP ──

router.post('/cull/:id/accept', authenticate, async (req, res, next) => {
  try {
    const media = await prisma.media.findUnique({
      where:   { id: req.params.id },
      include: { event: { include: { studio: { select: { ownerId: true } } } } },
    });
    if (!media) return next(notFound('Media not found'));
    await guardEvent(media.eventId, req.user.userId);

    await prisma.media.update({
      where: { id: req.params.id },
      data:  { cullStatus: 'KEEP' },
    });
    res.json({ data: { id: req.params.id, cullStatus: 'KEEP' } });
  } catch (err) { next(err); }
});

// ─── POST /cull/:id/reject — confirm REJECTED ─────────────────

router.post('/cull/:id/reject', authenticate, async (req, res, next) => {
  try {
    const media = await prisma.media.findUnique({
      where:   { id: req.params.id },
      include: { event: { include: { studio: { select: { ownerId: true } } } } },
    });
    if (!media) return next(notFound('Media not found'));
    await guardEvent(media.eventId, req.user.userId);

    await prisma.media.update({
      where: { id: req.params.id },
      data:  { cullStatus: 'REJECTED' },
    });
    res.json({ data: { id: req.params.id, cullStatus: 'REJECTED' } });
  } catch (err) { next(err); }
});

// ─── DELETE /cull/:id — reset cull decision ───────────────────

router.delete('/cull/:id', authenticate, async (req, res, next) => {
  try {
    const media = await prisma.media.findUnique({
      where:   { id: req.params.id },
      include: { event: { include: { studio: { select: { ownerId: true } } } } },
    });
    if (!media) return next(notFound('Media not found'));
    await guardEvent(media.eventId, req.user.userId);

    await prisma.media.update({
      where: { id: req.params.id },
      data:  { cullStatus: 'NONE' },
    });
    res.json({ data: { id: req.params.id, cullStatus: 'NONE' } });
  } catch (err) { next(err); }
});

export default router;
