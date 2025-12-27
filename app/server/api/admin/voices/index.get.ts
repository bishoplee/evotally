import { defineEventHandler, getQuery } from 'h3'
import { prisma } from '~/server/utils/db'
import { verifyBearerHeader } from '~/server/utils/jwt'
import { getHeader, createError } from 'h3'

/**
 * Get all provider voices (admin endpoint)
 *
 * Query params:
 * - provider: Filter by provider
 * - isActive: Filter by active status
 */
export default defineEventHandler(async (e) => {
  // Verify authentication
  const auth = getHeader(e, 'authorization')
  const { sub } = await verifyBearerHeader(auth)

  // TODO: Add admin check here
  // For now, any authenticated user can access
  // In production, add: if (!user.isAdmin) throw createError(...)

  const q = getQuery(e)
  const provider = q.provider ? String(q.provider) : undefined
  const isActive = q.isActive !== undefined ? q.isActive === 'true' : undefined

  const where: any = {}
  if (provider) where.provider = provider
  if (isActive !== undefined) where.isActive = isActive

  const voices = await prisma.providerVoice.findMany({
    where,
    orderBy: [
      { provider: 'asc' },
      { name: 'asc' }
    ]
  })

  return {
    voices,
    total: voices.length
  }
})
