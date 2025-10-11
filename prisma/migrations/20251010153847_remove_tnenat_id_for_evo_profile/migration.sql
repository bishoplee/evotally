/*
  Warnings:

  - You are about to drop the column `tenantId` on the `EvoProfile` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "public"."EvoProfile_tenantId_idx";

-- AlterTable
ALTER TABLE "EvoProfile" DROP COLUMN "tenantId";
