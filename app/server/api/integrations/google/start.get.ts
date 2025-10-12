import { defineEventHandler, getRequestURL } from 'h3'
import { mustUserId } from '~/server/utils/oauth'

export default defineEventHandler((event) => {
  mustUserId(event) // require login
  const c = useRuntimeConfig()
  const scopes = (c.googleScopes || process.env.GOOGLE_SCOPES || '').toString().split(/\s+/).join(' ')
  const params = new URLSearchParams({
    client_id: c.googleClientId || process.env.GOOGLE_CLIENT_ID!,
    redirect_uri: c.googleRedirectUri || process.env.GOOGLE_REDIRECT_URI!,
    response_type: 'code',
    access_type: 'offline',
    prompt: 'consent', // ensures refresh_token on first connect
    scope: scopes,
    include_granted_scopes: 'true',
  })
  const url = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`
  // Let frontend open this URL
  return { url }
})
