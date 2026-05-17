import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate } from '../middleware/auth.js';

const router = Router();
const prisma = new PrismaClient();

// GET /api/guests?eventId=xxx
router.get('/', authenticate, async (req, res) => {
  const { eventId } = req.query;
  if (!eventId) return res.status(400).json({ error: 'eventId required' });
  const guests = await prisma.guest.findMany({
    where: { eventId },
    orderBy: { createdAt: 'desc' },
  });
  res.json(guests);
});

// POST /api/guests — add single guest
router.post('/', authenticate, async (req, res) => {
  try {
    const guest = await prisma.guest.create({ data: req.body });
    res.status(201).json(guest);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/guests/bulk — import CSV list
router.post('/bulk', authenticate, async (req, res) => {
  const { eventId, guests } = req.body;
  if (!eventId || !Array.isArray(guests)) return res.status(400).json({ error: 'eventId and guests array required' });
  try {
    const result = await prisma.guest.createMany({
      data: guests.map(g => ({ ...g, eventId })),
      skipDuplicates: true,
    });
    res.json({ created: result.count });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/guests/:id
router.patch('/:id', authenticate, async (req, res) => {
  const guest = await prisma.guest.update({ where: { id: req.params.id }, data: req.body });
  res.json(guest);
});

// DELETE /api/guests/:id
router.delete('/:id', authenticate, async (req, res) => {
  await prisma.guest.delete({ where: { id: req.params.id } });
  res.status(204).end();
});

// POST /api/guests/:id/selfie — register face embedding
router.post('/:id/selfie', authenticate, async (req, res) => {
  const { selfieUrl, faceEmbedding } = req.body;
  const guest = await prisma.guest.update({
    where: { id: req.params.id },
    data: { selfieUrl, faceEmbedding },
  });
  res.json(guest);
});

export default router;
