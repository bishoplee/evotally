import { defineEventHandler, readBody } from 'h3'
import { verifyBearerHeader } from '~/server/utils/jwt'
import { prisma } from '~/server/utils/db'

export default defineEventHandler(async (event) => {
  const auth = event.node.req.headers.authorization || ''
  const { sub } = await verifyBearerHeader(auth)
  const userId = String(sub)

  const body = await readBody(event)

  // Validate required fields
  if (!body.type || !['work', 'school'].includes(body.type)) {
    throw createError({
      statusCode: 400,
      message: 'Type must be either "work" or "school"'
    })
  }

  if (!body.organization?.trim()) {
    throw createError({
      statusCode: 400,
      message: body.type === 'work' ? 'Company name is required' : 'School name is required'
    })
  }

  if (!body.title?.trim()) {
    throw createError({
      statusCode: 400,
      message: body.type === 'work' ? 'Position is required' : 'Degree/Program is required'
    })
  }

  if (!body.startDate?.trim()) {
    throw createError({
      statusCode: 400,
      message: 'Start date is required'
    })
  }

  const workOrSchool = await prisma.workOrSchool.create({
    data: {
      userId,
      owner: body.owner || 'user',
      type: body.type,
      organization: body.organization.trim(),
      title: body.title.trim(),
      startDate: body.startDate.trim(),
      endDate: body.endDate?.trim() || null,
      isCurrent: body.isCurrent || false,
      description: body.description?.trim() || null,
      location: body.location?.trim() || null,
      notes: body.notes?.trim() || null
    }
  })

  return { workOrSchool }
})
