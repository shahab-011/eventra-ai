/**
 * WhatsApp automation engine.
 *
 * Call onGuestAdded() from routes/guests.js after creating a guest.
 * Call scheduleEventAutomation() from routes/events.js after creating/updating an event.
 *
 * Each function checks the studio's active AutomationRules and enqueues
 * delayed BullMQ jobs on the 'whatsapp-jobs' queue.
 */

import prisma          from './prisma.js';
import { whatsappQueue } from './queues.js';
import logger          from './logger.js';

// ─── GUEST_ADDED trigger ──────────────────────────────────────

export async function onGuestAdded(guest) {
  if (!guest?.whatsappOptIn) return;

  const event = await prisma.event.findUnique({
    where:  { id: guest.eventId },
    select: { studioId: true },
  });
  if (!event) return;

  const rules = await prisma.automationRule.findMany({
    where: { studioId: event.studioId, trigger: 'GUEST_ADDED', isActive: true },
  });

  for (const rule of rules) {
    try {
      const delay = rule.offsetHours * 60 * 60 * 1000;
      const msg   = await prisma.whatsAppMessage.create({
        data: {
          guestId:      guest.id,
          eventId:      guest.eventId,
          type:         rule.messageType,
          templateName: rule.templateName ?? null,
          status:       'QUEUED',
        },
      });

      await whatsappQueue.add(
        rule.messageType.toLowerCase().replace('_', '-'),
        { messageId: msg.id, guestId: guest.id, eventId: guest.eventId },
        { delay, jobId: `auto-${rule.id}-g-${guest.id}` },
      );

      logger.info({ ruleId: rule.id, guestId: guest.id, delay }, '[automation] GUEST_ADDED queued');
    } catch (err) {
      logger.error({ err, ruleId: rule.id }, '[automation] GUEST_ADDED enqueue failed');
    }
  }
}

// ─── EVENT_START / AFTER_EVENT trigger ───────────────────────

export async function scheduleEventAutomation(event) {
  const rules = await prisma.automationRule.findMany({
    where: { studioId: event.studioId, trigger: { in: ['EVENT_START', 'AFTER_EVENT'] }, isActive: true },
  });
  if (!rules.length) return;

  const guests = await prisma.guest.findMany({
    where:  { eventId: event.id, whatsappOptIn: true, deletedAt: null },
    select: { id: true },
  });
  if (!guests.length) return;

  const now = Date.now();

  for (const rule of rules) {
    const base   = rule.trigger === 'EVENT_START'
      ? new Date(event.startDate).getTime()
      : new Date(event.endDate ?? event.startDate).getTime();
    const fireAt = base + rule.offsetHours * 60 * 60 * 1000;

    if (fireAt <= now) {
      logger.info({ ruleId: rule.id }, '[automation] fire time in the past, skipping');
      continue;
    }
    const delay = fireAt - now;

    for (const guest of guests) {
      try {
        const msg = await prisma.whatsAppMessage.create({
          data: {
            guestId:      guest.id,
            eventId:      event.id,
            type:         rule.messageType,
            templateName: rule.templateName ?? null,
            status:       'QUEUED',
          },
        });

        await whatsappQueue.add(
          rule.messageType.toLowerCase().replace('_', '-'),
          { messageId: msg.id, guestId: guest.id, eventId: event.id },
          { delay, jobId: `auto-${rule.id}-ev-${event.id}-g-${guest.id}` },
        );
      } catch (err) {
        logger.error({ err, ruleId: rule.id, guestId: guest.id }, '[automation] EVENT enqueue failed');
      }
    }

    logger.info(
      { ruleId: rule.id, eventId: event.id, guests: guests.length, delaySec: Math.round(delay / 1000) },
      '[automation] EVENT jobs queued',
    );
  }
}
