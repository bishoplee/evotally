import { verifyJWT } from '~/server/utils/jwt'
import { prisma } from '~/server/utils/db'

export default defineEventHandler(async (e) => {
  const auth = getHeader(e, 'authorization') || ''
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : ''
  if (!token) throw createError({ statusCode: 401, statusMessage: 'missing token' })

  const { sub } = await verifyJWT(token)
  const q = getQuery(e)

  const owner = String(q.owner || '').trim() // 'user' or 'assistant'
  const relationship_status = String(q.relationship_status || '').trim()

  const where: any = { userId: String(sub) }
  if (owner) where.owner = owner
  if (relationship_status) where.relationship_status = relationship_status

  const relationships = await prisma.relationshipEdge.findMany({
    where,
    orderBy: [
      { relationship_status: 'asc' }, // current first
      { strength: 'desc' }, // higher strength first
      { created_at: 'desc' }
    ]
  })

  return { relationships }
})
