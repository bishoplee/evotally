/*
  Warnings:

  - The primary key for the `EvoProfile` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `progressPct` on the `EvoProfile` table. All the data in the column will be lost.
  - You are about to drop the column `score` on the `EvoProfile` table. All the data in the column will be lost.
  - You are about to drop the column `tenantId` on the `EvoProfile` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[userId]` on the table `EvoProfile` will be added. If there are existing duplicate values, this will fail.
  - The required column `id` was added to the `EvoProfile` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.

*/
-- DropIndex
DROP INDEX "public"."EvoProfile_tenantId_updatedAt_idx";

-- AlterTable
ALTER TABLE "EvoProfile" DROP CONSTRAINT "EvoProfile_pkey",
DROP COLUMN "progressPct",
DROP COLUMN "score",
DROP COLUMN "tenantId",
ADD COLUMN     "id" TEXT NOT NULL,
ADD CONSTRAINT "EvoProfile_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "tenantId" TEXT,
ADD COLUMN     "timezone" TEXT DEFAULT 'America/New_York';

-- CreateTable
CREATE TABLE "Voice" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "elevenVoiceId" TEXT NOT NULL,
    "stability" DOUBLE PRECISION DEFAULT 0.4,
    "similarityBoost" DOUBLE PRECISION DEFAULT 0.85,

    CONSTRAINT "Voice_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Voice_userId_key" ON "Voice"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "EvoProfile_userId_key" ON "EvoProfile"("userId");

-- AddForeignKey
ALTER TABLE "Voice" ADD CONSTRAINT "Voice_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
