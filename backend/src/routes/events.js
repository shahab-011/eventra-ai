import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate } from '../middleware/auth.js';
import { z } from 'zod';

const router = Router();
const prisma = new PrismaClient();

const createEventSchema = z.object({
  name: z.string().min(2),
  type: z.enum(['WEDDING', 'CORPORATE', 'BIRTHDAY', 'COLLEGE_FEST', 'CONCERT', 'MARATHON', 'OTHER']).default('WEDDING'),
  startDate: z.string(),
  endDate: z.string().optional(),
  venue: z.string().optional(),
  description: z.string().optional(),
  guestLimit: z.number().int().min(1).default(300),
  storageAllocGB: z.number().default(25),
  galleryTheme: z.string().default('dark'),
  downloadEnabled: z.boolean().default(true),
});

// GET /api/events — list all events for studio
router.get('/', authenticate, async (req, res) => {
  try {
    const studio = await prisma.studio.findUnique({ where: { ownerId: req.user.userId } });
    if (!studio) return res.status(404).json({ error: 'Studio not found' });

    const events = await prisma.event.findMany({
      where: { studioId: studio.id },
      include: { subEvents: true, _count: { select: { guests: true, media: true } } },
      orderBy: { startDate: 'desc' },
    });
    res.json(events);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/events
router.post('/', authenticate, async (req, res) => {
  try {
    const data = createEventSchema.parse(req.body);
    const studio = await prisma.studio.findUnique({ where: { ownerId: req.user.userId } });
    if (!studio) return res.status(404).json({ error: 'Studio not found' });

    const event = await prisma.event.create({
      data: { ...data, studioId: studio.id, startDate: new Date(data.startDate), endDate: data.endDate ? new Date(data.endDate) : null },
    });
    res.status(201).json(event);
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ error: err.errors });
    res.status(500).json({ error: err.message });
  }
});

// GET /api/events/:id
router.get('/:id', authenticate, async (req, res) => {
  try {
    const event = await prisma.event.findUnique({
      where: { id: req.params.id },
      include: { subEvents: true, guests: { select: { id: true, name: true, phone: true, rsvpStatus: true, guestType: true } }, _count: { select: { media: true } } },
    });
    if (!event) return res.status(404).json({ error: 'Event not found' });
    res.json(event);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/events/:id
router.patch('/:id', authenticate, async (req, res) => {
  try {
    const event = await prisma.event.update({ where: { id: req.params.id }, data: req.body });
    res.json(event);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/events/:id
router.delete('/:id', authenticate, async (req, res) => {
  try {
    await prisma.event.delete({ where: { id: req.params.id } });
    res.status(204).end();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
