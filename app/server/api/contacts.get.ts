import { defineEventHandler, getQuery, createError } from 'h3'
import { prisma } from '~/server/utils/db'

export default defineEventHandler(async (event) => {
  const u = event.context.user
  if (!u?.id) throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  const userId = String(u.id)
  const { q = '' } = getQuery(event)
  const query = String(q || '').trim()

  const items = await prisma.contact.findMany({
    where: {
      userId,
      deleted_at: null,
      OR: query ? [
        { name: { contains: query, mode: 'insensitive' } },
        { email: { contains: query, mode: 'insensitive' } },
        { phone: { contains: query, mode: 'insensitive' } },
      ] : undefined,
    },
    orderBy: [{ name: 'asc' }],
    take: 200,
  })

  return { items }
})
