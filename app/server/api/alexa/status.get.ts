import { verifyBearerHeader } from '~/server/utils/jwt'
import { prisma } from '~/server/utils/db'

/**
 * Get Alexa account linking status for the authenticated user
 *
 * Returns information about whether the user has linked their Alexa account,
 * when it was linked, and how many active refresh tokens they have.
 */
export default defineEventHandler(async (e) => {
  const auth = getHeader(e, 'authorization')
  const { sub } = await verifyBearerHeader(auth)
  const userId = String(sub)

  // Check for active refresh tokens
  const activeTokens = await prisma.alexaRefreshToken.findMany({
    where: {
      userId,
      expiresAt: {
        gte: new Date() // Not expired
      }
    },
    orderBy: {
      createdAt: 'desc'
    },
    select: {
      id: true,
      createdAt: true,
      expiresAt: true,
      clientId: true
    }
  })

  // Get linked Alexa identities (from actual skill usage)
  const alexaIdentities = await prisma.externalIdentity.findMany({
    where: {
      userId,
      provider: 'alexa'
    },
    orderBy: {
      lastSeenAt: 'desc'
    },
    select: {
      id: true,
      providerUserId: true,
      deviceId: true,
      lastSeenAt: true,
      createdAt: true
    }
  })

  const isLinked = activeTokens.length > 0
  const mostRecent = activeTokens[0]

  return {
    isLinked,
    linkedAt: mostRecent?.createdAt || null,
    expiresAt: mostRecent?.expiresAt || null,
    activeConnections: activeTokens.length,
    tokens: activeTokens.map(t => ({
      id: t.id,
      linkedAt: t.createdAt,
      expiresAt: t.expiresAt,
      clientId: t.clientId
    })),
    // Alexa accounts that have actually used the skill
    alexaAccounts: alexaIdentities.map(a => ({
      id: a.id,
      alexaUserId: a.providerUserId,
      deviceId: a.deviceId,
      lastUsed: a.lastSeenAt,
      linkedAt: a.createdAt
    }))
  }
})
