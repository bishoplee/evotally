import { verifyBearerHeader } from '~/server/utils/jwt'
import { prisma } from '~/server/utils/db'

/**
 * Revoke Alexa account linking
 *
 * Deletes all refresh tokens and unused authorization codes for the user,
 * effectively unlinking all Alexa devices.
 */
export default defineEventHandler(async (e) => {
  const auth = getHeader(e, 'authorization')
  const { sub } = await verifyBearerHeader(auth)
  const userId = String(sub)

  // Delete all refresh tokens for this user
  const deletedTokens = await prisma.alexaRefreshToken.deleteMany({
    where: { userId }
  })

  // Delete all unused authorization codes for this user
  const deletedCodes = await prisma.alexaAuthCode.deleteMany({
    where: { userId }
  })

  return {
    success: true,
    message: 'Alexa access revoked successfully',
    deletedTokens: deletedTokens.count,
    deletedCodes: deletedCodes.count
  }
})
