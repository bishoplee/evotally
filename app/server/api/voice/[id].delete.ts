import { defineEventHandler, createError } from 'h3'
import { prisma } from '~/server/utils/db'

export default defineEventHandler(async (event) => {
  const u = event.context.user
  if (!u?.id) throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  const id = event.context.params?.id as string
  if (!id) throw createError({ statusCode: 400, statusMessage: 'id required' })

  const v = await prisma.voice.findUnique({ where: { id } })
  if (!v || v.userId !== String(u.id)) throw createError({ statusCode: 404, statusMessage: 'Not found' })

  await prisma.voice.delete({ where: { id } })
  return { ok: true }
})
