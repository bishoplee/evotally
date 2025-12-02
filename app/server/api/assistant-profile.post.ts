import { defineEventHandler, readBody, createError } from 'h3'
import { prisma } from '~/server/utils/db'

type Body = Partial<{
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
  const userId = event.context.user?.id as string | undefined
  if (!userId) throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })

  const b = (await readBody<Body>(event)) || {}

  // Build update object with all fields
  const clean: any = {}

  // Core Identity & Role
  if (b.name !== undefined) clean.name = String(b.name).trim() || 'Evo'
  if (b.pronouns !== undefined) clean.pronouns = b.pronouns ? String(b.pronouns).trim() : null
  if (b.primaryRole !== undefined) clean.primaryRole = String(b.primaryRole).trim()
  if (b.addressUserAs !== undefined) clean.addressUserAs = b.addressUserAs ? String(b.addressUserAs).trim() : null
  if (b.birthday !== undefined) clean.birthday = b.birthday ? String(b.birthday).trim() : null
  if (b.fictionalAge !== undefined) clean.fictionalAge = b.fictionalAge ? Number(b.fictionalAge) : null

  // Personality & Vibe
  if (b.personalityTraits !== undefined) clean.personalityTraits = Array.isArray(b.personalityTraits) ? b.personalityTraits : []
  if (b.affectionLevel !== undefined) clean.affectionLevel = b.affectionLevel != null ? Number(b.affectionLevel) : null
  if (b.seriousnessLevel !== undefined) clean.seriousnessLevel = b.seriousnessLevel != null ? Number(b.seriousnessLevel) : null
  if (b.emotionalExpressiveness !== undefined) clean.emotionalExpressiveness = b.emotionalExpressiveness ? String(b.emotionalExpressiveness) : null
  if (b.backstory !== undefined) clean.backstory = b.backstory ? String(b.backstory) : null

  // Relationship Dynamics
  if (b.relationshipDescription !== undefined) clean.relationshipDescription = b.relationshipDescription ? String(b.relationshipDescription) : null
  if (b.termsOfEndearment !== undefined) clean.termsOfEndearment = b.termsOfEndearment ? String(b.termsOfEndearment) : null
  if (b.specificEndearments !== undefined) clean.specificEndearments = Array.isArray(b.specificEndearments) ? b.specificEndearments : []
  if (b.upsetResponseStyle !== undefined) clean.upsetResponseStyle = b.upsetResponseStyle ? String(b.upsetResponseStyle) : null
  if (b.toughLoveAllowed !== undefined) clean.toughLoveAllowed = b.toughLoveAllowed ? String(b.toughLoveAllowed) : null
  if (b.relationshipPriority !== undefined) clean.relationshipPriority = b.relationshipPriority ? String(b.relationshipPriority) : null

  // Communication Style
  if (b.defaultTone !== undefined) clean.defaultTone = b.defaultTone ? String(b.defaultTone) : null
  if (b.formalityLevel !== undefined) clean.formalityLevel = b.formalityLevel ? String(b.formalityLevel) : null
  if (b.useEmojisSlang !== undefined) clean.useEmojisSlang = b.useEmojisSlang ? String(b.useEmojisSlang) : null
  if (b.catchphrases !== undefined) clean.catchphrases = Array.isArray(b.catchphrases) ? b.catchphrases : []
  if (b.forbiddenPhrases !== undefined) clean.forbiddenPhrases = Array.isArray(b.forbiddenPhrases) ? b.forbiddenPhrases : []

  // Autonomy, Initiative & Boundaries
  if (b.proactivityLevel !== undefined) clean.proactivityLevel = b.proactivityLevel ? String(b.proactivityLevel) : null
  if (b.allowedSuggestions !== undefined) clean.allowedSuggestions = Array.isArray(b.allowedSuggestions) ? b.allowedSuggestions : []
  if (b.forbiddenTopics !== undefined) clean.forbiddenTopics = Array.isArray(b.forbiddenTopics) ? b.forbiddenTopics : []
  if (b.correctWhenWrong !== undefined) clean.correctWhenWrong = b.correctWhenWrong ? String(b.correctWhenWrong) : null
  if (b.ignoredMessageResponse !== undefined) clean.ignoredMessageResponse = b.ignoredMessageResponse ? String(b.ignoredMessageResponse) : null

  // Special Rituals, Dates & Lore
  if (b.specialDates !== undefined) clean.specialDates = b.specialDates || {}
  if (b.recurringRituals !== undefined) clean.recurringRituals = Array.isArray(b.recurringRituals) ? b.recurringRituals : []
  if (b.specialDayCelebration !== undefined) clean.specialDayCelebration = b.specialDayCelebration ? String(b.specialDayCelebration) : null
  if (b.loreReferenceLevel !== undefined) clean.loreReferenceLevel = b.loreReferenceLevel ? String(b.loreReferenceLevel) : null

  // Safety, Ethics & Guardrails
  if (b.physicalPresencePretend !== undefined) clean.physicalPresencePretend = b.physicalPresencePretend ? String(b.physicalPresencePretend) : null
  if (b.forbiddenRoles !== undefined) clean.forbiddenRoles = Array.isArray(b.forbiddenRoles) ? b.forbiddenRoles : []
  if (b.selfCriticalResponse !== undefined) clean.selfCriticalResponse = b.selfCriticalResponse ? String(b.selfCriticalResponse) : null
  if (b.unhealthyPatternResponse !== undefined) clean.unhealthyPatternResponse = b.unhealthyPatternResponse ? String(b.unhealthyPatternResponse) : null

  // Voice settings
  if (b.voiceId !== undefined) clean.voiceId = b.voiceId ? String(b.voiceId).trim() : null
  if (b.voiceStability !== undefined) clean.voiceStability = b.voiceStability != null ? Number(b.voiceStability) : null
  if (b.voiceSimilarity !== undefined) clean.voiceSimilarity = b.voiceSimilarity != null ? Number(b.voiceSimilarity) : null
  if (b.provider !== undefined) clean.provider = b.provider ? String(b.provider) : 'elevenlabs'

  // Legacy fields
  if (b.gender !== undefined) clean.gender = b.gender ? String(b.gender) : null
  if (b.personality !== undefined) clean.personality = b.personality ? String(b.personality) : null
  if (b.bio !== undefined) clean.bio = b.bio ? String(b.bio) : null
  if (b.speakingStyle !== undefined) clean.speakingStyle = b.speakingStyle ? String(b.speakingStyle) : null
  if (b.relationshipType !== undefined) clean.relationshipType = b.relationshipType ? String(b.relationshipType) : 'spouse_partner'
  if (b.traits !== undefined) clean.traits = b.traits

  // Facts (keep existing logic for backward compatibility)
  if (b.facts !== undefined) clean.facts = b.facts

  const profile = await prisma.userAssistantProfile.upsert({
    where: { userId },
    create: { userId, ...clean },
    update: { ...clean },
  })

  return { profile, ok: true }
})
