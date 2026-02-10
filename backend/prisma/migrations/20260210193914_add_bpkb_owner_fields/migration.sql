-- AlterTable
ALTER TABLE "vehicles" ADD COLUMN     "bpkbOwnerName" TEXT,
ADD COLUMN     "isOwnerDifferent" BOOLEAN NOT NULL DEFAULT false;
