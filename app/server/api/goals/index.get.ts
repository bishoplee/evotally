import { verifyJWT } from '~/server/utils/jwt'
import { prisma } from '~/server/utils/db'

export default defineEventHandler(async (e) => {
  const auth = getHeader(e, 'authorization') || ''
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : ''
  if (!token) throw createError({ statusCode: 401, statusMessage: 'missing token' })

  const { sub } = await verifyJWT(token)
  const q = getQuery(e)

  const owner = String(q.owner || '').trim() // 'user' or 'assistant'
  const status = String(q.status || '').trim()
  const category = String(q.category || '').trim()

  const where: any = { userId: String(sub) }
  if (owner) where.owner = owner
  if (status) where.status = status
  if (category) where.category = category

  const goals = await prisma.goal.findMany({
    where,
    orderBy: [
      { status: 'asc' }, // active first
      { priority: 'desc' }, // high priority first
      { created_at: 'desc' }
    ]
  })

  return { goals }
})
