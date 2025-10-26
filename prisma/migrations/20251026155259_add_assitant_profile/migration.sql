/*
  Warnings:

  - You are about to drop the `UserFact` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."UserFact" DROP CONSTRAINT "UserFact_userId_fkey";

-- DropTable
DROP TABLE "public"."UserFact";

-- CreateTable
CREATE TABLE "user_facts" (
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

    CONSTRAINT "user_facts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserAssistantProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL DEFAULT 'Evo',
    "gender" TEXT NOT NULL DEFAULT 'female',
    "personality" TEXT,
    "voiceId" TEXT,
    "voiceStability" DOUBLE PRECISION DEFAULT 0.5,
    "voiceSimilarity" DOUBLE PRECISION DEFAULT 0.75,
    "bio" TEXT,
    "traits" JSONB,
    "speakingStyle" TEXT,
    "relationshipType" TEXT NOT NULL DEFAULT 'spouse_partner',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserAssistantProfile_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "user_facts_userId_category_idx" ON "user_facts"("userId", "category");

-- CreateIndex
CREATE INDEX "user_facts_userId_verified_idx" ON "user_facts"("userId", "verified");

-- CreateIndex
CREATE UNIQUE INDEX "user_facts_userId_factKey_key" ON "user_facts"("userId", "factKey");

-- CreateIndex
CREATE UNIQUE INDEX "UserAssistantProfile_userId_key" ON "UserAssistantProfile"("userId");

-- AddForeignKey
ALTER TABLE "user_facts" ADD CONSTRAINT "user_facts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserAssistantProfile" ADD CONSTRAINT "UserAssistantProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
