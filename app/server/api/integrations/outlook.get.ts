// app/server/api/integrations/outlook.get.ts
import { defineEventHandler, createError } from 'h3'
import { prisma } from '~/server/utils/db'

export default defineEventHandler(async (event) => {
  const u = event.context.user
  if (!u?.id) throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })

  const acc = await prisma.externalAccount.findUnique({
    where: { userId_provider: { userId: String(u.id), provider: 'outlook' } },
  })

  return {
    connected: !!acc,
    expiry: acc?.expiresAt?.toISOString(),
    scope: acc?.scope,
  }
})
