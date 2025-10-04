import { prisma } from '~/server/utils/db'
export default defineEventHandler(async () => {
  const one = await prisma.$queryRawUnsafe('SELECT 1 as ok')
  return { ok: true, result: one }
})
