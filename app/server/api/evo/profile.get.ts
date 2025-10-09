import { PrismaClient } from '@prisma/client'
import { computeScoreAndProgress, EVO_REGISTRY } from '../../utils/evoProfile'

const prisma = new PrismaClient()

export default defineEventHandler(async (event) => {
  // @ts-ignore
  const userId = event.context.user?.id
  if (!userId) throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })

  let profile = await prisma.evoProfile.findUnique({ where: { userId } })
  if (!profile) {
    profile = await prisma.evoProfile.create({
      data: { userId, sections: {} }
    })
  }

  const { score, progressPct } = computeScoreAndProgress(profile.sections as any)

  return {
    ok: true,
    profile: {
      userId,
      sections: profile.sections || {},
      score,
      progressPct,
      updatedAt: profile.updatedAt,
    },
    registry: EVO_REGISTRY // front-end uses this to render questions
  }
})
