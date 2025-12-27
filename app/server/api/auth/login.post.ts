import { defineEventHandler, readBody, createError, setCookie } from 'h3'
import { prisma } from '~/server/utils/db'
import { createHash, randomBytes } from 'node:crypto'
import { mintAccessToken, jwtCfg, setRefreshCookie } from '~/server/utils/jwt'
import bcrypt from 'bcryptjs'

async function checkPassword(input: string, stored?: string | null) {
  if (!stored) return false
  // bcrypt hash usually starts with $2a/$2b/$2y
  if (/^\$2[aby]\$/.test(stored)) {
    try { return await bcrypt.compare(input, stored) } catch { return false }
  }
  // Fallback: accept plain text (for legacy/dev seeds only)
  return input === stored
}

export default defineEventHandler(async (event) => {
  const body = await readBody<{
    email?: string
    password?: string
    persona?: string
    deviceId?: string // Optional: for tracking mobile devices
    platform?: string // Optional: 'web' | 'ios' | 'android'
  }>(event)

  const email = (body?.email || '').trim().toLowerCase()
  const password = body?.password || ''
  const persona = body?.persona || 'spouse'
  const platform = body?.platform || 'web'

  if (!email || !password) {
    throw createError({ statusCode: 400, statusMessage: 'Missing email or password' })
  }

  // Case-insensitive email lookup
  const user = await prisma.user.findFirst({
    where: { email: { equals: email, mode: 'insensitive' } },
  })

  if (!user) throw createError({ statusCode: 401, statusMessage: 'Invalid credentials' })

  // Check if guest user trying to log in
  if (user.is_guest) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Guest accounts cannot log in. Please create a full account.'
    })
  }

  // Try common password columns
  const storedHash =
    (user as any).password_hash ??
    (user as any).passwordHash ??
    (user as any).password ??
    null

  const ok = await checkPassword(password, storedHash)
  if (!ok) throw createError({ statusCode: 401, statusMessage: 'Invalid credentials' })

  // Mint access token
  const { access_token, expires_in } = await mintAccessToken(String(user.id), persona)

  // Create & store a refresh token
  const plainRefresh = randomBytes(48).toString('base64url')
  const token_hash = createHash('sha256').update(plainRefresh).digest('hex')
  const { refreshTtl } = jwtCfg()
  const expires_at = new Date(Date.now() + refreshTtl * 1000)

  await prisma.refreshToken.create({
    data: {
      token_hash,
      expires_at,
      user: { connect: { id: user.id } },
    } as any,
  })

  // Set cookie for web clients
  if (platform === 'web') {
    setRefreshCookie(event, plainRefresh, expires_at)
  }

  // Return user info and tokens
  return {
    access_token,
    expires_in,
    refresh_token: plainRefresh, // Include for mobile apps
    user: {
      id: user.id,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      display_name: user.display_name,
      is_guest: user.is_guest
    }
  }
})
