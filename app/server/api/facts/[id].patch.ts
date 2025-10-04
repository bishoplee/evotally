import { verifyBearer } from '~/server/utils/jwt'
import { prisma } from '~/server/utils/db'

export default defineEventHandler(async (e) => {
  const auth = getHeader(e,'authorization')||''
  const token = auth.startsWith('Bearer ')?auth.slice(7):''
  if (!token) throw createError({ statusCode:401, statusMessage:'missing token' })
  const { sub } = await verifyBearer(token)
  const id = getRouterParam(e,'id')!
  const b = await readBody<{type?:string,key?:string|null,value?:string|null,text?:string}>(e)

  const rec = await prisma.fact.findFirst({ where: { id, userId: String(sub) } })
  if (!rec) throw createError({ statusCode:404, statusMessage:'not found' })

  const updated = await prisma.fact.update({
    where:{ id }, data:{
      type: b.type ?? rec.type,
      key:  (b.key===undefined? rec.key : (b.key||null)),
      value:(b.value===undefined? rec.value : (b.value||null)),
      text: b.text?.trim() || rec.text
    }
  })
  // (Optional) re-embed + update Qdrant point here if text changed.
  return updated
})

