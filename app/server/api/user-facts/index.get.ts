import { defineEventHandler, createError, getQuery } from 'h3'
import { prisma } from '~/server/utils/db'

export default defineEventHandler(async (event) => {
  const userId = event.context.user?.id as string | undefined
  if (!userId) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const q = getQuery(event) as any
  const where: any = { userId }

  // Filter by category if provided
  if (q.category) {
    where.category = String(q.category)
  }

  // Search across factKey and factValue
  if (q.q) {
    const search = String(q.q)
    where.OR = [
      { factKey: { contains: search, mode: 'insensitive' } },
      { factValue: { contains: search, mode: 'insensitive' } },
      { category: { contains: search, mode: 'insensitive' } },
    ]
  }

  // Return all user facts, newest first
  const userFacts = await prisma.userFact.findMany({
    where,
    orderBy: { createdAt: 'desc' }
  })

  return userFacts
})
