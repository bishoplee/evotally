import { defineEventHandler, getQuery } from 'h3'
import { prisma } from '~/server/utils/db'
import { requireUserId } from './_utils'

/**
 * Get all available voices for the user
 *
 * Returns both:
 * - System voices from ProviderVoice (available to all users)
 * - User's custom uploaded voices
 *
 * Query params:
 * - provider: Filter by provider (optional)
 * - language: Filter by language (optional)
 * - search: Search by name/description (optional)
 */
export default defineEventHandler(async (e) => {
  const userId = await requireUserId(e)
  const q = getQuery(e)

  const provider = q.provider ? String(q.provider) : undefined
  const language = q.language ? String(q.language) : undefined
  const search = q.search ? String(q.search) : undefined

  // Build where clause for system voices
  const systemWhere: any = {
    isActive: true
  }
  if (provider) systemWhere.provider = provider
  if (language) systemWhere.language = language
  if (search) {
    systemWhere.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } }
    ]
  }

  // Get system voices from ProviderVoice
  const systemVoices = await prisma.providerVoice.findMany({
    where: systemWhere,
    orderBy: [
      { provider: 'asc' },
      { name: 'asc' }
    ]
  })

  // Get user's custom voices (provider="custom")
  const customWhere: any = {
    userId,
    provider: 'custom'
  }
  if (search) {
    customWhere.label = { contains: search, mode: 'insensitive' }
  }

  const customVoices = await prisma.voice.findMany({
    where: customWhere,
    orderBy: [
      { isDefault: 'desc' },
      { created_at: 'desc' }
    ]
  })

  // Format system voices to match the response structure
  const formattedSystemVoices = systemVoices.map(v => ({
    id: v.id,
    type: 'system' as const,
    provider: v.provider,
    providerId: v.providerId,
    voiceId: v.providerId, // For compatibility
    name: v.name,
    label: v.name,
    description: v.description,
    language: v.language,
    gender: v.gender,
    accent: v.accent,
    ageRange: v.ageRange,
    useCase: v.useCase,
    previewUrl: v.previewUrl,
    settings: v.settings,
    created_at: v.created_at,
    updated_at: v.updated_at
  }))

  // Format custom voices
  const formattedCustomVoices = customVoices.map(v => ({
    id: v.id,
    type: 'custom' as const,
    provider: v.provider,
    voiceId: v.voiceId,
    name: v.label || 'Custom Voice',
    label: v.label,
    description: 'User uploaded voice',
    isDefault: v.isDefault,
    stability: v.stability,
    similarityBoost: v.similarityBoost,
    settings: v.settings,
    created_at: v.created_at,
    updated_at: v.updated_at
  }))

  return {
    systemVoices: formattedSystemVoices,
    customVoices: formattedCustomVoices,
    all: [...formattedSystemVoices, ...formattedCustomVoices]
  }
})
