import { defineStore } from 'pinia'

type Sections = Record<string, Record<string, string>>
type Registry = Record<string, { weight:number, questions:{id:string,prompt:string}[] }>

export const useEvoProfile = defineStore('evoProfile', {
  state: () => ({
    sections: {} as Sections,
    progressPct: 0,
    score: 0,
    registry: {} as Registry,
    loading: false,
  }),
  actions: {
    async fetchProfile() {
      this.loading = true
      try {
        const { data } = await $fetch('/api/evo/profile')
        // @ts-ignore
        this.sections = data.profile.sections || {}
        // @ts-ignore
        this.progressPct = data.profile.progressPct
        // @ts-ignore
        this.score = data.profile.score
        // @ts-ignore
        this.registry = data.registry || {}
      } finally { this.loading = false }
    },
    async saveSection(sectionKey: string, answers: Record<string, string>) {
      const res = await $fetch('/api/evo/profile', {
        method: 'PUT',
        body: { sections: { [sectionKey]: answers } }
      })
      // @ts-ignore
      this.sections = res.profile.sections
      // @ts-ignore
      this.progressPct = res.profile.progressPct
      // @ts-ignore
      this.score = res.profile.score
    }
  }
})
