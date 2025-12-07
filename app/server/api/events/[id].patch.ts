import { verifyBearerHeader } from '~/server/utils/jwt'
import { prisma } from '~/server/utils/db'

export default defineEventHandler(async (e) => {
  const auth = getHeader(e, 'authorization')
  const { sub } = await verifyBearerHeader(auth)

  const id = getRouterParam(e, 'id')
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Event ID is required' })
  }

  const body = await readBody<{
    title?: string
    description?: string
    startDate?: string
    endDate?: string
    isRecurring?: boolean
  }>(e)

  // Verify the event belongs to the user
  const existingEvent = await prisma.event.findUnique({
    where: { id },
    select: { userId: true }
  })

  if (!existingEvent) {
    throw createError({ statusCode: 404, statusMessage: 'Event not found' })
  }

  if (existingEvent.userId !== String(sub)) {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
  }

  const event = await prisma.event.update({
    where: { id },
    data: {
      ...(body.title !== undefined && { title: body.title.trim() }),
      ...(body.description !== undefined && { description: body.description?.trim() || null }),
      ...(body.startDate !== undefined && { startDate: body.startDate.trim() }),
      ...(body.endDate !== undefined && { endDate: body.endDate?.trim() || null }),
      ...(body.isRecurring !== undefined && { isRecurring: body.isRecurring }),
    }
  })

  return { event }
})
