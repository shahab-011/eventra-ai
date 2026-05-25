import prisma from './prisma.js';
import logger from './logger.js';

/**
 * Fire-and-forget audit writer. Never throws; failures are logged only.
 * @param {'SIGNUP'|'LOGIN'|'LOGIN_FAILED'|'LOGOUT'|'TOKEN_REFRESH'|'OAUTH_LOGIN'|'ACCOUNT_LOCKED'|'OTP_REQUESTED'|'OTP_VERIFIED'|'OTP_FAILED'} action
 * @param {{ userId?, ip?, userAgent?, metadata? }} opts
 */
export function audit(action, opts = {}) {
  const { userId = null, ip = null, userAgent = null, metadata = null } = opts;
  prisma.auditLog
    .create({ data: { action, userId, ip, userAgent, metadata } })
    .catch(err => logger.error({ err, action }, 'audit write failed'));
}
