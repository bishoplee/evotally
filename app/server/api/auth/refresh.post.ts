import { prisma } from '~/server/utils/db'
import { signAccess } from '~/server/utils/jwt'
import { createHash } from 'crypto'

export default defineEventHandler(async (e) => {
  const refresh = getCookie(e, 'refresh_token')
  if (!refresh) throw createError({ statusCode: 401, statusMessage: 'no refresh' })
  const token_hash = createHash('sha256').update(refresh).digest('hex')
  const rec = await prisma.refreshToken.findFirst({ where: { token_hash, revoked_at: null } })
  if (!rec || rec.expires_at < new Date()) throw createError({ statusCode: 401, statusMessage: 'expired' })
  const body = await readBody<{ persona?: string }>(e).catch(() => ({} as any))
  const user = await prisma.user.findUnique({ where: { id: rec.userId } })
  if (!user) throw createError({ statusCode: 401, statusMessage: 'invalid user' })
  const access_token = await signAccess(user.id, (body?.persona || user.persona_default))
  return { access_token, expires_in: Number(useRuntimeConfig().accessTtl) }
})

