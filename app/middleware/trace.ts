export default defineEventHandler(async (event) => {
  if (event.path.startsWith('/api/')) return  // don't touch API requests
  // do your work, then don't block:
  // await next() is implicit in Nitro; just don't send a response here
})
