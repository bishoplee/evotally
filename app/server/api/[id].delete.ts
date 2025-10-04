import { prisma } from '~/server/utils/db'
import { verifyBearer } from '~/server/utils/jwt'

export default defineEventHandler( async (event) => {
  const { sub } = await verifyBearer(getHeader(event,'authorization') || '')
  const id = getRouterParam(event,'id')!
  const rec = await prisma.fact.findFirst({ where: { id, userId: String(sub) } })
  if (!rec) throw createError({ statusCode: 404, statusMessage: 'not found' })
  // Optional: delete from Qdrant if you tracked point_id
  try {
    if (rec.qdrant_point_id) {
      const { public: p } = useRuntimeConfig()
      await $fetch(`${p.qdrantUrl}/collections/identity/points/delete`, {
        method: 'POST', body: { points: [rec.qdrant_point_id] }
      })
    }
  } catch {}
  await prisma.fact.delete({ where: { id } })
  return { ok: true }
})

