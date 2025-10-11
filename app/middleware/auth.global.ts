// app/middleware/auth.global.ts
import { useAuth } from '~/stores/auth'

export default defineNuxtRouteMiddleware( async (to) => {
  if (to.path.startsWith('/api/')) return
  const PUBLIC = new Set(['/login', '/register'])
  if (to.meta?.public === true || PUBLIC.has(to.path)) return

  const auth = useAuth()
  if (!auth.ready) {
    // Try a cheap /api/auth/me first on SSR to avoid rotation
    const headers = process.server ? useRequestHeaders(['cookie']) : undefined
    try {
      const me = await $fetch<{ user: any | null }>('/api/auth/me', {
        credentials: 'include',
        headers, // <-- forward cookie on SSR
      })
      if (!me?.user) {
        // If you gate by token, you can attempt a refresh here (with headers)
        // await auth.refresh()
      }
    } catch {/* ignore */}
    auth.ready = true
  }

  // Gate: if you keep user in store, check that; otherwise check token state
  const authed = auth.isAuthed /* or Boolean(user) if you store user */
  if (!authed) {
    const redirect = encodeURIComponent(to.fullPath || '/')
    return navigateTo(`/login?redirect=${redirect}`, { replace: true })
  }
})
