import { defineEventHandler, getCookie, createError } from 'h3'
import { prisma } from '~/server/utils/db'
import { createHash, randomBytes } from 'node:crypto'
import { mintAccessToken, jwtCfg, setRefreshCookie } from '~/server/utils/jwt' // from your updated jwt.ts

export default defineEventHandler(async (event) => {
  // 1) Read refresh token from either cookie (web) or body (mobile)
  let incoming: string | undefined
  let platform = 'web'

  // Try to read from request body first (for mobile apps)
  try {
    const body = await readBody<{ refresh_token?: string; persona?: string; platform?: string }>(event)
    if (body?.refresh_token) {
      incoming = body.refresh_token
      platform = body.platform || 'mobile'
    }
  } catch {
    // Body parsing failed, try cookie instead
  }

  // Fallback to cookie (for web apps)
  if (!incoming) {
    incoming = getCookie(event, 'refresh_token')
    platform = 'web'
  }

  if (!incoming) {
    throw createError({ statusCode: 401, statusMessage: 'No refresh token provided' })
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
    throw createError({ statusCode: 401, statusMessage: 'Invalid or expired refresh token' })
  }

  // Check if guest user
  if (rec.user.is_guest) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Guest accounts cannot refresh tokens'
    })
  }

  // Get persona from body or use default
  let persona = rec.user.persona_default || 'spouse'
  try {
    const body = await readBody<{ persona?: string }>(event)
    if (body?.persona) persona = body.persona
  } catch {
    // ignore body parse errors
  }

  // 3) Rotate refresh token (security best practice)
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
        userId: rec.userId,
        token_hash: next_hash,
        expires_at: nextExpiresAt,
      },
    }),
  ])

  // 4) Set cookie for web clients only
  if (platform === 'web') {
    setRefreshCookie(event, nextPlain, nextExpiresAt)
  }

  // 5) Mint new access token
  const { access_token, expires_in } = await mintAccessToken(String(rec.user.id), persona)

  // Return tokens (include refresh_token for mobile apps)
  return {
    access_token,
    expires_in,
    refresh_token: nextPlain, // Mobile apps need this
    user: {
      id: rec.user.id,
      email: rec.user.email,
      first_name: rec.user.first_name,
      last_name: rec.user.last_name,
      display_name: rec.user.display_name,
      is_guest: rec.user.is_guest
    }
  }
})
