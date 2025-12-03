import { verifyJWT } from '~/server/utils/jwt'
import { prisma } from '~/server/utils/db'

export default defineEventHandler(async (e) => {
  const auth = getHeader(e, 'authorization') || ''
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : ''
  if (!token) throw createError({ statusCode: 401, statusMessage: 'missing token' })

  const { sub } = await verifyJWT(token)
  const body = await readBody<{
    first_name?: string | null
    last_name?: string | null
    email?: string | null
    birthday?: string | null
    timezone?: string | null
  }>(e)

  // Update user profile
  const user = await prisma.user.update({
    where: { id: String(sub) },
    data: {
      first_name: body.first_name || null,
      last_name: body.last_name || null,
      email: body.email || null,
      birthday: body.birthday || null,
      timezone: body.timezone || null,
    },
    select: {
      id: true,
      email: true,
      first_name: true,
      last_name: true,
      birthday: true,
      timezone: true,
    }
  })

  return { ok: true, user }
})
