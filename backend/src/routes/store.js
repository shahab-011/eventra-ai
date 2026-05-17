import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate } from '../middleware/auth.js';

const router = Router();
const prisma = new PrismaClient();

// GET /api/store/orders?eventId=xxx
router.get('/orders', authenticate, async (req, res) => {
  const { eventId } = req.query;
  const where = eventId ? { eventId } : {};
  const orders = await prisma.order.findMany({ where, orderBy: { createdAt: 'desc' } });
  res.json(orders);
});

// POST /api/store/orders — guest places order (public)
router.post('/orders', async (req, res) => {
  try {
    const order = await prisma.order.create({ data: req.body });
    res.status(201).json(order);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/store/orders/:id
router.patch('/orders/:id', authenticate, async (req, res) => {
  const order = await prisma.order.update({ where: { id: req.params.id }, data: req.body });
  res.json(order);
});

export default router;
