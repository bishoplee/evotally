import { verifyJWT } from '~/server/utils/jwt'
import { prisma } from '~/server/utils/db'

async function embedText(text: string) {
  const url = useRuntimeConfig().embedUrl as string
  const r = await $fetch<any>(url, { method: 'POST', body: { input: text } })
  return r.data[0].embedding as number[]
}

async function qdrantUpsertIdentity(tenant_id: string, payload: any, vector: number[]) {
  const url = `${useRuntimeConfig().qdrantUrl}/collections/identity/points`
  const id = Date.now() * 1000 + Math.floor(Math.random() * 1000)
  await $fetch(url, {
    method: 'PUT',
    body: { points: [{ id, vector, payload: { tenant_id, ...payload } }] },
    headers: { 'Content-Type': 'application/json' }
  })
  return String(id)
}

export default defineEventHandler(async (e) => {
  const auth = getHeader(e, 'authorization') || ''
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : ''
  if (!token) throw createError({ statusCode: 401, statusMessage: 'missing token' })
  const { sub } = await verifyJWT(token)

  const body = await readBody<{ type?:string, key?:string, value?:string, text:string }>(e)
  if (!body?.text?.trim()) throw createError({ statusCode: 400, statusMessage: 'text required' })
  const type = body.type || 'trait'

  // canonical save
  const fact = await prisma.fact.create({
    data: {
      userId: String(sub),
      type,
      key: body.key || null,
      value: body.value || null,
      text: body.text.trim(),
    }
  })

  // mirror to Qdrant identity collection
  const emb = await embedText(body.text.trim())
  const pointId = await qdrantUpsertIdentity(String(sub), {
    type, key: body.key || null, value: body.value || null, text: body.text.trim(), ts: Date.now()
  }, emb)

  await prisma.fact.update({ where: { id: fact.id }, data: { qdrant_point_id: pointId } })
  return { ...fact, qdrant_point_id: pointId }
})

