import { verifyBearer } from '~/server/utils/jwt'
import { prisma } from '~/server/utils/db'

export default defineEventHandler(async (e) => {
  const auth = getHeader(e, 'authorization') || ''
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : ''
  if (!token) throw createError({ statusCode: 401, statusMessage: 'missing token' })
  const { sub } = await verifyBearer(token)
  const id = getRouterParam(e, 'id')!

  const fact = await prisma.fact.findFirst({ where: { id, userId: String(sub) } })
  if (!fact) throw createError({ statusCode: 404, statusMessage: 'not found' })

  // best effort: delete from Qdrant
  try {
    if (fact.qdrant_point_id) {
      await $fetch(`${useRuntimeConfig().qdrantUrl}/collections/identity/points/delete`, {
        method: 'POST',
        body: { points: [fact.qdrant_point_id] },
        headers: { 'Content-Type': 'application/json' }
      })
    }
  } catch {}

  await prisma.fact.delete({ where: { id } })
  return { ok: true }
})

