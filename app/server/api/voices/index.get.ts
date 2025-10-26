// app/server/api/voices/index.get.ts
import { defineEventHandler, getQuery } from 'h3'
import { prisma } from '~/server/utils/db'
import { requireUserId } from './_utils'

export default defineEventHandler(async (e) => {
  const userId = await requireUserId(e)
  const q = getQuery(e)
  const provider = q.provider ? String(q.provider) : undefined

  const items = await prisma.voice.findMany({
    where: { userId, ...(provider ? { provider } : {}) },
    orderBy: [{ isDefault: 'desc' }, { created_at: 'desc' }],
  })
  return { items }
})
