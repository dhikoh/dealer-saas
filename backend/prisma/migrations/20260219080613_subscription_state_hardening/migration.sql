-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM (
    'ACTIVE',
    'TRIAL',
    'GRACE',
    'SUSPENDED',
    'CANCELLED'
);
-- CreateEnum
CREATE TYPE "SuspensionType" AS ENUM ('SOFT', 'HARD');
-- Modify "tenants" table safely
ALTER TABLE "tenants"
ADD COLUMN "suspensionType" "SuspensionType";
-- Safely cast subscriptionStatus to Enum
ALTER TABLE "tenants"
ALTER COLUMN "subscriptionStatus" DROP DEFAULT;
ALTER TABLE "tenants"
ALTER COLUMN "subscriptionStatus" TYPE "SubscriptionStatus" USING "subscriptionStatus"::"SubscriptionStatus";
ALTER TABLE "tenants"
ALTER COLUMN "subscriptionStatus"
SET DEFAULT 'ACTIVE';
-- CreateTable
CREATE TABLE "tenant_status_history" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "oldStatus" "SubscriptionStatus" NOT NULL,
    "newStatus" "SubscriptionStatus" NOT NULL,
    "reason" TEXT,
    "triggeredBy" TEXT NOT NULL,
    "referenceId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "tenant_status_history_pkey" PRIMARY KEY ("id")
);
-- CreateIndex
CREATE INDEX "tenant_status_history_tenantId_idx" ON "tenant_status_history"("tenantId");
-- CreateIndex
CREATE INDEX "tenants_subscriptionStatus_idx" ON "tenants"("subscriptionStatus");
-- AddForeignKey
ALTER TABLE "tenant_status_history"
ADD CONSTRAINT "tenant_status_history_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;