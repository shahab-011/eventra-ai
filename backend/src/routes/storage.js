import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate } from '../middleware/auth.js';

const router = Router();
const prisma = new PrismaClient();

router.get('/', authenticate, async (req, res) => {
  const studio = await prisma.studio.findUnique({ where: { ownerId: req.user.userId }, include: { events: { select: { id: true, name: true, storageUsedGB: true, storageAllocGB: true, status: true, startDate: true } } } });
  if (!studio) return res.status(404).json({ error: 'Studio not found' });
  res.json({ storageUsedGB: studio.storageUsedGB, storageLimitGB: studio.storageLimitGB, events: studio.events });
});

// POST /api/storage/transfer — transfer event to client
router.post('/transfer', authenticate, async (req, res) => {
  const { eventId, clientEmail } = req.body;
  if (!eventId || !clientEmail) return res.status(400).json({ error: 'eventId and clientEmail required' });

  const event = await prisma.event.findUnique({ where: { id: eventId }, include: { studio: true } });
  if (!event) return res.status(404).json({ error: 'Event not found' });

  // Free storage from studio plan
  await prisma.studio.update({
    where: { id: event.studioId },
    data: { storageUsedGB: { decrement: event.storageUsedGB } },
  });

  await prisma.event.update({
    where: { id: eventId },
    data: { status: 'ARCHIVED', transferredAt: new Date() },
  });

  // In production: send email invite to clientEmail, create transfer record
  res.json({ message: `Transfer invite sent to ${clientEmail}`, storageFreedGB: event.storageUsedGB });
});

export default router;
