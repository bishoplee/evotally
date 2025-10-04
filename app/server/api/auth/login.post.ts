import { prisma } from '~/server/utils/db'
import { signAccess } from '~/server/utils/jwt'
import { verify } from '~/server/utils/hash'
import { randomBytes, createHash } from 'crypto'

export default defineEventHandler(async (e) => {
  const body = await readBody<{email:string,password:string,persona?:string}>(e)
  if (!body?.email || !body?.password) throw createError({ statusCode: 400, statusMessage: 'missing creds' })
  const user = await prisma.user.findUnique({ where: { email: body.email.toLowerCase() } })
  if (!user || !(await verify(user.password_hash, body.password))) throw createError({ statusCode: 401, statusMessage: 'invalid credentials' })

  // issue refresh token (opaque string, store hash)
  const refreshRaw = randomBytes(32).toString('hex')
  const token_hash = createHash('sha256').update(refreshRaw).digest('hex')
  const now = new Date()
  const exp = new Date(now.getTime() + Number(useRuntimeConfig().refreshTtl) * 1000)
  await prisma.refreshToken.create({ data: { userId: user.id, token_hash, expires_at: exp } })

  setCookie(e, 'refresh_token', refreshRaw, { httpOnly: true, secure: true, sameSite: 'lax', path: '/', expires: exp })
  const access_token = await signAccess(user.id, body.persona || user.persona_default)
  return { access_token, expires_in: Number(useRuntimeConfig().accessTtl) }
})

