import { defineStore } from 'pinia'
import { useApi } from '~/useApi'

/** Types (relaxed to match current server payloads) */
export type EvoAnswerMap = Record<string, string>

export type EvoSectionKey =
  | 'everyday'
  | 'humor'
  | 'personality'
  | 'connection'
  | 'emotional'
  | 'memory'
  | 'storytelling'
  | 'life'
  | 'future'
  | 'calibration'

export type EvoQuestion = {
  id: string
  prompt: string
  weight?: number
  placeholder?: string
}

export type EvoRegistry = Record<
  EvoSectionKey,
  {
    weight: number
    questions: EvoQuestion[]
  }
>

type ProfileResponse = {
  ok: boolean
  profile: {
    userId: string
    sections: Record<string, EvoAnswerMap>
    score: number
    progressPct: number
    updatedAt: string
  }
  registry: EvoRegistry
}

type PatchResponse = {
  ok: boolean
  profile?: {
    sections?: Record<string, EvoAnswerMap>
    score?: number
    progressPct?: number
    updatedAt?: string
  }
}

export const useEvoProfile = defineStore('evoProfile', {
  state: () => ({
    loading: false as boolean,
    error: '' as string,
    /** Server-calculated */
    score: 0 as number,
    progressPct: 0 as number,
    /** Server-provided questions/weights */
    registry: {} as EvoRegistry | Record<string, any>,
    /** User answers by section -> { questionId: answer } */
    sections: {} as Record<string, EvoAnswerMap>,
    /** One-time init guard */
    initialized: false as boolean
  }),

  getters: {
    /** Safe read of a section answer */
    answer:
      (state) =>
      (sectionKey: string, questionId: string): string => {
        return state.sections?.[sectionKey]?.[questionId] ?? ''
      },

    /** True if we have at least the registry */
    ready: (state) => !!state.initialized && Object.keys(state.registry || {}).length > 0
  },

  actions: {
    /** Ensure a section object exists locally */
    ensureSection(sectionKey: string) {
      if (!this.sections[sectionKey]) {
        // make it reactive
        this.sections[sectionKey] = {}
      }
      return this.sections[sectionKey]
    },

    /** Local-only setter (useful for forms) */
    setAnswer(sectionKey: string, questionId: string, value: string) {
      const sec = this.ensureSection(sectionKey)
      sec[questionId] = value
    },

    /** Fetch profile + registry from server and normalize local state */
    async fetchProfile() {
      const api = useApi()
      this.loading = true
      this.error = ''

      try {
        const res = await api.get<ProfileResponse>('/api/evo/profile')
        if (!res?.ok) throw new Error('Bad response')

        // server-provided
        this.registry = res.registry || {}
        this.sections = { ...(res.profile?.sections || {}) }

        // normalize: ensure every section exists to avoid undefined access in templates
        for (const key of Object.keys(this.registry || {})) {
          this.ensureSection(key)
        }

        this.score = Number(res.profile?.score ?? 0)
        this.progressPct = Number(res.profile?.progressPct ?? 0)
        this.initialized = true
      } catch (e: any) {
        this.error = e?.statusMessage || e?.message || 'Failed to load Evo profile'
        // still initialize empty registry/sections so UI won’t crash
        this.registry = this.registry || ({} as EvoRegistry)
        for (const key of Object.keys(this.registry)) this.ensureSection(key)
        this.initialized = true
        throw e
      } finally {
        this.loading = false
      }
    },

    /**
     * Save a single section. Pass the whole answer map for that section.
     * On success, merges server-calculated score/progress and latest answers.
     */
    async saveSection(sectionKey: string, answers: EvoAnswerMap) {
      const api = useApi()
      this.error = ''

      // ensure local exists before patch
      this.ensureSection(sectionKey)

      try {
        const res = await api.patch<PatchResponse>(`/api/evo/profile/${encodeURIComponent(sectionKey)}`, {
          answers
        })

        if (!res?.ok) throw new Error('Save failed')

        // Merge any authoritative values from server
        if (res.profile?.sections?.[sectionKey]) {
          this.sections[sectionKey] = { ...res.profile.sections[sectionKey] }
        } else {
          // fall back to what we sent
          this.sections[sectionKey] = { ...answers }
        }

        if (typeof res.profile?.score === 'number') this.score = res.profile.score
        if (typeof res.profile?.progressPct === 'number') this.progressPct = res.profile.progressPct
      } catch (e: any) {
        this.error = e?.statusMessage || e?.message || 'Failed to save section'
        throw e
      }
    },

    /** Optional helper: reset a section locally (does not call server) */
    resetSection(sectionKey: string) {
      this.sections[sectionKey] = {}
    }
  }
})
