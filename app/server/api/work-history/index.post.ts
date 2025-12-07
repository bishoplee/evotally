import { defineEventHandler, readBody } from 'h3'
import { verifyBearerHeader } from '~/server/utils/jwt'
import { prisma } from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  const auth = event.node.req.headers.authorization || ''
  const { sub } = await verifyBearerHeader(auth)
  const userId = String(sub)

  const body = await readBody(event)

  // Validate required fields
  if (!body.company?.trim()) {
    throw createError({
      statusCode: 400,
      message: 'Company name is required'
    })
  }

  if (!body.position?.trim()) {
    throw createError({
      statusCode: 400,
      message: 'Position/title is required'
    })
  }

  if (!body.startDate?.trim()) {
    throw createError({
      statusCode: 400,
      message: 'Start date is required'
    })
  }

  const workHistory = await prisma.workHistory.create({
    data: {
      userId,
      owner: body.owner || 'user',
      company: body.company.trim(),
      position: body.position.trim(),
      startDate: body.startDate.trim(),
      endDate: body.endDate?.trim() || null,
      isCurrent: body.isCurrent || false,
      description: body.description?.trim() || null,
      location: body.location?.trim() || null
    }
  })

  return { workHistory }
})
