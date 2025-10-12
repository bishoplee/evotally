// app/server/api/contacts/import.post.ts
import { defineEventHandler, readBody, createError } from 'h3'
import { prisma } from '~/server/utils/db'
import { refreshGoogle, refreshMs } from '~/server/utils/oauth'

type Body = { source?: 'google' | 'outlook' | 'all' }

export default defineEventHandler(async (event) => {
  const u = event.context.user
  if (!u?.id) throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  const userId = String(u.id)
  const { source = 'all' } = await readBody<Body>(event).catch(() => ({ source: 'all' }))

  let upserts = 0
  let seen = 0

  // ---------- GOOGLE (unchanged from earlier example) ----------
  if (source === 'google' || source === 'all') {
    const cfg = useRuntimeConfig()
    const acc = await prisma.externalAccount.findUnique({
      where: { userId_provider: { userId, provider: 'google' } },
    })
    if (acc) {
      let accessToken = acc.accessToken
      if (acc.expiresAt < new Date(Date.now() + 60_000)) {
        const ref = await refreshGoogle(acc.refreshToken, process.env.GOOGLE_CLIENT_ID!, process.env.GOOGLE_CLIENT_SECRET!)
        accessToken = ref.access_token
        await prisma.externalAccount.update({
          where: { id: acc.id },
          data: { accessToken, expiresAt: new Date(Date.now() + ref.expires_in * 1000), scope: ref.scope || acc.scope },
        })
      }

      // Simple list (you can keep or switch to incremental with syncToken)
      let next: string | null = 'https://people.googleapis.com/v1/people/me/connections?pageSize=500&personFields=names,emailAddresses,phoneNumbers'
      while (next) {
        const page = await $fetch(next, { headers: { Authorization: `Bearer ${accessToken}` } }) as any
        const list = page.connections || []
        seen += list.length
        for (const p of list) {
          const externalId = p.resourceName
          const name = p.names?.[0]?.displayName || null
          const email = p.emailAddresses?.[0]?.value || null
          const phone = p.phoneNumbers?.[0]?.value || null
          const etag = p.etag || undefined

          await prisma.contact.upsert({
            where: { userId_source_externalId: { userId, source: 'google', externalId } },
            update: { name, email, phone, etag, raw: p, deleted_at: null },
            create: { userId, source: 'google', externalId, name, email, phone, etag, raw: p },
          })
          upserts++
        }
        next = page.nextPageToken
          ? `https://people.googleapis.com/v1/people/me/connections?pageSize=500&personFields=names,emailAddresses,phoneNumbers&pageToken=${page.nextPageToken}`
          : null
      }
    }
  }

  // ---------- OUTLOOK (Microsoft Graph) ----------
  if (source === 'outlook' || source === 'all') {
    const cfg = useRuntimeConfig()
    const acc = await prisma.externalAccount.findUnique({
      where: { userId_provider: { userId, provider: 'outlook' } },
    })
    if (acc) {
      // refresh if needed
      let accessToken = acc.accessToken
      if (acc.expiresAt < new Date(Date.now() + 60_000)) {
        const ref = await refreshMs(acc.refreshToken, cfg.msRedirectUri!, cfg.msClientId!, cfg.msClientSecret!, cfg.msTenant || 'common')
        accessToken = ref.access_token
        await prisma.externalAccount.update({
          where: { id: acc.id },
          data: {
            accessToken,
            expiresAt: new Date(Date.now() + ref.expires_in * 1000),
            ...(ref.refresh_token ? { refreshToken: ref.refresh_token } : {}),
            scope: ref.scope || acc.scope,
          },
        })
      }

      // Basic list
      // Fields: displayName, emailAddresses/address, businessPhones[], mobilePhone
      let next: string | null = 'https://graph.microsoft.com/v1.0/me/contacts?$top=100&$select=id,displayName,emailAddresses,businessPhones,mobilePhone'
      while (next) {
        const page = await $fetch(next, { headers: { Authorization: `Bearer ${accessToken}` } }) as any
        const list = page.value || []
        seen += list.length

        for (const c of list) {
          const externalId = c.id
          const name = c.displayName || null
          const email = c.emailAddresses?.[0]?.address || null
          const phone = c.mobilePhone || c.businessPhones?.[0] || null
          const etag = c['@odata.etag'] || undefined

          await prisma.contact.upsert({
            where: { userId_source_externalId: { userId, source: 'outlook', externalId } },
            update: { name, email, phone, etag, raw: c, deleted_at: null },
            create: { userId, source: 'outlook', externalId, name, email, phone, etag, raw: c },
          })
          upserts++
        }

        next = page['@odata.nextLink'] || null
      }

      // (Optional) Switch this to delta later:
      // GET https://graph.microsoft.com/v1.0/me/contacts/delta
      // and store the delta URL in ExternalAccount.syncToken for incremental syncs.
    }
  }

  return { upserts, seen }
})
