import { Router }   from 'express';
import multer        from 'multer';
import Papa          from 'papaparse';
import { parsePhoneNumber, isValidPhoneNumber } from 'libphonenumber-js';
import { z }         from 'zod';
import prisma        from '../lib/prisma.js';
import { authenticate } from '../middleware/auth.js';
import { validate }  from '../lib/validate.js';
import { parsePagination } from '../lib/pagination.js';
import { notFound, forbidden, badRequest, conflict } from '../lib/errors.js';
import logger        from '../lib/logger.js';

// ─── Routers ──────────────────────────────────────────────────
const router                    = Router();  // /api/guests
export const eventGuestRouter   = Router();  // /api/events  (delivery tracking)
export const publicGuestRouter  = Router();  // /api/public  (RSVP)

// ─── Constants ────────────────────────────────────────────────

const PLAN_GUEST_LIMITS = {
  FREE:       100,
  MINI:       500,
  SMALL:      1000,
  MID:        2500,
  LARGE:      10000,
  ENTERPRISE: Infinity,
};

// ─── Schemas ──────────────────────────────────────────────────

const addGuestSchema = z.object({
  eventId:       z.string().uuid(),
  name:          z.string().max(150).optional().nullable(),
  phone:         z.string().min(5).max(20),
  whatsappOptIn: z.boolean().default(false),
  guestType:     z.enum(['STANDARD', 'VIP', 'HOST']).default('STANDARD'),
  rsvpStatus:    z.enum(['PENDING', 'CONFIRMED', 'DECLINED']).default('PENDING'),
});

const updateGuestSchema = addGuestSchema.partial().omit({ eventId: true, phone: true });

const rsvpSchema = z.object({
  status: z.enum(['CONFIRMED', 'DECLINED']),
});

const bulkSchema = z.object({
  ids:    z.array(z.string().uuid()).min(1),
  action: z.enum(['remind', 'resend', 'delete']),
});

const listQuerySchema = z.object({
  eventId:   z.string().uuid().optional(),
  status:    z.enum(['PENDING', 'CONFIRMED', 'DECLINED']).optional(),
  guestType: z.enum(['STANDARD', 'VIP', 'HOST']).optional(),
  search:    z.string().max(100).optional(),
  page:      z.coerce.number().int().positive().optional(),
  limit:     z.coerce.number().int().positive().optional(),
  sort:      z.string().optional(),
});

const publicRsvpSchema = z.object({
  name:   z.string().max(150).optional().nullable(),
  phone:  z.string().min(5).max(20),
  status: z.enum(['CONFIRMED', 'DECLINED']).default('CONFIRMED'),
  optIn:  z.boolean().default(false),
});

const deliveryQuerySchema = z.object({
  status: z.enum(['all', 'delivered', 'undelivered']).default('all'),
  page:   z.coerce.number().int().positive().optional(),
  limit:  z.coerce.number().int().positive().optional(),
});

// ─── Helpers ──────────────────────────────────────────────────

/** Normalise a raw phone string to E.164, defaulting to India as region. */
function normalizePhone(raw) {
  try {
    const cleaned = raw.toString().trim();
    if (isValidPhoneNumber(cleaned, 'IN')) {
      return parsePhoneNumber(cleaned, 'IN').format('E.164');
    }
    const p = parsePhoneNumber(cleaned);
    return p.isValid() ? p.format('E.164') : null;
  } catch {
    return null;
  }
}

/** Verify the caller has access to the event. Returns the full event row. */
async function guardEvent(eventId, userId, { writeAccess = false } = {}) {
  const event = await prisma.event.findUnique({
    where:   { id: eventId },
    include: { studio: { select: { id: true, ownerId: true, planTier: true } } },
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

/** Throw if adding `addingCount` guests would exceed event or plan limits. */
async function assertGuestCapacity(eventId, event, addingCount = 1) {
  const current = await prisma.guest.count({ where: { eventId, deletedAt: null } });
  if (current + addingCount > event.guestLimit) {
    throw badRequest(`Guest limit reached (${event.guestLimit})`);
  }
  const planMax = PLAN_GUEST_LIMITS[event.studio.planTier] ?? 500;
  if (current + addingCount > planMax) {
    throw badRequest(`Plan guest limit reached (${planMax} for ${event.studio.planTier} tier)`);
  }
}

// ─── multer (memory storage, 5 MB, CSV only) ─────────────────

const upload = multer({
  storage: multer.memoryStorage(),
  limits:  { fileSize: 5 * 1024 * 1024 },
  fileFilter(_, file, cb) {
    cb(null, file.mimetype === 'text/csv' || file.originalname.endsWith('.csv'));
  },
});

// ═══════════════════════════════════════════════════════════════
//  /api/guests
// ═══════════════════════════════════════════════════════════════

// ─── GET / — list with pagination ─────────────────────────────

router.get('/', authenticate, validate(listQuerySchema, 'query'), async (req, res, next) => {
  try {
    const { eventId, status, guestType, search } = req.query;
    if (!eventId) return next(badRequest('eventId query param required'));

    await guardEvent(eventId, req.user.userId);

    const { page, skip, take } = parsePagination(req.query);

    const where = {
      eventId,
      deletedAt: null,
      ...(status    ? { rsvpStatus: status } : {}),
      ...(guestType ? { guestType }           : {}),
      ...(search    ? {
        OR: [
          { name:  { contains: search, mode: 'insensitive' } },
          { phone: { contains: search } },
        ],
      } : {}),
    };

    const [guests, total] = await Promise.all([
      prisma.guest.findMany({
        where,
        include: {
          whatsappMessages: {
            orderBy: { createdAt: 'desc' },
            take:    1,
            select:  { status: true, type: true, sentAt: true, deliveredAt: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      prisma.guest.count({ where }),
    ]);

    res.json({ data: guests, meta: { page, limit: take, total, pages: Math.ceil(total / take) } });
  } catch (err) { next(err); }
});

// ─── POST / — add single guest ────────────────────────────────

router.post('/', authenticate, validate(addGuestSchema), async (req, res, next) => {
  try {
    const { eventId, phone: rawPhone, ...rest } = req.body;
    const event = await guardEvent(eventId, req.user.userId, { writeAccess: true });

    const phone = normalizePhone(rawPhone);
    if (!phone) return next(badRequest('Invalid phone number'));

    const existing = await prisma.guest.findUnique({
      where: { eventId_phone: { eventId, phone } },
    });

    if (existing) {
      if (existing.deletedAt) {
        // Restore soft-deleted record
        const restored = await prisma.guest.update({
          where: { id: existing.id },
          data:  { deletedAt: null, ...rest },
        });
        return res.status(201).json({ data: restored });
      }
      return next(conflict('A guest with this phone already exists'));
    }

    await assertGuestCapacity(eventId, event);

    const guest = await prisma.guest.create({ data: { eventId, phone, ...rest } });
    res.status(201).json({ data: guest });
  } catch (err) { next(err); }
});

// ─── POST /import — multipart CSV ─────────────────────────────

router.post('/import', authenticate, upload.single('file'), async (req, res, next) => {
  try {
    const { eventId } = req.body;
    if (!eventId) return next(badRequest('eventId required'));
    if (!req.file)  return next(badRequest('CSV file required (field name: file)'));

    const event = await guardEvent(eventId, req.user.userId, { writeAccess: true });

    const csv = req.file.buffer.toString('utf8');
    const { data: rows, errors: parseErrors } = Papa.parse(csv, {
      header:          true,
      skipEmptyLines:  true,
      transformHeader: h => h.trim().toLowerCase().replace(/\s+/g, ''),
    });

    if (parseErrors.length) {
      return next(badRequest(`CSV parse error: ${parseErrors[0].message}`));
    }

    // Fetch all non-deleted phones for this event
    const existingPhones = new Set(
      (await prisma.guest.findMany({
        where:  { eventId, deletedAt: null },
        select: { phone: true },
      })).map(g => g.phone),
    );

    const currentCount = existingPhones.size;
    const planMax      = PLAN_GUEST_LIMITS[event.studio.planTier] ?? 500;
    const capacity     = Math.min(planMax, event.guestLimit) - currentCount;

    const toInsert = [];
    const skipped  = [];
    const errors   = [];

    for (const row of rows) {
      const rawPhone = (row.phone || row.mobile || row.number || '').trim();
      if (!rawPhone) {
        errors.push({ row, reason: 'Missing phone number' });
        continue;
      }

      const phone = normalizePhone(rawPhone);
      if (!phone) {
        errors.push({ row, reason: `Invalid phone: ${rawPhone}` });
        continue;
      }

      if (existingPhones.has(phone)) {
        skipped.push(phone);
        continue;
      }

      if (toInsert.length >= capacity) {
        skipped.push(phone);
        continue;
      }

      existingPhones.add(phone); // in-batch dedupe

      const rawType = (row.guesttype || row.type || '').toUpperCase();
      toInsert.push({
        eventId,
        phone,
        name:          (row.name || '').trim() || null,
        guestType:     ['STANDARD', 'VIP', 'HOST'].includes(rawType) ? rawType : 'STANDARD',
        whatsappOptIn: ['true', '1', 'yes'].includes((row.whatsappoptin || '').toLowerCase()),
      });
    }

    if (toInsert.length > 0) {
      await prisma.guest.createMany({ data: toInsert, skipDuplicates: true });
    }

    res.json({ data: { added: toInsert.length, skipped: skipped.length, errors } });
  } catch (err) { next(err); }
});

// ─── POST /bulk — remind | resend | delete ────────────────────
// All IDs must belong to the same event.

router.post('/bulk', authenticate, validate(bulkSchema), async (req, res, next) => {
  try {
    const { ids, action } = req.body;

    const first = await prisma.guest.findFirst({
      where:  { id: ids[0], deletedAt: null },
      select: { eventId: true },
    });
    if (!first) return next(notFound('Guest not found'));

    await guardEvent(first.eventId, req.user.userId, { writeAccess: true });

    const count = await prisma.guest.count({
      where: { id: { in: ids }, eventId: first.eventId, deletedAt: null },
    });
    if (count !== ids.length) return next(badRequest('One or more guest IDs not found in this event'));

    if (action === 'delete') {
      await prisma.guest.updateMany({
        where: { id: { in: ids } },
        data:  { deletedAt: new Date() },
      });
      return res.json({ data: { affected: ids.length, action: 'delete' } });
    }

    // remind / resend — enqueue WhatsApp QUEUED rows for opted-in guests
    const messageType = action === 'remind' ? 'GALLERY_LINK' : 'PHOTO_READY';
    const optedIn = await prisma.guest.findMany({
      where:  { id: { in: ids }, whatsappOptIn: true, deletedAt: null },
      select: { id: true },
    });

    if (optedIn.length > 0) {
      await prisma.whatsAppMessage.createMany({
        data: optedIn.map(g => ({
          guestId: g.id,
          type:    messageType,
          status:  'QUEUED',
          body:    action === 'remind'
            ? 'Your photos are ready! Click to view your gallery.'
            : 'Your selected photos are ready for download.',
        })),
      });
    }

    logger.warn(
      { action, eventId: first.eventId, total: ids.length, queued: optedIn.length },
      '[STUB] Bulk WhatsApp action queued — wire to B10 worker',
    );

    res.json({
      data: {
        action,
        total:   ids.length,
        queued:  optedIn.length,
        skipped: ids.length - optedIn.length,
        message: `${optedIn.length} WhatsApp message(s) queued`,
      },
    });
  } catch (err) { next(err); }
});

// ─── GET /export.csv — streaming cursor-based export ─────────

router.get('/export.csv', authenticate, async (req, res, next) => {
  try {
    const { eventId } = req.query;
    if (!eventId) return next(badRequest('eventId query param required'));

    await guardEvent(eventId, req.user.userId);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="guests-${eventId}.csv"`);

    res.write('id,name,phone,guestType,rsvpStatus,whatsappOptIn,photosReceived,createdAt\n');

    const BATCH = 200;
    let cursor  = undefined;

    for (;;) {
      const batch = await prisma.guest.findMany({
        where:   { eventId, deletedAt: null },
        orderBy: { id: 'asc' },
        take:    BATCH,
        ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
        select:  {
          id:             true,
          name:           true,
          phone:          true,
          guestType:      true,
          rsvpStatus:     true,
          whatsappOptIn:  true,
          photosReceived: true,
          createdAt:      true,
        },
      });

      if (batch.length === 0) break;

      for (const g of batch) {
        const safeName = (g.name ?? '').replace(/"/g, '""');
        res.write(`${g.id},"${safeName}",${g.phone},${g.guestType},${g.rsvpStatus},${g.whatsappOptIn},${g.photosReceived},${g.createdAt.toISOString()}\n`);
      }

      if (batch.length < BATCH) break;
      cursor = batch[batch.length - 1].id;
    }

    res.end();
  } catch (err) { next(err); }
});

// ─── PATCH /:id — update guest ────────────────────────────────

router.patch('/:id', authenticate, validate(updateGuestSchema), async (req, res, next) => {
  try {
    const guest = await prisma.guest.findUnique({ where: { id: req.params.id } });
    if (!guest || guest.deletedAt) return next(notFound('Guest not found'));

    await guardEvent(guest.eventId, req.user.userId, { writeAccess: true });

    const updated = await prisma.guest.update({ where: { id: req.params.id }, data: req.body });
    res.json({ data: updated });
  } catch (err) { next(err); }
});

// ─── PATCH /:id/rsvp ──────────────────────────────────────────

router.patch('/:id/rsvp', authenticate, validate(rsvpSchema), async (req, res, next) => {
  try {
    const guest = await prisma.guest.findUnique({ where: { id: req.params.id } });
    if (!guest || guest.deletedAt) return next(notFound('Guest not found'));

    await guardEvent(guest.eventId, req.user.userId, { writeAccess: true });

    const updated = await prisma.guest.update({
      where: { id: req.params.id },
      data:  { rsvpStatus: req.body.status },
    });
    res.json({ data: updated });
  } catch (err) { next(err); }
});

// ─── DELETE /:id — soft delete ────────────────────────────────

router.delete('/:id', authenticate, async (req, res, next) => {
  try {
    const guest = await prisma.guest.findUnique({ where: { id: req.params.id } });
    if (!guest || guest.deletedAt) return next(notFound('Guest not found'));

    await guardEvent(guest.eventId, req.user.userId, { writeAccess: true });

    await prisma.guest.update({ where: { id: req.params.id }, data: { deletedAt: new Date() } });
    res.status(204).end();
  } catch (err) { next(err); }
});

// ─── POST /:id/selfie — store selfie URL + face embedding ─────

router.post('/:id/selfie', authenticate, async (req, res, next) => {
  try {
    const { selfieUrl, faceEmbedding } = req.body;
    if (!selfieUrl) return next(badRequest('selfieUrl required'));

    const guest = await prisma.guest.findUnique({ where: { id: req.params.id } });
    if (!guest || guest.deletedAt) return next(notFound('Guest not found'));

    // Guests can upload their own selfie; team members can update any
    const isOwnGuest = req.user.type === 'guest' && req.user.guestId === req.params.id;
    if (!isOwnGuest) {
      await guardEvent(guest.eventId, req.user.userId, { writeAccess: true });
    }

    const updated = await prisma.guest.update({
      where: { id: req.params.id },
      data:  { selfieUrl, ...(faceEmbedding ? { faceEmbedding } : {}) },
    });
    res.json({ data: updated });
  } catch (err) { next(err); }
});

// ═══════════════════════════════════════════════════════════════
//  eventGuestRouter — GET /api/events/:eventId/guests
//  Delivery tracking view for GuestManagement.jsx
// ═══════════════════════════════════════════════════════════════

eventGuestRouter.get(
  '/:eventId/guests',
  authenticate,
  validate(deliveryQuerySchema, 'query'),
  async (req, res, next) => {
    try {
      const { eventId } = req.params;
      await guardEvent(eventId, req.user.userId);

      const { status } = req.query;
      const { page, skip, take } = parsePagination(req.query);

      const deliveryFilter =
        status === 'all'         ? {} :
        status === 'delivered'   ? { whatsappMessages: { some: { status: { in: ['DELIVERED', 'READ'] } } } } :
                                   { whatsappMessages: { none: { status: { in: ['DELIVERED', 'READ'] } } } };

      const where = { eventId, deletedAt: null, ...deliveryFilter };

      const [guests, total, deliveredCount, totalCount] = await Promise.all([
        prisma.guest.findMany({
          where,
          include: {
            whatsappMessages: {
              orderBy: { createdAt: 'desc' },
              take:    5,
              select:  { id: true, type: true, status: true, sentAt: true, deliveredAt: true, readAt: true },
            },
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take,
        }),
        prisma.guest.count({ where }),
        prisma.guest.count({
          where: {
            eventId,
            deletedAt: null,
            whatsappMessages: { some: { status: { in: ['DELIVERED', 'READ'] } } },
          },
        }),
        prisma.guest.count({ where: { eventId, deletedAt: null } }),
      ]);

      res.json({
        data: guests,
        meta: { page, limit: take, total, pages: Math.ceil(total / take) },
        summary: {
          total:       totalCount,
          delivered:   deliveredCount,
          undelivered: totalCount - deliveredCount,
          percent:     totalCount > 0 ? +((deliveredCount / totalCount) * 100).toFixed(1) : 0,
        },
      });
    } catch (err) { next(err); }
  },
);

// ═══════════════════════════════════════════════════════════════
//  publicGuestRouter — POST /api/public/rsvp/:eventToken
//  No authentication — opaque token from Event.inviteToken
// ═══════════════════════════════════════════════════════════════

publicGuestRouter.post('/rsvp/:eventToken', validate(publicRsvpSchema), async (req, res, next) => {
  try {
    const event = await prisma.event.findUnique({
      where:   { inviteToken: req.params.eventToken },
      select:  { id: true, status: true, guestLimit: true, studio: { select: { planTier: true } } },
    });
    if (!event) return next(notFound('Invite not found'));
    if (['ARCHIVED', 'COMPLETED'].includes(event.status)) {
      return next(badRequest('RSVP is no longer open for this event'));
    }

    const { phone: rawPhone, name, status, optIn } = req.body;
    const phone = normalizePhone(rawPhone);
    if (!phone) return next(badRequest('Invalid phone number'));

    const existing = await prisma.guest.findUnique({
      where: { eventId_phone: { eventId: event.id, phone } },
    });

    if (existing) {
      const updated = await prisma.guest.update({
        where: { id: existing.id },
        data:  {
          deletedAt:     null,
          rsvpStatus:    status,
          whatsappOptIn: optIn,
          ...(name ? { name } : {}),
        },
      });
      return res.json({ data: { guest: updated, created: false } });
    }

    // Enforce capacity for new guests
    const currentCount = await prisma.guest.count({ where: { eventId: event.id, deletedAt: null } });
    const planMax      = PLAN_GUEST_LIMITS[event.studio.planTier] ?? 500;
    if (currentCount >= event.guestLimit || currentCount >= planMax) {
      return next(badRequest('Guest capacity reached for this event'));
    }

    const guest = await prisma.guest.create({
      data: { eventId: event.id, phone, name: name ?? null, rsvpStatus: status, whatsappOptIn: optIn },
    });
    res.status(201).json({ data: { guest, created: true } });
  } catch (err) { next(err); }
});

export default router;
