import { defineEventHandler, readBody, getRouterParam } from 'h3'
import { verifyBearerHeader } from '~/server/utils/jwt'
import { prisma } from '~/server/utils/db'

export default defineEventHandler(async (event) => {
  const auth = event.node.req.headers.authorization || ''
  const { sub } = await verifyBearerHeader(auth)
  const userId = String(sub)

  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({
      statusCode: 400,
      message: 'Entry ID is required'
    })
  }

  // Check ownership
  const existing = await prisma.workOrSchool.findUnique({
    where: { id }
  })

  if (!existing) {
    throw createError({
      statusCode: 404,
      message: 'Entry not found'
    })
  }

  if (existing.userId !== userId) {
    throw createError({
      statusCode: 403,
      message: 'Forbidden'
    })
  }

  const body = await readBody(event)

  const workOrSchool = await prisma.workOrSchool.update({
    where: { id },
    data: {
      type: body.type || existing.type,
      organization: body.organization?.trim() || existing.organization,
      title: body.title?.trim() || existing.title,
      startDate: body.startDate?.trim() || existing.startDate,
      endDate: body.endDate?.trim() || null,
      isCurrent: body.isCurrent !== undefined ? body.isCurrent : existing.isCurrent,
      description: body.description?.trim() || null,
      location: body.location?.trim() || null,
      notes: body.notes?.trim() || null
    }
  })

  return { workOrSchool }
})
