// app/plugins/auth-init.global.ts
import { useAuth } from '~/stores/auth'

export default defineNuxtPlugin(async () => {
  const auth = useAuth()

  // On SSR, ask who we are using the existing refresh cookie (no rotation).
  const headers = process.server ? useRequestHeaders(['cookie']) : undefined

  try {
    const me = await $fetch<{ user: any | null }>('/api/auth/me', {
      credentials: 'include',
      headers, // <-- forward cookie on SSR
    })
    if (me?.user) {
      // If you keep a user object in the store, set it here.
      // If you only gate on token, you can optionally call refresh now.
    } else {
      // If you rely on a token, optionally skip refresh on SSR and let client do it.
    }
  } finally {
    auth.ready = true
  }
})
