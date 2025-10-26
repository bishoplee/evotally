<script setup lang="ts">
definePageMeta({ public: true })

import { ref, computed, onMounted } from 'vue'
import { useAuth } from '~/stores/auth'

type AssistantProfile = {
  name?: string
  gender?: 'male' | 'female'
  relationshipType?: string
  speakingStyle?: string
  voiceId?: string | null
}

type VoiceRow = {
  id: string
  provider: string
  voiceId: string
  label?: string | null
  isDefault?: boolean
  settings?: Record<string, any> | null
}

type SessionRow = {
  id: string
  title?: string | null
  started_at?: string
}

const auth = useAuth()
const rt = useRuntimeConfig()
const gatewayUrl = 'https://gw.cimb.us:5000'

/* ---------- state ---------- */
const loading = ref(true)
const err = ref('')

const me = ref<{ id?: string; email?: string; display_name?: string } | null>(null)

const assistant = ref<AssistantProfile>({
  name: 'Evo',
  gender: 'female',
  relationshipType: 'spouse_partner',
  speakingStyle: 'casual',
  voiceId: null
})

const voices = ref<VoiceRow[]>([])
const recentSessions = ref<SessionRow[]>([])

const google = ref<{ connected: boolean; expiry?: string | null }>({ connected: false, expiry: null })
const gateway = ref<{ ok: boolean; tts?: boolean; peers?: number } | null>(null)

const isAuthed = computed(() => auth.isAuthed)
const selectedVoice = computed(() => voices.value.find(v => v.voiceId === assistant.value.voiceId) || null)
const assistantAvatar = computed(() => (assistant.value.gender === 'male' ? '🧑‍💼' : '👩‍💼'))

/* ---------- helpers ---------- */
function shortId(id?: string | null) {
  if (!id) return '—'
  return id.length > 12 ? id.slice(0, 6) + '…' + id.slice(-4) : id
}
function relLabel(tag?: string) {
  const map: Record<string, string> = {
    spouse_partner: 'Spouse / Partner',
    friend: 'Friend',
    coach: 'Coach'
  }
  return map[tag || ''] || tag || '—'
}

/* ---------- network ---------- */
async function loadAuthedBits() {
  try {
    await auth.ensure()
    if (!auth.isAuthed) return

    // Identity (cheap)
    const meResp = await $fetch<{ user: any | null }>('/api/auth/me', { credentials: 'include' }).catch(() => null)
    me.value = meResp?.user || null

    // Assistant profile
    const ap = await $fetch<{ profile: AssistantProfile }>('/api/assistant-profile', { credentials: 'include' }).catch(() => null)
    if (ap?.profile) assistant.value = { ...assistant.value, ...ap.profile }

    // Voices (provider defaults to elevenlabs for now)
    const vr = await $fetch<{ items: VoiceRow[] }>('/api/voices?provider=elevenlabs', { credentials: 'include' }).catch(() => ({ items: [] }))
    voices.value = vr?.items || []

    // Recent sessions (if you have this endpoint; otherwise harmless)
    const sr = await $fetch<{ items: SessionRow[] }>('/api/sessions?limit=5', { credentials: 'include' }).catch(() => ({ items: [] }))
    recentSessions.value = sr?.items || []

    // Google status
    const g = await $fetch<{ connected: boolean; expiry?: string }>(
      '/api/integrations/google',
      { credentials: 'include' }
    ).catch(() => null)
    if (g) google.value = { connected: !!g.connected, expiry: g.expiry || null }
  } catch (e: any) {
    err.value = e?.message || 'Failed to load dashboard data'
  }
}

async function pingGateway() {
  try {
    const r = await fetch(`${gatewayUrl}/health`, { credentials: 'omit' })
    if (!r.ok) throw new Error(String(r.status))
    const j = await r.json().catch(() => ({}))
    gateway.value = {
      ok: true,
      tts: Boolean(j?.eleven_voice),
      peers: Number(j?.active_peers || 0)
    }
  } catch {
    gateway.value = { ok: false }
  }
}

onMounted(async () => {
  loading.value = true
  try {
    await loadAuthedBits()
    await pingGateway()
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="mx-auto max-w-6xl p-6 space-y-8">
    <!-- Hero / Welcome -->
    <header class="flex items-start justify-between">
      <div>
        <h1 class="text-2xl font-semibold">Welcome{{ me?.display_name ? `, ${me.display_name}` : '' }} 👋</h1>
        <p class="text-sm text-gray-600">
          Your AI companion with voice. Jump in with quick actions below.
        </p>
      </div>
      <div class="flex items-center gap-3">
        <NuxtLink
          v-if="!isAuthed"
          to="/login"
          class="px-3 py-2 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white text-sm"
        >
          Sign in
        </NuxtLink>
        <NuxtLink
          v-if="!isAuthed"
          to="/register"
          class="px-3 py-2 rounded-md border border-gray-300 hover:bg-gray-50 text-sm"
        >
          Create account
        </NuxtLink>
        <NuxtLink
          v-else
          to="/voice"
          class="px-3 py-2 rounded-md bg-brand-600 hover:bg-brand-700 text-white text-sm"
        >
          Start talking
        </NuxtLink>
      </div>
    </header>

    <!-- Status row -->
    <section class="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <div class="rounded-xl border border-gray-200 bg-white p-4">
        <div class="text-xs uppercase tracking-wide text-gray-500">Auth</div>
        <div class="mt-1 text-sm">
          <span :class="isAuthed ? 'text-green-700' : 'text-gray-600'">
            {{ isAuthed ? 'Signed in' : 'Guest' }}
          </span>
        </div>
        <div v-if="me?.email" class="text-xs text-gray-500 mt-1">{{ me.email }}</div>
      </div>

      <div class="rounded-xl border border-gray-200 bg-white p-4">
        <div class="text-xs uppercase tracking-wide text-gray-500">Gateway</div>
        <div class="mt-1 text-sm">
          <span v-if="gateway?.ok" class="text-green-700">Online</span>
          <span v-else class="text-red-700">Offline</span>
        </div>
        <div class="text-xs text-gray-500 mt-1">
          TTS: {{ gateway?.tts ? 'ready' : '—' }} • Peers: {{ gateway?.peers ?? '—' }}
        </div>
      </div>

      <div class="rounded-xl border border-gray-200 bg-white p-4">
        <div class="text-xs uppercase tracking-wide text-gray-500">Google</div>
        <div class="mt-1 text-sm">
          <span :class="google.connected ? 'text-green-700' : 'text-gray-600'">
            {{ google.connected ? 'Connected' : 'Not connected' }}
          </span>
        </div>
        <div v-if="google.expiry" class="text-xs text-gray-500 mt-1">
          Expires: {{ new Date(google.expiry).toLocaleString() }}
        </div>
      </div>

      <div class="rounded-xl border border-gray-200 bg-white p-4">
        <div class="text-xs uppercase tracking-wide text-gray-500">Quick links</div>
        <div class="mt-2 flex flex-wrap gap-2">
          <NuxtLink to="/facts" class="text-sm text-brand-600 hover:text-brand-700">Facts</NuxtLink>
          <NuxtLink to="/assistant" class="text-sm text-brand-600 hover:text-brand-700">Assistant</NuxtLink>
          <NuxtLink to="/voice" class="text-sm text-brand-600 hover:text-brand-700">Voice</NuxtLink>
        </div>
      </div>
    </section>

    <!-- Assistant overview / Voice card -->
    <section class="grid md:grid-cols-2 gap-6">
      <div class="p-5 bg-white rounded-xl border border-gray-200">
        <div class="flex items-center gap-3">
          <div class="text-3xl">{{ assistantAvatar }}</div>
          <div>
            <h2 class="text-lg font-semibold">Assistant</h2>
            <p class="text-sm text-gray-600">
              {{ assistant.name || 'Evo' }} • <span class="capitalize">{{ assistant.gender }}</span> •
              {{ relLabel(assistant.relationshipType) }} • {{ assistant.speakingStyle || 'casual' }}
            </p>
          </div>
        </div>
        <p class="text-sm text-gray-600 mt-3">
          Your assistant’s personality and defaults live here.
        </p>
        <div class="mt-3">
          <NuxtLink to="/assistant" class="px-3 py-2 rounded-md bg-gray-900 text-white text-sm hover:bg-black">
            Update assistant
          </NuxtLink>
        </div>
      </div>

      <div class="p-5 bg-white rounded-xl border border-gray-200">
        <h3 class="text-lg font-semibold">Current Voice</h3>
        <div v-if="!isAuthed" class="text-sm text-gray-600 mt-1">
          Sign in to view and test your voice.
        </div>
        <template v-else>
          <div class="mt-1 text-sm text-gray-700">
            <div class="font-medium">{{ selectedVoice?.label || 'Custom voice' }}</div>
            <div class="text-xs text-gray-500">
              Provider: {{ selectedVoice?.provider || 'elevenlabs' }} • ID: {{ shortId(assistant.voiceId) }}
            </div>
            <div v-if="selectedVoice?.settings" class="text-xs text-gray-500 mt-1">
              Stability: {{ (selectedVoice.settings.stability ?? 0.5).toFixed(2) }},
              Similarity: {{ (selectedVoice.settings.similarityBoost ?? 0.75).toFixed(2) }}
            </div>
          </div>
          <div class="mt-3 flex items-center gap-2">
            <NuxtLink to="/voice" class="px-3 py-2 rounded-md bg-indigo-600 text-white text-sm hover:bg-indigo-700">
              Test voice
            </NuxtLink>
            <NuxtLink to="/assistant" class="text-sm text-brand-600 hover:text-brand-700">
              Change voice →
            </NuxtLink>
          </div>
        </template>
      </div>
    </section>

    <!-- Recent activity + Next steps -->
    <section class="grid md:grid-cols-3 gap-6">
      <div class="md:col-span-2 p-5 bg-white rounded-xl border border-gray-200">
        <div class="flex items-center justify-between">
          <h3 class="text-lg font-semibold">Recent Conversations</h3>
          <NuxtLink to="/voice" class="text-sm text-brand-600 hover:text-brand-700">Open voice</NuxtLink>
        </div>
        <div v-if="!isAuthed" class="text-sm text-gray-600 mt-2">
          Sign in to see recent conversations.
        </div>
        <ul v-else class="mt-3 divide-y divide-gray-100">
          <li v-if="recentSessions.length === 0" class="py-2 text-sm text-gray-600">
            No sessions yet. Click “Start talking” to begin.
          </li>
          <li v-for="s in recentSessions" :key="s.id" class="py-2">
            <div class="text-sm font-medium">{{ s.title || 'Conversation' }}</div>
            <div class="text-xs text-gray-500">
              {{ s.started_at ? new Date(s.started_at).toLocaleString() : '—' }}
            </div>
          </li>
        </ul>
      </div>

      <div class="p-5 bg-white rounded-xl border border-gray-200">
        <h3 class="text-lg font-semibold">Next steps</h3>
        <ul class="mt-2 text-sm list-disc ml-4 space-y-1 text-gray-700">
          <li><NuxtLink to="/assistant" class="text-brand-600 hover:text-brand-700">Tune your assistant’s personality</NuxtLink></li>
          <li><NuxtLink to="/voice" class="text-brand-600 hover:text-brand-700">Try click-to-talk and TTS</NuxtLink></li>
          <li><NuxtLink to="/facts" class="text-brand-600 hover:text-brand-700">Add personal facts for better replies</NuxtLink></li>
          <li><NuxtLink to="/profile" class="text-brand-600 hover:text-brand-700">Set your profile & timezone</NuxtLink></li>
        </ul>
      </div>
    </section>

    <div v-if="err" class="p-3 text-sm rounded-md bg-red-50 text-red-700 border border-red-200">
      {{ err }}
    </div>
  </div>
</template>

<style scoped>
:root {
  --brand-600: #016d77;
  --brand-700: #075860;
}
.bg-brand-600 { background-color: var(--brand-600); }
.hover\:bg-brand-700:hover { background-color: var(--brand-700); }
.text-brand-600 { color: var(--brand-600); }
.hover\:text-brand-700:hover { color: var(--brand-700); }
</style>
