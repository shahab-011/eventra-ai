/**
 * Socket.IO singleton.
 *
 * Initialisation (src/index.js):
 *   initIO(httpServer)
 *
 * Direct emit from the API process (routes, ftpServer):
 *   getIO()?.to('event:xyz').emit('media:uploaded', data)
 *
 * ─── Architecture ─────────────────────────────────────────────
 *
 * Multi-pod fan-out:
 *   @socket.io/redis-adapter connects all API replicas so that any pod can
 *   emit to any room and every connected client receives it.
 *
 * Worker-to-socket relay:
 *   Workers (separate Node.js processes) have no socket.io reference.
 *   They call publish() in lib/realtime.js which writes to the Redis
 *   'realtime:events' channel.  This module subscribes to that channel
 *   and calls io.to(room).emit() — the adapter then fans out to all pods.
 *
 * ─── Auth ──────────────────────────────────────────────────────
 *
 * Studio / team members:
 *   Pass a valid JWT access token in socket.handshake.auth.token.
 *   After connection: emit join:studio / join:event / join:camera.
 *
 * Guests / slideshow viewers:
 *   Pass a GalleryToken in socket.handshake.auth.galleryToken.
 *   After connection: emit join:event / join:slideshow.
 *
 * ─── Rooms ─────────────────────────────────────────────────────
 *
 *   studio:{studioId}       — EventHub.jsx dashboard; studio owner + team
 *   event:{eventId}         — All event-level updates; owner + team + gallery-token guests
 *   camera:{cameraId}       — Camera2CloudSetup.jsx; studio owner + team only
 *   slideshow:{eventId}     — LiveSlideshow.jsx; gallery-token holders only
 *
 * ─── Emitted events ────────────────────────────────────────────
 *
 *   media:uploaded          { mediaId, eventId, filename, uploadSource }
 *   media:processed         { mediaId, eventId, thumbnailUrl, processedUrl, wmUrl }
 *   face:progress           { mediaId, facesDetected, embeddings?, done?, total? }
 *   match:complete          { guestId, eventId, confirmed, pending, token }
 *   edit:progress           { editJobId, mediaId, done, total, editedUrl }
 *   edit:done               { editJobId, done, failed, total }
 *   cull:progress           { editJobId, done, total }
 *   cull:done               { editJobId, total, kept, suggestedReject }
 *   camera:upload           { cameraId, cameraName, mediaId, filename }
 *   camera:status           { cameraId, cameraName, status, eventId }
 *   delivery:update         { guestId, eventId, messageId, status, waMessageId? }
 *   slideshow:newPhoto      { mediaId, eventId, thumbnailUrl, processedUrl }
 */

import { Server }          from 'socket.io';
import { createAdapter }   from '@socket.io/redis-adapter';
import IORedis             from 'ioredis';

import prisma              from './prisma.js';
import { verifyAccessToken } from '../services/token.js';
import { CHANNEL }         from './realtime.js';
import env                 from '../config/env.js';
import logger              from './logger.js';

let _io = null;

// ─── Redis connections ────────────────────────────────────────
// The adapter needs two dedicated ioredis clients.
// The relay subscriber is a third connection (subscribed clients cannot run commands).

const adapterPub = new IORedis(env.REDIS_URL, { maxRetriesPerRequest: null });
const adapterSub = adapterPub.duplicate();
const relaySub   = new IORedis(env.REDIS_URL, { lazyConnect: true });

[adapterPub, adapterSub, relaySub].forEach((c, i) =>
  c.on('error', err => logger.warn({ err }, `[socket] Redis connection ${i} error`)),
);

// ─── Relay: worker publications → socket broadcasts ──────────

relaySub.on('message', (channel, raw) => {
  if (channel !== CHANNEL || !_io) return;
  try {
    const { room, event, data } = JSON.parse(raw);
    _io.to(room).emit(event, data);
  } catch { /* malformed — ignore */ }
});

// ─── Auth middleware ──────────────────────────────────────────

async function authMiddleware(socket, next) {
  const { token, galleryToken } = socket.handshake.auth ?? {};

  // Gallery-token auth (guest/slideshow viewers)
  if (galleryToken) {
    try {
      const row = await prisma.galleryToken.findUnique({
        where:  { token: galleryToken },
        select: { eventId: true, expiresAt: true },
      });
      if (!row || row.expiresAt < new Date()) {
        return next(new Error('AUTH_INVALID: gallery token invalid or expired'));
      }
      socket.data.type    = 'gallery';
      socket.data.eventId = row.eventId;
      return next();
    } catch (err) {
      logger.error({ err }, '[socket] gallery token lookup failed');
      return next(new Error('AUTH_ERROR: internal error'));
    }
  }

  // JWT auth (studio users and team members)
  if (token) {
    try {
      socket.data.user = verifyAccessToken(token);
      socket.data.type = 'user';
      return next();
    } catch {
      return next(new Error('AUTH_INVALID: invalid or expired JWT'));
    }
  }

  return next(new Error('AUTH_REQUIRED: provide token or galleryToken'));
}

// ─── Room join helpers ────────────────────────────────────────

async function getStudioForUser(userId) {
  // Owner has direct studio
  const owned = await prisma.studio.findUnique({
    where:  { ownerId: userId },
    select: { id: true },
  });
  if (owned) return owned.id;

  // Active team member
  const member = await prisma.teamMember.findFirst({
    where:  { userId, status: 'ACTIVE' },
    select: { studioId: true },
  });
  return member?.studioId ?? null;
}

async function canAccessEvent(userId, eventId) {
  const event = await prisma.event.findUnique({
    where:  { id: eventId },
    select: { studioId: true },
  });
  if (!event) return false;

  const owned = await prisma.studio.findUnique({
    where:  { id: event.studioId, ownerId: userId },
    select: { id: true },
  });
  if (owned) return true;

  const member = await prisma.teamMember.findFirst({
    where:  { studioId: event.studioId, userId, status: 'ACTIVE' },
    select: { id: true },
  });
  return !!member;
}

async function canAccessCamera(userId, cameraId) {
  const camera = await prisma.cameraAccount.findUnique({
    where:  { id: cameraId },
    select: { studioId: true },
  });
  if (!camera) return false;

  const owned = await prisma.studio.findUnique({
    where:  { id: camera.studioId, ownerId: userId },
    select: { id: true },
  });
  if (owned) return true;

  const member = await prisma.teamMember.findFirst({
    where:  { studioId: camera.studioId, userId, status: 'ACTIVE' },
    select: { id: true },
  });
  return !!member;
}

// ─── Connection handler ───────────────────────────────────────

function onConnection(socket) {
  const userId      = socket.data.user?.userId   ?? null;
  const galleryType = socket.data.type === 'gallery';

  // ── join:studio ────────────────────────────────────────────
  socket.on('join:studio', async (studioId) => {
    if (!userId || typeof studioId !== 'string') return;
    try {
      const accessibleId = await getStudioForUser(userId);
      if (accessibleId !== studioId) return;
      socket.join(`studio:${studioId}`);
      socket.emit('joined:studio', { studioId });
    } catch (err) {
      logger.warn({ err, userId, studioId }, '[socket] join:studio error');
    }
  });

  // ── join:event ─────────────────────────────────────────────
  socket.on('join:event', async (eventId) => {
    if (typeof eventId !== 'string') return;
    try {
      let allowed = false;

      if (galleryType && socket.data.eventId === eventId) {
        // Gallery-token holder is pre-authorised for their event
        allowed = true;
      } else if (userId) {
        allowed = await canAccessEvent(userId, eventId);
      }

      if (!allowed) return;
      socket.join(`event:${eventId}`);
      socket.emit('joined:event', { eventId });
    } catch (err) {
      logger.warn({ err, userId, eventId }, '[socket] join:event error');
    }
  });

  // ── join:camera ────────────────────────────────────────────
  socket.on('join:camera', async (cameraId) => {
    if (!userId || typeof cameraId !== 'string') return;
    try {
      if (!(await canAccessCamera(userId, cameraId))) return;
      socket.join(`camera:${cameraId}`);
      socket.emit('joined:camera', { cameraId });
    } catch (err) {
      logger.warn({ err, userId, cameraId }, '[socket] join:camera error');
    }
  });

  // ── join:slideshow ─────────────────────────────────────────
  // Public slideshow — gallery-token holders only.
  socket.on('join:slideshow', async (eventId) => {
    if (typeof eventId !== 'string') return;
    try {
      if (!galleryType || socket.data.eventId !== eventId) return;
      socket.join(`slideshow:${eventId}`);
      socket.emit('joined:slideshow', { eventId });
    } catch (err) {
      logger.warn({ err, eventId }, '[socket] join:slideshow error');
    }
  });

  // ── leave rooms ────────────────────────────────────────────
  socket.on('leave:event',     (id) => typeof id === 'string' && socket.leave(`event:${id}`));
  socket.on('leave:studio',    (id) => typeof id === 'string' && socket.leave(`studio:${id}`));
  socket.on('leave:camera',    (id) => typeof id === 'string' && socket.leave(`camera:${id}`));
  socket.on('leave:slideshow', (id) => typeof id === 'string' && socket.leave(`slideshow:${id}`));
}

// ─── Exported API ─────────────────────────────────────────────

export function initIO(httpServer) {
  _io = new Server(httpServer, {
    cors:       { origin: env.FRONTEND_URL, credentials: true },
    transports: ['websocket', 'polling'],
  });

  // Redis adapter — fans out events across multiple API pods
  _io.adapter(createAdapter(adapterPub, adapterSub));

  // Auth gate — every connection must pass before joining any room
  _io.use(authMiddleware);

  _io.on('connection', onConnection);

  // Start relaying worker publications to socket rooms
  relaySub
    .connect()
    .then(() => relaySub.subscribe(CHANNEL))
    .catch(err => logger.error({ err }, '[socket] failed to subscribe to realtime:events'));

  logger.info('[socket] Socket.IO initialised with redis-adapter');
  return _io;
}

/** Returns the Socket.IO server instance (null before initIO is called). */
export function getIO() { return _io; }
