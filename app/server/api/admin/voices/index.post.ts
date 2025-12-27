import { defineEventHandler, readBody, createError } from 'h3'
import { prisma } from '~/server/utils/db'
import { verifyBearerHeader } from '~/server/utils/jwt'
import { getHeader } from 'h3'

/**
 * Add a new provider voice to the catalog (admin endpoint)
 *
 * Body:
 * - provider: Provider name (e.g., "elevenlabs", "openai")
 * - providerId: Provider's voice ID
 * - name: Display name
 * - description: Optional description
 * - language: Optional language code
 * - gender: Optional gender
 * - accent: Optional accent
 * - ageRange: Optional age range
 * - useCase: Optional use case
 * - previewUrl: Optional preview audio URL
 * - settings: Optional provider-specific settings
 */
export default defineEventHandler(async (e) => {
  // Verify authentication
  const auth = getHeader(e, 'authorization')
  const { sub } = await verifyBearerHeader(auth)

  // TODO: Add admin check here

  const body = await readBody<{
    provider: string
    providerId: string
    name: string
    description?: string
    language?: string
    gender?: string
    accent?: string
    ageRange?: string
    useCase?: string
    previewUrl?: string
    settings?: any
  }>(e)

  if (!body?.provider || !body?.providerId || !body?.name) {
    throw createError({
      statusCode: 400,
      statusMessage: 'provider, providerId, and name are required'
    })
  }

  // Check if voice already exists
  const existing = await prisma.providerVoice.findUnique({
    where: {
      provider_providerId: {
        provider: body.provider,
        providerId: body.providerId
      }
    }
  }).catch(() => null)

  if (existing) {
    // Update existing voice
    const updated = await prisma.providerVoice.update({
      where: { id: existing.id },
      data: {
        name: body.name,
        description: body.description,
        language: body.language,
        gender: body.gender,
        accent: body.accent,
        ageRange: body.ageRange,
        useCase: body.useCase,
        previewUrl: body.previewUrl,
        settings: body.settings
      }
    })

    return {
      voice: updated,
      message: 'Provider voice updated'
    }
  }

  // Create new voice
  const voice = await prisma.providerVoice.create({
    data: {
      provider: body.provider,
      providerId: body.providerId,
      name: body.name,
      description: body.description,
      language: body.language,
      gender: body.gender,
      accent: body.accent,
      ageRange: body.ageRange,
      useCase: body.useCase,
      previewUrl: body.previewUrl,
      settings: body.settings,
      isActive: true
    }
  })

  return {
    voice,
    message: 'Provider voice added successfully'
  }
})
