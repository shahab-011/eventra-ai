/**
 * Camera2Cloud — FTP server
 *
 * Listens on FTP_PORT (default 2121). Each CameraAccount has a unique
 * ftpUsername/ftpPassword. On file receipt the bytes stream directly to R2;
 * a Media row is created and enqueued for processing.
 *
 * Run via the main process (startFTPServer() is called from index.js after
 * the HTTP server starts).
 */

import FtpSrv  from 'ftp-srv';
import { PassThrough } from 'node:stream';
import { randomUUID }  from 'node:crypto';
import path            from 'node:path';

import prisma          from './lib/prisma.js';
import logger          from './lib/logger.js';
import { streamUpload } from './services/r2.js';
import { processMediaQueue } from './lib/queues.js';
import { getIO }       from './lib/socket.js';

// ─── MIME sniff from extension ────────────────────────────────

const MIME_MAP = {
  jpg:  'image/jpeg',
  jpeg: 'image/jpeg',
  png:  'image/png',
  gif:  'image/gif',
  webp: 'image/webp',
  heic: 'image/heic',
  heif: 'image/heif',
  mp4:  'video/mp4',
  mov:  'video/quicktime',
};

function mimeFromExt(filename) {
  const ext = filename.split('.').pop()?.toLowerCase() ?? '';
  return MIME_MAP[ext] ?? 'application/octet-stream';
}

// ─── Virtual filesystem ───────────────────────────────────────
//
// ftp-srv requires a filesystem interface per connection.
// We only implement the methods cameras actually call:
//   list  — return an empty directory listing (cameras rarely need it)
//   write — intercept file bytes and stream them to R2

class CameraFS {
  constructor(camera) {
    this.camera   = camera;   // CameraAccount row
    this.cwd      = '/';
  }

  currentDirectory() {
    return this.cwd;
  }

  // Cameras may try to cd before uploading; just accept any path
  async chdir(dir) {
    this.cwd = dir;
    return dir;
  }

  async list(_path) {
    return [];
  }

  async write(filename) {
    const pass = new PassThrough();

    // Fire upload to R2 in the background — ftp-srv will pipe bytes into pass
    const ext       = path.extname(filename).slice(1).toLowerCase();
    const mediaId   = randomUUID();
    const eventId   = this.camera.eventId;
    const subEventId = this.camera.subEventId ?? undefined;
    const key       = `events/${eventId}/originals/${mediaId}.${ext || 'bin'}`;
    const mimeType  = mimeFromExt(filename);
    const camera    = this.camera;

    streamUpload(key, pass, mimeType)
      .then(async (deliveryUrl) => {
        const media = await prisma.media.create({
          data: {
            id:           mediaId,
            eventId,
            subEventId,
            filename:     filename,
            key,
            mimeType,
            status:       'PROCESSING',
            uploadSource: 'CAMERA2CLOUD',
            processedUrl: deliveryUrl,
            sizeBytes:    0n,               // unknown until head; worker will update
          },
        });

        // Bump camera stats
        await prisma.cameraAccount.update({
          where: { id: camera.id },
          data:  {
            uploadCount:  { increment: 1 },
            lastUploadAt: new Date(),
            status:       'CONNECTED',
          },
        });

        // Enqueue for processing (thumb, web variant, watermark, face detect)
        await processMediaQueue.add('process-media', {
          mediaId,
          eventId,
          key,
          mimeType,
        }, { jobId: `camera-${mediaId}` });

        // Live progress tick
        const io = getIO();
        if (io) {
          io.to(`event:${eventId}`).emit('camera:upload', {
            cameraId:   camera.id,
            cameraName: camera.name,
            mediaId,
            filename,
          });
        }

        logger.info({ mediaId, cameraId: camera.id, filename }, '[ftpServer] file received');
      })
      .catch(err => {
        logger.error({ err, cameraId: camera.id, filename }, '[ftpServer] R2 stream error');
      });

    // Return the writable side — ftp-srv will pipe bytes into it
    return { stream: pass };
  }

  // Cameras sometimes stat a file before upload; just return a fake stat
  async stat(filename) {
    return { isDirectory: () => false, size: 0, mtime: new Date(), name: filename };
  }

  async mkdir(_dir)               { return _dir; }
  async read(_filename)           { throw new Error('read not supported'); }
  async delete(_filename)         { return; }
  async rename(_from, _to)        { return; }
  async chmod(_filename, _mode)   { return; }
}

// ─── Build and export FTP server ──────────────────────────────

let ftpServer;

export function startFTPServer() {
  const port = Number(process.env.FTP_PORT ?? 2121);

  ftpServer = new FtpSrv({
    url:        `ftp://0.0.0.0:${port}`,
    pasv_url:   process.env.FTP_PASV_URL ?? '127.0.0.1',
    pasv_min:   Number(process.env.FTP_PASV_MIN ?? 3000),
    pasv_max:   Number(process.env.FTP_PASV_MAX ?? 3100),
    anonymous:  false,
    greeting:   'Eventra Camera2Cloud FTP',
  });

  ftpServer.on('login', async ({ connection, username, password }, resolve, reject) => {
    try {
      const camera = await prisma.cameraAccount.findUnique({
        where:  { ftpUsername: username },
        select: {
          id: true, studioId: true, eventId: true, subEventId: true,
          name: true, ftpPassword: true, status: true,
        },
      });

      if (!camera || camera.ftpPassword !== password) {
        return reject(new Error('Invalid credentials'));
      }
      if (!camera.eventId) {
        return reject(new Error('Camera not assigned to an event'));
      }

      // Update status to CONNECTED
      await prisma.cameraAccount.update({
        where: { id: camera.id },
        data:  { status: 'CONNECTED' },
      });

      logger.info({ cameraId: camera.id, username }, '[ftpServer] camera connected');
      resolve({ fs: new CameraFS(camera) });
    } catch (err) {
      logger.error({ err, username }, '[ftpServer] login error');
      reject(new Error('Authentication failed'));
    }
  });

  ftpServer.on('disconnect', async ({ username }) => {
    try {
      const camera = await prisma.cameraAccount.findUnique({
        where:  { ftpUsername: username },
        select: { id: true },
      });
      if (camera) {
        await prisma.cameraAccount.update({
          where: { id: camera.id },
          data:  { status: 'DISCONNECTED' },
        });
      }
    } catch (_) { /* non-fatal */ }
  });

  ftpServer.listen().then(() => {
    logger.info(`[ftpServer] listening on port ${port}`);
  });

  return ftpServer;
}

export async function stopFTPServer() {
  if (ftpServer) await ftpServer.close();
}
