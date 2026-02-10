-- DropForeignKey
ALTER TABLE "stock_transfers" DROP CONSTRAINT "stock_transfers_sourceBranchId_fkey";

-- DropForeignKey
ALTER TABLE "stock_transfers" DROP CONSTRAINT "stock_transfers_targetBranchId_fkey";

-- AlterTable
ALTER TABLE "stock_transfers" ADD COLUMN     "price" DECIMAL(65,30),
ADD COLUMN     "targetTenantId" TEXT,
ADD COLUMN     "type" TEXT NOT NULL DEFAULT 'MUTATION',
ALTER COLUMN "sourceBranchId" DROP NOT NULL,
ALTER COLUMN "targetBranchId" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "stock_transfers_targetTenantId_idx" ON "stock_transfers"("targetTenantId");

-- AddForeignKey
ALTER TABLE "stock_transfers" ADD CONSTRAINT "stock_transfers_targetTenantId_fkey" FOREIGN KEY ("targetTenantId") REFERENCES "tenants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_transfers" ADD CONSTRAINT "stock_transfers_sourceBranchId_fkey" FOREIGN KEY ("sourceBranchId") REFERENCES "branches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_transfers" ADD CONSTRAINT "stock_transfers_targetBranchId_fkey" FOREIGN KEY ("targetBranchId") REFERENCES "branches"("id") ON DELETE SET NULL ON UPDATE CASCADE;
