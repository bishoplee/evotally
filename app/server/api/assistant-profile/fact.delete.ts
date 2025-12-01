import { defineEventHandler, readBody, createError } from 'h3'
import { prisma } from '~/server/utils/db'

type Body = {
  key: string
}

export default defineEventHandler(async (event) => {
  const userId = event.context.user?.id as string | undefined
  if (!userId) throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })

  const body = await readBody<Body>(event)
  const key = body.key?.trim()

  if (!key) {
    throw createError({ statusCode: 422, statusMessage: 'Fact key is required' })
  }

  // Find the profile
  const profile = await prisma.userAssistantProfile.findUnique({ where: { userId } })
  if (!profile) {
    throw createError({ statusCode: 404, statusMessage: 'Profile not found' })
  }

  // Get existing facts
  const facts = (profile.facts as Record<string, any>) || {}

  // Remove the fact
  if (facts[key]) {
    delete facts[key]

    // Update profile
    const updated = await prisma.userAssistantProfile.update({
      where: { userId },
      data: { facts },
    })

    return { ok: true, facts: updated.facts }
  }

  return { ok: true, facts: profile.facts }
})
