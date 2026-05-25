import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import prisma from '../lib/prisma.js';

const router = Router();

// GET /api/analytics/overview
router.get('/overview', authenticate, async (req, res) => {
  try {
    const studio = await prisma.studio.findUnique({ where: { ownerId: req.user.userId } });
    if (!studio) return res.status(404).json({ error: 'Studio not found' });

    const [events, media, guests, messages] = await Promise.all([
      prisma.event.count({ where: { studioId: studio.id } }),
      prisma.media.count({ where: { event: { studioId: studio.id } } }),
      prisma.guest.count({ where: { event: { studioId: studio.id } } }),
      prisma.whatsAppMessage.count({ where: { guest: { event: { studioId: studio.id } } } }),
    ]);

    res.json({ events, media, guests, whatsappMessages: messages, storageUsedGB: studio.storageUsedGB, storageLimitGB: studio.storageLimitGB });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/analytics/event/:eventId
router.get('/event/:eventId', authenticate, async (req, res) => {
  try {
    const [photos, guests, selections, messages] = await Promise.all([
      prisma.media.count({ where: { eventId: req.params.eventId } }),
      prisma.guest.count({ where: { eventId: req.params.eventId } }),
      prisma.photoSelection.count({ where: { media: { eventId: req.params.eventId } } }),
      prisma.whatsAppMessage.count({ where: { guest: { eventId: req.params.eventId } } }),
    ]);

    res.json({ photos, guests, selections, whatsappMessages: messages });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
