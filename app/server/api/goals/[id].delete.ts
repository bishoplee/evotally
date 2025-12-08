import { defineEventHandler, getRouterParam } from 'h3'
import { verifyBearerHeader } from '~/server/utils/jwt'
import { prisma } from '~/server/utils/db'

export default defineEventHandler(async (event) => {
  const auth = event.node.req.headers.authorization || ''
  const { sub } = await verifyBearerHeader(auth)
  const userId = String(sub)

  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({
      statusCode: 400,
      message: 'Goal ID is required'
    })
  }

  // Check ownership
  const existing = await prisma.goal.findUnique({
    where: { id }
  })

  if (!existing) {
    throw createError({
      statusCode: 404,
      message: 'Goal not found'
    })
  }

  if (existing.userId !== userId) {
    throw createError({
      statusCode: 403,
      message: 'Forbidden'
    })
  }

  await prisma.goal.delete({
    where: { id }
  })

  return { ok: true }
})
