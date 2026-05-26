-- B13: Invite module — slug, QR, publish flag, InviteView analytics, guest RSVP fields

-- Invite: new columns
ALTER TABLE "Invite"
  ADD COLUMN IF NOT EXISTS "slug"            TEXT    UNIQUE,
  ADD COLUMN IF NOT EXISTS "customData"      JSONB,
  ADD COLUMN IF NOT EXISTS "qrDataUrl"       TEXT,
  ADD COLUMN IF NOT EXISTS "published"       BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS "showGuestPool"   BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS "plusOnesEnabled" BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS "mealPrefEnabled" BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS "updatedAt"       TIMESTAMP(3) NOT NULL DEFAULT NOW();

-- Guest: invite tracking + RSVP detail fields
ALTER TABLE "Guest"
  ADD COLUMN IF NOT EXISTS "inviteId"    TEXT,
  ADD COLUMN IF NOT EXISTS "plusOnes"    INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "mealPref"    TEXT,
  ADD COLUMN IF NOT EXISTS "rsvpMessage" TEXT;

-- FK: Guest.inviteId → Invite.id (SET NULL on delete)
ALTER TABLE "Guest"
  ADD CONSTRAINT "Guest_inviteId_fkey"
  FOREIGN KEY ("inviteId") REFERENCES "Invite"("id") ON DELETE SET NULL;

-- Index for invite→guest lookup
CREATE INDEX IF NOT EXISTS "Guest_inviteId_idx" ON "Guest"("inviteId");

-- InviteView: per-visit analytics log
CREATE TABLE IF NOT EXISTS "InviteView" (
  "id"        TEXT         NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "inviteId"  TEXT         NOT NULL,
  "viewedAt"  TIMESTAMP(3) NOT NULL DEFAULT NOW(),
  "ipHash"    TEXT,
  CONSTRAINT "InviteView_inviteId_fkey"
    FOREIGN KEY ("inviteId") REFERENCES "Invite"("id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "InviteView_inviteId_viewedAt_idx" ON "InviteView"("inviteId", "viewedAt");
