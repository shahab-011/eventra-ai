import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate } from '../middleware/auth.js';

const router = Router();
const prisma = new PrismaClient();

// POST /api/whatsapp/send — send WhatsApp message to guest(s)
router.post('/send', authenticate, async (req, res) => {
  const { guestIds, type, body, templateId } = req.body;
  if (!guestIds?.length || !type) return res.status(400).json({ error: 'guestIds and type required' });

  try {
    const messages = await prisma.whatsAppMessage.createMany({
      data: guestIds.map(guestId => ({ guestId, type, body, templateId, status: 'QUEUED' })),
    });
    // In production: queue jobs to WhatsApp Business API
    res.json({ queued: messages.count });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/whatsapp/webhook — receive incoming WhatsApp messages (Meta webhook)
router.get('/webhook', (req, res) => {
  const { 'hub.mode': mode, 'hub.verify_token': token, 'hub.challenge': challenge } = req.query;
  if (mode === 'subscribe' && token === process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN) {
    return res.status(200).send(challenge);
  }
  res.status(403).end();
});

router.post('/webhook', async (req, res) => {
  // Handle incoming WhatsApp messages (RSVP replies, selfie uploads, bot interactions)
  // In production: parse req.body.entry[0].changes[0].value and route to handler
  console.log('WhatsApp webhook received:', JSON.stringify(req.body).slice(0, 200));
  res.status(200).end();
});

// GET /api/whatsapp/stats?eventId=xxx
router.get('/stats', authenticate, async (req, res) => {
  const { eventId } = req.query;
  if (!eventId) return res.status(400).json({ error: 'eventId required' });

  const guests = await prisma.guest.findMany({ where: { eventId }, include: { whatsappMessages: true } });
  const sent = guests.flatMap(g => g.whatsappMessages).length;
  const delivered = guests.flatMap(g => g.whatsappMessages).filter(m => m.status === 'DELIVERED').length;
  const read = guests.flatMap(g => g.whatsappMessages).filter(m => m.status === 'READ').length;

  res.json({ sent, delivered, read, openRate: sent > 0 ? Math.round((read / sent) * 100) : 0 });
});

export default router;
