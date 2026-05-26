/**
 * Media processing worker.
 *
 * Exports:
 *   processMedia(job)  — processor consumed by workers/index.js
 *   cleanup()          — closes the Redis publisher (called by index.js on shutdown)
 *
 * Standalone entry point (npm run worker:media):
 *   node src/workers/mediaWorker.js
 */

import '../config/env.js';

import { promises as fs }  from 'node:fs';
import { tmpdir }           from 'node:os';
import { join, extname }    from 'node:path';
import { randomUUID }       from 'node:crypto';
import { fileURLToPath }    from 'node:url';
import sharp                from 'sharp';
import ffmpeg               from 'fluent-ffmpeg';
import { parse as parseExif } from 'exifr';

import prisma               from '../lib/prisma.js';
import { bullConnection, faceDetectQueue } from '../lib/queues.js';
import { publishToEvent, publishSlideshow } from '../lib/realtime.js';
import { getObjectBuffer, putObject, cdnUrl } from '../services/r2.js';
import logger               from '../lib/logger.js';

// No local Redis publisher — all events go through lib/realtime.js
export function cleanup() { return Promise.resolve(); }

// ─── MIME sets ────────────────────────────────────────────────

export const IMAGE_MIMES = new Set([
  'image/jpeg', 'image/jpg', 'image/png',
  'image/gif',  'image/webp', 'image/heic', 'image/heif',
]);
export const VIDEO_MIMES = new Set(['video/mp4', 'video/quicktime']);

// ─── Watermark ────────────────────────────────────────────────

async function applyWatermark(webBuffer, { watermarkUrl, studioName }) {
  const meta = await sharp(webBuffer).metadata();
  const w = meta.width  ?? 1600;
  const h = meta.height ?? 1067;

  let overlayInput;
  if (watermarkUrl) {
    const res = await fetch(watermarkUrl);
    if (res.ok) {
      const logoBuf   = Buffer.from(await res.arrayBuffer());
      const logoWidth = Math.max(60, Math.floor(w * 0.12));
      overlayInput    = await sharp(logoBuf).resize(logoWidth).toBuffer();
    }
  }

  if (!overlayInput) {
    const fontSize = Math.max(14, Math.floor(w / 45));
    const safeName = (studioName ?? 'Eventra').replace(/[<>&"]/g, '');
    overlayInput = Buffer.from(
      `<svg width="${w}" height="${Math.ceil(fontSize * 1.6)}">
        <text x="${Math.floor(w / 2)}" y="${Math.ceil(fontSize * 1.3)}"
              text-anchor="middle" font-family="Arial,sans-serif"
              font-size="${fontSize}" fill="rgba(255,255,255,0.55)">${safeName}</text>
      </svg>`,
    );
  }

  return sharp(webBuffer)
    .composite([{ input: overlayInput, gravity: watermarkUrl ? 'southeast' : 'south' }])
    .jpeg({ quality: 85, mozjpeg: true })
    .toBuffer();
}

// ─── Image ────────────────────────────────────────────────────

async function processImage(job) {
  const { mediaId, eventId, key, mimeType, watermarkEnabled, watermarkUrl, studioName } = job.data;

  const originalBuffer = await getObjectBuffer(key);

  let takenAt, width, height;
  try {
    const exif = await parseExif(originalBuffer, {
      pick: ['DateTimeOriginal', 'CreateDate', 'ImageWidth', 'ImageHeight', 'ExifImageWidth', 'ExifImageHeight'],
    });
    takenAt = exif?.DateTimeOriginal ?? exif?.CreateDate ?? null;
    width   = exif?.ExifImageWidth   ?? exif?.ImageWidth   ?? null;
    height  = exif?.ExifImageHeight  ?? exif?.ImageHeight  ?? null;
  } catch { /* non-fatal */ }

  if (!width || !height) {
    const meta = await sharp(originalBuffer).metadata();
    width  = meta.width  ?? null;
    height = meta.height ?? null;
  }

  const thumbKey    = `events/${eventId}/thumbs/${mediaId}.jpg`;
  const thumbBuffer = await sharp(originalBuffer)
    .resize(400, null, { withoutEnlargement: true })
    .rotate()
    .jpeg({ quality: 80, mozjpeg: true })
    .toBuffer();
  const thumbnailUrl = await putObject(thumbKey, thumbBuffer, 'image/jpeg');

  const webKey    = `events/${eventId}/web/${mediaId}.jpg`;
  const webBuffer = await sharp(originalBuffer)
    .resize(1600, null, { withoutEnlargement: true })
    .rotate()
    .jpeg({ quality: 85, mozjpeg: true })
    .toBuffer();
  const processedUrl = await putObject(webKey, webBuffer, 'image/jpeg');

  let wmUrl = null;
  if (watermarkEnabled) {
    const wmKey    = `events/${eventId}/wm/${mediaId}.jpg`;
    const wmBuffer = await applyWatermark(webBuffer, { watermarkUrl, studioName });
    wmUrl          = await putObject(wmKey, wmBuffer, 'image/jpeg');
  }

  await prisma.media.update({
    where: { id: mediaId },
    data:  { status: 'READY', thumbnailUrl, processedUrl, wmUrl, width, height, takenAt: takenAt ?? null },
  });

  await faceDetectQueue.add('detect', {
    mediaId, eventId, key: thumbKey, thumbnailUrl,
  }, { jobId: `face-${mediaId}` });

  const processedPayload = { mediaId, eventId, thumbnailUrl, processedUrl, wmUrl };
  await publishToEvent(eventId, 'media:processed', processedPayload);
  await publishSlideshow(eventId, 'slideshow:newPhoto', { mediaId, eventId, thumbnailUrl, processedUrl });
  logger.info({ mediaId, eventId }, '[mediaWorker] image processed');
}

// ─── Video ────────────────────────────────────────────────────

async function processVideo(job) {
  const { mediaId, eventId, key, watermarkEnabled, watermarkUrl, studioName } = job.data;

  const tmpDir    = tmpdir();
  const ext       = extname(key) || '.mp4';
  const inputPath = join(tmpDir, `${randomUUID()}${ext}`);
  const thumbPath = join(tmpDir, `${randomUUID()}.jpg`);
  const webPath   = join(tmpDir, `${randomUUID()}.mp4`);

  try {
    const buf = await getObjectBuffer(key);
    await fs.writeFile(inputPath, buf);

    await new Promise((resolve, reject) => {
      ffmpeg(inputPath)
        .screenshots({ count: 1, timemarks: ['00:00:01'], filename: thumbPath })
        .on('end', resolve).on('error', reject);
    });

    await new Promise((resolve, reject) => {
      ffmpeg(inputPath)
        .videoCodec('libx264').audioCodec('aac')
        .outputOptions(['-vf', "scale='min(1280,iw)':-2", '-crf', '23', '-preset', 'fast', '-movflags', '+faststart'])
        .output(webPath)
        .on('end', resolve).on('error', reject);
    });

    let width = null, height = null;
    await new Promise(resolve => {
      ffmpeg.ffprobe(inputPath, (err, meta) => {
        if (!err) {
          const vs = meta.streams?.find(s => s.codec_type === 'video');
          width = vs?.width ?? null; height = vs?.height ?? null;
        }
        resolve();
      });
    });

    const thumbKey     = `events/${eventId}/thumbs/${mediaId}.jpg`;
    const thumbnailUrl = await putObject(thumbKey, await fs.readFile(thumbPath), 'image/jpeg');
    const webKey       = `events/${eventId}/web/${mediaId}.mp4`;
    const processedUrl = await putObject(webKey,   await fs.readFile(webPath),   'video/mp4');

    await prisma.media.update({
      where: { id: mediaId },
      data:  { status: 'READY', thumbnailUrl, processedUrl, width, height },
    });
    await publishToEvent(eventId, 'media:processed', { mediaId, eventId, thumbnailUrl, processedUrl });
    logger.info({ mediaId, eventId }, '[mediaWorker] video processed');
  } finally {
    await Promise.allSettled([fs.unlink(inputPath), fs.unlink(thumbPath), fs.unlink(webPath)]);
  }
}

// ─── Exported processor ───────────────────────────────────────

export async function processMedia(job) {
  const { mediaId, mimeType } = job.data;
  logger.info({ mediaId, mimeType }, '[mediaWorker] processing job');

  try {
    if (IMAGE_MIMES.has(mimeType))      await processImage(job);
    else if (VIDEO_MIMES.has(mimeType)) await processVideo(job);
    else throw new Error(`Unsupported MIME type: ${mimeType}`);
  } catch (err) {
    logger.error({ err, mediaId }, '[mediaWorker] processing failed');
    await prisma.media.update({ where: { id: mediaId }, data: { status: 'FAILED' } }).catch(() => {});
    throw err;
  }
}

// ─── Standalone runner ────────────────────────────────────────

const __file = fileURLToPath(import.meta.url).replace(/\\/g, '/');
const isMain = process.argv[1] && process.argv[1].replace(/\\/g, '/') === __file;

if (isMain) {
  const { Worker } = await import('bullmq');

  const worker = new Worker('process-media', processMedia, {
    connection:  bullConnection,
    concurrency: 4,
  });

  worker.on('completed', job =>
    logger.info({ jobId: job.id, mediaId: job.data.mediaId }, '[mediaWorker] completed'),
  );
  worker.on('failed', (job, err) =>
    logger.error({ jobId: job?.id, mediaId: job?.data?.mediaId, err }, '[mediaWorker] failed'),
  );
  worker.on('error', err => logger.error({ err }, '[mediaWorker] worker error'));

  logger.info('[mediaWorker] started standalone — listening on process-media');

  const shutdown = async signal => {
    logger.info(`[mediaWorker] ${signal} — draining`);
    await worker.close();
    await cleanup();
    await prisma.$disconnect();
    process.exit(0);
  };
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT',  () => shutdown('SIGINT'));
}
