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
const showVoiceSettings = ref(false)

const selected = computed(() => {
  if (!profile.value.voiceId) return null
  return voices.value.find(v => v.voiceId === profile.value.voiceId) || null
})

const relationLabel = computed(() => {
  const map: Record<string, string> = {
    spouse_partner: 'Spouse / Partner',
    friend: 'Friend',
    coach: 'Coach'
  }
  return map[profile.value.relationshipType || ''] || (profile.value.relationshipType || 'Companion')
})

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
    const r = await fetch('https://gw.cimb.us:5000/dev/tts', {
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
  "Hi, I'm your companion. How can I help you today?",
  "Tell me about your day so far.",
  "I'm here to listen and help with whatever you need."
]

onMounted(load)
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50">
    <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
      <!-- Header -->
      <div class="text-center mb-8">
        <div class="flex items-center justify-center gap-3 mb-4">
          <div class="text-5xl">{{ avatar }}</div>
          <div class="text-left">
            <h1 class="text-3xl font-bold text-gray-900">
              {{ profile.name || 'Evo' }}
            </h1>
            <p class="text-sm text-gray-600">
              Your {{ relationLabel }} • <span class="capitalize">{{ profile.speakingStyle || 'casual' }}</span> style
            </p>
          </div>
        </div>
        <p class="text-lg text-gray-700 max-w-2xl mx-auto">
          Click the orb below to start a voice conversation. I'll listen, remember, and respond naturally.
        </p>
      </div>

      <!-- Error Display -->
      <div v-if="err" class="max-w-2xl mx-auto mb-6">
        <div class="rounded-lg bg-red-50 border border-red-200 p-4 text-sm text-red-700">
          {{ err }}
        </div>
      </div>

      <!-- Main Voice Interface -->
      <div class="max-w-4xl mx-auto">
        <ClickToTalk />
      </div>

      <!-- Quick Actions -->
      <div class="mt-12 max-w-4xl mx-auto">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-lg font-semibold text-gray-900">Quick Actions</h2>
          <button
            @click="showVoiceSettings = !showVoiceSettings"
            class="text-sm text-primary-600 hover:text-primary-700 font-medium"
          >
            {{ showVoiceSettings ? 'Hide' : 'Show' }} Voice Settings
          </button>
        </div>

        <!-- Voice Settings Panel -->
        <div v-if="showVoiceSettings" class="card mb-6 space-y-4">
          <div class="flex items-start justify-between">
            <div>
              <h3 class="font-semibold text-gray-900 mb-1">Current Voice</h3>
              <p class="text-sm text-gray-600">
                {{ selected?.label || 'Custom voice' }}
                <span class="text-gray-400">•</span>
                {{ selected?.provider || 'elevenlabs' }}
              </p>
              <p class="text-xs text-gray-500 mt-1">
                ID: {{ shortId(profile.voiceId) }}
              </p>
            </div>
            <NuxtLink to="/assistant" class="btn-outline text-sm">
              Change Voice
            </NuxtLink>
          </div>

          <!-- Voice Test -->
          <div class="pt-4 border-t border-gray-200">
            <p class="text-sm font-medium text-gray-700 mb-3">Test Your Voice</p>
            <div class="flex flex-wrap gap-2">
              <button
                v-for="line in sampleLines"
                :key="line"
                class="btn-secondary text-sm"
                @click="say(line)"
              >
                "{{ line.slice(0, 35) }}{{ line.length > 35 ? '...' : '' }}"
              </button>
            </div>
          </div>

          <!-- Available Voices -->
          <div v-if="voices.length > 0" class="pt-4 border-t border-gray-200">
            <p class="text-sm font-medium text-gray-700 mb-3">Your Voices ({{ voices.length }})</p>
            <div class="grid sm:grid-cols-2 gap-3">
              <div
                v-for="v in voices"
                :key="v.id"
                class="p-3 rounded-lg border transition-all duration-200"
                :class="v.voiceId === profile.voiceId
                  ? 'border-primary-300 bg-primary-50'
                  : 'border-gray-200 hover:border-gray-300'"
              >
                <div class="flex items-start justify-between">
                  <div class="flex-1 min-w-0">
                    <p class="font-medium text-sm text-gray-900 truncate">
                      {{ v.label || 'Untitled Voice' }}
                    </p>
                    <p class="text-xs text-gray-500 mt-0.5">
                      {{ v.provider }} • {{ shortId(v.voiceId) }}
                    </p>
                  </div>
                  <button
                    class="ml-2 px-2 py-1 text-xs rounded bg-primary-100 text-primary-700 hover:bg-primary-200"
                    @click="say(`Testing ${v.label || 'this voice'}. How do I sound?`)"
                  >
                    Test
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Action Cards -->
        <div class="grid sm:grid-cols-3 gap-4">
          <NuxtLink to="/assistant" class="card hover:shadow-lg transition-shadow duration-300 cursor-pointer group">
            <div class="text-3xl mb-3">⚙️</div>
            <h3 class="font-semibold text-gray-900 mb-1 group-hover:text-primary-600 transition-colors">
              Customize Assistant
            </h3>
            <p class="text-sm text-gray-600">
              Update personality, voice, and speaking style
            </p>
          </NuxtLink>

          <NuxtLink to="/facts" class="card hover:shadow-lg transition-shadow duration-300 cursor-pointer group">
            <div class="text-3xl mb-3">📝</div>
            <h3 class="font-semibold text-gray-900 mb-1 group-hover:text-primary-600 transition-colors">
              View Your Facts
            </h3>
            <p class="text-sm text-gray-600">
              See what your assistant knows about you
            </p>
          </NuxtLink>

          <NuxtLink to="/profile" class="card hover:shadow-lg transition-shadow duration-300 cursor-pointer group">
            <div class="text-3xl mb-3">👤</div>
            <h3 class="font-semibold text-gray-900 mb-1 group-hover:text-primary-600 transition-colors">
              Account Settings
            </h3>
            <p class="text-sm text-gray-600">
              Manage your profile and preferences
            </p>
          </NuxtLink>
        </div>
      </div>

      <!-- Tips Section -->
      <div class="mt-12 max-w-4xl mx-auto">
        <div class="card bg-gradient-to-br from-primary-50 to-white border-primary-100">
          <div class="flex items-start gap-4">
            <div class="text-3xl">💡</div>
            <div class="flex-1">
              <h3 class="font-semibold text-gray-900 mb-2">Tips for Better Conversations</h3>
              <ul class="space-y-2 text-sm text-gray-700">
                <li class="flex items-start">
                  <span class="text-primary-600 mr-2">•</span>
                  <span>Speak naturally and clearly. The assistant will wait for you to finish before responding.</span>
                </li>
                <li class="flex items-start">
                  <span class="text-primary-600 mr-2">•</span>
                  <span>Share context about yourself. The more your assistant knows, the better it can help.</span>
                </li>
                <li class="flex items-start">
                  <span class="text-primary-600 mr-2">•</span>
                  <span>If you need to stop, just click the orb again. Your conversation is saved automatically.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
