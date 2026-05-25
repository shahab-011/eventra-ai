import { Router }      from 'express';
import { promises as dns } from 'dns';
import { z }           from 'zod';

import prisma          from '../lib/prisma.js';
import { presignPut, cdnUrl } from '../lib/r2.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import { resolveTenant, invalidateTenantCache } from '../middleware/tenant.js';
import { validate }    from '../lib/validate.js';
import { notFound, badRequest, conflict } from '../lib/errors.js';
import { getStorageOverview } from '../services/storage.js';

// ─── Schemas ──────────────────────────────────────────────────

const brandingSchema = z.object({
  name:               z.string().min(2).max(80).optional(),
  tagline:            z.string().max(160).optional().nullable(),
  logoUrl:            z.string().url().optional().nullable(),
  primaryColor:       z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Must be a hex colour').optional(),
  accentColor:        z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Must be a hex colour').optional(),
  watermarkEnabled:   z.boolean().optional(),
  watermarkUrl:       z.string().url().optional().nullable(),
  defaultGalleryTheme: z.enum(['dark', 'light', 'minimal', 'luxury']).optional(),
});

const logoUploadSchema = z.object({
  contentType: z.enum(['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml']),
});

const domainSchema = z.object({
  customDomain: z
    .string()
    .min(4).max(253)
    .regex(/^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/, 'Invalid domain format'),
});

// ─── Helpers ──────────────────────────────────────────────────

const BUSINESS_ROLES = ['BUSINESS', 'SUPER_ADMIN'];

async function loadOwnStudio(userId) {
  const studio = await prisma.studio.findUnique({ where: { ownerId: userId } });
  if (!studio) throw notFound('Studio not found');
  return studio;
}

// The hostname your edge points to — studio owners set their CNAME to this.
// For Cloudflare for SaaS: this is your CF zone's fallback origin hostname.
const EDGE_HOSTNAME = process.env.EDGE_HOSTNAME ?? 'edge.eventra.app';

async function checkCname(domain) {
  try {
    const records = await dns.resolveCname(domain);
    return records.some(r => r === EDGE_HOSTNAME || r.endsWith('.' + EDGE_HOSTNAME));
  } catch {
    return false;
  }
}

// ─── Authenticated router (/api/studio) ───────────────────────

const router = Router();

// ── 1. GET /api/studio ────────────────────────────────────────

router.get('/', authenticate, requireRole(...BUSINESS_ROLES), async (req, res, next) => {
  try {
    res.json({ data: await loadOwnStudio(req.user.userId) });
  } catch (err) { next(err); }
});

// ── 1. PATCH /api/studio ──────────────────────────────────────

router.patch(
  '/',
  authenticate,
  requireRole(...BUSINESS_ROLES),
  validate(brandingSchema),
  async (req, res, next) => {
    try {
      const studio  = await loadOwnStudio(req.user.userId);
      const updated = await prisma.studio.update({ where: { id: studio.id }, data: req.body });
      await invalidateTenantCache(updated);
      res.json({ data: updated });
    } catch (err) { next(err); }
  },
);

// ── 1. POST /api/studio/logo-upload-url ───────────────────────
// Step 1 of direct-to-R2 upload flow.
// Client: POST here → gets { uploadUrl, publicUrl } → PUT file to uploadUrl
//         → PATCH /api/studio { logoUrl: publicUrl }

router.post(
  '/logo-upload-url',
  authenticate,
  requireRole(...BUSINESS_ROLES),
  validate(logoUploadSchema),
  async (req, res, next) => {
    try {
      const studio = await loadOwnStudio(req.user.userId);
      const { contentType } = req.body;
      const ext = contentType.split('/')[1].replace('jpeg', 'jpg').replace('svg+xml', 'svg');
      const key = `studios/${studio.id}/logo-${Date.now()}.${ext}`;

      const uploadUrl = await presignPut(key, contentType, 900);
      res.json({ data: { uploadUrl, publicUrl: cdnUrl(key), key, expiresInSeconds: 900 } });
    } catch (err) { next(err); }
  },
);

// ── 2. PATCH /api/studio/domain ───────────────────────────────

router.patch(
  '/domain',
  authenticate,
  requireRole(...BUSINESS_ROLES),
  validate(domainSchema),
  async (req, res, next) => {
    try {
      const studio = await loadOwnStudio(req.user.userId);
      const { customDomain } = req.body;

      const taken = await prisma.studio.findFirst({
        where: { customDomain, NOT: { id: studio.id } },
      });
      if (taken) return next(conflict('Custom domain already in use'));

      await invalidateTenantCache(studio); // clear old domain from cache

      const updated = await prisma.studio.update({
        where: { id: studio.id },
        data:  { customDomain, domainVerified: false },
      });

      res.json({
        data: {
          customDomain: updated.customDomain,
          domainVerified: false,
          dns: dnsInstructions(customDomain),
        },
      });
    } catch (err) { next(err); }
  },
);

function dnsInstructions(customDomain) {
  return {
    record: { type: 'CNAME', name: customDomain, value: EDGE_HOSTNAME, ttl: 3600 },
    note: `Add the CNAME above, then call POST /api/studio/domain/verify. DNS propagation can take up to 48 h.`,
    //
    // ── SSL provisioning options ─────────────────────────────────────────────
    //
    // Option A — Cloudflare for SaaS (recommended for zero-ops SSL):
    //   1. Enable "Custom Hostnames" in your Cloudflare zone settings.
    //   2. POST https://api.cloudflare.com/client/v4/zones/{zone_id}/custom_hostnames
    //      Body: { "hostname": "<customDomain>", "ssl": { "method": "http", "type": "dv" } }
    //   3. Cloudflare provisions a DV certificate via ACME (HTTP-01) automatically.
    //   4. Poll GET .../custom_hostnames/{id} until status === "active".
    //   5. Call POST /api/studio/domain/verify to mark it verified in Eventra.
    //
    // Option B — Self-managed ACME (Let's Encrypt / ZeroSSL):
    //   1. Ensure the CNAME resolves to your edge host.
    //   2. Run: certbot certonly --standalone -d <customDomain>
    //      Or DNS-01: certbot certonly --dns-cloudflare -d <customDomain>
    //   3. Configure nginx/caddy to serve the cert, then reload.
    //   4. Call POST /api/studio/domain/verify.
    //
    // Option C — Caddy (automatic HTTPS):
    //   In your Caddyfile, add an on_demand_tls block pointing to
    //   POST /api/studio/domain/verify as the ask endpoint.
    //   Caddy will provision certs on first request for each verified domain.
  };
}

// ── 2. POST /api/studio/domain/verify ────────────────────────

router.post(
  '/domain/verify',
  authenticate,
  requireRole(...BUSINESS_ROLES),
  async (req, res, next) => {
    try {
      const studio = await loadOwnStudio(req.user.userId);
      if (!studio.customDomain) return next(badRequest('No custom domain configured'));

      const ok = await checkCname(studio.customDomain);
      if (!ok) {
        return res.status(422).json({
          error: {
            code:    'DOMAIN_NOT_VERIFIED',
            message: `CNAME for ${studio.customDomain} does not resolve to ${EDGE_HOSTNAME}`,
            hint:    `Add: CNAME ${studio.customDomain} → ${EDGE_HOSTNAME}`,
          },
        });
      }

      const updated = await prisma.studio.update({
        where: { id: studio.id },
        data:  { domainVerified: true },
      });

      // Warm the new domain cache entry immediately
      await invalidateTenantCache(studio);

      res.json({ data: { customDomain: updated.customDomain, domainVerified: true } });
    } catch (err) { next(err); }
  },
);

// ── 4. GET /api/studio/storage ────────────────────────────────

router.get('/storage', authenticate, requireRole(...BUSINESS_ROLES), async (req, res, next) => {
  try {
    const studio = await loadOwnStudio(req.user.userId);
    res.json({ data: await getStorageOverview(studio.id) });
  } catch (err) { next(err); }
});

// ─── Public router (/api/public) ──────────────────────────────
// No auth; relies on resolveTenant middleware to attach req.studio.

const publicRouter = Router();

// ── 5. GET /api/public/branding ───────────────────────────────

publicRouter.get('/branding', resolveTenant, (req, res) => {
  const {
    name, tagline, logoUrl,
    primaryColor, accentColor,
    watermarkEnabled, watermarkUrl,
    defaultGalleryTheme,
  } = req.studio;

  res.json({
    data: { name, tagline, logoUrl, primaryColor, accentColor, watermarkEnabled, watermarkUrl, defaultGalleryTheme },
  });
});

export default router;
export { publicRouter };
