import { defineEventHandler, readBody, createError } from 'h3'
import { prisma } from '~/server/utils/db'

export default defineEventHandler(async (event) => {
  const u = event.context.user
  if (!u?.id) throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })

  const { id } = await readBody<{ id: string }>(event)
  if (!id) throw createError({ statusCode: 400, statusMessage: 'id required' })

  const v = await prisma.voice.findUnique({ where: { id } })
  if (!v || v.userId !== String(u.id)) throw createError({ statusCode: 404, statusMessage: 'Not found' })

  await prisma.$transaction([
    prisma.voice.updateMany({ where: { userId: String(u.id), isDefault: true }, data: { isDefault: false } }),
    prisma.voice.update({ where: { id }, data: { isDefault: true } }),
  ])

  return { ok: true }
})
