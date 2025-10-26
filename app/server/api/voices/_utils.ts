// app/server/api/voices/_utils.ts
import { createError, getHeader } from 'h3'
import { prisma } from '~/server/utils/db'
import { verifyBearerHeader } from '~/server/utils/jwt'

export async function requireUserId(e: any) {
  const payload = await verifyBearerHeader(getHeader(e, 'authorization') || '')
  const userId = String(payload.sub || '')
  if (!userId) throw createError({ statusCode: 401, statusMessage: 'unauthorized' })
  return userId
}

export async function assertOwnership(userId: string, id: string) {
  const v = await prisma.voice.findUnique({ where: { id } })
  if (!v || v.userId !== userId) {
    throw createError({ statusCode: 404, statusMessage: 'Not found' })
  }
  return v
}
