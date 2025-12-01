import { defineEventHandler, createError, getRouterParam } from 'h3'
import { prisma } from '~/server/utils/db'

export default defineEventHandler(async (event) => {
  const userId = event.context.user?.id as string | undefined
  if (!userId) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'ID required' })
  }

  // Verify the fact belongs to the user
  const userFact = await prisma.userFact.findFirst({
    where: { id, userId }
  })

  if (!userFact) {
    throw createError({ statusCode: 404, statusMessage: 'User fact not found' })
  }

  // Delete the fact
  await prisma.userFact.delete({
    where: { id }
  })

  return { ok: true }
})
