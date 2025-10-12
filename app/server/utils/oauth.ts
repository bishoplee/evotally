import { ofetch } from 'ofetch'
import { H3Event, createError } from 'h3'

export function mustUserId(event: H3Event) {
  const u = event.context.user
  if (!u?.id) throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  return String(u.id)
}

export async function exchangeGoogleCode(code: string, redirectUri: string, clientId: string, clientSecret: string) {
  const res = await ofetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    body: {
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    },
  })
  return res as {
    access_token: string; refresh_token?: string; expires_in: number; scope: string; id_token?: string
  }
}

export async function refreshGoogle(refreshToken: string, clientId: string, clientSecret: string) {
  const res = await ofetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    body: {
      refresh_token: refreshToken,
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: 'refresh_token',
    },
  })
  return res as { access_token: string; expires_in: number; scope?: string }
}

export async function exchangeMsCode(code: string, redirectUri: string, clientId: string, clientSecret: string, tenant: string) {
  const url = `https://login.microsoftonline.com/${tenant}/oauth2/v2.0/token`
  const res = await ofetch(url, {
    method: 'POST',
    body: {
      client_id: clientId,
      client_secret: clientSecret,
      code,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    },
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  })
  return res as { access_token: string; refresh_token: string; expires_in: number; scope: string }
}

export async function refreshMs(refreshToken: string, redirectUri: string, clientId: string, clientSecret: string, tenant: string) {
  const url = `https://login.microsoftonline.com/${tenant}/oauth2/v2.0/token`
  const res = await ofetch(url, {
    method: 'POST',
    body: {
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      redirect_uri: redirectUri,
      grant_type: 'refresh_token',
    },
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  })
  return res as { access_token: string; refresh_token?: string; expires_in: number; scope: string }
}
