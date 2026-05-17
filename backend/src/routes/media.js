import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import multer from 'multer';
import { authenticate } from '../middleware/auth.js';

const router = Router();
const prisma = new PrismaClient();
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
router.post('/upload', authenticate, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file provided' });
    const { eventId, subEventId, uploadSource = 'MANUAL' } = req.body;
    if (!eventId) return res.status(400).json({ error: 'eventId required' });

    // In production: upload req.file.buffer to Cloudflare R2 / S3
    // For now we store metadata only
    const media = await prisma.media.create({
      data: {
        eventId,
        subEventId: subEventId || null,
        filename: req.file.originalname,
        originalUrl: `/media/${eventId}/${req.file.originalname}`,
        mimeType: req.file.mimetype,
        sizeBytes: req.file.size,
        uploadSource,
      },
    });
    res.status(201).json(media);
  } catch (err) {
    res.status(500).json({ error: err.message });
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
router.delete('/:id', authenticate, async (req, res) => {
  await prisma.media.delete({ where: { id: req.params.id } });
  res.status(204).end();
});

export default router;
