// app/server/api/voices/index.post.ts
import { defineEventHandler, readBody, createError } from 'h3'
import { prisma } from '~/server/utils/db'
import { requireUserId } from './_utils'

export default defineEventHandler(async (e) => {
  const userId = await requireUserId(e)
  const b = await readBody<{
    provider: string
    voiceId: string
    label?: string
    stability?: number | null
    similarityBoost?: number | null
    settings?: any
    makeDefault?: boolean
  }>(e)

  if (!b?.provider || !b?.voiceId) {
    throw createError({ statusCode: 400, statusMessage: 'provider and voiceId are required' })
  }

  // Respect your uniqueness constraint @@unique([userId, provider]).
  // If user wants *multiple* voices per provider later, drop that Prisma constraint.
  const existing = await prisma.voice.findUnique({
    where: { userId_provider: { userId, provider: b.provider } } as any,
  }).catch(() => null)

  if (existing) {
    // Update the existing provider row instead of throwing
    const updated = await prisma.voice.update({
      where: { id: existing.id },
      data: {
        voiceId: b.voiceId,
        label: b.label ?? existing.label,
        stability: b.stability ?? existing.stability,
        similarityBoost: b.similarityBoost ?? existing.similarityBoost,
        settings: b.settings ?? existing.settings,
      },
    })
    // Optional: flip default if requested
    if (b.makeDefault) {
      await prisma.$transaction([
        prisma.voice.updateMany({ where: { userId }, data: { isDefault: false } }),
        prisma.voice.update({ where: { id: updated.id }, data: { isDefault: true } }),
      ])
      updated.isDefault = true
    }
    return { item: updated, upserted: true }
  }

  const item = await prisma.voice.create({
    data: {
      userId,
      provider: b.provider,
      voiceId: b.voiceId,
      label: b.label ?? null,
      stability: b.stability ?? undefined,
      similarityBoost: b.similarityBoost ?? undefined,
      settings: b.settings ?? undefined,
      isDefault: false,
    },
  })

  if (b.makeDefault) {
    await prisma.$transaction([
      prisma.voice.updateMany({ where: { userId }, data: { isDefault: false } }),
      prisma.voice.update({ where: { id: item.id }, data: { isDefault: true } }),
    ])
    item.isDefault = true
  }

  return { item }
})
