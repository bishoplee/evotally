import { verifyJWT } from '~/server/utils/jwt'
import { prisma } from '~/server/utils/db'

export default defineEventHandler(async (e) => {
  const auth = getHeader(e, 'authorization') || ''
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : ''
  if (!token) throw createError({ statusCode: 401, statusMessage: 'missing token' })

  const { sub } = await verifyJWT(token)
  const id = getRouterParam(e, 'id')
  if (!id) throw createError({ statusCode: 400, statusMessage: 'id required' })

  // Verify ownership
  const existing = await prisma.relationshipEdge.findUnique({ where: { id } })
  if (!existing || existing.userId !== String(sub)) {
    throw createError({ statusCode: 404, statusMessage: 'relationship not found' })
  }

  await prisma.relationshipEdge.delete({ where: { id } })

  return { ok: true }
})
