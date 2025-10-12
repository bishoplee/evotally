import { defineEventHandler, getQuery, sendRedirect, createError } from 'h3'
import { prisma } from '~/server/utils/db'
import { exchangeGoogleCode } from '~/server/utils/oauth'

export default defineEventHandler(async (event) => {
  const c = useRuntimeConfig()
  const { code, state } = getQuery(event)
  if (!code) throw createError({ statusCode: 400, statusMessage: 'Missing code' })

  // In a stricter setup you'd verify `state` binds to the user/session.

  const token = await exchangeGoogleCode(String(code), c.googleRedirectUri || process.env.GOOGLE_REDIRECT_URI!,
    c.googleClientId || process.env.GOOGLE_CLIENT_ID!, c.googleClientSecret || process.env.GOOGLE_CLIENT_SECRET!)

  // Fetch profile userId from event cookie session? If callback domain is same-origin, user is logged in.
  // If not guaranteed, you can store `userId` in a signed state and read it here.
  const u = event.context.user
  if (!u?.id) throw createError({ statusCode: 401, statusMessage: 'Login required before linking Google' })

  // Get Google profile id (people/me) to store
  const me = await $fetch('https://people.googleapis.com/v1/people/me?personFields=names', {
    headers: { Authorization: `Bearer ${token.access_token}` },
  }).catch(() => null) as any

  const providerUser = me?.resourceName || 'people/me'
  const expiresAt = new Date(Date.now() + token.expires_in * 1000)

  await prisma.externalAccount.upsert({
    where: { userId_provider: { userId: String(u.id), provider: 'google' } },
    update: {
      accessToken: token.access_token,
      // refresh_token may be missing on subsequent consents
      ...(token.refresh_token ? { refreshToken: token.refresh_token } : {}),
      scope: token.scope,
      expiresAt,
      providerUser,
    },
    create: {
      user: { connect: { id: String(u.id) } },
      provider: 'google',
      providerUser,
      scope: token.scope,
      accessToken: token.access_token,
      refreshToken: token.refresh_token || '',
      expiresAt,
    },
  })

  return sendRedirect(event, '/profile') // or show “Connected” page
})
