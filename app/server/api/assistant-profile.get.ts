import { defineEventHandler, createError } from 'h3'
import { prisma } from '~/server/utils/db'

export default defineEventHandler(async (event) => {
  const userId = event.context.user?.id as string | undefined
  if (!userId) throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })

  // Ensure there is a profile (lazy-create with defaults)
  let profile = await prisma.userAssistantProfile.findUnique({ where: { userId } })
  if (!profile) {
    profile = await prisma.userAssistantProfile.create({
      data: { userId }, // defaults from schema will fill the rest
    })
  }
  return { profile }
})
