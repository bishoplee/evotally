import { verifyBearerHeader } from '~/server/utils/jwt'
import { prisma } from '~/server/utils/db'

export default defineEventHandler(async (e) => {
  const auth = getHeader(e, 'authorization')
  const { sub } = await verifyBearerHeader(auth)
  const body = await readBody<{
    owner?: string
    from_type: string
    from_owner: string
    from_name?: string | null
    from_relation?: string | null
    to_type: string
    to_owner: string
    to_name?: string | null
    to_relation?: string | null
    relation_type: string
    direction?: string
    relationship_status?: string
    strength?: number
    tags?: string[]
    description?: string | null
    confidence?: number
  }>(e)

  if (!body?.from_type || !body?.to_type || !body?.relation_type) {
    throw createError({ statusCode: 400, statusMessage: 'from_type, to_type, and relation_type are required' })
  }

  const relationship = await prisma.relationshipEdge.create({
    data: {
      userId: String(sub),
      owner: body.owner || 'user',
      from_type: body.from_type,
      from_owner: body.from_owner,
      from_name: body.from_name || null,
      from_relation: body.from_relation || null,
      to_type: body.to_type,
      to_owner: body.to_owner,
      to_name: body.to_name || null,
      to_relation: body.to_relation || null,
      relation_type: body.relation_type,
      direction: body.direction || 'bidirectional',
      relationship_status: body.relationship_status || 'current',
      strength: body.strength !== undefined ? body.strength : 5,
      tags: body.tags || [],
      description: body.description || null,
      confidence: body.confidence !== undefined ? body.confidence : 1.0,
    }
  })

  return { relationship }
})
