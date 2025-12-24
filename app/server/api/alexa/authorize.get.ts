import { verifyBearerHeader } from '~/server/utils/jwt'
import { prisma } from '~/server/utils/db'

/**
 * Alexa Account Linking - Authorization Endpoint
 *
 * This endpoint handles the OAuth authorization flow for Alexa account linking.
 * Alexa will redirect users here with the following query parameters:
 * - client_id: The client ID from Alexa skill configuration
 * - redirect_uri: Where to redirect after authorization
 * - state: OAuth state parameter for security
 * - response_type: Should be "code"
 * - scope: Optional scopes
 */
export default defineEventHandler(async (e) => {
  const query = getQuery(e)

  const client_id = String(query.client_id || '')
  const redirect_uri = String(query.redirect_uri || '')
  const state = String(query.state || '')
  const response_type = String(query.response_type || '')
  const scope = String(query.scope || '')

  // Validate required parameters
  if (!client_id || !redirect_uri || !state || response_type !== 'code') {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid OAuth parameters. Required: client_id, redirect_uri, state, response_type=code'
    })
  }

  // Validate redirect_uri is from Amazon
  if (!redirect_uri.includes('amazon.com') && !redirect_uri.includes('amazonalexa.com')) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid redirect_uri. Must be an Amazon domain.'
    })
  }

  // Check if user is already authenticated
  const auth = getHeader(e, 'authorization')
  let userId: string | null = null

  try {
    if (auth) {
      const { sub } = await verifyBearerHeader(auth)
      userId = String(sub)
    }
  } catch (err) {
    // User not authenticated, will need to login
  }

  // If user is authenticated, generate authorization code and redirect
  if (userId) {
    // Generate a one-time authorization code
    const authCode = crypto.randomUUID()
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes

    // Store the authorization code in database
    await prisma.alexaAuthCode.create({
      data: {
        code: authCode,
        userId: userId,
        clientId: client_id,
        redirectUri: redirect_uri,
        scope: scope || null,
        expiresAt: expiresAt,
        used: false
      }
    })

    // Redirect back to Alexa with the authorization code
    const redirectUrl = new URL(redirect_uri)
    redirectUrl.searchParams.set('code', authCode)
    redirectUrl.searchParams.set('state', state)

    return sendRedirect(e, redirectUrl.toString(), 302)
  }

  // User not authenticated - return parameters for frontend to handle
  // The frontend should show a login/authorization page
  return {
    requiresAuth: true,
    client_id,
    redirect_uri,
    state,
    scope,
    authorizationUrl: `/alexa/authorize?client_id=${encodeURIComponent(client_id)}&redirect_uri=${encodeURIComponent(redirect_uri)}&state=${encodeURIComponent(state)}&response_type=code${scope ? `&scope=${encodeURIComponent(scope)}` : ''}`
  }
})
