import { verifyJWT } from '~/server/utils/jwt'
import { prisma } from '~/server/utils/db'

export default defineEventHandler(async (e) => {
  const auth = getHeader(e, 'authorization') || ''
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : ''
  if (!token) throw createError({ statusCode: 401, statusMessage: 'missing token' })
  const { sub } = await verifyJWT(token)
  const q = getQuery(e)
  const search = String(q.q || '').trim()
  const type = String(q.type || '').trim()
  const owner = String(q.owner || '').trim() // 'user' or 'assistant'

  const where:any = { userId: String(sub) }
  if (type) where.type = type
  if (owner) where.owner = owner // Filter by owner if specified
  if (search) where.OR = [
    { text: { contains: search, mode: 'insensitive' } },
    { key:  { contains: search, mode: 'insensitive' } },
    { value:{ contains: search, mode: 'insensitive' } },
  ]
  const facts = await prisma.fact.findMany({ where, orderBy: { created_at: 'desc' } })
  return facts
})

