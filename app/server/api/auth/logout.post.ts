import { prisma } from '~/server/utils/db'
import { createHash } from 'crypto'

export default defineEventHandler(async (e) => {
  const refresh = getCookie(e, 'refresh_token')
  if (refresh) {
    const token_hash = createHash('sha256').update(refresh).digest('hex')
    await prisma.refreshToken.updateMany({ where: { token_hash }, data: { revoked_at: new Date() } })
    setCookie(e, 'refresh_token', '', { httpOnly: true, secure: true, sameSite: 'lax', path: '/', maxAge: 0 })
  }
  return { ok: true }
})

