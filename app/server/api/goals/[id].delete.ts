import { verifyBearerHeader } from '~/server/utils/jwt'
import { prisma } from '~/server/utils/db'

export default defineEventHandler(async (e) => {
  const auth = getHeader(e, 'authorization')
  const { sub } = await verifyBearerHeader(auth)
  const id = getRouterParam(e, 'id')
  if (!id) throw createError({ statusCode: 400, statusMessage: 'id required' })

  // Verify ownership
  const existing = await prisma.goal.findUnique({ where: { id } })
  if (!existing || existing.userId !== String(sub)) {
    throw createError({ statusCode: 404, statusMessage: 'goal not found' })
  }

  await prisma.goal.delete({ where: { id } })

  return { ok: true }
})
