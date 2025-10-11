import { createError } from 'h3'
import { prisma } from '../../utils/db'
import { EVO_REGISTRY, computeScoreAndProgress } from '../../utils/evoProfile'

export default defineEventHandler(async (event) => {
  const userId: string | undefined = event.context.user?.id
  //no tenent id
  if (!userId) throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })

  let profile = await prisma.evoProfile.findUnique({ where: { userId } })
  if (!profile) {
    profile = await prisma.evoProfile.create({ data: { userId, sections: {} } })
  }

  const sections = (profile.sections as any) || {}
  const { score, progressPct } = computeScoreAndProgress(sections)

  return {
    ok: true,
    profile: {
      userId,
      sections,
      score,
      progressPct,
      updatedAt: profile.updatedAt
    },
    registry: EVO_REGISTRY
  }
})
