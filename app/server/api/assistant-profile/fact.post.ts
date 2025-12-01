import { defineEventHandler, readBody, createError } from 'h3'
import { prisma } from '~/server/utils/db'

type Body = {
  key: string
  value: string
  category?: string
}

export default defineEventHandler(async (event) => {
  const userId = event.context.user?.id as string | undefined
  if (!userId) throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })

  const body = await readBody<Body>(event)
  const key = body.key?.trim()
  const value = body.value?.trim()

  if (!key) {
    throw createError({ statusCode: 422, statusMessage: 'Fact key is required' })
  }
  if (!value) {
    throw createError({ statusCode: 422, statusMessage: 'Fact value is required' })
  }

  // Ensure profile exists
  let profile = await prisma.userAssistantProfile.findUnique({ where: { userId } })
  if (!profile) {
    profile = await prisma.userAssistantProfile.create({
      data: { userId },
    })
  }

  // Get existing facts or initialize empty object
  const facts = (profile.facts as Record<string, any>) || {}

  // Add or update the fact
  facts[key] = {
    value,
    category: body.category || 'general',
    updatedAt: new Date().toISOString(),
  }

  // Update profile with new facts
  const updated = await prisma.userAssistantProfile.update({
    where: { userId },
    data: { facts },
  })

  return { ok: true, facts: updated.facts }
})
