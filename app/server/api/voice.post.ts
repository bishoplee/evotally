import { defineEventHandler, readBody, createError } from 'h3'
import { prisma } from '~/server/utils/db'

export default defineEventHandler(async (event) => {
  const u = event.context.user
  if (!u?.id) throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })

  const b = await readBody<{
    provider?: string
    voiceId: string
    stability?: number | null
    similarityBoost?: number | null
    label?: string | null
    settings?: Record<string, any> | null
    isDefault?: boolean | null
  }>(event)

  const provider = (b.provider || 'elevenlabs').trim().toLowerCase()
  const voiceId = (b.voiceId || '').trim()
  if (!voiceId) throw createError({ statusCode: 422, statusMessage: 'voiceId required' })
  if (b.stability != null && (b.stability < 0 || b.stability > 1)) {
    throw createError({ statusCode: 422, statusMessage: 'stability must be 0..1' })
  }
  if (b.similarityBoost != null && (b.similarityBoost < 0 || b.similarityBoost > 1)) {
    throw createError({ statusCode: 422, statusMessage: 'similarityBoost must be 0..1' })
  }

  const data = {
    user: { connect: { id: String(u.id) } },
    provider,
    voiceId,
    stability: b.stability ?? undefined,
    similarityBoost: b.similarityBoost ?? undefined,
    label: b.label?.trim() || undefined,
    settings: b.settings ?? undefined,
    isDefault: !!b.isDefault,
  }

  const saved = await prisma.voice.upsert({
    where: { userId_provider: { userId: String(u.id), provider } },
    update: {
      voiceId: data.voiceId,
      stability: data.stability,
      similarityBoost: data.similarityBoost,
      label: data.label,
      settings: data.settings,
      isDefault: data.isDefault || undefined,
    },
    create: data,
    select: { id: true, provider: true, isDefault: true },
  })

  if (saved.isDefault) {
    await prisma.voice.updateMany({
      where: { userId: String(u.id), id: { not: saved.id }, isDefault: true },
      data: { isDefault: false },
    })
  }

  return { ok: true, id: saved.id }
})
