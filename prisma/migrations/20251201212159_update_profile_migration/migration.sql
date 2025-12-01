/*
  Warnings:

  - You are about to drop the `UserAssistantProfile` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."UserAssistantProfile" DROP CONSTRAINT "UserAssistantProfile_userId_fkey";

-- DropTable
DROP TABLE "public"."UserAssistantProfile";

-- CreateTable
CREATE TABLE "user_assistant_profiles" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL DEFAULT 'Evo',
    "pronouns" TEXT DEFAULT 'she/her',
    "primaryRole" TEXT NOT NULL DEFAULT 'spouse_partner',
    "addressUserAs" TEXT,
    "birthday" TEXT,
    "fictionalAge" INTEGER,
    "personalityTraits" JSONB,
    "affectionLevel" INTEGER DEFAULT 7,
    "seriousnessLevel" INTEGER DEFAULT 5,
    "emotionalExpressiveness" TEXT DEFAULT 'moderately_expressive',
    "backstory" TEXT,
    "relationshipDescription" TEXT,
    "termsOfEndearment" TEXT DEFAULT 'sometimes',
    "specificEndearments" JSONB,
    "upsetResponseStyle" TEXT DEFAULT 'comfort_validation',
    "toughLoveAllowed" TEXT DEFAULT 'occasionally',
    "relationshipPriority" TEXT,
    "defaultTone" TEXT DEFAULT 'soft_gentle',
    "formalityLevel" TEXT DEFAULT 'mixed',
    "useEmojisSlang" TEXT DEFAULT 'some_emojis',
    "catchphrases" JSONB,
    "forbiddenPhrases" JSONB,
    "proactivityLevel" TEXT DEFAULT 'occasional',
    "allowedSuggestions" JSONB,
    "forbiddenTopics" JSONB,
    "correctWhenWrong" TEXT DEFAULT 'important_only',
    "ignoredMessageResponse" TEXT DEFAULT 'back_off',
    "specialDates" JSONB,
    "recurringRituals" JSONB,
    "specialDayCelebration" TEXT DEFAULT 'mention',
    "loreReferenceLevel" TEXT DEFAULT 'sometimes',
    "physicalPresencePretend" TEXT DEFAULT 'clear_boundaries',
    "forbiddenRoles" JSONB,
    "selfCriticalResponse" TEXT DEFAULT 'challenge_encourage',
    "unhealthyPatternResponse" TEXT DEFAULT 'suggest_resources',
    "setupCompletedQuestions" JSONB DEFAULT '[]',
    "voiceId" TEXT,
    "voiceStability" DOUBLE PRECISION DEFAULT 0.5,
    "voiceSimilarity" DOUBLE PRECISION DEFAULT 0.75,
    "provider" TEXT NOT NULL DEFAULT 'elevenlabs',
    "gender" TEXT NOT NULL DEFAULT 'female',
    "personality" TEXT,
    "bio" TEXT,
    "traits" JSONB,
    "speakingStyle" TEXT,
    "relationshipType" TEXT NOT NULL DEFAULT 'spouse_partner',
    "facts" JSONB DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_assistant_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_assistant_profiles_userId_key" ON "user_assistant_profiles"("userId");

-- AddForeignKey
ALTER TABLE "user_assistant_profiles" ADD CONSTRAINT "user_assistant_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
