import { verifyBearerHeader } from '~/server/utils/jwt'
import { prisma } from '~/server/utils/db'

export default defineEventHandler(async (e) => {
  const auth = getHeader(e, 'authorization')
  const { sub } = await verifyBearerHeader(auth)

  const body = await readBody<{
    title: string
    description?: string
    startDate: string
    endDate?: string
    isRecurring?: boolean
  }>(e)

  if (!body.title?.trim()) {
    throw createError({ statusCode: 400, statusMessage: 'Title is required' })
  }

  if (!body.startDate?.trim()) {
    throw createError({ statusCode: 400, statusMessage: 'Start date is required' })
  }

  const event = await prisma.event.create({
    data: {
      userId: String(sub),
      title: body.title.trim(),
      description: body.description?.trim() || null,
      startDate: body.startDate.trim(),
      endDate: body.endDate?.trim() || null,
      isRecurring: body.isRecurring || false,
    }
  })

  return { event }
})
