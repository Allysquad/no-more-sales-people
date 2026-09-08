-- CreateTable
CREATE TABLE "BusinessUser" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BusinessUser_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BusinessUser_email_key"
    ON "BusinessUser"("email");

-- Seed a demo business user for login access
INSERT INTO "BusinessUser" ("id", "name", "email", "password", "createdAt")
VALUES (
    'business_demo_user',
    'Demo Business User',
    'business@nomoresalespeople.com',
    'demo-password',
    NOW()
);