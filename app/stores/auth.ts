import { defineStore } from 'pinia'

type Tokens = { access_token: string; expires_in: number }
export const useAuth = defineStore('auth', {
  state: () => ({ accessToken: '', exp: 0 }),
  getters: {
    bearer: (s) => s.accessToken ? { Authorization: `Bearer ${s.accessToken}` } : {}
  },
  actions: {
    set(t: Tokens) { this.accessToken = t.access_token; this.exp = Math.floor(Date.now()/1000) + t.expires_in },
    async login(email:string, password:string, persona='spouse') {
      const r = await $fetch<Tokens>('/api/auth/login', { method: 'POST', body: { email, password, persona } })
      this.set(r)
    },
    async refresh(persona?:string) {
      const r = await $fetch<Tokens>('/api/auth/refresh', { method: 'POST', body: persona ? { persona } : undefined })
      this.set(r)
    },
    async ensure() {
      const now = Math.floor(Date.now()/1000)
      if (!this.accessToken || now >= this.exp - 15) await this.refresh()
      return this.accessToken
    },
    async logout() { this.accessToken = ''; this.exp = 0; await $fetch('/api/auth/logout', { method: 'POST' }) }
  }
})

