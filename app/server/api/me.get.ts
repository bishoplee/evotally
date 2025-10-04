import { verifyBearer } from '~/server/utils/jwt'
import { prisma } from '~/server/utils/db'

export default defineEventHandler(async (e) => {
  const auth = getHeader(e, 'authorization') || ''
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : ''
  if (!token) throw createError({ statusCode: 401, statusMessage: 'missing token' })
  const payload = await verifyBearer(token)
  const user = await prisma.user.findUnique({ where: { id: String(payload.sub) } })
  if (!user) throw createError({ statusCode: 401, statusMessage: 'no user' })
  return { id: user.id, email: user.email, persona_default: user.persona_default, settings: user.settings }
})

