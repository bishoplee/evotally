import { defineEventHandler } from 'h3'
import { mustUserId } from '~/server/utils/oauth'

export default defineEventHandler((event) => {
  mustUserId(event)
  const c = useRuntimeConfig()
  const params = new URLSearchParams({
    client_id: c.msClientId || process.env.MS_CLIENT_ID!,
    response_type: 'code',
    redirect_uri: c.msRedirectUri || process.env.MS_REDIRECT_URI!,
    response_mode: 'query',
    scope: (c.msScopes || process.env.MS_SCOPES!).toString(),
  })
  const url = `https://login.microsoftonline.com/${c.msTenant || process.env.MS_TENANT || 'common'}/oauth2/v2.0/authorize?${params}`
  return { url }
})
