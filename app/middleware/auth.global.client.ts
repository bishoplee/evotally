import { useAuth } from '~/stores/auth'

export default defineNuxtRouteMiddleware(async (to) => {
  // CRITICAL FIX: Skip the middleware entirely if the path starts with /api/
  // API calls are handled by the server (Nitro) and do not need client-side redirection.
  if (to.path.startsWith('/api/')) return


  const PUBLIC = new Set<string>(['/login', '/register', '/index'])
  if (to.meta?.public === true || PUBLIC.has(to.path)) return
  
  const auth = useAuth()
  
  // Public routes:
  if (['/login', '/register'].includes(to.path)) return

  // Check authentication for all other client-side routes
  try {
    await auth.ensure()
  } catch {
    return navigateTo('/login')
  }

  console.log('we are here');

  if (!auth.user) {
    const redirect = encodeURIComponent(to.fullPath || '/')
    return navigateTo(`/login?redirect=${redirect}`, { replace: true })
  }
})
