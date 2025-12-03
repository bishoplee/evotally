import { verifyJWT } from '~/server/utils/jwt'
import { prisma } from '~/server/utils/db'

export default defineEventHandler(async (e) => {
  const auth = getHeader(e, 'authorization') || ''
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : ''
  if (!token) throw createError({ statusCode: 401, statusMessage: 'missing token' })

  const { sub } = await verifyJWT(token)
  const body = await readBody<{
    lat: number
    lng: number
    city: string
    region: string
    country: string
  }>(e)

  // Validate required fields
  if (typeof body.lat !== 'number' || typeof body.lng !== 'number') {
    throw createError({ statusCode: 400, statusMessage: 'Invalid coordinates' })
  }

  // Update user's current location
  const user = await prisma.user.update({
    where: { id: String(sub) },
    data: {
      currentLat: body.lat,
      currentLng: body.lng,
      currentCity: body.city || null,
      currentRegion: body.region || null,
      currentCountry: body.country || null,
      locationUpdated: new Date(),
    },
    select: {
      id: true,
      currentLat: true,
      currentLng: true,
      currentCity: true,
      currentRegion: true,
      currentCountry: true,
      locationUpdated: true,
    }
  })

  return { ok: true, location: user }
})
