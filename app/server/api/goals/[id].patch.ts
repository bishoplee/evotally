import { defineEventHandler, readBody, getRouterParam } from 'h3'
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

  const body = await readBody(event)

  const goal = await prisma.goal.update({
    where: { id },
    data: {
      title: body.title?.trim() || existing.title,
      description: body.description?.trim() || null,
      category: body.category?.trim() || null,
      status: body.status || existing.status,
      priority: body.priority || null,
      targetDate: body.targetDate?.trim() || null,
      progress: body.progress !== undefined ? body.progress : existing.progress,
      notes: body.notes?.trim() || null
    }
  })

  return { goal }
})
