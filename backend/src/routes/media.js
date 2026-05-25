import { Router } from 'express';
import multer from 'multer';
import { authenticate } from '../middleware/auth.js';
import prisma from '../lib/prisma.js';
import { assertStorageAvailable, incrementStorage, decrementStorage } from '../services/storage.js';

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 30 * 1024 * 1024 } });

// GET /api/media?eventId=xxx&subEventId=xxx
router.get('/', authenticate, async (req, res) => {
  const { eventId, subEventId, page = 1, limit = 50 } = req.query;
  if (!eventId) return res.status(400).json({ error: 'eventId required' });

  const where = { eventId, ...(subEventId ? { subEventId } : {}) };
  const [media, total] = await Promise.all([
    prisma.media.findMany({ where, skip: (page - 1) * limit, take: Number(limit), orderBy: { createdAt: 'desc' } }),
    prisma.media.count({ where }),
  ]);
  res.json({ media, total, page: Number(page), pages: Math.ceil(total / limit) });
});

// POST /api/media/upload — upload single file
router.post('/upload', authenticate, upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file provided' });
    const { eventId, subEventId, uploadSource = 'MANUAL' } = req.body;
    if (!eventId) return res.status(400).json({ error: 'eventId required' });

    // Resolve which studio owns this event so we can enforce the storage limit
    const event = await prisma.event.findUnique({
      where:  { id: eventId },
      select: { studioId: true },
    });
    if (!event) return res.status(404).json({ error: 'Event not found' });

    // Throws 402 STORAGE_LIMIT_EXCEEDED if the upload would exceed the plan limit
    await assertStorageAvailable(event.studioId, req.file.size);

    // In production: upload req.file.buffer to Cloudflare R2 (see src/lib/r2.js)
    // For now we store metadata only
    const media = await prisma.media.create({
      data: {
        eventId,
        subEventId: subEventId || null,
        filename:   req.file.originalname,
        originalUrl: `/media/${eventId}/${req.file.originalname}`,
        mimeType:   req.file.mimetype,
        sizeBytes:  req.file.size,
        uploadSource,
      },
    });

    // Keep studio running total in sync
    await incrementStorage(event.studioId, req.file.size);

    res.status(201).json(media);
  } catch (err) {
    next(err);
  }
});

// POST /api/media/:id/ai-edit — trigger AI editing
router.post('/:id/ai-edit', authenticate, async (req, res) => {
  const media = await prisma.media.update({ where: { id: req.params.id }, data: { aiEdited: true } });
  res.json({ media, message: 'AI editing queued' });
});

// POST /api/media/:id/face-match — trigger face matching for a media item
router.post('/:id/face-match', authenticate, async (req, res) => {
  const media = await prisma.media.update({ where: { id: req.params.id }, data: { aiProcessed: true } });
  res.json({ media, message: 'Face matching queued' });
});

// PATCH /api/media/:id
router.patch('/:id', authenticate, async (req, res) => {
  const media = await prisma.media.update({ where: { id: req.params.id }, data: req.body });
  res.json(media);
});

// DELETE /api/media/:id
router.delete('/:id', authenticate, async (req, res, next) => {
  try {
    const media = await prisma.media.findUnique({
      where:  { id: req.params.id },
      select: { sizeBytes: true, event: { select: { studioId: true } } },
    });
    if (!media) return res.status(404).json({ error: 'Media not found' });

    await prisma.media.delete({ where: { id: req.params.id } });
    await decrementStorage(media.event.studioId, media.sizeBytes);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

export default router;
