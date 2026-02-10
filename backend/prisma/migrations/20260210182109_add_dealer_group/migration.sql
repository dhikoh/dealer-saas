/*
  Warnings:

  - A unique constraint covering the columns `[adminOfGroupId]` on the table `tenants` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "tenants" ADD COLUMN     "adminOfGroupId" TEXT,
ADD COLUMN     "dealerGroupId" TEXT;

-- CreateTable
CREATE TABLE "dealer_groups" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "adminTenantId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dealer_groups_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "dealer_groups_code_key" ON "dealer_groups"("code");

-- CreateIndex
CREATE UNIQUE INDEX "dealer_groups_adminTenantId_key" ON "dealer_groups"("adminTenantId");

-- CreateIndex
CREATE UNIQUE INDEX "tenants_adminOfGroupId_key" ON "tenants"("adminOfGroupId");

-- AddForeignKey
ALTER TABLE "tenants" ADD CONSTRAINT "tenants_dealerGroupId_fkey" FOREIGN KEY ("dealerGroupId") REFERENCES "dealer_groups"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dealer_groups" ADD CONSTRAINT "dealer_groups_adminTenantId_fkey" FOREIGN KEY ("adminTenantId") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
