// server/middleware/auth.global.ts
import { defineEventHandler, getRequestHeader, getCookie, createError } from 'h3'
import { prisma } from '~/server/utils/db'
import { verifyBearer } from '~/server/utils/jwt' // or your verifyBearer
// ^ change import to your existing helper

const PUBLIC_PATHS = new Set([
  '/api/auth/login',
  '/api/auth/refresh',
  '/api/auth/logout',
  '/api/auth/register',
  '/health',
  '/api/auth/me',
  '/api/alexa/authorize',
  '/api/alexa/token'
])

export default defineEventHandler(async (event) => {
  // Only guard API routes
  if (!event.path?.startsWith('/api/')) return
  if (PUBLIC_PATHS.has(event.path)) return

  // 1) Try Authorization: Bearer <access>
  const authHeader = getRequestHeader(event, 'authorization') || ''
  const bearer = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : ''
  if (bearer) {
    const payload = await verifyBearer(bearer).catch(() => null) // <-- changed
    if (payload?.sub) {
      // Load full user from database
      const user = await prisma.user.findUnique({
        where: { id: String(payload.sub) }
      })

      if (user) {
        event.context.user = {
          id: user.id,
          email: user.email,
          first_name: user.first_name,
          last_name: user.last_name,
          birthday: user.birthday,
          timezone: user.timezone,
          city: user.city,
          region: user.region,
          country: user.country,
          currentCity: user.currentCity,
          currentRegion: user.currentRegion,
          currentCountry: user.currentCountry,
          tenantId: (user as any).tenantId ?? '',
          persona: payload.persona as string | undefined,
        }
        return
      }
    }
  }

  // 2) Fallback: refresh cookie (hydrate context so route can proceed)
  const refresh = getCookie(event, 'refresh_token')
  if (refresh) {
    const token_hash = (await import('node:crypto')).createHash('sha256').update(refresh).digest('hex')
    console.log(token_hash)
    const rec = await prisma.refreshToken.findFirst({
      where: { token_hash, revoked_at: null },
      include: { user: true } // pull user to hydrate context
    })
    console.log('Rec', rec);
    if (rec && rec.expires_at > new Date() && rec.user) {
      event.context.user = {
        id: rec.user.id,
        email: rec.user.email,
        first_name: rec.user.first_name,
        last_name: rec.user.last_name,
        birthday: rec.user.birthday,
        timezone: rec.user.timezone,
        city: rec.user.city,
        region: rec.user.region,
        country: rec.user.country,
        currentCity: rec.user.currentCity,
        currentRegion: rec.user.currentRegion,
        currentCountry: rec.user.currentCountry,
        tenantId: (rec.user as any).tenantId ?? '',
        persona: rec.user.persona_default
      }
      return
    }
  }

  throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
})
