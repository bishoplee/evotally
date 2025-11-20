/*
  Warnings:

  - You are about to drop the `user_facts` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."user_facts" DROP CONSTRAINT "user_facts_userId_fkey";

-- AlterTable
ALTER TABLE "UserAssistantProfile" ADD COLUMN     "provider" TEXT NOT NULL DEFAULT 'elevenlabs';

-- DropTable
DROP TABLE "public"."user_facts";

-- CreateTable
CREATE TABLE "UserFact" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "factKey" TEXT NOT NULL,
    "factValue" TEXT NOT NULL,
    "rawAnswer" TEXT,
    "source" TEXT NOT NULL DEFAULT 'conversation',
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "confidence" TEXT NOT NULL DEFAULT 'medium',
    "lastUpdated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" JSONB,

    CONSTRAINT "UserFact_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "UserFact_userId_category_idx" ON "UserFact"("userId", "category");

-- CreateIndex
CREATE INDEX "UserFact_userId_verified_idx" ON "UserFact"("userId", "verified");

-- CreateIndex
CREATE UNIQUE INDEX "UserFact_userId_factKey_key" ON "UserFact"("userId", "factKey");

-- AddForeignKey
ALTER TABLE "UserFact" ADD CONSTRAINT "UserFact_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
