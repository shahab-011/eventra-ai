-- ─────────────────────────────────────────────────────────────────────────────
-- pgvector setup — run ONCE against the production/staging database BEFORE
-- running `prisma migrate deploy`.
--
--   psql "$DATABASE_URL" -f pgvector_setup.sql
--
-- Order matters:
--   1. Enable the extension (requires superuser or pg_extension_owner).
--   2. The Prisma migration creates FaceVector + GuestFaceVector tables.
--   3. This script adds ivfflat cosine indexes AFTER the tables exist.
-- ─────────────────────────────────────────────────────────────────────────────

-- Step 1 — install the extension (idempotent)
CREATE EXTENSION IF NOT EXISTS vector;

-- ─────────────────────────────────────────────────────────────────────────────
-- Step 2 — create FaceVector and GuestFaceVector with vector columns
-- (Prisma cannot manage Unsupported("vector(512)") columns, so we handle them
-- here.  Run this block once after Prisma creates the tables without the column,
-- or merge it into your migration.)
-- ─────────────────────────────────────────────────────────────────────────────

-- Add vector column to FaceVector if it doesn't already exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='FaceVector' AND column_name='embedding'
  ) THEN
    ALTER TABLE "FaceVector" ADD COLUMN embedding vector(512);
  END IF;
END
$$;

-- Add vector column to GuestFaceVector if it doesn't already exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='GuestFaceVector' AND column_name='embedding'
  ) THEN
    ALTER TABLE "GuestFaceVector" ADD COLUMN embedding vector(512);
  END IF;
END
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- Step 3 — ivfflat cosine-distance indexes
--
-- lists=100 is appropriate for up to ~1 M face vectors (≈ sqrt(rows) rule).
-- Re-run REINDEX or VACUUM ANALYZE after large bulk inserts.
--
-- NOTE: CREATE INDEX CONCURRENTLY cannot run inside a transaction.
--       Run these statements outside psql's default auto-commit block if needed.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS "FaceVector_embedding_cosine_idx"
  ON "FaceVector"
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

CREATE INDEX IF NOT EXISTS "GuestFaceVector_embedding_cosine_idx"
  ON "GuestFaceVector"
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 50);

-- Tune ivfflat probes at query time for recall vs speed trade-off:
--   SET ivfflat.probes = 10;  -- default 1; higher = more accurate, slower
