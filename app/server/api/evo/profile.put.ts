import { PrismaClient } from '@prisma/client'
import { AnswersSchema, computeScoreAndProgress } from '../../utils/evoProfile'

const prisma = new PrismaClient()

export default defineEventHandler(async (event) => {
  // @ts-ignore
  const userId = event.context.user?.id
  if (!userId) throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })

  const body = await readBody(event)
  const parsed = AnswersSchema.safeParse(body)
  if (!parsed.success) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid payload' })
  }

  const current = await prisma.evoProfile.findUnique({ where: { userId } })
  const mergedSections = { ...(current?.sections || {}), ...(parsed.data.sections || {}) }

  const { score } = computeScoreAndProgress(mergedSections as any)

  const updated = await prisma.evoProfile.upsert({
    where: { userId },
    update: { sections: mergedSections, score },
    create: { userId, sections: mergedSections, score }
  })

  const { progressPct } = computeScoreAndProgress(updated.sections as any)

  return {
    ok: true,
    profile: {
      userId,
      sections: updated.sections,
      score: updated.score,
      progressPct,
      updatedAt: updated.updatedAt,
    }
  }
})
