// server/api/evo/profile/[key].patch.ts
import { createError, readBody, readRawBody, getRequestHeader } from 'h3'
import { prisma } from '~/server/utils/db'
import { computeScoreAndProgress } from '~/server/utils/evoProfile'

function isRecord(v:any): v is Record<string,string> {
  return v && typeof v === 'object' && !Array.isArray(v)
}

export default defineEventHandler(async (event) => {
  // @ts-ignore injected by server auth middleware
  const userId: string | undefined = event.context.user?.id
  if (!userId) throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })

  const key = getRouterParam(event, 'key')
  if (!key) throw createError({ statusCode: 400, statusMessage: 'missing section key' })

  // --- Parse body flexibly
  let values: Record<string,string> | null = null
  const json = await readBody<any>(event).catch(() => null)

  if (json && typeof json === 'object') {
    // Accept {values:{...}} OR {answers:{...}} OR a bare object
    const candidate = json.values ?? json.answers ?? json
    if (isRecord(candidate)) values = candidate
  }

  // Fallback for urlencoded forms
  if (!values) {
    const ctype = getRequestHeader(event, 'content-type') || ''
    if (ctype.includes('application/x-www-form-urlencoded')) {
      const raw = (await readRawBody(event).catch(() => null)) || ''
      const params = new URLSearchParams(String(raw))
      const obj: Record<string,string> = {}
      for (const [k, v] of params.entries()) obj[k] = v
      if (Object.keys(obj).length) values = obj
    }
  }

  if (!values || !Object.keys(values).length) {
    throw createError({ statusCode: 400, statusMessage: 'invalid body' })
  }

  // Ensure profile
  let profile = await prisma.evoProfile.findUnique({ where: { userId } })
  if (!profile) {
    profile = await prisma.evoProfile.create({ data: { userId, sections: {} } })
  }

  // Merge section
  const prev = (profile.sections as Record<string, Record<string,string>>) || {}
  const merged = { ...prev, [key]: { ...(prev[key] || {}), ...values } }

  const updated = await prisma.evoProfile.update({
    where: { userId },
    data: { sections: merged },
  })

  const { score, progressPct } = computeScoreAndProgress(updated.sections as any)
  return { ok: true, score, progressPct }
})
