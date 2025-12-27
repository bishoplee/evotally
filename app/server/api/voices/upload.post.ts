import { defineEventHandler, readBody, createError } from 'h3'
import { prisma } from '~/server/utils/db'
import { requireUserId } from './_utils'

/**
 * Upload or register a custom voice
 *
 * Body:
 * - voiceId: URL to the voice file (already uploaded to storage)
 * - label: Display name for the voice
 * - stability: Optional stability setting
 * - similarityBoost: Optional similarity boost
 * - makeDefault: Whether to make this the default voice
 */
export default defineEventHandler(async (e) => {
  const userId = await requireUserId(e)
  const body = await readBody<{
    voiceId: string // URL to voice file
    label?: string
    stability?: number
    similarityBoost?: number
    makeDefault?: boolean
  }>(e)

  if (!body?.voiceId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'voiceId (URL to voice file) is required'
    })
  }

  // Check if user already has a custom voice
  const existing = await prisma.voice.findUnique({
    where: {
      userId_provider: {
        userId,
        provider: 'custom'
      }
    }
  }).catch(() => null)

  let voice

  if (existing) {
    // Update existing custom voice
    voice = await prisma.voice.update({
      where: { id: existing.id },
      data: {
        voiceId: body.voiceId,
        label: body.label ?? existing.label,
        stability: body.stability ?? existing.stability,
        similarityBoost: body.similarityBoost ?? existing.similarityBoost
      }
    })
  } else {
    // Create new custom voice
    voice = await prisma.voice.create({
      data: {
        userId,
        provider: 'custom',
        voiceId: body.voiceId,
        label: body.label ?? 'My Custom Voice',
        stability: body.stability ?? 0.4,
        similarityBoost: body.similarityBoost ?? 0.85,
        isDefault: false
      }
    })
  }

  // Set as default if requested
  if (body.makeDefault) {
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
    message: existing ? 'Custom voice updated' : 'Custom voice uploaded successfully'
  }
})
