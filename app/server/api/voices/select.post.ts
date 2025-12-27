import { defineEventHandler, readBody, createError } from 'h3'
import { prisma } from '~/server/utils/db'
import { requireUserId } from './_utils'

/**
 * Select a voice for the user
 *
 * Can select either:
 * - A system voice from ProviderVoice (by provider + providerId)
 * - A custom voice (by voiceId from Voice table)
 *
 * Body:
 * - type: "system" or "custom"
 * - provider: Provider name (required for system voices)
 * - providerId: Provider's voice ID (required for system voices)
 * - voiceId: Custom voice ID (required for custom voices)
 * - makeDefault: Whether to make this the default voice
 */
export default defineEventHandler(async (e) => {
  const userId = await requireUserId(e)
  const body = await readBody<{
    type: 'system' | 'custom'
    provider?: string
    providerId?: string
    voiceId?: string
    label?: string
    makeDefault?: boolean
  }>(e)

  if (!body?.type) {
    throw createError({
      statusCode: 400,
      statusMessage: 'type is required ("system" or "custom")'
    })
  }

  let voice

  if (body.type === 'system') {
    // Select a system voice from ProviderVoice catalog
    if (!body.provider || !body.providerId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'provider and providerId are required for system voices'
      })
    }

    // Verify the provider voice exists and is active
    const providerVoice = await prisma.providerVoice.findUnique({
      where: {
        provider_providerId: {
          provider: body.provider,
          providerId: body.providerId
        }
      }
    })

    if (!providerVoice || !providerVoice.isActive) {
      throw createError({
        statusCode: 404,
        statusMessage: 'System voice not found or not active'
      })
    }

    // Check if user already has this provider configured
    const existing = await prisma.voice.findUnique({
      where: {
        userId_provider: {
          userId,
          provider: body.provider
        }
      }
    }).catch(() => null)

    if (existing) {
      // Update to use the selected provider voice
      voice = await prisma.voice.update({
        where: { id: existing.id },
        data: {
          voiceId: body.providerId,
          label: body.label ?? providerVoice.name
        }
      })
    } else {
      // Create new voice selection for this provider
      voice = await prisma.voice.create({
        data: {
          userId,
          provider: body.provider,
          voiceId: body.providerId,
          label: body.label ?? providerVoice.name,
          isDefault: false
        }
      })
    }
  } else if (body.type === 'custom') {
    // Select an existing custom voice
    if (!body.voiceId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'voiceId is required for custom voices'
      })
    }

    // Verify the custom voice exists and belongs to the user
    voice = await prisma.voice.findFirst({
      where: {
        id: body.voiceId,
        userId,
        provider: 'custom'
      }
    })

    if (!voice) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Custom voice not found'
      })
    }
  } else {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid type. Must be "system" or "custom"'
    })
  }

  // Set as default if requested
  if (body.makeDefault && voice) {
    await prisma.$transaction([
      prisma.voice.updateMany({
        where: { userId },
        data: { isDefault: false }
      }),
      prisma.voice.update({
        where: { id: voice.id },
        data: { isDefault: true }
      })
    ])
    voice.isDefault = true
  }

  return {
    voice,
    message: 'Voice selected successfully'
  }
})
