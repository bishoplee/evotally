import { mintAccessToken } from '~/server/utils/jwt'
import { prisma } from '~/server/utils/db'

/**
 * Alexa Account Linking - Token Endpoint
 *
 * This endpoint handles the OAuth token exchange for Alexa account linking.
 * Alexa will POST to this endpoint to exchange an authorization code for an access token.
 *
 * Request body (application/x-www-form-urlencoded):
 * - grant_type: Should be "authorization_code" or "refresh_token"
 * - code: The authorization code (if grant_type is authorization_code)
 * - redirect_uri: Must match the original redirect_uri
 * - client_id: The client ID from Alexa skill configuration
 * - client_secret: The client secret from Alexa skill configuration
 * - refresh_token: The refresh token (if grant_type is refresh_token)
 */
export default defineEventHandler(async (e) => {
  // Parse form data (Alexa sends application/x-www-form-urlencoded)
  const body = await readBody(e)

  const grant_type = String(body.grant_type || '')
  const code = String(body.code || '')
  const redirect_uri = String(body.redirect_uri || '')
  const client_id = String(body.client_id || '')
  const client_secret = String(body.client_secret || '')
  const refresh_token = String(body.refresh_token || '')

  // Validate client credentials
  const config = useRuntimeConfig()
  const expectedClientId = config.alexaClientId || 'alexa-skill-client'
  const expectedClientSecret = config.alexaClientSecret || 'alexa-skill-secret'

  if (client_id !== expectedClientId || client_secret !== expectedClientSecret) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Invalid client credentials'
    })
  }

  // Handle authorization_code grant
  if (grant_type === 'authorization_code') {
    if (!code || !redirect_uri) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Missing required parameters: code and redirect_uri'
      })
    }

    // Find the authorization code
    const authCode = await prisma.alexaAuthCode.findUnique({
      where: { code }
    })

    if (!authCode) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid authorization code'
      })
    }

    // Validate authorization code
    if (authCode.used) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Authorization code already used'
      })
    }

    if (authCode.expiresAt < new Date()) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Authorization code expired'
      })
    }

    if (authCode.redirectUri !== redirect_uri) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Redirect URI mismatch'
      })
    }

    if (authCode.clientId !== client_id) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Client ID mismatch'
      })
    }

    // Mark code as used
    await prisma.alexaAuthCode.update({
      where: { code },
      data: { used: true }
    })

    // Generate access token and refresh token
    const { access_token, expires_in } = await mintAccessToken(authCode.userId)
    const newRefreshToken = crypto.randomUUID()

    // Store refresh token
    await prisma.alexaRefreshToken.create({
      data: {
        token: newRefreshToken,
        userId: authCode.userId,
        clientId: client_id,
        expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000) // 90 days
      }
    })

    return {
      access_token,
      token_type: 'Bearer',
      expires_in,
      refresh_token: newRefreshToken
    }
  }

  // Handle refresh_token grant
  if (grant_type === 'refresh_token') {
    if (!refresh_token) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Missing required parameter: refresh_token'
      })
    }

    // Find the refresh token
    const storedToken = await prisma.alexaRefreshToken.findUnique({
      where: { token: refresh_token }
    })

    if (!storedToken) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid refresh token'
      })
    }

    if (storedToken.expiresAt < new Date()) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Refresh token expired'
      })
    }

    if (storedToken.clientId !== client_id) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Client ID mismatch'
      })
    }

    // Generate new access token
    const { access_token, expires_in } = await mintAccessToken(storedToken.userId)

    return {
      access_token,
      token_type: 'Bearer',
      expires_in
    }
  }

  throw createError({
    statusCode: 400,
    statusMessage: 'Unsupported grant_type. Must be authorization_code or refresh_token'
  })
})
