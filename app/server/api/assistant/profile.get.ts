import { defineEventHandler, createError, getHeader } from 'h3'
import { prisma } from '~/server/utils/db'
import { verifyBearerHeader } from '~/server/utils/jwt'

/**
 * Get Assistant Profile (Mobile-friendly endpoint)
 *
 * Returns the user's assistant profile with all configuration.
 * If profile doesn't exist, creates one with defaults.
 *
 * Headers:
 * - Authorization: Bearer {access_token}
 *
 * Response includes all assistant configuration:
 * - Core Identity & Role
 * - Personality & Vibe
 * - Relationship Dynamics
 * - Communication Style
 * - Autonomy & Boundaries
 * - Special Rituals & Dates
 * - Safety & Guardrails
 * - Voice Settings
 */
export default defineEventHandler(async (event) => {
  // Verify authentication via Bearer token
  const auth = getHeader(event, 'authorization')
  const { sub } = await verifyBearerHeader(auth)
  const userId = String(sub)

  // Get or create assistant profile
  let profile = await prisma.userAssistantProfile.findUnique({
    where: { userId }
  })

  if (!profile) {
    // Create profile with defaults
    profile = await prisma.userAssistantProfile.create({
      data: { userId }
    })
  }

  return {
    profile: {
      id: profile.id,
      userId: profile.userId,

      // A. Core Identity & Role
      name: profile.name,
      pronouns: profile.pronouns,
      primaryRole: profile.primaryRole,
      addressUserAs: profile.addressUserAs,
      birthday: profile.birthday,
      fictionalAge: profile.fictionalAge,

      // B. Personality & Vibe
      personalityTraits: profile.personalityTraits,
      affectionLevel: profile.affectionLevel,
      seriousnessLevel: profile.seriousnessLevel,
      emotionalExpressiveness: profile.emotionalExpressiveness,
      backstory: profile.backstory,

      // C. Relationship Dynamics
      relationshipDescription: profile.relationshipDescription,
      termsOfEndearment: profile.termsOfEndearment,
      specificEndearments: profile.specificEndearments,
      upsetResponseStyle: profile.upsetResponseStyle,
      toughLoveAllowed: profile.toughLoveAllowed,
      relationshipPriority: profile.relationshipPriority,

      // D. Communication Style
      defaultTone: profile.defaultTone,
      formalityLevel: profile.formalityLevel,
      useEmojisSlang: profile.useEmojisSlang,
      catchphrases: profile.catchphrases,
      forbiddenPhrases: profile.forbiddenPhrases,

      // E. Autonomy, Initiative & Boundaries
      proactivityLevel: profile.proactivityLevel,
      allowedSuggestions: profile.allowedSuggestions,
      forbiddenTopics: profile.forbiddenTopics,
      correctWhenWrong: profile.correctWhenWrong,
      ignoredMessageResponse: profile.ignoredMessageResponse,

      // F. Special Rituals, Dates & Lore
      specialDates: profile.specialDates,
      recurringRituals: profile.recurringRituals,
      specialDayCelebration: profile.specialDayCelebration,
      loreReferenceLevel: profile.loreReferenceLevel,

      // G. Safety, Ethics & Guardrails
      physicalPresencePretend: profile.physicalPresencePretend,
      forbiddenRoles: profile.forbiddenRoles,
      selfCriticalResponse: profile.selfCriticalResponse,
      unhealthyPatternResponse: profile.unhealthyPatternResponse,

      // Setup tracking
      setupCompletedQuestions: profile.setupCompletedQuestions,

      // Voice Settings
      voiceId: profile.voiceId,
      voiceStability: profile.voiceStability,
      voiceSimilarity: profile.voiceSimilarity,
      provider: profile.provider,

      // Legacy fields
      gender: profile.gender,
      personality: profile.personality,
      bio: profile.bio,
      traits: profile.traits,
      speakingStyle: profile.speakingStyle,
      relationshipType: profile.relationshipType,

      // Facts
      facts: profile.facts,

      // Timestamps
      createdAt: profile.createdAt,
      updatedAt: profile.updatedAt
    }
  }
})
