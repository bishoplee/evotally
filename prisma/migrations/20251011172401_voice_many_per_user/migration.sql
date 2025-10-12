/*
  Warnings:

  - You are about to drop the column `elevenVoiceId` on the `Voice` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[userId,provider]` on the table `Voice` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `provider` to the `Voice` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `Voice` table without a default value. This is not possible if the table is not empty.
  - Added the required column `voiceId` to the `Voice` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "public"."Voice_userId_key";

-- AlterTable
ALTER TABLE "Voice" DROP COLUMN "elevenVoiceId",
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "isDefault" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "label" TEXT,
ADD COLUMN     "provider" TEXT NOT NULL,
ADD COLUMN     "settings" JSONB,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "voiceId" TEXT NOT NULL;

-- CreateIndex
CREATE INDEX "Voice_userId_idx" ON "Voice"("userId");

-- CreateIndex
CREATE INDEX "Voice_provider_idx" ON "Voice"("provider");

-- CreateIndex
CREATE UNIQUE INDEX "Voice_userId_provider_key" ON "Voice"("userId", "provider");
