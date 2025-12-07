import { verifyBearerHeader } from '~/server/utils/jwt'
import { prisma } from '~/server/utils/db'

export default defineEventHandler(async (e) => {
  const auth = getHeader(e, 'authorization')
  const { sub } = await verifyBearerHeader(auth)

  const events = await prisma.event.findMany({
    where: { userId: String(sub) },
    orderBy: { startDate: 'asc' }
  })

  return { events }
})
