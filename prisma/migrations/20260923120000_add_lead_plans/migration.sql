-- CreateEnum
CREATE TYPE "LeadPlanType" AS ENUM ('ONE_COUNTRY', 'MULTIPLE_COUNTRIES', 'ALL_COUNTRIES');

-- CreateEnum
CREATE TYPE "LeadCountry" AS ENUM ('SCOTLAND', 'IRELAND', 'ENGLAND', 'WALES');

-- CreateEnum
CREATE TYPE "LeadRating" AS ENUM ('BRONZE', 'SILVER', 'GOLD', 'PLATINUM');

-- CreateTable
CREATE TABLE "LeadPlan" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "LeadPlanType" NOT NULL,
    "countries" "LeadCountry"[] NOT NULL,
    "ratings" "LeadRating"[] NOT NULL,
    "monthlyPricePence" INTEGER NOT NULL,
    "pricePerLeadPence" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LeadPlan_pkey" PRIMARY KEY ("id")
);

-- Add the demo plan before making the user relationship required
INSERT INTO "LeadPlan" (
    "id", "name", "type", "countries", "ratings", "monthlyPricePence", "pricePerLeadPence"
)
VALUES (
    'demo_all_leads_plan',
    'All leads demo plan',
    'ALL_COUNTRIES',
    ARRAY[]::"LeadCountry"[],
    ARRAY['BRONZE', 'SILVER', 'GOLD', 'PLATINUM']::"LeadRating"[],
    0,
    0
);

ALTER TABLE "BusinessUser" ADD COLUMN "leadPlanId" TEXT;

UPDATE "BusinessUser"
SET "leadPlanId" = 'demo_all_leads_plan'
WHERE "leadPlanId" IS NULL;

ALTER TABLE "BusinessUser" ALTER COLUMN "leadPlanId" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "BusinessUser"
ADD CONSTRAINT "BusinessUser_leadPlanId_fkey"
FOREIGN KEY ("leadPlanId") REFERENCES "LeadPlan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
