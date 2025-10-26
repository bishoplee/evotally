<script setup lang="ts">
definePageMeta({ ssr: false })

import { ref, computed, onMounted } from 'vue'
import ClickToTalk from './components/ClickToTalk.vue'
import { useAuth } from '~/stores/auth'

type Gender = 'male' | 'female'
type VoiceRow = {
  id: string
  provider: string
  voiceId: string
  label?: string | null
  isDefault?: boolean
  settings?: Record<string, any> | null
}

const auth = useAuth()
const runtime = useRuntimeConfig()
const gatewayUrl = 'https://gw.cimb.us:5000'

// ---- State ----
const loading = ref(true)
const err = ref('')
const profile = ref<{
  name?: string
  gender?: Gender
  relationshipType?: string
  speakingStyle?: string
  voiceId?: string | null
}>({
  name: 'Evo',
  gender: 'female',
  relationshipType: 'spouse_partner',
  speakingStyle: 'casual',
  voiceId: null
})

const voices = ref<VoiceRow[]>([])
const selected = computed(() => {
  if (!profile.value.voiceId) return null
  return voices.value.find(v => v.voiceId === profile.value.voiceId) || null
})

// Friendly label for relationship
const relationLabel = computed(() => {
  const map: Record<string, string> = {
    spouse_partner: 'Spouse / Partner',
    friend: 'Friend',
    coach: 'Coach'
  }
  return map[profile.value.relationshipType || ''] || (profile.value.relationshipType || '—')
})

// Avatar emoji (quick visual)
const avatar = computed(() => (profile.value.gender === 'male' ? '🧑‍💼' : '👩‍💼'))

async function load() {
  err.value = ''
  loading.value = true
  try {
    await auth.ensure()
    const p = await $fetch<{ profile: any }>('/api/assistant-profile', { credentials: 'include' }).catch(() => null)
    if (p?.profile) {
      profile.value.name = p.profile.name || 'Evo'
      profile.value.gender = (p.profile.gender === 'male' ? 'male' : 'female')
      profile.value.relationshipType = p.profile.relationshipType || 'spouse_partner'
      profile.value.speakingStyle = p.profile.speakingStyle || 'casual'
      profile.value.voiceId = p.profile.voiceId || null
    }
    const v = await $fetch<{ items: VoiceRow[] }>('/api/voices?provider=elevenlabs', { credentials: 'include' }).catch(() => ({ items: [] }))
    voices.value = v?.items || []
  } catch (e: any) {
    err.value = e?.message || 'Failed to load assistant/voice'
  } finally {
    loading.value = false
  }
}

function shortId(id?: string | null) {
  if (!id) return '—'
  return id.length > 12 ? id.slice(0, 6) + '…' + id.slice(-4) : id
}

async function say(text: string) {
  try {
    await auth.ensure()
    if (!auth.accessToken) throw new Error('Not authenticated')
    const r = await fetch(`${gatewayUrl}/dev/tts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${auth.accessToken}`
      },
      body: JSON.stringify({ text })
    })
    if (!r.ok) throw new Error(`Gateway TTS failed (${r.status})`)
  } catch (e: any) {
    err.value = e?.message || 'Failed to speak'
  }
}

const sampleLines = [
  "Hi, I'm your companion. How can I help you right now?",
  "I can look up places nearby, manage your schedule, or just chat.",
  "Would you like a quick check of the weather and your day?"
]

onMounted(load)
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-start justify-between">
      <div>
        <h1 class="text-2xl font-semibold">Evo - Your Companion</h1>
      </div>
      <NuxtLink
        to="/assistant"
        class="inline-flex items-center gap-2 px-3 py-2 rounded-md bg-green-600 text-white hover:bg-green-700"
        title="Edit assistant personality and voice"
      >
        Update Assistant
        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 opacity-90" viewBox="0 0 20 20" fill="currentColor"><path d="M12.293 2.293a1 1 0 011.414 0L18 6.586V9a1 1 0 01-1 1h-1v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-1H3a1 1 0 01-1-1V8a2 2 0 012-2h5V5a1 1 0 01.293-.707l3-3zM11 6h2.586L11 3.414V6z"/></svg>
      </NuxtLink>
    </div>

    <div v-if="err" class="p-3 text-sm rounded-md bg-red-50 text-red-700 border border-red-200">
      {{ err }}
    </div>

    <!-- Click to Talk -->
    <section>
      <ClickToTalk />
    </section>

    <!-- Overview -->
    <section class="grid md:grid-cols-2 gap-6">
      <div class="p-4 bg-white rounded-xl shadow border border-gray-100">
        <div class="flex items-center gap-3">
          <div class="text-3xl">{{ avatar }}</div>
          <div>
            <h2 class="text-lg font-semibold">
              {{ profile.name || 'Evo' }}
            </h2>
            <p class="text-sm text-gray-600">
              {{ relationLabel }} • <span class="capitalize">{{ profile.gender || 'female' }}</span> •
              <span class="capitalize">{{ profile.speakingStyle || 'casual' }}</span> style
            </p>
          </div>
        </div>
        <p class="text-sm text-gray-600 mt-3">
          Your assistant’s behavior and voice are customizable. Click “Update Assistant” to change personality,
          tone, and default voice.
        </p>
      </div>

      <!-- Current Voice -->
      <div class="p-4 bg-white rounded-xl shadow border border-gray-100">
        <h3 class="text-lg font-semibold mb-2">Current Voice</h3>
        <div v-if="loading" class="text-sm text-gray-500">Loading voice…</div>
        <div v-else class="space-y-2">
          <div class="flex items-start justify-between">
            <div>
              <div class="font-medium">
                {{ selected?.label || 'Custom voice' }}
              </div>
              <div class="text-xs text-gray-600">
                Provider: {{ selected?.provider || 'elevenlabs' }} • ID: {{ shortId(profile.voiceId) }}
              </div>
              <div v-if="selected?.settings" class="text-xs text-gray-500 mt-1">
                Stability: {{ (selected.settings.stability ?? 0.5).toFixed(2) }},
                Similarity: {{ (selected.settings.similarityBoost ?? 0.75).toFixed(2) }}
              </div>
            </div>
            <NuxtLink to="/assistant" class="text-sm text-brand-600 hover:text-brand-700">
              Change voice →
            </NuxtLink>
          </div>

          <div class="mt-3">
            <div class="flex flex-wrap items-center gap-2">
              <button
                class="px-3 py-2 rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
               @click="say('Hi, this is a quick test of your  current voice.')"
              >
                Test: Greeting
              </button>
              <button
                v-for="line in sampleLines"
                :key="line"
                class="px-3 py-2 rounded-md border border-gray-300 hover:bg-gray-50 text-sm"
                @click="say(line)"
              >
                Say: "{{ line.slice(0, 28) }}…"
              </button>
            </div>
            <p class="text-xs text-gray-500 mt-2">
              Uses your gateway’s /dev/tts endpoint with your current auth token.
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- Your Voices -->
    <section class="p-4 bg-white rounded-xl shadow border border-gray-100">
      <div class="flex items-center justify-between mb-2">
        <h3 class="text-lg font-semibold">Your Voices (ElevenLabs)</h3>
        <NuxtLink to="/assistant" class="text-sm text-brand-600 hover:text-brand-700">
          Manage & upload →
        </NuxtLink>
      </div>
      <div v-if="loading" class="text-sm text-gray-500">Loading voices…</div>
      <div v-else-if="voices.length === 0" class="text-sm text-gray-600">
        You have no uploaded voices yet. Visit the Assistant page to add one.
      </div>
      <ul v-else class="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        <li
          v-for="v in voices"
          :key="v.id"
          class="rounded-xl border border-gray-200 p-3"
          :class="v.voiceId === profile.voiceId ? 'ring-2 ring-brand-600' : ''"
        >
          <div class="flex items-start justify-between">
            <div>
              <div class="font-medium">
                {{ v.label || 'Untitled Voice' }}
              </div>
              <div class="text-xs text-gray-600">
                {{ v.provider }} • {{ shortId(v.voiceId) }}
              </div>
            </div>
            <span
              v-if="v.isDefault || v.voiceId === profile.voiceId"
              class="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 border border-green-200"
              title="This is your current/default voice"
            >
              Default
            </span>
          </div>
          <div class="mt-2 flex items-center gap-2">
            <button
              class="px-3 py-1.5 rounded-md text-white bg-indigo-600 hover:bg-indigo-700 text-xs"
              @click="say(`Testing voice ${v.label || 'selection'}. How do I sound to you today?`)"
            >
              Test
            </button>
            <NuxtLink to="/assistant" class="text-xs text-brand-600 hover:text-brand-700">
              Make default
            </NuxtLink>
          </div>
        </li>
      </ul>
    </section>
  </div>
</template>

<style scoped>
/* brand helpers (optional if Tailwind custom properties exist already) */
:root {
  --brand-600: #016d77;
  --brand-700: #075860;
}
.bg-brand-600 { background-color: var(--brand-600); }
.hover\:bg-brand-700:hover { background-color: var(--brand-700); }
.text-brand-600 { color: var(--brand-600); }
.hover\:text-brand-700:hover { color: var(--brand-700); }
.ring-brand-600 { --tw-ring-color: var(--brand-600); }
</style>
