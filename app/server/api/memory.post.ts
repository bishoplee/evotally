import { defineEventHandler, readBody, createError } from 'h3'
import { prisma } from '~/server/utils/db'

type Body = {
  profile?: {
    name?: string | null
    timezone?: string | null
    // email change omitted on purpose
  }
  // Optional convenience: persist a single voice & set it default
  preferences?: {
    voice?: {
      provider?: string
      voiceId?: string
      stability?: number | null
      similarityBoost?: number | null
      label?: string | null
      settings?: Record<string, any> | null
      isDefault?: boolean | null
    }
  }
}

export default defineEventHandler(async (event) => {
  const u = event.context.user
  if (!u?.id) throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })

  const body = await readBody<Body>(event).catch(() => ({} as Body))
  const updates: any = {}

  // --- profile updates ---
  if (body.profile?.name != null) updates.display_name = String(body.profile.name || '').trim()
  if (body.profile?.timezone != null) updates.timezone = String(body.profile.timezone || '').trim()

  if (Object.keys(updates).length) {
    await prisma.user.update({ where: { id: String(u.id) }, data: updates })
  }

  // --- optional voice upsert (treat as default) ---
  const v = body.preferences?.voice
  if (v && v.voiceId) {
    const provider = (v.provider || 'elevenlabs').trim().toLowerCase()
    const voiceId = String(v.voiceId).trim()
    if (!voiceId) throw createError({ statusCode: 422, statusMessage: 'voiceId required' })
    if (v.stability != null && (v.stability < 0 || v.stability > 1)) {
      throw createError({ statusCode: 422, statusMessage: 'stability must be 0..1' })
    }
    if (v.similarityBoost != null && (v.similarityBoost < 0 || v.similarityBoost > 1)) {
      throw createError({ statusCode: 422, statusMessage: 'similarityBoost must be 0..1' })
    }

    const data = {
      user: { connect: { id: String(u.id) } },
      provider,
      voiceId,
      stability: v.stability ?? undefined,
      similarityBoost: v.similarityBoost ?? undefined,
      label: v.label?.trim() || undefined,
      settings: v.settings ?? undefined,
      isDefault: v.isDefault ?? true, // default to true if not provided
    }

    const saved = await prisma.voice.upsert({
      where: { userId_provider: { userId: String(u.id), provider } },
      update: {
        voiceId: data.voiceId,
        stability: data.stability,
        similarityBoost: data.similarityBoost,
        label: data.label,
        settings: data.settings,
        isDefault: data.isDefault,
      },
      create: data,
      select: { id: true, provider: true, isDefault: true },
    })

    // If this voice is now default, clear others
    if (saved.isDefault) {
      await prisma.voice.updateMany({
        where: { userId: String(u.id), id: { not: saved.id }, isDefault: true },
        data: { isDefault: false },
      })
    }
  }

  return { ok: true }
})
