import { prisma } from '~/server/utils/db'
import { verifyBearer } from '~/server/utils/jwt'

export default defineEventHandler( async (event) => {
  const { sub } = await verifyBearer(getHeader(event,'authorization') || '')
  const id = getRouterParam(event, 'id')!
  const rec = await prisma.fact.findFirst({ where: { id, userId: String(sub) } })
  if (!rec) throw createError({ statusCode: 404, statusMessage: 'not found' })
  const b = await readBody<any>(event)
  const updated = await prisma.fact.update({
    where: { id }, data: {
      type:  b.type ?? rec.type,
      key:   b.key === undefined ? rec.key : (b.key || null),
      value: b.value === undefined ? rec.value : (b.value || null),
      text:  b.text?.trim() || rec.text
    }
  })
  return updated
})

