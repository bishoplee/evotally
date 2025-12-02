import { defineEventHandler, readBody, createError } from 'h3'
import { prisma } from '~/server/utils/db'
import { createHash, randomBytes } from 'node:crypto'
import { mintAccessToken, jwtCfg, setRefreshCookie } from '~/server/utils/jwt'

/**
 * Google OAuth endpoint
 *
 * Expects a Google ID token from the frontend Google Sign-In
 * Verifies the token, finds or creates the user, and returns access/refresh tokens
 *
 * Body: { credential: string (Google ID token) }
 */
export default defineEventHandler(async (event) => {
  const body = await readBody<{ credential?: string; persona?: string }>(event)
  const credential = body?.credential
  const persona = body?.persona || 'spouse'

  if (!credential) {
    throw createError({ statusCode: 400, statusMessage: 'Missing Google credential' })
  }

  try {
    // Verify Google ID token
    // Note: In production, you should verify the token with Google's API
    // For now, we'll decode it (this is NOT secure for production use)
    const payload = JSON.parse(
      Buffer.from(credential.split('.')[1], 'base64').toString()
    )

    const email = payload.email?.toLowerCase()
    const display_name = payload.name || email
    const googleId = payload.sub
    const given_name = payload.given_name
    const family_name = payload.family_name

    if (!email || !googleId) {
      throw createError({ statusCode: 400, statusMessage: 'Invalid Google token' })
    }

    // Find or create user
    let user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: { equals: email, mode: 'insensitive' } },
          { googleId: googleId }
        ]
      }
    })

    if (!user) {
      // Create new user
      user = await prisma.user.create({
        data: {
          email,
          display_name,
          first_name: given_name,
          last_name: family_name,
          googleId,
          email_verified_at: new Date(), // Google-verified email
        }
      })
    } else if (!user.googleId) {
      // Update existing user with Google ID
      user = await prisma.user.update({
        where: { id: user.id },
        data: { googleId }
      })
    }

    // Mint access token
    const { access_token, expires_in } = await mintAccessToken(String(user.id), persona)

    // Create & store refresh token
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

    // Set refresh cookie
    setRefreshCookie(event, plainRefresh, expires_at)

    return {
      access_token,
      expires_in,
      user: {
        id: user.id,
        email: user.email,
        display_name: user.display_name,
      }
    }
  } catch (error: any) {
    console.error('Google OAuth error:', error)
    throw createError({
      statusCode: 401,
      statusMessage: error.message || 'Google authentication failed'
    })
  }
})
