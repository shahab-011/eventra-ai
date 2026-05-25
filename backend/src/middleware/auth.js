import { verifyAccessToken } from '../services/token.js';
import prisma from '../lib/prisma.js';
import { unauthorized, forbidden } from '../lib/errors.js';

// ─── authenticate ─────────────────────────────────────────────
// Verifies the Bearer access token (15-min JWT) and sets req.user.
// Works for both business users and guest-scoped tokens.
// Shape for business:  { userId, email, role, studioId, type:'access' }
// Shape for guest:     { guestId, eventId, role:'GUEST', type:'guest' }

export function authenticate(req, res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) return next(unauthorized('Missing token'));

  try {
    req.user = verifyAccessToken(header.slice(7));
    next();
  } catch {
    next(unauthorized('Invalid or expired token'));
  }
}

// ─── requireRole ──────────────────────────────────────────────
// Checks req.user.role (UserRole: BUSINESS | SUPER_ADMIN | GUEST).
// Call after authenticate.

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(forbidden('Insufficient permissions'));
    }
    next();
  };
}

// ─── requireTeamRole ──────────────────────────────────────────
// Checks the caller's TeamMember role for the studio they belong to.
// Studio owners (BUSINESS users with a studio.ownerId match) always pass.
// Sets req.studioId and (for non-owners) req.teamRole.
// Call after authenticate.

export function requireTeamRole(...teamRoles) {
  return async (req, res, next) => {
    if (!req.user?.userId) return next(unauthorized('Missing token'));

    try {
      // Studio owners have implicit OWNER access — bypass membership check
      const ownedStudio = await prisma.studio.findUnique({
        where: { ownerId: req.user.userId },
        select: { id: true },
      });
      if (ownedStudio) {
        req.studioId = ownedStudio.id;
        return next();
      }

      // Verify active team membership with one of the required roles
      const member = await prisma.teamMember.findFirst({
        where: {
          userId: req.user.userId,
          status: 'ACTIVE',
          role:   { in: teamRoles },
        },
        select: { studioId: true, role: true },
      });

      if (!member) return next(forbidden('Insufficient team permissions'));

      req.studioId = member.studioId;
      req.teamRole = member.role;
      next();
    } catch (err) {
      next(err);
    }
  };
}

// ─── requireStudioOwnership ───────────────────────────────────
// Ensures the resource being accessed belongs to the caller's studio.
// `getResourceStudioId` is a function(req) → string | Promise<string>
// that returns the studioId of the resource (default: req.params.studioId).
// Sets req.studio on success.

export function requireStudioOwnership(getResourceStudioId = req => req.params.studioId) {
  return async (req, res, next) => {
    if (!req.user?.userId) return next(unauthorized('Missing token'));

    try {
      const studio = await prisma.studio.findUnique({
        where: { ownerId: req.user.userId },
      });

      if (!studio) return next(forbidden('Not a studio owner'));

      const resourceStudioId = typeof getResourceStudioId === 'function'
        ? await getResourceStudioId(req)
        : getResourceStudioId;

      // If a resourceStudioId was provided, it must match the caller's studio
      if (resourceStudioId && studio.id !== resourceStudioId) {
        return next(forbidden('Access denied'));
      }

      req.studio   = studio;
      req.studioId = studio.id;
      next();
    } catch (err) {
      next(err);
    }
  };
}
