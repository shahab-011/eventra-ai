/**
 * Socket.IO singleton.
 *
 * Usage:
 *   Server startup  → initIO(httpServer)
 *   Routes          → getIO()?.to('event:xyz').emit('media:ready', data)
 *
 * Inter-process events:
 *   The media worker runs in a separate process and cannot access the Socket.IO
 *   server directly.  It publishes to the Redis channel 'media:events'; the
 *   subscriber created here relays those messages to connected clients.
 */
import { Server }   from 'socket.io';
import IORedis      from 'ioredis';
import env          from '../config/env.js';
import logger       from './logger.js';

let _io = null;

// Dedicated subscriber connection — a subscribed client cannot send commands.
const subscriber = new IORedis(env.REDIS_URL, { lazyConnect: true });

subscriber.on('error', err => logger.warn({ err }, '[socket] Redis subscriber error'));

subscriber.on('message', (channel, raw) => {
  if (channel !== 'media:events' || !_io) return;
  try {
    const { room, event, data } = JSON.parse(raw);
    _io.to(room).emit(event, data);
  } catch { /* malformed publish — ignore */ }
});

export function initIO(httpServer) {
  _io = new Server(httpServer, {
    cors:       { origin: env.FRONTEND_URL, credentials: true },
    transports: ['websocket', 'polling'],
  });

  _io.on('connection', socket => {
    socket.on('join:event', eventId => {
      if (typeof eventId === 'string') socket.join(`event:${eventId}`);
    });
    socket.on('leave:event', eventId => {
      if (typeof eventId === 'string') socket.leave(`event:${eventId}`);
    });
  });

  // Start listening on the Redis inter-process channel
  subscriber.connect().then(() => subscriber.subscribe('media:events')).catch(err =>
    logger.error({ err }, '[socket] failed to subscribe to media:events'),
  );

  logger.info('Socket.IO initialised');
  return _io;
}

export function getIO() { return _io; }
