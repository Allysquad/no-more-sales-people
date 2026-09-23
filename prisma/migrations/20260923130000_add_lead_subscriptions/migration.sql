-- CreateTable
CREATE TABLE "LeadSubscription" (
    "id" TEXT NOT NULL,
    "businessUserId" TEXT NOT NULL,
    "type" "LeadPlanType" NOT NULL,
    "countries" "LeadCountry"[] NOT NULL,
    "rating" "LeadRating" NOT NULL,
    "monthlyPricePence" INTEGER NOT NULL,
    "acceptedAt" TIMESTAMP(3) NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LeadSubscription_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LeadSubscription_businessUserId_active_idx"
    ON "LeadSubscription"("businessUserId", "active");

-- AddForeignKey
ALTER TABLE "LeadSubscription"
ADD CONSTRAINT "LeadSubscription_businessUserId_fkey"
FOREIGN KEY ("businessUserId") REFERENCES "BusinessUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Preserve the existing demo experience with an explicitly accepted subscription
INSERT INTO "LeadSubscription" (
    "id", "businessUserId", "type", "countries", "rating", "monthlyPricePence", "acceptedAt", "active"
)
VALUES (
    'demo_all_leads_subscription',
    'business_demo_user',
    'ALL_COUNTRIES',
    ARRAY[]::"LeadCountry"[],
    'BRONZE',
    344000,
    NOW(),
    true
);
