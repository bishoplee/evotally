import { parse } from 'csv-parse/sync'
import { verifyBearer } from '~/server/utils/jwt'
import { prisma } from '~/server/utils/db'

async function embedText(text: string) {
  const url = useRuntimeConfig().embedUrl as string
  const r = await $fetch<any>(url, { method:'POST', body:{ input: text } })
  return r.data[0].embedding as number[]
}
async function qdrantUpsert(tenant_id: string, payload: any, vector: number[]) {
  const url = `${useRuntimeConfig().qdrantUrl}/collections/identity/points`
  const id = Date.now()*1000 + Math.floor(Math.random()*1000)
  await $fetch(url, { method:'PUT', body:{ points:[{ id, vector, payload:{ tenant_id, ...payload } }] }, headers:{'Content-Type':'application/json'} })
  return String(id)
}

export default defineEventHandler(async (e) => {
  const auth = getHeader(e,'authorization')||''
  const token = auth.startsWith('Bearer ')?auth.slice(7):''
  if (!token) throw createError({ statusCode:401, statusMessage:'missing token' })
  const { sub } = await verifyBearer(token)

  const form = await readMultipartFormData(e)
  const file = form?.find(f => f.name==='file')
  if (!file) throw createError({ statusCode:400, statusMessage:'missing file' })

  const csv = file.data?.toString('utf-8') || ''
  const rows = parse(csv, { columns:true, skip_empty_lines:true })
  // expected headers: type,key,value,text
  const inserted:string[] = []
  for (const r of rows) {
    const text = (r.text||'').trim()
    if (!text) continue
    const fact = await prisma.fact.create({
      data: {
        userId: String(sub),
        type: (r.type||'trait').trim(),
        key:  r.key?.trim() || null,
        value:r.value?.trim() || null,
        text
      }
    })
    const emb = await embedText(text)
    const pid = await qdrantUpsert(String(sub), {
      type: fact.type, key: fact.key, value: fact.value, text, ts: Date.now()
    }, emb)
    await prisma.fact.update({ where:{ id: fact.id }, data:{ qdrant_point_id: pid } })
    inserted.push(fact.id)
  }
  return { ok:true, count: inserted.length }
})

