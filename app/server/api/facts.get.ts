import { prisma } from '~/server/utils/db'
import { verifyBearer } from '~/server/utils/jwt'
import { getHeader, getQuery, createError } from 'h3'

export default defineEventHandler(async (event) => {
  const authHeader = getHeader(event, 'authorization')

  if (!authHeader) {
    // No token at all -> not authed
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  let sub: string
  try {
    const payload = await verifyBearer(authHeader)
    sub = String(payload.sub)
  } catch (err: any) {
    console.warn('[facts.get] invalid JWT:', err?.message || err)
    throw createError({ statusCode: 401, statusMessage: 'Invalid token' })
  }

  const q = getQuery(event) as any
  const where: any = { userId: sub }

  if (q.type) where.type = String(q.type)
  if (q.q) {
    where.OR = [
      { text:  { contains: String(q.q), mode: 'insensitive' } },
      { key:   { contains: String(q.q), mode: 'insensitive' } },
      { value: { contains: String(q.q), mode: 'insensitive' } },
    ]
  }

  return await prisma.fact.findMany({
    where,
    orderBy: { created_at: 'desc' }
  })
})


