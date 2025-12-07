import { verifyBearerHeader } from '~/server/utils/jwt'
import { prisma } from '~/server/utils/db'

export default defineEventHandler(async (e) => {
  const auth = getHeader(e, 'authorization')
  const { sub } = await verifyBearerHeader(auth)

  const id = getRouterParam(e, 'id')
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Event ID is required' })
  }

  // Verify the event belongs to the user
  const event = await prisma.event.findUnique({
    where: { id },
    select: { userId: true }
  })

  if (!event) {
    throw createError({ statusCode: 404, statusMessage: 'Event not found' })
  }

  if (event.userId !== String(sub)) {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
  }

  await prisma.event.delete({
    where: { id }
  })

  return { ok: true }
})
