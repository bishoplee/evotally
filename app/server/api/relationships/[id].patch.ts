import { verifyBearerHeader } from '~/server/utils/jwt'
import { prisma } from '~/server/utils/db'

export default defineEventHandler(async (e) => {
  const auth = getHeader(e, 'authorization')
  const { sub } = await verifyBearerHeader(auth)
  const id = getRouterParam(e, 'id')
  if (!id) throw createError({ statusCode: 400, statusMessage: 'id required' })

  const body = await readBody<{
    from_type?: string
    from_owner?: string
    from_name?: string | null
    from_relation?: string | null
    to_type?: string
    to_owner?: string
    to_name?: string | null
    to_relation?: string | null
    relation_type?: string
    direction?: string
    relationship_status?: string
    strength?: number
    tags?: string[]
    description?: string | null
    confidence?: number
  }>(e)

  // Verify ownership
  const existing = await prisma.relationshipEdge.findUnique({ where: { id } })
  if (!existing || existing.userId !== String(sub)) {
    throw createError({ statusCode: 404, statusMessage: 'relationship not found' })
  }

  const data: any = {}
  if (body.from_type !== undefined) data.from_type = body.from_type
  if (body.from_owner !== undefined) data.from_owner = body.from_owner
  if (body.from_name !== undefined) data.from_name = body.from_name
  if (body.from_relation !== undefined) data.from_relation = body.from_relation
  if (body.to_type !== undefined) data.to_type = body.to_type
  if (body.to_owner !== undefined) data.to_owner = body.to_owner
  if (body.to_name !== undefined) data.to_name = body.to_name
  if (body.to_relation !== undefined) data.to_relation = body.to_relation
  if (body.relation_type !== undefined) data.relation_type = body.relation_type
  if (body.direction !== undefined) data.direction = body.direction
  if (body.relationship_status !== undefined) data.relationship_status = body.relationship_status
  if (body.strength !== undefined) data.strength = body.strength
  if (body.tags !== undefined) data.tags = body.tags
  if (body.description !== undefined) data.description = body.description
  if (body.confidence !== undefined) data.confidence = body.confidence

  const relationship = await prisma.relationshipEdge.update({
    where: { id },
    data
  })

  return { relationship }
})
