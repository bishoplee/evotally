// app/server/api/integrations/outlook/callback.get.ts
import { defineEventHandler, getQuery, createError, sendRedirect } from 'h3'
import { prisma } from '~/server/utils/db'
import { exchangeMsCode } from '~/server/utils/oauth'

export default defineEventHandler(async (event) => {
  const c = useRuntimeConfig()
  const { code, error } = getQuery(event)
  if (error) throw createError({ statusCode: 400, statusMessage: String(error) })
  if (!code) throw createError({ statusCode: 400, statusMessage: 'Missing code' })

  const u = event.context.user
  if (!u?.id) throw createError({ statusCode: 401, statusMessage: 'Login required before linking Outlook' })

  const token = await exchangeMsCode(
    String(code),
    c.msRedirectUri!,
    c.msClientId!,
    c.msClientSecret!,
    c.msTenant || 'common'
  )

  // Who am I on Graph?
  const me = await $fetch('https://graph.microsoft.com/v1.0/me', {
    headers: { Authorization: `Bearer ${token.access_token}` },
  }).catch(() => null) as any

  const providerUser = me?.id || 'me'
  const expiresAt = new Date(Date.now() + token.expires_in * 1000)

  await prisma.externalAccount.upsert({
    where: { userId_provider: { userId: String(u.id), provider: 'outlook' } },
    update: {
      accessToken: token.access_token,
      ...(token.refresh_token ? { refreshToken: token.refresh_token } : {}),
      scope: token.scope,
      expiresAt,
      providerUser,
    },
    create: {
      user: { connect: { id: String(u.id) } },
      provider: 'outlook',
      providerUser,
      scope: token.scope,
      accessToken: token.access_token,
      refreshToken: token.refresh_token || '',
      expiresAt,
    },
  })

  return sendRedirect(event, '/profile')
})
