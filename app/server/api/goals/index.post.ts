import { verifyJWT } from '~/server/utils/jwt'
import { prisma } from '~/server/utils/db'

export default defineEventHandler(async (e) => {
  const auth = getHeader(e, 'authorization') || ''
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : ''
  if (!token) throw createError({ statusCode: 401, statusMessage: 'missing token' })

  const { sub } = await verifyJWT(token)
  const body = await readBody<{
    owner?: string
    title: string
    description?: string | null
    category?: string | null
    status?: string
    priority?: number
    timeframe?: string | null
    targetDate?: string | null
  }>(e)

  if (!body?.title?.trim()) {
    throw createError({ statusCode: 400, statusMessage: 'title required' })
  }

  const goal = await prisma.goal.create({
    data: {
      userId: String(sub),
      owner: body.owner || 'user',
      title: body.title.trim(),
      description: body.description?.trim() || null,
      category: body.category || null,
      status: body.status || 'active',
      priority: body.priority !== undefined ? body.priority : 5,
      timeframe: body.timeframe?.trim() || null,
      targetDate: body.targetDate?.trim() || null,
    }
  })

  return { goal }
})
