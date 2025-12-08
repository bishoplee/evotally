import { verifyJWT } from '~/server/utils/jwt'
import { prisma } from '~/server/utils/db'

export default defineEventHandler(async (e) => {
  const auth = getHeader(e, 'authorization') || ''
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : ''
  if (!token) throw createError({ statusCode: 401, statusMessage: 'missing token' })

  const { sub } = await verifyJWT(token)
  const id = getRouterParam(e, 'id')
  if (!id) throw createError({ statusCode: 400, statusMessage: 'id required' })

  const body = await readBody<{
    title?: string
    description?: string | null
    category?: string | null
    status?: string
    priority?: number
    timeframe?: string | null
    targetDate?: string | null
  }>(e)

  // Verify ownership
  const existing = await prisma.goal.findUnique({ where: { id } })
  if (!existing || existing.userId !== String(sub)) {
    throw createError({ statusCode: 404, statusMessage: 'goal not found' })
  }

  const data: any = {}
  if (body.title !== undefined) data.title = body.title.trim()
  if (body.description !== undefined) data.description = body.description?.trim() || null
  if (body.category !== undefined) data.category = body.category || null
  if (body.status !== undefined) data.status = body.status
  if (body.priority !== undefined) data.priority = body.priority
  if (body.timeframe !== undefined) data.timeframe = body.timeframe?.trim() || null
  if (body.targetDate !== undefined) data.targetDate = body.targetDate?.trim() || null

  const goal = await prisma.goal.update({
    where: { id },
    data
  })

  return { goal }
})
