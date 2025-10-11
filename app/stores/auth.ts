// app/stores/auth.ts
import { defineStore } from 'pinia'

type Tokens = { access_token: string; expires_in: number }

export const useAuth = defineStore('auth', {
  state: () => ({ accessToken: '', exp: 0, ready: false }),
  getters: {
    isAuthed: (s) => !!s.accessToken && Math.floor(Date.now() / 1000) < s.exp - 10,
    bearer:   (s) => (s.accessToken ? { Authorization: `Bearer ${s.accessToken}` } : {}),
  },
  actions: {
    set(t: Tokens) {
      this.accessToken = t.access_token
      this.exp = Math.floor(Date.now() / 1000) + t.expires_in
    },

    async login(email: string, password: string, persona = 'spouse') {
      const headers = process.server ? useRequestHeaders(['cookie']) : undefined
      const r = await $fetch<Tokens>('/api/auth/login', {
        method: 'POST',
        body: { email, password, persona },
        credentials: 'include',
        headers, // forward cookies on SSR (rare on login page, but safe)
      })
      this.set(r)
      this.ready = true
    },

    async refresh(persona?: string) {
      const headers = process.server ? useRequestHeaders(['cookie']) : undefined
      const r = await $fetch<Tokens>('/api/auth/refresh', {
        method: 'POST',
        body: persona ? { persona } : undefined,
        credentials: 'include',
        headers, // <-- forward cookie on SSR
      })
      this.set(r)
    },

    async ensure() {
      try {
        const now = Math.floor(Date.now() / 1000)
        if (!this.accessToken || now >= this.exp - 15) {
          await this.refresh()
        }
      } finally {
        this.ready = true
      }
      return this.isAuthed
    },

    async logout() {
      // clear local state first so UI flips immediately
      this.accessToken = ''
      this.exp = 0
      this.ready = true
      const headers = process.server ? useRequestHeaders(['cookie']) : undefined
      // best-effort: don't throw if network fails
      try {
        await $fetch('/api/auth/logout', { method: 'POST', credentials: 'include', headers })
      } catch {}
    },
  },
})
