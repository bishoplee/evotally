// server/api/facts.get.ts
import { defineEventHandler, createError, getQuery } from 'h3'
import { prisma } from '~/server/utils/db'

export default defineEventHandler(async (event) => {
  const userId = event.context.user?.id as string | undefined
  if (!userId) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const q = getQuery(event) as any

  const where: any = { userId }

  if (q.type) {
    where.type = String(q.type)
  }

  if (q.q) {
    const search = String(q.q)
    where.OR = [
      { text:  { contains: search, mode: 'insensitive' } },
      { key:   { contains: search, mode: 'insensitive' } },
      { value: { contains: search, mode: 'insensitive' } },
    ]
  }

  // Return all facts for this user, newest first
  const facts = await prisma.fact.findMany({
    where,
    orderBy: { created_at: 'desc' }
  })

  return facts
})
