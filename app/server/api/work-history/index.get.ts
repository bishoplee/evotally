import { defineEventHandler, getQuery } from 'h3'
import { verifyBearerHeader } from '~/server/utils/jwt'
import { prisma } from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  const auth = event.node.req.headers.authorization || ''
  const { sub } = await verifyBearerHeader(auth)
  const userId = String(sub)

  const query = getQuery(event)
  const owner = query.owner as string | undefined

  const where: any = { userId }
  if (owner) {
    where.owner = owner
  }

  const workHistory = await prisma.workHistory.findMany({
    where,
    orderBy: [
      { isCurrent: 'desc' },
      { startDate: 'desc' }
    ]
  })

  return { workHistory }
})
