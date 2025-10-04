import { prisma } from '~/server/utils/db'
import { verifyBearer } from '~/server/utils/jwt'

export default defineEventHandler( async (event) => {
  const { sub } = await verifyBearer(getHeader(event,'authorization') || '')
  const q = getQuery(event) as any
  const where: any = { userId: String(sub) }
  if (q.type) where.type = String(q.type)
  if (q.q) where.OR = [
    { text:  { contains: String(q.q), mode: 'insensitive' } },
    { key:   { contains: String(q.q), mode: 'insensitive' } },
    { value: { contains: String(q.q), mode: 'insensitive' } },
  ]
  return await prisma.fact.findMany({ where, orderBy: { created_at: 'desc' } })
})

