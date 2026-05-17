import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate } from '../middleware/auth.js';

const router = Router();
const prisma = new PrismaClient();

router.get('/', authenticate, async (req, res) => {
  const { eventId, studioId } = req.query;
  const where = { ...(eventId ? { eventId } : {}), ...(studioId ? { studioId } : {}) };
  const codes = await prisma.qRCode.findMany({ where, orderBy: { createdAt: 'desc' } });
  res.json(codes);
});

router.post('/', authenticate, async (req, res) => {
  const code = await prisma.qRCode.create({ data: req.body });
  res.status(201).json(code);
});

// Public: track scan
router.post('/:id/scan', async (req, res) => {
  const code = await prisma.qRCode.update({ where: { id: req.params.id }, data: { scanCount: { increment: 1 } } });
  res.json({ redirect: code.url });
});

router.patch('/:id', authenticate, async (req, res) => {
  const code = await prisma.qRCode.update({ where: { id: req.params.id }, data: req.body });
  res.json(code);
});

router.delete('/:id', authenticate, async (req, res) => {
  await prisma.qRCode.delete({ where: { id: req.params.id } });
  res.status(204).end();
});

export default router;
