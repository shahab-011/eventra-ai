import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate } from '../middleware/auth.js';
import { v4 as uuidv4 } from 'uuid';

const router = Router();
const prisma = new PrismaClient();

router.get('/', authenticate, async (req, res) => {
  const { eventId } = req.query;
  if (!eventId) return res.status(400).json({ error: 'eventId required' });
  const invites = await prisma.invite.findMany({ where: { eventId }, orderBy: { createdAt: 'desc' } });
  res.json(invites);
});

router.post('/', authenticate, async (req, res) => {
  try {
    const slug = `${req.body.title?.toLowerCase().replace(/\s+/g, '-')}-${uuidv4().slice(0, 6)}`;
    const invite = await prisma.invite.create({
      data: { ...req.body, shareUrl: `https://eventra.ai/invite/${slug}`, rsvpByDate: req.body.rsvpByDate ? new Date(req.body.rsvpByDate) : null },
    });
    res.status(201).json(invite);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/:id', authenticate, async (req, res) => {
  const invite = await prisma.invite.update({ where: { id: req.params.id }, data: req.body });
  res.json(invite);
});

router.delete('/:id', authenticate, async (req, res) => {
  await prisma.invite.delete({ where: { id: req.params.id } });
  res.status(204).end();
});

// Public: GET /api/invites/view/:slug — increment view count
router.get('/view/:slug', async (req, res) => {
  const invite = await prisma.invite.findFirst({ where: { shareUrl: { endsWith: req.params.slug } } });
  if (!invite) return res.status(404).json({ error: 'Invite not found' });
  await prisma.invite.update({ where: { id: invite.id }, data: { viewCount: { increment: 1 } } });
  res.json(invite);
});

export default router;
