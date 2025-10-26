import { defineEventHandler, readBody, createError } from 'h3'
import { prisma } from '~/server/utils/db'

type Body = Partial<{
  name: string
  gender: string
  personality: string
  voiceId: string | null
  voiceStability: number | null
  voiceSimilarity: number | null
  bio: string | null
  traits: Record<string, any> | null
  speakingStyle: string | null
  relationshipType: string
}>

export default defineEventHandler(async (event) => {
  const userId = event.context.user?.id as string | undefined
  if (!userId) throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })

  const b = (await readBody<Body>(event)) || {}

  // Minimal validation / coercion
  const clean = {
    name: (b.name ?? '').toString().trim() || undefined,
    gender: (b.gender ?? '').toString().trim() || undefined,
    personality: b.personality?.toString().trim() || null,
    voiceId: b.voiceId === null ? null : (b.voiceId ?? '').toString().trim() || null,
    voiceStability: b.voiceStability == null ? null : Number(b.voiceStability),
    voiceSimilarity: b.voiceSimilarity == null ? null : Number(b.voiceSimilarity),
    bio: b.bio === null ? null : (b.bio ?? '').toString(),
    traits: b.traits ?? undefined, // leave undefined to not overwrite
    speakingStyle: b.speakingStyle?.toString().trim() || null,
    relationshipType: (b.relationshipType ?? '').toString().trim() || undefined,
  }

  const profile = await prisma.userAssistantProfile.upsert({
    where: { userId },
    create: { userId, ...clean },
    update: { ...clean },
  })

  return { profile, ok: true }
})
