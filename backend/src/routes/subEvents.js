import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate } from '../middleware/auth.js';

const router = Router();
const prisma = new PrismaClient();

// GET /api/events/:eventId/subevents
router.get('/:eventId/subevents', authenticate, async (req, res) => {
  const subEvents = await prisma.subEvent.findMany({
    where: { eventId: req.params.eventId },
    include: { _count: { select: { media: true } } },
    orderBy: { date: 'asc' },
  });
  res.json(subEvents);
});

// POST /api/events/:eventId/subevents
router.post('/:eventId/subevents', authenticate, async (req, res) => {
  try {
    const subEvent = await prisma.subEvent.create({
      data: { ...req.body, eventId: req.params.eventId, date: new Date(req.body.date) },
    });
    res.status(201).json(subEvent);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/events/:eventId/subevents/:id
router.patch('/:eventId/subevents/:id', authenticate, async (req, res) => {
  const subEvent = await prisma.subEvent.update({ where: { id: req.params.id }, data: req.body });
  res.json(subEvent);
});

// DELETE /api/events/:eventId/subevents/:id
router.delete('/:eventId/subevents/:id', authenticate, async (req, res) => {
  await prisma.subEvent.delete({ where: { id: req.params.id } });
  res.status(204).end();
});

export default router;
