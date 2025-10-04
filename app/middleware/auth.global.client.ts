import { useAuth } from '~/stores/auth'

export default defineNuxtRouteMiddleware(async (to) => {
  // CRITICAL FIX: Skip the middleware entirely if the path starts with /api/
  // API calls are handled by the server (Nitro) and do not need client-side redirection.
  if (to.path.startsWith('/api/')) return
  
  const auth = useAuth()
  
  // Public routes:
  if (['/login', '/register'].includes(to.path)) return

  // Check authentication for all other client-side routes
  try {
    await auth.ensure()
  } catch {
    return navigateTo('/login')
  }
})
