/**
 * Realtime publish helpers.
 *
 * Workers run in a separate process — they have no access to the Socket.IO
 * server. Instead they call publish() here, which writes a JSON payload onto
 * the Redis 'realtime:events' pub/sub channel. The socket server (lib/socket.js)
 * subscribes to that channel and broadcasts to the appropriate room.
 *
 * Usage:
 *   import { publishToEvent, publishToStudio } from '../lib/realtime.js';
 *
 *   await publishToEvent(eventId, 'media:processed', { mediaId, thumbnailUrl });
 *   await publishToStudio(studioId, 'delivery:update', { guestId, status });
 */

import IORedis from 'ioredis';
import env     from '../config/env.js';
import logger  from './logger.js';

export const CHANNEL = 'realtime:events';

// Lazy singleton — created on first publish call, shared across all workers
// running in the same process.
let _pub = null;

function getPub() {
  if (!_pub) {
    _pub = new IORedis(env.REDIS_URL, { maxRetriesPerRequest: null });
    _pub.on('error', err => logger.warn({ err }, '[realtime] Redis publisher error'));
  }
  return _pub;
}

/**
 * Low-level publish. Room name must be fully qualified (e.g. 'event:abc').
 */
export async function publish(room, event, data) {
  try {
    await getPub().publish(CHANNEL, JSON.stringify({ room, event, data }));
  } catch (err) {
    logger.warn({ err, room, event }, '[realtime] publish failed');
  }
}

// ─── Typed helpers ────────────────────────────────────────────

/** Broadcast to all sockets in an event room (studio + guests). */
export const publishToEvent = (eventId, event, data) =>
  publish(`event:${eventId}`, event, data);

/** Broadcast to the studio owner's dashboard room. */
export const publishToStudio = (studioId, event, data) =>
  publish(`studio:${studioId}`, event, data);

/** Broadcast to a specific camera's monitoring room. */
export const publishToCamera = (cameraId, event, data) =>
  publish(`camera:${cameraId}`, event, data);

/**
 * Broadcast to the public slideshow room for an event.
 * Also mirrors to the event room so studio dashboards get the same tick.
 */
export async function publishSlideshow(eventId, event, data) {
  await Promise.all([
    publish(`slideshow:${eventId}`, event, data),
    publish(`event:${eventId}`,     event, data),
  ]);
}

// ─── Lifecycle ────────────────────────────────────────────────

/** Close the shared publisher connection. Call once from workers/index.js shutdown. */
export function closePublisher() {
  if (_pub) {
    const p = _pub;
    _pub = null;
    return p.quit();
  }
  return Promise.resolve();
}
