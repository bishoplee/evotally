// app/server/utils/jwt.ts
import { SignJWT, jwtVerify, JWTPayload } from 'jose'
import { setCookie, getCookie, deleteCookie, createError, H3Event } from 'h3'

const alg = 'HS256'
const enc = new TextEncoder()

function cfg() {
  const c = useRuntimeConfig()
  return {
    secret: enc.encode(String(c.authJwtSecret)),
    accessTtl: Number(c.accessTtl || 900),        // 15m default
    refreshTtl: Number(c.refreshTtl || 7 * 24 * 3600), // 7d default
  }
}

/** Sign an access JWT and return the token + TTL (seconds) */
export async function mintAccessToken(userId: string, persona = 'spouse') {
  const { secret, accessTtl } = cfg()
  const exp = Math.floor(Date.now() / 1000) + accessTtl
  const token = await new SignJWT({
    sub: userId,
    // keep claim names consistent with your middleware (tenantId vs tenant_id)
    tenantId: userId,
    persona,
  })
    .setProtectedHeader({ alg })
    .setExpirationTime(exp)
    .setIssuedAt()
    .sign(secret)

  return { access_token: token, expires_in: accessTtl }
}

/** Verify a raw JWT string (no "Bearer " prefix) */
export async function verifyAccess(token: string): Promise<JWTPayload> {
  if (!token) throw createError({ statusCode: 401, statusMessage: 'No token' })
  const { secret } = cfg()
  const { payload } = await jwtVerify(token, secret, { algorithms: [alg] })
  return payload
}

/** Verify a raw JWT string (no "Bearer " prefix) */
export async function verifyBearer(token: string): Promise<JWTPayload> {
  if (!token) throw createError({ statusCode: 401, statusMessage: 'No token' })
  const { secret } = cfg()
  const { payload } = await jwtVerify(token, secret, { algorithms: [alg] })
  return payload
}

/** Verify an Authorization header with "Bearer <token>" */
export async function verifyBearerHeader(authorization?: string): Promise<JWTPayload> {
  if (!authorization?.startsWith('Bearer ')) {
    throw createError({ statusCode: 401, statusMessage: 'No token' })
  }
  const token = authorization.slice(7)
  return verifyAccess(token)
}

/** Set refresh cookie with correct flags for localhost vs production */
export function setRefreshCookie(event: H3Event, token: string, exp: Date) {
  setCookie(event, 'refresh_token', token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production', // IMPORTANT: false on http://localhost
    path: '/',
    expires: exp, // or use maxAge: cfg().refreshTtl
  })
}
export function getRefreshCookie(event: H3Event) {
  return getCookie(event, 'refresh_token')
}
export function clearRefreshCookie(event: H3Event) {
  deleteCookie(event, 'refresh_token', { path: '/' })
}

export function jwtCfg() {
  return cfg()
}
