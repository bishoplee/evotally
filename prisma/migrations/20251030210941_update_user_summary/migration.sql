/*
  Warnings:

  - Added the required column `lastInteraction` to the `UserSummary` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "UserSummary" ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "keyTopics" JSONB,
ADD COLUMN     "lastInteraction" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "recentHighlight" TEXT,
ADD COLUMN     "totalSessions" INTEGER NOT NULL DEFAULT 0;
