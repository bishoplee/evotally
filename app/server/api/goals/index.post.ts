import { defineEventHandler, readBody } from 'h3'
import { verifyBearerHeader } from '~/server/utils/jwt'
import { prisma } from '~/server/utils/db'

export default defineEventHandler(async (event) => {
  const auth = event.node.req.headers.authorization || ''
  const { sub } = await verifyBearerHeader(auth)
  const userId = String(sub)

  const body = await readBody(event)

  // Validate required fields
  if (!body.title?.trim()) {
    throw createError({
      statusCode: 400,
      message: 'Goal title is required'
    })
  }

  const goal = await prisma.goal.create({
    data: {
      userId,
      owner: body.owner || 'user',
      title: body.title.trim(),
      description: body.description?.trim() || null,
      category: body.category?.trim() || null,
      status: body.status || 'active',
      priority: body.priority || null,
      targetDate: body.targetDate?.trim() || null,
      progress: body.progress !== undefined ? body.progress : 0,
      notes: body.notes?.trim() || null
    }
  })

  return { goal }
})
