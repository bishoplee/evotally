import { verifyBearerHeader } from '~/server/utils/jwt'
import { prisma } from '~/server/utils/db'

export default defineEventHandler(async (e) => {
  const auth = getHeader(e, 'authorization')
  const { sub } = await verifyBearerHeader(auth)

  const userId = String(sub)

  try {
    // Delete all user memory in a transaction
    await prisma.$transaction(async (tx) => {
      // Delete all turns (conversation messages) for user's sessions
      await tx.turn.deleteMany({
        where: {
          session: {
            userId
          }
        }
      })

      // Delete all sessions
      await tx.session.deleteMany({
        where: { userId }
      })

      // Delete all facts
      await tx.fact.deleteMany({
        where: { userId }
      })

      // Delete user facts
      await tx.userFact.deleteMany({
        where: { userId }
      })

      // Delete user summary
      await tx.userSummary.deleteMany({
        where: { userId }
      })

      // Delete fact collection sessions
      await tx.factCollectionSession.deleteMany({
        where: { userId }
      })

      // Delete question history
      await tx.questionHistory.deleteMany({
        where: { userId }
      })
    })

    return {
      ok: true,
      message: 'All conversations and stored memory have been deleted.',
      deletedCount: {
        sessions: 'all',
        turns: 'all',
        facts: 'all',
        userFacts: 'all',
        summaries: 'all'
      }
    }
  } catch (error: any) {
    console.error('Failed to delete user memory:', error)
    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Failed to delete memory'
    })
  }
})
