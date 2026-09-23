DELETE FROM "Lead"
WHERE "completed" = false
   OR "name" IS NULL
   OR "email" IS NULL
   OR "phone" IS NULL
   OR "postcode" IS NULL;

ALTER TABLE "Lead"
  ALTER COLUMN "name" SET NOT NULL,
  ALTER COLUMN "email" SET NOT NULL,
  ALTER COLUMN "phone" SET NOT NULL,
  ALTER COLUMN "postcode" SET NOT NULL,
  ALTER COLUMN "completed" SET DEFAULT true;

ALTER TABLE "Lead"
  ADD COLUMN "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

UPDATE "Lead"
SET "completedAt" = "createdAt",
    "completed" = true;