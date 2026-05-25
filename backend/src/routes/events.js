import { Router }         from 'express';
import { z }              from 'zod';
import prisma             from '../lib/prisma.js';
import { audit }          from '../lib/audit.js';
import { parsePagination } from '../lib/pagination.js';
import { authenticate }   from '../middleware/auth.js';
import { validate }       from '../lib/validate.js';
import { AppError, notFound, forbidden, badRequest, conflict } from '../lib/errors.js';
import { decrementStorage, incrementStorage } from '../services/storage.js';

const router = Router();

// ─── Schemas ──────────────────────────────────────────────────

const EVENT_TYPES    = ['WEDDING','CORPORATE','BIRTHDAY','COLLEGE_FEST','CONCERT','MARATHON','OTHER'];
const EVENT_STATUSES = ['UPCOMING','LIVE','COMPLETED','ARCHIVED'];

const createEventSchema = z.object({
  name:            z.string().min(2).max(150),
  type:            z.enum(EVENT_TYPES).default('WEDDING'),
  startDate:       z.string().min(1),
  endDate:         z.string().optional().nullable(),
  venue:           z.string().max(200).optional().nullable(),
  description:     z.string().max(2000).optional().nullable(),
  guestLimit:      z.coerce.number().int().min(1).default(300),
  storageAllocGB:  z.coerce.number().min(0.1).default(25),
  galleryTheme:    z.string().max(50).default('dark'),
  downloadEnabled: z.boolean().default(true),
  downloadPin:     z.string().min(4).max(20).optional().nullable(),
  isPublic:        z.boolean().default(true),
});

const updateEventSchema = createEventSchema.partial().omit({ startDate: true }).extend({
  startDate: z.string().optional(),
});

const statusSchema = z.object({
  status: z.enum(['LIVE', 'COMPLETED', 'ARCHIVED']),
});

const transferSchema = z.object({
  targetEmail: z.string().email(),
});

const listQuerySchema = z.object({
  status: z.enum(EVENT_STATUSES).optional(),
  type:   z.enum(EVENT_TYPES).optional(),
  search: z.string().max(100).optional(),
  page:   z.coerce.number().int().positive().optional(),
  limit:  z.coerce.number().int().positive().optional(),
  sort:   z.string().optional(),
});

// ─── Lifecycle guard ──────────────────────────────────────────

const VALID_TRANSITIONS = {
  UPCOMING:  ['LIVE'],
  LIVE:      ['COMPLETED'],
  COMPLETED: ['ARCHIVED'],
  ARCHIVED:  [],
};

// ─── Access helpers ───────────────────────────────────────────

/** Load event + studio owner. Optionally restrict to studio owner only. */
async function guardEvent(eventId, userId, { ownerOnly = false, writeAccess = false } = {}) {
  const event = await prisma.event.findUnique({
    where:   { id: eventId },
    include: { studio: { select: { id: true, ownerId: true, storageUsedGB: true, name: true } } },
  });
  if (!event) throw notFound('Event not found');

  if (event.studio.ownerId === userId) return event;
  if (ownerOnly) throw forbidden('Only the studio owner can perform this action');

  const member = await prisma.teamMember.findFirst({
    where:  { studioId: event.studioId, userId, status: 'ACTIVE' },
    select: { role: true },
  });
  if (!member) throw forbidden('Access denied');

  // Write operations require ADMIN, SHOOTER, or EDITOR; VIEWER is read-only
  if (writeAccess && !['ADMIN', 'SHOOTER', 'EDITOR'].includes(member.role)) {
    throw forbidden('Insufficient team permissions for write access');
  }

  event._teamRole = member.role;
  return event;
}

/** Resolve studioId for the calling user (owner or active team member). */
async function resolveCallerStudio(userId) {
  const owned = await prisma.studio.findUnique({ where: { ownerId: userId }, select: { id: true } });
  if (owned) return owned.id;

  const member = await prisma.teamMember.findFirst({
    where:  { userId, status: 'ACTIVE' },
    select: { studioId: true },
  });
  return member?.studioId ?? null;
}

// ─── GET / — list events (pagination + filter + search) ───────

router.get('/', authenticate, validate(listQuerySchema, 'query'), async (req, res, next) => {
  try {
    const studioId = await resolveCallerStudio(req.user.userId);
    if (!studioId) return next(notFound('Studio not found'));

    const { status, type, search } = req.query;
    const { page, skip, take, orderBy } = parsePagination(req.query);

    const where = {
      studioId,
      ...(status ? { status } : {}),
      ...(type   ? { type   } : {}),
      ...(search ? {
        OR: [
          { name:  { contains: search, mode: 'insensitive' } },
          { venue: { contains: search, mode: 'insensitive' } },
        ],
      } : {}),
    };

    const [events, total] = await Promise.all([
      prisma.event.findMany({
        where,
        include: {
          _count:    { select: { guests: true, media: true, subEvents: true } },
          subEvents: { select: { id: true, name: true, ceremonyType: true, date: true, status: true, guestAccess: true, order: true }, orderBy: { order: 'asc' } },
        },
        orderBy: orderBy ?? { startDate: 'desc' },
        skip,
        take,
      }),
      prisma.event.count({ where }),
    ]);

    res.json({ data: events, meta: { page, limit: take, total, pages: Math.ceil(total / take) } });
  } catch (err) { next(err); }
});

// ─── POST / — create event ────────────────────────────────────

router.post('/', authenticate, validate(createEventSchema), async (req, res, next) => {
  try {
    const studio = await prisma.studio.findUnique({ where: { ownerId: req.user.userId } });
    if (!studio) return next(notFound('Studio not found'));

    const { startDate, endDate, ...rest } = req.body;
    const event = await prisma.event.create({
      data: {
        ...rest,
        studioId:  studio.id,
        startDate: new Date(startDate),
        endDate:   endDate ? new Date(endDate) : null,
      },
    });
    res.status(201).json({ data: event });
  } catch (err) { next(err); }
});

// ─── GET /:id — single event with full detail ─────────────────

router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const event = await guardEvent(req.params.id, req.user.userId);
    const full = await prisma.event.findUnique({
      where:   { id: event.id },
      include: {
        subEvents: {
          include: { _count: { select: { media: true } } },
          orderBy: [{ order: 'asc' }, { date: 'asc' }],
        },
        guests:    { select: { id: true, name: true, phone: true, rsvpStatus: true, guestType: true } },
        _count:    { select: { media: true, guests: true, invites: true } },
      },
    });
    res.json({ data: full });
  } catch (err) { next(err); }
});

// ─── PATCH /:id — update info/branding fields ─────────────────

router.patch('/:id', authenticate, validate(updateEventSchema), async (req, res, next) => {
  try {
    await guardEvent(req.params.id, req.user.userId, { writeAccess: true });

    const { startDate, endDate, ...rest } = req.body;
    const data = {
      ...rest,
      ...(startDate ? { startDate: new Date(startDate) } : {}),
      ...(endDate !== undefined ? { endDate: endDate ? new Date(endDate) : null } : {}),
    };

    const event = await prisma.event.update({ where: { id: req.params.id }, data });
    res.json({ data: event });
  } catch (err) { next(err); }
});

// ─── PATCH /:id/status — lifecycle transition ─────────────────
// UPCOMING → LIVE (requires ≥1 sub-event)
// LIVE → COMPLETED
// COMPLETED → ARCHIVED

router.patch('/:id/status', authenticate, validate(statusSchema), async (req, res, next) => {
  try {
    const event = await guardEvent(req.params.id, req.user.userId, { writeAccess: true });
    const { status: newStatus } = req.body;

    const allowed = VALID_TRANSITIONS[event.status];
    if (!allowed.includes(newStatus)) {
      return next(badRequest(
        `Cannot transition from ${event.status} to ${newStatus}. ` +
        `Allowed: ${allowed.length ? allowed.join(', ') : 'none (terminal state)'}`,
      ));
    }

    // Cannot go LIVE without at least one sub-event
    if (newStatus === 'LIVE') {
      const subCount = await prisma.subEvent.count({ where: { eventId: event.id } });
      if (subCount === 0) {
        return next(badRequest('Cannot go LIVE: add at least one sub-event first'));
      }
    }

    const updated = await prisma.event.update({
      where: { id: event.id },
      data:  { status: newStatus },
    });
    res.json({ data: updated });
  } catch (err) { next(err); }
});

// ─── DELETE /:id — owner only ─────────────────────────────────

router.delete('/:id', authenticate, async (req, res, next) => {
  try {
    const event = await guardEvent(req.params.id, req.user.userId, { ownerOnly: true });

    // Reclaim storage before deleting
    if (event.storageUsedGB > 0) {
      await decrementStorage(event.studioId, event.storageUsedGB * (1024 ** 3));
    }

    await prisma.event.delete({ where: { id: event.id } });
    res.status(204).end();
  } catch (err) { next(err); }
});

// ─── POST /:id/transfer — Samaro storage handoff ─────────────
//
// Transfers the event from the photographer's studio to the client's
// personal studio. In a single transaction:
//   1. Find or create the target user + studio.
//   2. Move event.studioId to target studio.
//   3. Shift storage accounting.
//   4. Add original owner as EDITOR in target studio (view & edit own media).
//   5. Write AuditLog.

router.post('/:id/transfer', authenticate, validate(transferSchema), async (req, res, next) => {
  try {
    const event = await guardEvent(req.params.id, req.user.userId, { ownerOnly: true });
    const { targetEmail } = req.body;

    // Prevent transfer to self
    const callerUser = await prisma.user.findUnique({ where: { id: req.user.userId }, select: { email: true } });
    if (callerUser.email === targetEmail) return next(badRequest('Cannot transfer event to yourself'));

    const result = await prisma.$transaction(async tx => {
      // 1. Find or create target user
      let target = await tx.user.findUnique({ where: { email: targetEmail } });
      if (!target) {
        target = await tx.user.create({
          data: {
            email:        targetEmail,
            name:         targetEmail.split('@')[0],
            passwordHash: '', // placeholder; set when the client accepts
          },
        });
      }

      // 2. Find or create target's personal studio
      let targetStudio = await tx.studio.findUnique({ where: { ownerId: target.id } });
      if (!targetStudio) {
        const slug = targetEmail.split('@')[0].toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 35);
        // Ensure subdomain uniqueness with a suffix if needed
        const existing = await tx.studio.findUnique({ where: { subdomain: slug } });
        const subdomain = existing ? `${slug}-${Date.now()}` : slug;
        targetStudio = await tx.studio.create({
          data: {
            name:     `${target.name}'s Gallery`,
            subdomain,
            ownerId:  target.id,
            planTier: 'FREE',
          },
        });
      }

      // 3. Move event + update accounting
      const transferredEvent = await tx.event.update({
        where: { id: event.id },
        data:  {
          studioId:       targetStudio.id,
          transferredAt:  new Date(),
          transferredToId: targetStudio.id,
          status:         'COMPLETED',
        },
      });

      // Shift storage GB from original → target studio
      const gbMoved = event.storageUsedGB;
      if (gbMoved > 0) {
        await tx.studio.update({ where: { id: event.studioId },     data: { storageUsedGB: { decrement: gbMoved } } });
        await tx.studio.update({ where: { id: targetStudio.id },    data: { storageUsedGB: { increment: gbMoved } } });
      }

      // 4. Add original owner as EDITOR in the target studio (co-host)
      await tx.teamMember.upsert({
        where:  { studioId_userId: { studioId: targetStudio.id, userId: event.studio.ownerId } },
        update: { role: 'EDITOR', status: 'ACTIVE' },
        create: { studioId: targetStudio.id, userId: event.studio.ownerId, role: 'EDITOR', status: 'ACTIVE' },
      });

      return { transferredEvent, targetStudio, target };
    });

    // 5. Audit (fire-and-forget, outside transaction)
    audit('EVENT_TRANSFER', {
      userId: req.user.userId,
      ip:     req.ip,
      metadata: {
        eventId:          event.id,
        fromStudioId:     event.studioId,
        toStudioId:       result.targetStudio.id,
        targetEmail,
      },
    });

    res.json({
      data: {
        event:       result.transferredEvent,
        targetEmail,
        targetStudio: { id: result.targetStudio.id, name: result.targetStudio.name },
        message:     'Event transferred. You have been added as an editor in the client studio.',
      },
    });
  } catch (err) { next(err); }
});

// ─── GET /:id/overview — aggregated stats (no N+1) ────────────
//
// Four parallel queries; no sequential N+1:
//   1. Event row + nested _count for all relations + ordered sub-events
//   2. Media aggregate: total sizeBytes
//   3. Guest aggregate: selfie count
//   4. WhatsApp delivered message count

router.get('/:id/overview', authenticate, async (req, res, next) => {
  try {
    const event = await guardEvent(req.params.id, req.user.userId);

    const [detail, storageAgg, selfieCount, deliveredCount] = await Promise.all([
      prisma.event.findUnique({
        where:   { id: event.id },
        include: {
          _count:    { select: { media: true, guests: true, subEvents: true, invites: true, qrCodes: true } },
          subEvents: {
            select: {
              id: true, name: true, ceremonyType: true, date: true,
              status: true, guestAccess: true, order: true,
              _count: { select: { media: true } },
            },
            orderBy: [{ order: 'asc' }, { date: 'asc' }],
          },
        },
      }),
      prisma.media.aggregate({
        where: { eventId: event.id },
        _sum:  { sizeBytes: true },
      }),
      prisma.guest.count({ where: { eventId: event.id, selfieUrl: { not: null } } }),
      prisma.whatsAppMessage.count({
        where: { guest: { eventId: event.id }, status: { in: ['DELIVERED', 'READ'] } },
      }),
    ]);

    const storageBytesUsed = Number(storageAgg._sum.sizeBytes ?? 0);

    res.json({
      data: {
        id:          detail.id,
        name:        detail.name,
        status:      detail.status,
        type:        detail.type,
        startDate:   detail.startDate,
        endDate:     detail.endDate,
        counts: {
          media:          detail._count.media,
          guests:         detail._count.guests,
          subEvents:      detail._count.subEvents,
          invites:        detail._count.invites,
          qrCodes:        detail._count.qrCodes,
          selfies:        selfieCount,
          delivered:      deliveredCount,
        },
        storage: {
          usedBytes: storageBytesUsed,
          usedGB:    +(storageBytesUsed / (1024 ** 3)).toFixed(4),
          allocGB:   detail.storageAllocGB,
        },
        subEvents: detail.subEvents,
      },
    });
  } catch (err) { next(err); }
});

export default router;
