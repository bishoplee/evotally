import { defineEventHandler, getCookie, createError } from 'h3'
import { prisma } from '~/server/utils/db'
import { createHash, randomBytes } from 'node:crypto'
import { mintAccessToken, jwtCfg, setRefreshCookie } from '~/server/utils/jwt' // from your updated jwt.ts

export default defineEventHandler(async (event) => {
  // 1) Read refresh cookie
  const incoming = getCookie(event, 'refresh_token')
  if (!incoming) {
    throw createError({ statusCode: 401, statusMessage: 'no refresh' })
  }

  // 2) Validate token by hash lookup (not revoked, not expired)
  const token_hash = createHash('sha256').update(incoming).digest('hex')
  const rec = await prisma.refreshToken.findFirst({
    where: {
      token_hash,
      revoked_at: null,
      expires_at: { gt: new Date() },
    },
    include: { user: true },
  })
  if (!rec?.user) {
    throw createError({ statusCode: 401, statusMessage: 'invalid refresh' })
  }

  // (Optional) persona override via body; default to user's persona_default
  let persona = rec.user.persona_default || 'spouse'
  try {
    const body = await readBody<{ persona?: string }>(event)
    if (body?.persona) persona = body.persona
  } catch {
    // ignore body parse errors
  }

  // 3) Rotate refresh token (best practice)
  const nextPlain = randomBytes(48).toString('base64url')
  const next_hash = createHash('sha256').update(nextPlain).digest('hex')
  const { refreshTtl } = jwtCfg()
  const nextExpiresAt = new Date(Date.now() + refreshTtl * 1000)

  await prisma.$transaction([
    prisma.refreshToken.update({
      where: { id: rec.id },
      data: { revoked_at: new Date() },
    }),
    prisma.refreshToken.create({
      data: {
        userId: rec.userId,         // <-- matches your model
        token_hash: next_hash,
        expires_at: nextExpiresAt,  // created_at defaults to now
      },
    }),
  ])

  // 4) Set rotated cookie (secure=false on localhost handled in setRefreshCookie)
  setRefreshCookie(event, nextPlain, nextExpiresAt)

  // 5) Mint new access token
  const { access_token, expires_in } = await mintAccessToken(String(rec.user.id), persona)

  return { access_token, expires_in }
})
