import { defineEventHandler, readBody, createError, getHeader } from 'h3'
import { prisma } from '~/server/utils/db'
import { verifyBearerHeader } from '~/server/utils/jwt'

/**
 * Update Assistant Profile (Mobile-friendly endpoint)
 *
 * Updates the user's assistant profile with partial data.
 * Creates profile if it doesn't exist.
 *
 * Headers:
 * - Authorization: Bearer {access_token}
 * - Content-Type: application/json
 *
 * Body: Any subset of profile fields (see type below)
 */

type UpdateBody = Partial<{
  // Core Identity & Role
  name: string
  pronouns: string | null
  primaryRole: string
  addressUserAs: string | null
  birthday: string | null
  fictionalAge: number | null

  // Personality & Vibe
  personalityTraits: string[] | null
  affectionLevel: number | null
  seriousnessLevel: number | null
  emotionalExpressiveness: string | null
  backstory: string | null

  // Relationship Dynamics
  relationshipDescription: string | null
  termsOfEndearment: string | null
  specificEndearments: string[] | null
  upsetResponseStyle: string | null
  toughLoveAllowed: string | null
  relationshipPriority: string | null

  // Communication Style
  defaultTone: string | null
  formalityLevel: string | null
  useEmojisSlang: string | null
  catchphrases: string[] | null
  forbiddenPhrases: string[] | null

  // Autonomy, Initiative & Boundaries
  proactivityLevel: string | null
  allowedSuggestions: string[] | null
  forbiddenTopics: string[] | null
  correctWhenWrong: string | null
  ignoredMessageResponse: string | null

  // Special Rituals, Dates & Lore
  specialDates: any | null
  recurringRituals: string[] | null
  specialDayCelebration: string | null
  loreReferenceLevel: string | null

  // Safety, Ethics & Guardrails
  physicalPresencePretend: string | null
  forbiddenRoles: string[] | null
  selfCriticalResponse: string | null
  unhealthyPatternResponse: string | null

  // Voice settings
  voiceId: string | null
  voiceStability: number | null
  voiceSimilarity: number | null
  provider: string | null

  // Legacy fields
  gender: string | null
  personality: string | null
  bio: string | null
  speakingStyle: string | null
  relationshipType: string | null
  traits: any | null

  // Facts
  facts: any | null
}>

export default defineEventHandler(async (event) => {
  // Verify authentication via Bearer token
  const auth = getHeader(event, 'authorization')
  const { sub } = await verifyBearerHeader(auth)
  const userId = String(sub)

  const body = (await readBody<UpdateBody>(event)) || {}

  // Build update object
  const updateData: any = {}

  // Core Identity & Role
  if (body.name !== undefined) updateData.name = String(body.name).trim() || 'Evo'
  if (body.pronouns !== undefined) updateData.pronouns = body.pronouns ? String(body.pronouns).trim() : null
  if (body.primaryRole !== undefined) updateData.primaryRole = String(body.primaryRole).trim()
  if (body.addressUserAs !== undefined) updateData.addressUserAs = body.addressUserAs ? String(body.addressUserAs).trim() : null
  if (body.birthday !== undefined) updateData.birthday = body.birthday ? String(body.birthday).trim() : null
  if (body.fictionalAge !== undefined) updateData.fictionalAge = body.fictionalAge ? Number(body.fictionalAge) : null

  // Personality & Vibe
  if (body.personalityTraits !== undefined) updateData.personalityTraits = Array.isArray(body.personalityTraits) ? body.personalityTraits : []
  if (body.affectionLevel !== undefined) updateData.affectionLevel = body.affectionLevel != null ? Number(body.affectionLevel) : null
  if (body.seriousnessLevel !== undefined) updateData.seriousnessLevel = body.seriousnessLevel != null ? Number(body.seriousnessLevel) : null
  if (body.emotionalExpressiveness !== undefined) updateData.emotionalExpressiveness = body.emotionalExpressiveness ? String(body.emotionalExpressiveness) : null
  if (body.backstory !== undefined) updateData.backstory = body.backstory ? String(body.backstory) : null

  // Relationship Dynamics
  if (body.relationshipDescription !== undefined) updateData.relationshipDescription = body.relationshipDescription ? String(body.relationshipDescription) : null
  if (body.termsOfEndearment !== undefined) updateData.termsOfEndearment = body.termsOfEndearment ? String(body.termsOfEndearment) : null
  if (body.specificEndearments !== undefined) updateData.specificEndearments = Array.isArray(body.specificEndearments) ? body.specificEndearments : []
  if (body.upsetResponseStyle !== undefined) updateData.upsetResponseStyle = body.upsetResponseStyle ? String(body.upsetResponseStyle) : null
  if (body.toughLoveAllowed !== undefined) updateData.toughLoveAllowed = body.toughLoveAllowed ? String(body.toughLoveAllowed) : null
  if (body.relationshipPriority !== undefined) updateData.relationshipPriority = body.relationshipPriority ? String(body.relationshipPriority) : null

  // Communication Style
  if (body.defaultTone !== undefined) updateData.defaultTone = body.defaultTone ? String(body.defaultTone) : null
  if (body.formalityLevel !== undefined) updateData.formalityLevel = body.formalityLevel ? String(body.formalityLevel) : null
  if (body.useEmojisSlang !== undefined) updateData.useEmojisSlang = body.useEmojisSlang ? String(body.useEmojisSlang) : null
  if (body.catchphrases !== undefined) updateData.catchphrases = Array.isArray(body.catchphrases) ? body.catchphrases : []
  if (body.forbiddenPhrases !== undefined) updateData.forbiddenPhrases = Array.isArray(body.forbiddenPhrases) ? body.forbiddenPhrases : []

  // Autonomy, Initiative & Boundaries
  if (body.proactivityLevel !== undefined) updateData.proactivityLevel = body.proactivityLevel ? String(body.proactivityLevel) : null
  if (body.allowedSuggestions !== undefined) updateData.allowedSuggestions = Array.isArray(body.allowedSuggestions) ? body.allowedSuggestions : []
  if (body.forbiddenTopics !== undefined) updateData.forbiddenTopics = Array.isArray(body.forbiddenTopics) ? body.forbiddenTopics : []
  if (body.correctWhenWrong !== undefined) updateData.correctWhenWrong = body.correctWhenWrong ? String(body.correctWhenWrong) : null
  if (body.ignoredMessageResponse !== undefined) updateData.ignoredMessageResponse = body.ignoredMessageResponse ? String(body.ignoredMessageResponse) : null

  // Special Rituals, Dates & Lore
  if (body.specialDates !== undefined) updateData.specialDates = body.specialDates || {}
  if (body.recurringRituals !== undefined) updateData.recurringRituals = Array.isArray(body.recurringRituals) ? body.recurringRituals : []
  if (body.specialDayCelebration !== undefined) updateData.specialDayCelebration = body.specialDayCelebration ? String(body.specialDayCelebration) : null
  if (body.loreReferenceLevel !== undefined) updateData.loreReferenceLevel = body.loreReferenceLevel ? String(body.loreReferenceLevel) : null

  // Safety, Ethics & Guardrails
  if (body.physicalPresencePretend !== undefined) updateData.physicalPresencePretend = body.physicalPresencePretend ? String(body.physicalPresencePretend) : null
  if (body.forbiddenRoles !== undefined) updateData.forbiddenRoles = Array.isArray(body.forbiddenRoles) ? body.forbiddenRoles : []
  if (body.selfCriticalResponse !== undefined) updateData.selfCriticalResponse = body.selfCriticalResponse ? String(body.selfCriticalResponse) : null
  if (body.unhealthyPatternResponse !== undefined) updateData.unhealthyPatternResponse = body.unhealthyPatternResponse ? String(body.unhealthyPatternResponse) : null

  // Voice settings
  if (body.voiceId !== undefined) updateData.voiceId = body.voiceId ? String(body.voiceId).trim() : null
  if (body.voiceStability !== undefined) updateData.voiceStability = body.voiceStability != null ? Number(body.voiceStability) : null
  if (body.voiceSimilarity !== undefined) updateData.voiceSimilarity = body.voiceSimilarity != null ? Number(body.voiceSimilarity) : null
  if (body.provider !== undefined) updateData.provider = body.provider ? String(body.provider) : 'elevenlabs'

  // Legacy fields
  if (body.gender !== undefined) updateData.gender = body.gender ? String(body.gender) : null
  if (body.personality !== undefined) updateData.personality = body.personality ? String(body.personality) : null
  if (body.bio !== undefined) updateData.bio = body.bio ? String(body.bio) : null
  if (body.speakingStyle !== undefined) updateData.speakingStyle = body.speakingStyle ? String(body.speakingStyle) : null
  if (body.relationshipType !== undefined) updateData.relationshipType = body.relationshipType ? String(body.relationshipType) : 'spouse_partner'
  if (body.traits !== undefined) updateData.traits = body.traits

  // Facts
  if (body.facts !== undefined) updateData.facts = body.facts

  // Upsert profile
  const profile = await prisma.userAssistantProfile.upsert({
    where: { userId },
    create: { userId, ...updateData },
    update: updateData
  })

  return {
    profile,
    message: 'Assistant profile updated successfully'
  }
})
