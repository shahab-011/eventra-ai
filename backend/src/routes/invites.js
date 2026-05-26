/**
 * Invite routes — InviteBuilder module (B13).
 *
 * Private (JWT auth):
 *   GET  /api/invites/templates           — template registry
 *   GET  /api/invites/templates/:id       — single template
 *   GET  /api/invites/?eventId=           — list event invites
 *   POST /api/invites/                    — create invite
 *   PATCH /api/invites/:id                — update invite
 *   DELETE /api/invites/:id               — delete invite
 *   POST /api/invites/:id/publish         — generate slug + QR, mark published
 *   GET  /api/invites/:id/analytics       — views over time + RSVP funnel
 *
 * Public (no auth) — mounted on /api/public in index.js:
 *   GET  /invite/:slug                    — render invite data; increment viewCount
 *   POST /invite/:slug/rsvp               — capture RSVP, upsert guest
 *   GET  /invite/:slug/pool               — confirmed attendees (if showGuestPool)
 */

import { createHash, randomBytes } from 'node:crypto';
import { Router }       from 'express';
import QRCode           from 'qrcode';
import { z }            from 'zod';
import { parsePhoneNumber, isValidPhoneNumber } from 'libphonenumber-js';

import prisma           from '../lib/prisma.js';
import { authenticate } from '../middleware/auth.js';
import { validate }     from '../lib/validate.js';
import { notFound, forbidden, badRequest } from '../lib/errors.js';
import { whatsappQueue } from '../lib/queues.js';
import { listTemplates, getTemplate } from '../data/templateRegistry.js';
import env              from '../config/env.js';
import logger           from '../lib/logger.js';

// ─── Routers ──────────────────────────────────────────────────

const router = Router();              // /api/invites
export const publicInviteRouter = Router(); // /api/public

// ─── Schemas ──────────────────────────────────────────────────

const createSchema = z.object({
  eventId:         z.string().uuid(),
  templateId:      z.string().min(1).max(50),
  title:           z.string().min(1).max(200),
  subtitle:        z.string().max(200).optional().nullable(),
  hostName:        z.string().max(150).optional().nullable(),
  rsvpByDate:      z.coerce.date().optional().nullable(),
  note:            z.string().max(1000).optional().nullable(),
  customData:      z.record(z.unknown()).optional().nullable(),
  showGuestPool:   z.boolean().default(false),
  plusOnesEnabled: z.boolean().default(false),
  mealPrefEnabled: z.boolean().default(false),
});

const updateSchema = createSchema.omit({ eventId: true }).partial();

const templateQuerySchema = z.object({
  category:       z.string().optional(),
  layout:         z.string().optional(),
  animationStyle: z.string().optional(),
  search:         z.string().max(100).optional(),
});

const rsvpSchema = z.object({
  name:      z.string().max(150).optional().nullable(),
  phone:     z.string().min(5).max(20),
  attending: z.boolean().default(true),
  plusOnes:  z.number().int().min(0).max(10).default(0),
  mealPref:  z.string().max(100).optional().nullable(),
  message:   z.string().max(500).optional().nullable(),
  optIn:     z.boolean().default(false),
});

// ─── Helpers ──────────────────────────────────────────────────

function normalizePhone(raw) {
  try {
    const cleaned = raw.toString().trim();
    if (isValidPhoneNumber(cleaned, 'IN')) return parsePhoneNumber(cleaned, 'IN').format('E.164');
    const p = parsePhoneNumber(cleaned);
    return p.isValid() ? p.format('E.164') : null;
  } catch {
    return null;
  }
}

/** Verify the caller owns the event (studio owner or active team member). */
async function guardInviteAccess(inviteId, userId, { write = false } = {}) {
  const invite = await prisma.invite.findUnique({
    where:   { id: inviteId },
    include: { event: { select: { studioId: true, studio: { select: { ownerId: true } } } } },
  });
  if (!invite) throw notFound('Invite not found');

  const { ownerId } = invite.event.studio;
  if (ownerId === userId) return invite;

  const member = await prisma.teamMember.findFirst({
    where:  { studioId: invite.event.studioId, userId, status: 'ACTIVE' },
    select: { role: true },
  });
  if (!member) throw forbidden('Access denied');
  if (write && !['ADMIN', 'EDITOR'].includes(member.role)) throw forbidden('Insufficient permissions');

  return invite;
}

/** Generate a unique URL-safe slug: `title-prefix-xxxxxxxx`. */
async function generateSlug(title) {
  const prefix = (title ?? 'invite')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 24);

  for (let i = 0; i < 5; i++) {
    const suffix = randomBytes(4).toString('hex'); // 8 hex chars
    const slug   = `${prefix}-${suffix}`;
    const exists = await prisma.invite.findUnique({ where: { slug }, select: { id: true } });
    if (!exists) return slug;
  }
  throw new Error('Could not generate a unique slug after 5 attempts');
}

/** Hash an IP address to an anonymised string (non-reversible, per-day). */
function hashIp(ip, inviteId) {
  const today = new Date().toISOString().slice(0, 10);
  return createHash('sha256').update(`${ip}:${inviteId}:${today}`).digest('hex').slice(0, 16);
}

// ─── Template endpoints ───────────────────────────────────────

// GET /api/invites/templates
router.get('/templates', authenticate, validate(templateQuerySchema, 'query'), (req, res) => {
  const { category, layout, animationStyle, search } = req.query;
  const templates = listTemplates({ category, layout, animationStyle, search });
  res.json({ data: templates, total: templates.length });
});

// GET /api/invites/templates/:id
router.get('/templates/:id', authenticate, (req, res, next) => {
  const tpl = getTemplate(req.params.id);
  if (!tpl) return next(notFound('Template not found'));
  res.json({ data: tpl });
});

// ─── CRUD (authenticated) ─────────────────────────────────────

// GET /api/invites/?eventId=
router.get('/', authenticate, async (req, res, next) => {
  try {
    const { eventId } = req.query;
    if (!eventId) return next(badRequest('eventId query param required'));

    // Verify access
    const event = await prisma.event.findUnique({
      where:   { id: eventId },
      include: { studio: { select: { ownerId: true } } },
    });
    if (!event) return next(notFound('Event not found'));

    if (event.studio.ownerId !== req.user.userId) {
      const member = await prisma.teamMember.findFirst({
        where: { studioId: event.studioId, userId: req.user.userId, status: 'ACTIVE' },
      });
      if (!member) return next(forbidden('Access denied'));
    }

    const invites = await prisma.invite.findMany({
      where:   { eventId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true, templateId: true, title: true, subtitle: true,
        hostName: true, rsvpByDate: true, note: true, customData: true,
        slug: true, shareUrl: true, qrDataUrl: true, published: true,
        showGuestPool: true, plusOnesEnabled: true, mealPrefEnabled: true,
        viewCount: true, rsvpCount: true, createdAt: true, updatedAt: true,
      },
    });

    res.json({ data: invites });
  } catch (err) { next(err); }
});

// POST /api/invites/
router.post('/', authenticate, validate(createSchema), async (req, res, next) => {
  try {
    const { eventId, templateId, ...rest } = req.body;

    // Validate template
    if (!getTemplate(templateId)) return next(badRequest(`Unknown templateId: ${templateId}`));

    // Guard event access
    const event = await prisma.event.findUnique({
      where:   { id: eventId },
      include: { studio: { select: { ownerId: true } } },
    });
    if (!event) return next(notFound('Event not found'));

    if (event.studio.ownerId !== req.user.userId) {
      const member = await prisma.teamMember.findFirst({
        where: { studioId: event.studioId, userId: req.user.userId, status: 'ACTIVE' },
      });
      if (!member) return next(forbidden('Access denied'));
    }

    const invite = await prisma.invite.create({
      data: { eventId, templateId, ...rest },
    });

    res.status(201).json({ data: invite });
  } catch (err) { next(err); }
});

// PATCH /api/invites/:id
router.patch('/:id', authenticate, validate(updateSchema), async (req, res, next) => {
  try {
    const invite = await guardInviteAccess(req.params.id, req.user.userId, { write: true });

    if (req.body.templateId && !getTemplate(req.body.templateId)) {
      return next(badRequest(`Unknown templateId: ${req.body.templateId}`));
    }

    const updated = await prisma.invite.update({
      where: { id: invite.id },
      data:  req.body,
    });
    res.json({ data: updated });
  } catch (err) { next(err); }
});

// DELETE /api/invites/:id
router.delete('/:id', authenticate, async (req, res, next) => {
  try {
    await guardInviteAccess(req.params.id, req.user.userId, { write: true });
    await prisma.invite.delete({ where: { id: req.params.id } });
    res.status(204).end();
  } catch (err) { next(err); }
});

// POST /api/invites/:id/publish — generate slug + QR, mark published
router.post('/:id/publish', authenticate, async (req, res, next) => {
  try {
    const existing = await guardInviteAccess(req.params.id, req.user.userId, { write: true });

    // Reuse existing slug if already published
    const slug     = existing.slug ?? await generateSlug(existing.title);
    const shareUrl = `${env.FRONTEND_URL}/invite/${slug}`;

    // Generate QR as base64 PNG data URL (renderable as <img src={qrDataUrl} />)
    const qrDataUrl = await QRCode.toDataURL(shareUrl, {
      errorCorrectionLevel: 'M',
      margin:  1,
      width:   300,
      color:   { dark: '#000000', light: '#FFFFFF' },
    });

    const invite = await prisma.invite.update({
      where: { id: req.params.id },
      data:  { slug, shareUrl, qrDataUrl, published: true },
    });

    logger.info({ inviteId: invite.id, slug }, '[invites] published');
    res.json({ data: invite });
  } catch (err) { next(err); }
});

// GET /api/invites/:id/analytics
router.get('/:id/analytics', authenticate, async (req, res, next) => {
  try {
    await guardInviteAccess(req.params.id, req.user.userId);
    const inviteId = req.params.id;

    // Views grouped by day (last 30 days)
    const viewsByDay = await prisma.$queryRaw`
      SELECT
        DATE("viewedAt")::text   AS day,
        COUNT(*)::int             AS views,
        COUNT(DISTINCT "ipHash")::int AS unique_views
      FROM "InviteView"
      WHERE "inviteId" = ${inviteId}::uuid
        AND "viewedAt" >= NOW() - INTERVAL '30 days'
      GROUP BY DATE("viewedAt")
      ORDER BY DATE("viewedAt")
    `;

    // RSVP funnel
    const [totalViews, uniqueViews, rsvpTotal, confirmed, declined] = await Promise.all([
      prisma.inviteView.count({ where: { inviteId } }),
      prisma.inviteView.groupBy({
        by:    ['ipHash'],
        where: { inviteId, ipHash: { not: null } },
      }).then(r => r.length),
      prisma.guest.count({ where: { inviteId, deletedAt: null } }),
      prisma.guest.count({ where: { inviteId, rsvpStatus: 'CONFIRMED', deletedAt: null } }),
      prisma.guest.count({ where: { inviteId, rsvpStatus: 'DECLINED', deletedAt: null } }),
    ]);

    const pending = rsvpTotal - confirmed - declined;

    res.json({
      data: {
        viewsByDay,
        funnel: {
          totalViews,
          uniqueViews,
          rsvpTotal,
          confirmed,
          declined,
          pending,
          conversionRate: uniqueViews > 0
            ? +((rsvpTotal / uniqueViews) * 100).toFixed(1)
            : 0,
        },
      },
    });
  } catch (err) { next(err); }
});

// ─── Public routes ────────────────────────────────────────────
// Mounted at /api/public by index.js

// GET /api/public/invite/:slug — render invite data
publicInviteRouter.get('/invite/:slug', async (req, res, next) => {
  try {
    const invite = await prisma.invite.findUnique({
      where:  { slug: req.params.slug },
      include: {
        event: {
          select: {
            id: true, name: true, type: true, startDate: true, endDate: true,
            venue: true, galleryTheme: true,
            studio: { select: { id: true, name: true, logoUrl: true } },
          },
        },
      },
    });

    if (!invite || !invite.published) return next(notFound('Invite not found'));

    // Debounced view count: one increment per IP per invite per day
    const rawIp   = req.headers['x-forwarded-for']?.split(',')[0]?.trim() ?? req.socket.remoteAddress ?? 'unknown';
    const ipHash  = hashIp(rawIp, invite.id);
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1_000);

    const recentView = await prisma.inviteView.findFirst({
      where:  { inviteId: invite.id, ipHash, viewedAt: { gt: oneHourAgo } },
      select: { id: true },
    });

    if (!recentView) {
      await prisma.$transaction([
        prisma.inviteView.create({ data: { inviteId: invite.id, ipHash } }),
        prisma.invite.update({ where: { id: invite.id }, data: { viewCount: { increment: 1 } } }),
      ]);
    }

    // Resolve template metadata for the renderer
    const template = getTemplate(invite.templateId);

    // Don't expose qrDataUrl, ipHash data, or internal fields
    const { qrDataUrl: _qr, ...safeInvite } = invite;
    res.json({ data: { invite: safeInvite, template } });
  } catch (err) { next(err); }
});

// POST /api/public/invite/:slug/rsvp
publicInviteRouter.post('/invite/:slug/rsvp', validate(rsvpSchema), async (req, res, next) => {
  try {
    const invite = await prisma.invite.findUnique({
      where:  { slug: req.params.slug },
      select: {
        id: true, eventId: true, published: true, rsvpByDate: true,
        plusOnesEnabled: true, mealPrefEnabled: true,
        event: { select: { status: true, guestLimit: true, studio: { select: { planTier: true } } } },
      },
    });

    if (!invite || !invite.published) return next(notFound('Invite not found'));
    if (['ARCHIVED', 'COMPLETED'].includes(invite.event.status)) {
      return next(badRequest('RSVP is no longer open for this event'));
    }
    if (invite.rsvpByDate && new Date() > invite.rsvpByDate) {
      return next(badRequest('The RSVP deadline has passed'));
    }

    const { phone: rawPhone, name, attending, plusOnes, mealPref, message: rsvpMessage, optIn } = req.body;

    const phone = normalizePhone(rawPhone);
    if (!phone) return next(badRequest('Invalid phone number'));

    const rsvpStatus = attending ? 'CONFIRMED' : 'DECLINED';
    const safePlusOnes  = invite.plusOnesEnabled ? (plusOnes ?? 0) : 0;
    const safeMealPref  = invite.mealPrefEnabled  ? (mealPref  ?? null) : null;

    // Upsert guest — one record per (eventId, phone)
    const existing = await prisma.guest.findUnique({
      where: { eventId_phone: { eventId: invite.eventId, phone } },
    });

    let guest;
    let created = false;

    if (existing) {
      guest = await prisma.guest.update({
        where: { id: existing.id },
        data: {
          deletedAt:    null,
          rsvpStatus,
          whatsappOptIn: optIn,
          inviteId:     invite.id,
          plusOnes:     safePlusOnes,
          mealPref:     safeMealPref,
          rsvpMessage,
          ...(name ? { name } : {}),
        },
      });
    } else {
      // Capacity check for new guests
      const PLAN_LIMITS = { FREE: 100, MINI: 500, SMALL: 1000, MID: 2500, LARGE: 10000, ENTERPRISE: Infinity };
      const currentCount = await prisma.guest.count({ where: { eventId: invite.eventId, deletedAt: null } });
      const planMax = PLAN_LIMITS[invite.event.studio.planTier] ?? 500;
      if (currentCount >= invite.event.guestLimit || currentCount >= planMax) {
        return next(badRequest('Guest capacity reached for this event'));
      }

      guest = await prisma.guest.create({
        data: {
          eventId:      invite.eventId,
          inviteId:     invite.id,
          phone,
          name:         name ?? null,
          rsvpStatus,
          whatsappOptIn: optIn,
          plusOnes:     safePlusOnes,
          mealPref:     safeMealPref,
          rsvpMessage,
        },
      });
      created = true;
    }

    // Increment rsvpCount on the invite
    await prisma.invite.update({
      where: { id: invite.id },
      data:  { rsvpCount: { increment: 1 } },
    });

    // WhatsApp RSVP confirmation if opted in and attending
    if (attending && optIn && phone) {
      try {
        const msg = await prisma.whatsAppMessage.create({
          data: { guestId: guest.id, eventId: invite.eventId, type: 'RSVP_CONFIRMATION', status: 'QUEUED' },
        });
        await whatsappQueue.add('rsvp-confirmation', { messageId: msg.id, guestId: guest.id, eventId: invite.eventId });
      } catch (waErr) {
        logger.warn({ waErr, guestId: guest.id }, '[invites/rsvp] WhatsApp queue failed, non-fatal');
      }
    }

    res.status(created ? 201 : 200).json({
      data: {
        guestId:    guest.id,
        rsvpStatus: guest.rsvpStatus,
        name:       guest.name,
        created,
      },
    });
  } catch (err) { next(err); }
});

// GET /api/public/invite/:slug/pool — "see who's coming"
publicInviteRouter.get('/invite/:slug/pool', async (req, res, next) => {
  try {
    const invite = await prisma.invite.findUnique({
      where:  { slug: req.params.slug },
      select: { id: true, published: true, showGuestPool: true, eventId: true },
    });

    if (!invite || !invite.published)  return next(notFound('Invite not found'));
    if (!invite.showGuestPool) {
      return res.json({ data: { guests: [], hidden: true } });
    }

    const guests = await prisma.guest.findMany({
      where: {
        inviteId:   invite.id,
        rsvpStatus: 'CONFIRMED',
        deletedAt:  null,
      },
      select: {
        id:        true,
        name:      true,
        plusOnes:  true,
        createdAt: true,
      },
      orderBy: { createdAt: 'asc' },
      take: 200,
    });

    // Privacy: only show first name, never expose phone
    const sanitised = guests.map(g => ({
      id:       g.id,
      name:     g.name ? g.name.split(' ')[0] : 'Guest',
      plusOnes: g.plusOnes,
    }));

    const totalAttending = guests.reduce((sum, g) => sum + 1 + g.plusOnes, 0);

    res.json({ data: { guests: sanitised, totalAttending } });
  } catch (err) { next(err); }
});

export default router;
