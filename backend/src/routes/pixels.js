import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate } from '../middleware/auth.js';

const router = Router();
const prisma = new PrismaClient();

router.get('/', authenticate, async (req, res) => {
  const studio = await prisma.studio.findUnique({ where: { ownerId: req.user.userId } });
  if (!studio) return res.status(404).json({ error: 'Studio not found' });
  const pixels = await prisma.trackingPixel.findMany({ where: { studioId: studio.id } });
  res.json(pixels);
});

router.post('/', authenticate, async (req, res) => {
  const studio = await prisma.studio.findUnique({ where: { ownerId: req.user.userId } });
  const pixel = await prisma.trackingPixel.create({ data: { ...req.body, studioId: studio.id } });
  res.status(201).json(pixel);
});

router.patch('/:id', authenticate, async (req, res) => {
  const pixel = await prisma.trackingPixel.update({ where: { id: req.params.id }, data: req.body });
  res.json(pixel);
});

router.delete('/:id', authenticate, async (req, res) => {
  await prisma.trackingPixel.delete({ where: { id: req.params.id } });
  res.status(204).end();
});

// Public: POST /api/pixels/fire — fired when guest views gallery
router.post('/fire', async (req, res) => {
  const { pixelId } = req.body;
  if (!pixelId) return res.status(400).json({ error: 'pixelId required' });
  await prisma.trackingPixel.update({ where: { id: pixelId }, data: { fireCount: { increment: 1 } } });
  res.status(200).end();
});

export default router;
