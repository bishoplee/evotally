import { prisma } from '~/server/utils/db'
import { verifyBearer } from '~/server/utils/jwt'

async function embed(text: string) {
  const { public: p } = useRuntimeConfig()
  const r = await $fetch<any>(p.embedUrl, { method:'POST', body:{ input: text } })
  return r.data[0].embedding as number[]
}
async function qdrantUpsert(tenant_id: string, vector: number[], payload: any) {
  const { public: p } = useRuntimeConfig()
  const id = Date.now()*1000 + Math.floor(Math.random()*1000)
  await $fetch(`${p.qdrantUrl}/collections/identity/points`, {
    method: 'PUT', body: { points: [{ id, vector, payload: { tenant_id, ...payload } }] }
  })
  return String(id)
}

export default defineEventHandler( async (event) => {
  const { sub } = await verifyBearer(getHeader(event,'authorization') || '')
  const b = await readBody<any>(event)
  if (!b?.text?.trim()) throw createError({ statusCode: 400, statusMessage: 'text required' })
  const type = b.type || 'trait'
  const rec = await prisma.fact.create({
    data: { userId: String(sub), type, key: b.key || null, value: b.value || null, text: b.text.trim() }
  })
  const vector = await embed(b.text.trim())
  const pid = await qdrantUpsert(String(sub), vector, { type, key:b.key||null, value:b.value||null, text:b.text.trim(), ts: Date.now() })
  await prisma.fact.update({ where: { id: rec.id }, data: { qdrant_point_id: pid } })
  return { ...rec, qdrant_point_id: pid }
})

