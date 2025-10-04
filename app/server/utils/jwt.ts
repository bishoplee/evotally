import { SignJWT, jwtVerify, JWTPayload } from 'jose'

const alg = 'HS256'
const enc = new TextEncoder()

function cfg() {
  const c = useRuntimeConfig()
  return {
    secret: enc.encode(c.authJwtSecret as string),
    accessTtl: Number(c.accessTtl || 900),        // 15m default
    refreshTtl: Number(c.refreshTtl || 7*24*3600) // 7d default
  }
}

export async function signAccess(userId: string, persona = 'spouse') {
  const { secret, accessTtl } = cfg()
  const exp = Math.floor(Date.now()/1000) + accessTtl
  return await new SignJWT({ sub: userId, tenant_id: userId, persona })
    .setProtectedHeader({ alg }).setExpirationTime(exp).setIssuedAt().sign(secret)
}

export async function verifyBearer(authorization?: string): Promise<JWTPayload> {
  if (!authorization?.startsWith('Bearer ')) throw createError({ statusCode: 401, statusMessage: 'No token' })
  const token = authorization.slice(7)
  const { secret } = cfg()
  const { payload } = await jwtVerify(token, secret, { algorithms: [alg] })
  return payload
}

export function setRefreshCookie(event: any, token: string, exp: Date) {
  setCookie(event, 'refresh_token', token, {
    httpOnly: true, secure: true, sameSite: 'lax', path: '/', expires: exp
  })
}
export function getRefreshCookie(event: any) {
  return getCookie(event, 'refresh_token')
}
export function clearRefreshCookie(event: any) {
  deleteCookie(event, 'refresh_token', { path: '/' })
}
export function jwtCfg() { return cfg() }

