import prisma from '../lib/prisma.js';
import logger from '../lib/logger.js';
import { AppError } from '../lib/errors.js';

const BYTES_PER_GB = 1024 ** 3;
const MS_PER_DAY   = 86_400_000;

// ─── Metering ─────────────────────────────────────────────────

/** Add bytes to a studio's running total. Called after every successful upload. */
export async function incrementStorage(studioId, bytes) {
  const gb = Number(bytes) / BYTES_PER_GB;
  await prisma.studio.update({
    where: { id: studioId },
    data:  { storageUsedGB: { increment: gb } },
  });
}

/** Subtract bytes. Called on media delete. */
export async function decrementStorage(studioId, bytes) {
  const gb = Number(bytes) / BYTES_PER_GB;
  await prisma.studio.update({
    where: { id: studioId },
    data:  { storageUsedGB: { decrement: gb } },
  });
}

/**
 * Truth-up: recompute storageUsedGB from the actual Media rows.
 * Safe to run at any time; designed for the nightly cron job.
 */
export async function recalcStorage(studioId) {
  const result = await prisma.media.aggregate({
    where: { event: { studioId } },
    _sum:  { sizeBytes: true },
  });
  const usedGB = Number(result._sum.sizeBytes ?? 0) / BYTES_PER_GB;
  await prisma.studio.update({ where: { id: studioId }, data: { storageUsedGB: usedGB } });
  return usedGB;
}

/** Nightly batch recalc for every studio. Import and call from a cron worker. */
export async function recalcAllStudios() {
  const studios = await prisma.studio.findMany({ select: { id: true } });
  const results = await Promise.allSettled(studios.map(s => recalcStorage(s.id)));
  const failed  = results.filter(r => r.status === 'rejected').length;
  if (failed) logger.error({ failed, total: studios.length }, 'recalcAllStudios: partial failure');
  return { processed: studios.length, failed };
}

// ─── Limit enforcement ────────────────────────────────────────

/**
 * Throw 402 STORAGE_LIMIT_EXCEEDED if adding `bytes` would push the studio over.
 * Call this before persisting a new media record / issuing a presigned PUT.
 */
export async function assertStorageAvailable(studioId, bytes) {
  const studio = await prisma.studio.findUnique({
    where:  { id: studioId },
    select: { storageUsedGB: true, storageLimitGB: true },
  });
  if (!studio) return;

  const incomingGB = Number(bytes) / BYTES_PER_GB;
  if (studio.storageUsedGB + incomingGB > studio.storageLimitGB) {
    throw new AppError(
      402,
      'STORAGE_LIMIT_EXCEEDED',
      `Storage limit of ${studio.storageLimitGB} GB reached. Please upgrade your plan.`,
    );
  }
}

// ─── Overview ─────────────────────────────────────────────────

function projectedFullDate(usedGB, limitGB, sevenDayBytes) {
  const recentGB   = Number(sevenDayBytes) / BYTES_PER_GB;
  const avgDailyGB = recentGB / 7;
  if (avgDailyGB <= 0 || usedGB >= limitGB) return null;
  const daysLeft = (limitGB - usedGB) / avgDailyGB;
  return new Date(Date.now() + daysLeft * MS_PER_DAY).toISOString();
}

export async function getStorageOverview(studioId) {
  const sevenDaysAgo = new Date(Date.now() - 7 * MS_PER_DAY);

  const [studio, events, recentAgg] = await Promise.all([
    prisma.studio.findUnique({
      where:  { id: studioId },
      select: { storageUsedGB: true, storageLimitGB: true },
    }),
    prisma.event.findMany({
      where:   { studioId },
      select:  {
        id: true, name: true, startDate: true, status: true,
        storageUsedGB: true, storageAllocGB: true,
        _count: { select: { media: true } },
      },
      orderBy: { startDate: 'desc' },
    }),
    prisma.media.aggregate({
      where: { event: { studioId }, createdAt: { gte: sevenDaysAgo } },
      _sum:  { sizeBytes: true },
    }),
  ]);

  return {
    usedGB:      studio.storageUsedGB,
    limitGB:     studio.storageLimitGB,
    usedPercent: Math.round((studio.storageUsedGB / studio.storageLimitGB) * 100),
    byEvent:     events.map(e => ({
      id:         e.id,
      name:       e.name,
      startDate:  e.startDate,
      status:     e.status,
      usedGB:     e.storageUsedGB,
      allocGB:    e.storageAllocGB,
      mediaCount: e._count.media,
    })),
    projectedFullDate: projectedFullDate(
      studio.storageUsedGB,
      studio.storageLimitGB,
      recentAgg._sum.sizeBytes ?? 0,
    ),
  };
}
