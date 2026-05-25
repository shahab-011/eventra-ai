/**
 * Media processing worker — run as a separate process:
 *   node src/workers/mediaWorker.js
 *
 * Requires:
 *   - ffmpeg binary in PATH (for video transcoding)
 *   - All env vars loaded (DATABASE_URL, REDIS_URL, R2_* etc.)
 *
 * For each process-media job:
 *   Images → sharp: thumb 400px + web 1600px + optional watermark + EXIF
 *   Videos → ffmpeg: poster frame + 720p web variant (original 4K kept intact)
 *   Both  → update Media row to READY + enqueue detect-faces for images
 */

import '../config/env.js';          // load & validate .env before anything else

import { Worker }      from 'bullmq';
import { createWriteStream, createReadStream, promises as fs } from 'node:fs';
import { tmpdir }      from 'node:os';
import { join, extname } from 'node:path';
import { pipeline }    from 'node:stream/promises';
import { randomUUID }  from 'node:crypto';
import sharp           from 'sharp';
import ffmpeg          from 'fluent-ffmpeg';
import { parse as parseExif } from 'exifr';
import IORedis         from 'ioredis';

import prisma          from '../lib/prisma.js';
import { bullConnection, faceDetectQueue } from '../lib/queues.js';
import {
  getObjectBuffer,
  putObject,
  cdnUrl,
} from '../services/r2.js';
import logger          from '../lib/logger.js';
import env             from '../config/env.js';

// ─── Redis publisher (inter-process socket relay) ─────────────
const publisher = new IORedis(env.REDIS_URL, { maxRetriesPerRequest: null });
publisher.on('error', err => logger.warn({ err }, '[worker] Redis publisher error'));

async function emitToEventRoom(eventId, event, data) {
  await publisher.publish('media:events', JSON.stringify({
    room: `event:${eventId}`,
    event,
    data,
  }));
}

// ─── Watermark helper ─────────────────────────────────────────

async function applyWatermark(webBuffer, { watermarkUrl, studioName }) {
  const meta = await sharp(webBuffer).metadata();
  const w = meta.width ?? 1600;
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

// ─── Image processing ─────────────────────────────────────────

async function processImage(job) {
  const { mediaId, eventId, key, mimeType, watermarkEnabled, watermarkUrl, studioName } = job.data;

  const originalBuffer = await getObjectBuffer(key);

  // EXIF
  let takenAt, width, height;
  try {
    const exif = await parseExif(originalBuffer, {
      pick: ['DateTimeOriginal', 'CreateDate', 'ImageWidth', 'ImageHeight', 'ExifImageWidth', 'ExifImageHeight'],
    });
    takenAt = exif?.DateTimeOriginal ?? exif?.CreateDate ?? null;
    width   = exif?.ExifImageWidth   ?? exif?.ImageWidth   ?? null;
    height  = exif?.ExifImageHeight  ?? exif?.ImageHeight  ?? null;
  } catch { /* non-fatal */ }

  // Get actual dimensions from sharp if EXIF didn't have them
  if (!width || !height) {
    const meta = await sharp(originalBuffer).metadata();
    width  = meta.width  ?? null;
    height = meta.height ?? null;
  }

  // Thumbnail — 400px wide, JPEG
  const thumbKey    = `events/${eventId}/thumbs/${mediaId}.jpg`;
  const thumbBuffer = await sharp(originalBuffer)
    .resize(400, null, { withoutEnlargement: true })
    .rotate()                 // auto-orient from EXIF
    .jpeg({ quality: 80, mozjpeg: true })
    .toBuffer();
  const thumbnailUrl = await putObject(thumbKey, thumbBuffer, 'image/jpeg');

  // Web variant — 1600px wide, JPEG
  const webKey    = `events/${eventId}/web/${mediaId}.jpg`;
  const webBuffer = await sharp(originalBuffer)
    .resize(1600, null, { withoutEnlargement: true })
    .rotate()
    .jpeg({ quality: 85, mozjpeg: true })
    .toBuffer();
  const processedUrl = await putObject(webKey, webBuffer, 'image/jpeg');

  // Watermark
  let wmUrl = null;
  if (watermarkEnabled) {
    const wmKey    = `events/${eventId}/wm/${mediaId}.jpg`;
    const wmBuffer = await applyWatermark(webBuffer, { watermarkUrl, studioName });
    wmUrl          = await putObject(wmKey, wmBuffer, 'image/jpeg');
  }

  // Persist
  await prisma.media.update({
    where: { id: mediaId },
    data:  {
      status:       'READY',
      thumbnailUrl,
      processedUrl,
      wmUrl,
      width,
      height,
      takenAt:      takenAt ?? null,
    },
  });

  // Enqueue face detection (module B7)
  await faceDetectQueue.add('detect', {
    mediaId,
    eventId,
    key:          thumbKey,   // run detection on the thumbnail (smaller download)
    thumbnailUrl,
  }, { jobId: `face-${mediaId}` });

  await emitToEventRoom(eventId, 'media:ready', { mediaId, eventId, thumbnailUrl, processedUrl, wmUrl });

  logger.info({ mediaId, eventId }, '[worker] image processed');
}

// ─── Video processing ─────────────────────────────────────────

async function processVideo(job) {
  const { mediaId, eventId, key, watermarkEnabled, watermarkUrl, studioName } = job.data;

  const tmpDir    = tmpdir();
  const ext       = extname(key) || '.mp4';
  const inputPath = join(tmpDir, `${randomUUID()}${ext}`);
  const thumbPath = join(tmpDir, `${randomUUID()}.jpg`);
  const webPath   = join(tmpDir, `${randomUUID()}.mp4`);

  try {
    // Download original to temp file (ffmpeg requires file path)
    const buf = await getObjectBuffer(key);
    await fs.writeFile(inputPath, buf);

    // Poster frame at 1 second
    await new Promise((resolve, reject) => {
      ffmpeg(inputPath)
        .screenshots({ count: 1, timemarks: ['00:00:01'], filename: thumbPath })
        .on('end',   resolve)
        .on('error', reject);
    });

    // 720p web variant — keep original 4K untouched
    await new Promise((resolve, reject) => {
      ffmpeg(inputPath)
        .videoCodec('libx264')
        .audioCodec('aac')
        .outputOptions([
          '-vf', 'scale=\'min(1280,iw)\':-2',
          '-crf', '23',
          '-preset', 'fast',
          '-movflags', '+faststart',
        ])
        .output(webPath)
        .on('end',   resolve)
        .on('error', reject);
    });

    // ffprobe metadata for dimensions
    let width = null, height = null;
    await new Promise(resolve => {
      ffmpeg.ffprobe(inputPath, (err, meta) => {
        if (!err) {
          const vs = meta.streams?.find(s => s.codec_type === 'video');
          width  = vs?.width  ?? null;
          height = vs?.height ?? null;
        }
        resolve();
      });
    });

    // Upload poster frame
    const thumbKey    = `events/${eventId}/thumbs/${mediaId}.jpg`;
    const thumbBuffer = await fs.readFile(thumbPath);
    const thumbnailUrl = await putObject(thumbKey, thumbBuffer, 'image/jpeg');

    // Upload 720p variant
    const webKey    = `events/${eventId}/web/${mediaId}.mp4`;
    const webBuffer = await fs.readFile(webPath);
    const processedUrl = await putObject(webKey, webBuffer, 'video/mp4');

    await prisma.media.update({
      where: { id: mediaId },
      data:  { status: 'READY', thumbnailUrl, processedUrl, width, height },
    });

    await emitToEventRoom(eventId, 'media:ready', { mediaId, eventId, thumbnailUrl, processedUrl });

    logger.info({ mediaId, eventId }, '[worker] video processed');
  } finally {
    // Always clean up temp files
    await Promise.allSettled([
      fs.unlink(inputPath),
      fs.unlink(thumbPath),
      fs.unlink(webPath),
    ]);
  }
}

// ─── Worker ───────────────────────────────────────────────────

const worker = new Worker(
  'process-media',
  async job => {
    const { mediaId, mimeType } = job.data;
    logger.info({ mediaId, mimeType }, '[worker] processing job');

    try {
      if (IMAGE_MIMES.has(mimeType)) {
        await processImage(job);
      } else if (VIDEO_MIMES.has(mimeType)) {
        await processVideo(job);
      } else {
        throw new Error(`Unsupported MIME type: ${mimeType}`);
      }
    } catch (err) {
      logger.error({ err, mediaId }, '[worker] processing failed');
      await prisma.media.update({
        where: { id: mediaId },
        data:  { status: 'FAILED' },
      }).catch(() => {});
      throw err; // BullMQ will retry per backoff config
    }
  },
  {
    connection:  bullConnection,
    concurrency: 4,            // process up to 4 jobs in parallel
  },
);

const IMAGE_MIMES = new Set([
  'image/jpeg', 'image/jpg', 'image/png',
  'image/gif',  'image/webp', 'image/heic', 'image/heif',
]);
const VIDEO_MIMES = new Set(['video/mp4', 'video/quicktime']);

worker.on('completed', job => {
  logger.info({ jobId: job.id, mediaId: job.data.mediaId }, '[worker] job completed');
});

worker.on('failed', (job, err) => {
  logger.error({ jobId: job?.id, mediaId: job?.data?.mediaId, err }, '[worker] job failed');
});

worker.on('error', err => {
  logger.error({ err }, '[worker] worker error');
});

logger.info('[worker] media worker started — waiting for jobs');

// Graceful shutdown
async function shutdown(signal) {
  logger.info(`[worker] ${signal} received — draining...`);
  await worker.close();
  await publisher.quit();
  await prisma.$disconnect();
  process.exit(0);
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT',  () => shutdown('SIGINT'));
