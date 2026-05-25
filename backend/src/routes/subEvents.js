import { Router }    from 'express';
import crypto        from 'crypto';
import { z }         from 'zod';
import prisma        from '../lib/prisma.js';
import { authenticate } from '../middleware/auth.js';
import { validate }  from '../lib/validate.js';
import { notFound, forbidden, badRequest } from '../lib/errors.js';
import logger        from '../lib/logger.js';

const router = Router();

// ─── Schemas ──────────────────────────────────────────────────

const CEREMONY_TYPES  = ['HALDI','MEHENDI','SANGEET','WEDDING','RECEPTION','ENGAGEMENT','ROKA','CUSTOM'];
const GUEST_ACCESS    = ['ALL','VIP','PRIVATE'];
const EVENT_STATUSES  = ['UPCOMING','LIVE','COMPLETED','ARCHIVED'];

const createSubEventSchema = z.object({
  name:         z.string().min(2).max(150),
  ceremonyType: z.enum(CEREMONY_TYPES).default('CUSTOM'),
  date:         z.string().min(1),
  venue:        z.string().max(200).optional().nullable(),
  guestAccess:  z.enum(GUEST_ACCESS).default('ALL'),
  status:       z.enum(EVENT_STATUSES).default('UPCOMING'),
  order:        z.coerce.number().int().min(0).optional(),
});

const updateSubEventSchema = createSubEventSchema.partial().omit({ date: true }).extend({
  date: z.string().optional(),
});

const reorderSchema = z.object({
  items: z.array(z.object({
    id:    z.string().uuid(),
    order: z.coerce.number().int().min(0),
  })).min(1),
});

// ─── Access helpers ───────────────────────────────────────────

/** Verify the event exists and the caller can access it. Returns { event, isOwner }. */
async function guardEventAccess(eventId, userId, { writeAccess = false } = {}) {
  const event = await prisma.event.findUnique({
    where:   { id: eventId },
    include: { studio: { select: { ownerId: true, id: true } } },
  });
  if (!event) throw notFound('Event not found');

  if (event.studio.ownerId === userId) return { event, isOwner: true };

  const member = await prisma.teamMember.findFirst({
    where:  { studioId: event.studioId, userId, status: 'ACTIVE' },
    select: { role: true },
  });
  if (!member) throw forbidden('Access denied');
  if (writeAccess && !['ADMIN', 'SHOOTER', 'EDITOR'].includes(member.role)) {
    throw forbidden('Insufficient team permissions');
  }
  return { event, isOwner: false, teamRole: member.role };
}

/** Verify a sub-event belongs to the specified event. */
async function loadSubEvent(subEventId, eventId) {
  const sub = await prisma.subEvent.findUnique({ where: { id: subEventId } });
  if (!sub || sub.eventId !== eventId) throw notFound('Sub-event not found');
  return sub;
}

// ─── GET /:eventId/subevents — ordered list ───────────────────
//
// guestAccess enforcement: if the caller holds a guest JWT (type:'guest'),
// filter out PRIVATE sub-events (guests need VIP status for VIP sub-events).
// Business/team callers always see all sub-events.

router.get('/:eventId/subevents', authenticate, async (req, res, next) => {
  try {
    await guardEventAccess(req.params.eventId, req.user.userId);

    const isGuestCaller = req.user.type === 'guest';

    // Guests see ALL and (if they're VIP) VIP sub-events; never PRIVATE.
    // We don't yet have guestType on the JWT, so guests see ALL and VIP only.
    const accessFilter = isGuestCaller ? { guestAccess: { in: ['ALL', 'VIP'] } } : {};

    const subEvents = await prisma.subEvent.findMany({
      where:   { eventId: req.params.eventId, ...accessFilter },
      include: { _count: { select: { media: true } } },
      orderBy: [{ order: 'asc' }, { date: 'asc' }],
    });

    res.json({ data: subEvents });
  } catch (err) { next(err); }
});

// ─── POST /:eventId/subevents — create ────────────────────────

router.post('/:eventId/subevents', authenticate, validate(createSubEventSchema), async (req, res, next) => {
  try {
    await guardEventAccess(req.params.eventId, req.user.userId, { writeAccess: true });

    const { date, order: providedOrder, ...rest } = req.body;

    // Auto-assign order as max+1 if not provided
    let order = providedOrder;
    if (order === undefined) {
      const agg = await prisma.subEvent.aggregate({
        where: { eventId: req.params.eventId },
        _max:  { order: true },
      });
      order = (agg._max.order ?? -1) + 1;
    }

    const subEvent = await prisma.subEvent.create({
      data: { ...rest, eventId: req.params.eventId, date: new Date(date), order },
    });
    res.status(201).json({ data: subEvent });
  } catch (err) { next(err); }
});

// ─── PUT /:eventId/subevents/reorder — bulk drag-reorder ──────
// Defined BEFORE /:id routes so Express matches the literal "reorder" first.

router.put('/:eventId/subevents/reorder', authenticate, validate(reorderSchema), async (req, res, next) => {
  try {
    await guardEventAccess(req.params.eventId, req.user.userId, { writeAccess: true });

    const { items } = req.body;
    const ids = items.map(i => i.id);

    await prisma.$transaction(async tx => {
      // Validate all IDs belong to this event
      const count = await tx.subEvent.count({
        where: { id: { in: ids }, eventId: req.params.eventId },
      });
      if (count !== ids.length) throw badRequest('One or more sub-event IDs do not belong to this event');

      await Promise.all(
        items.map(({ id, order }) => tx.subEvent.update({ where: { id }, data: { order } })),
      );
    });

    res.json({ data: { reordered: items.length } });
  } catch (err) { next(err); }
});

// ─── PATCH /:eventId/subevents/:id — update ───────────────────

router.patch('/:eventId/subevents/:id', authenticate, validate(updateSubEventSchema), async (req, res, next) => {
  try {
    await guardEventAccess(req.params.eventId, req.user.userId, { writeAccess: true });
    await loadSubEvent(req.params.id, req.params.eventId);

    const { date, ...rest } = req.body;
    const data = { ...rest, ...(date ? { date: new Date(date) } : {}) };

    const subEvent = await prisma.subEvent.update({ where: { id: req.params.id }, data });
    res.json({ data: subEvent });
  } catch (err) { next(err); }
});

// ─── DELETE /:eventId/subevents/:id ───────────────────────────

router.delete('/:eventId/subevents/:id', authenticate, async (req, res, next) => {
  try {
    const { event } = await guardEventAccess(req.params.eventId, req.user.userId, { writeAccess: true });

    // Guard: cannot remove the only sub-event while event is LIVE
    if (event.status === 'LIVE') {
      const remaining = await prisma.subEvent.count({ where: { eventId: req.params.eventId } });
      if (remaining <= 1) throw badRequest('Cannot delete the only sub-event while the event is LIVE');
    }

    await loadSubEvent(req.params.id, req.params.eventId);
    await prisma.subEvent.delete({ where: { id: req.params.id } });
    res.status(204).end();
  } catch (err) { next(err); }
});

// ─── POST /:eventId/itinerary/notify ──────────────────────────
// Enqueues a WhatsApp itinerary-update to all opted-in guests.
// Returns a job ID the client can poll (once the B10 queue worker is wired).
//
// Production path (B10): import { enqueueItineraryNotify } from '../services/whatsapp.js'
// and replace the stub below with: const jobId = await enqueueItineraryNotify(eventId, subEvents)

router.post('/:eventId/itinerary/notify', authenticate, async (req, res, next) => {
  try {
    await guardEventAccess(req.params.eventId, req.user.userId, { writeAccess: true });

    const guests = await prisma.guest.findMany({
      where:  { eventId: req.params.eventId, whatsappOptIn: true },
      select: { id: true, phone: true, name: true },
    });

    const jobId = crypto.randomUUID();

    if (guests.length > 0) {
      // Create QUEUED message rows so the B10 worker can pick them up
      await prisma.whatsAppMessage.createMany({
        data: guests.map(g => ({
          guestId:    g.id,
          type:       'ITINERARY_REMINDER',
          status:     'QUEUED',
          body:       `Your event itinerary has been updated. Please check the latest schedule.`,
        })),
      });
    }

    // ─── B10 stub ────────────────────────────────────────────
    // Replace this log with: await enqueueItineraryNotify(jobId, eventId, guests)
    // when the WhatsApp worker service (module B10) is implemented.
    logger.warn(
      { eventId: req.params.eventId, guestCount: guests.length, jobId },
      '[STUB] WhatsApp itinerary notify queued — wire to B10 worker',
    );

    res.json({
      data: {
        jobId,
        queued:  guests.length,
        message: guests.length > 0
          ? `Itinerary notification queued for ${guests.length} opted-in guest(s)`
          : 'No opted-in guests found for this event',
      },
    });
  } catch (err) { next(err); }
});

export default router;
