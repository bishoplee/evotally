import { createError } from 'h3'
import { prisma } from '../../utils/db'
import { EVO_REGISTRY, computeScoreAndProgress } from '../../utils/evoProfile'

export default defineEventHandler(async (event) => {
  const userId: string | undefined = event.context.user?.id
  //no tenent id
  if (!userId) throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })

  let user = await prisma.user.findUnique({ where: { id: userId } })

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
    user: {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        birthday: user.birthday,
        timezone: user.timezone,
        city: user.city,
        region: user.region,
        country: user.country,
        currentCity: user.currentCity,
        currentRegion: user.currentRegion,
        currentCountry: user.currentCountry,
        tenantId: (user as any).tenantId ?? '',
        persona: user.persona_default
    },
    registry: EVO_REGISTRY
  }
})
