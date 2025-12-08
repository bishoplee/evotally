import { defineEventHandler, getQuery } from 'h3'
import { verifyBearerHeader } from '~/server/utils/jwt'
import { prisma } from '~/server/utils/db'

export default defineEventHandler(async (event) => {
  const auth = event.node.req.headers.authorization || ''
  const { sub } = await verifyBearerHeader(auth)
  const userId = String(sub)

  const query = getQuery(event)
  const owner = query.owner as string | undefined
  const status = query.status as string | undefined

  const where: any = { userId }
  if (owner) {
    where.owner = owner
  }
  if (status) {
    where.status = status
  }

  const goals = await prisma.goal.findMany({
    where,
    orderBy: [
      { status: 'asc' },
      { priority: 'desc' },
      { created_at: 'desc' }
    ]
  })

  return { goals }
})
