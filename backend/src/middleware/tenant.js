/**
 * Tenant resolver — maps an incoming Host header to a Studio record.
 *
 * Resolution order:
 *   1. Exact match on Studio.customDomain (only when domainVerified = true)
 *   2. First segment of hostname matched against Studio.subdomain
 *      e.g.  "acme.eventra.app" → subdomain "acme"
 *
 * Results are cached in Redis (30-second TTL) to avoid a DB hit on every
 * public gallery request. Cache is invalidated whenever the studio is updated
 * via invalidateTenantCache().
 */
import prisma from '../lib/prisma.js';
import redis from '../lib/redis.js';
import { notFound } from '../lib/errors.js';

const CACHE_TTL = 30; // seconds

const STUDIO_SELECT = {
  id: true, name: true, tagline: true, logoUrl: true,
  primaryColor: true, accentColor: true,
  watermarkEnabled: true, watermarkUrl: true,
  defaultGalleryTheme: true,
  subdomain: true, customDomain: true, domainVerified: true,
  planTier: true, storageUsedGB: true, storageLimitGB: true,
};

async function fetchStudio(host) {
  // 1. Try verified custom domain
  const byDomain = await prisma.studio.findFirst({
    where:  { customDomain: host, domainVerified: true },
    select: STUDIO_SELECT,
  });
  if (byDomain) return { studio: byDomain, cacheKey: `tenant:domain:${host}` };

  // 2. Fall back to subdomain (first label of the host)
  const sub = host.split('.')[0];
  const bySub = await prisma.studio.findUnique({
    where:  { subdomain: sub },
    select: STUDIO_SELECT,
  });
  if (bySub) return { studio: bySub, cacheKey: `tenant:sub:${sub}` };

  return null;
}

export async function resolveTenant(req, res, next) {
  const host = req.hostname; // stripped of port by Express

  // Check both cache keys (domain-based and subdomain-based)
  const domainKey = `tenant:domain:${host}`;
  const subKey    = `tenant:sub:${host.split('.')[0]}`;

  try {
    const cached = await redis.get(domainKey) ?? await redis.get(subKey);
    if (cached) {
      req.studio = JSON.parse(cached);
      return next();
    }

    const found = await fetchStudio(host);
    if (!found) return next(notFound('Studio not found'));

    await redis.set(found.cacheKey, JSON.stringify(found.studio), 'EX', CACHE_TTL);
    req.studio = found.studio;
    next();
  } catch (err) {
    next(err);
  }
}

/** Call whenever studio branding or domain is updated to evict stale entries. */
export async function invalidateTenantCache(studio) {
  const keys = [`tenant:sub:${studio.subdomain}`];
  if (studio.customDomain) keys.push(`tenant:domain:${studio.customDomain}`);
  await redis.del(...keys);
}
