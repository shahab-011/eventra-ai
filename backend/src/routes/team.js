import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import prisma from '../lib/prisma.js';

const router = Router();

router.get('/', authenticate, async (req, res) => {
  const studio = await prisma.studio.findUnique({ where: { ownerId: req.user.userId } });
  if (!studio) return res.status(404).json({ error: 'Studio not found' });
  const members = await prisma.teamMember.findMany({ where: { studioId: studio.id }, include: { user: { select: { id: true, name: true, email: true } } } });
  res.json(members);
});

router.post('/invite', authenticate, async (req, res) => {
  const { email, role } = req.body;
  if (!email || !role) return res.status(400).json({ error: 'email and role required' });

  const studio = await prisma.studio.findUnique({ where: { ownerId: req.user.userId } });
  let user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    // Create placeholder account, user will set password when they accept
    user = await prisma.user.create({ data: { email, name: email.split('@')[0], passwordHash: '' } });
  }

  const member = await prisma.teamMember.upsert({
    where: { studioId_userId: { studioId: studio.id, userId: user.id } },
    update: { role, status: 'PENDING' },
    create: { studioId: studio.id, userId: user.id, role, status: 'PENDING' },
    include: { user: { select: { id: true, name: true, email: true } } },
  });
  res.status(201).json(member);
});

router.patch('/:id', authenticate, async (req, res) => {
  const member = await prisma.teamMember.update({ where: { id: req.params.id }, data: req.body, include: { user: true } });
  res.json(member);
});

router.delete('/:id', authenticate, async (req, res) => {
  await prisma.teamMember.delete({ where: { id: req.params.id } });
  res.status(204).end();
});

export default router;
