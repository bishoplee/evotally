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
  const body = await readBody<{ email?: string; password?: string; persona?: string }>(event)
  const email = (body?.email || '').trim().toLowerCase()
  const password = body?.password || ''
  const persona = body?.persona || 'spouse'

  if (!email || !password) {
    throw createError({ statusCode: 400, statusMessage: 'Missing email or password' })
  }

  // Case-insensitive email lookup; adjust "User" if your model name differs
  const user = await prisma.user.findFirst({
    where: { email: { equals: email, mode: 'insensitive' } },
  })

  if (!user) throw createError({ statusCode: 401, statusMessage: 'Invalid credentials' })

  // Try common password columns (adjust to your schema)
  const storedHash =
    (user as any).password_hash ??
    (user as any).passwordHash ??
    (user as any).password ?? // WARNING: may be plain text in some seeds
    null

  const ok = await checkPassword(password, storedHash)
  if (!ok) throw createError({ statusCode: 401, statusMessage: 'Invalid credentials' })

  // Mint access
  const { access_token, expires_in } = await mintAccessToken(String(user.id), persona)

  // Create & store a refresh (opaque) token hash
  const plainRefresh = randomBytes(48).toString('base64url')
  const token_hash = createHash('sha256').update(plainRefresh).digest('hex')
  const { refreshTtl } = jwtCfg()
  const expires_at = new Date(Date.now() + refreshTtl * 1000)

  await prisma.refreshToken.create({
    data: {       // adjust to your column name
      token_hash,
      expires_at,
      user: { connect: { id: user.id } },   // <-- this is the important bit
    } as any,
  })



  // Set cookie (secure=false on localhost via jwt.ts fix)
  setRefreshCookie(event, plainRefresh, expires_at)

  return { access_token, expires_in }
})
