import { prisma } from './db'

/**
 * Links a user to their Alexa account in the ExternalIdentity table
 *
 * This should be called when receiving requests from Alexa skill handlers
 * that include the Alexa user ID.
 *
 * @param userId - Our internal user ID
 * @param alexaUserId - The Alexa user ID (e.g., amzn1.ask.account.XXX)
 * @param deviceId - Optional Alexa device ID
 */
export async function linkAlexaIdentity(
  userId: string,
  alexaUserId: string,
  deviceId?: string
) {
  // Try to find existing identity
  const existing = await prisma.externalIdentity.findUnique({
    where: {
      provider_providerUserId_unique: {
        provider: 'alexa',
        providerUserId: alexaUserId
      }
    }
  })

  if (existing) {
    // Update last seen and device ID if provided
    await prisma.externalIdentity.update({
      where: { id: existing.id },
      data: {
        lastSeenAt: new Date(),
        deviceId: deviceId || existing.deviceId
      }
    })
  } else {
    // Create new identity link
    await prisma.externalIdentity.create({
      data: {
        provider: 'alexa',
        providerUserId: alexaUserId,
        deviceId: deviceId,
        userId: userId,
        lastSeenAt: new Date()
      }
    })
  }
}

/**
 * Get all Alexa identities for a user
 */
export async function getUserAlexaIdentities(userId: string) {
  return await prisma.externalIdentity.findMany({
    where: {
      userId: userId,
      provider: 'alexa'
    },
    orderBy: {
      lastSeenAt: 'desc'
    }
  })
}

/**
 * Find user by Alexa ID
 */
export async function findUserByAlexaId(alexaUserId: string) {
  const identity = await prisma.externalIdentity.findUnique({
    where: {
      provider_providerUserId_unique: {
        provider: 'alexa',
        providerUserId: alexaUserId
      }
    },
    include: {
      user: true
    }
  })

  return identity?.user || null
}
