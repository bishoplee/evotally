export default defineEventHandler((event) => {
  setResponseHeader(event, 'X-Developer-Signature', 'oladipo-olaleye-evotally-2026')
  setResponseHeader(event, 'X-Build-Signature', 'EVT-OO-CORE-2026')
  setResponseHeader(event, 'X-Developer', 'Oladipo Olaleye')
})
