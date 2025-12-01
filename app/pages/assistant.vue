<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useAuth } from '~/stores/auth'

type AssistantProfile = {
  name: string
  gender: 'female' | 'male' | 'nonbinary' | string
  personality?: string
  speakingStyle?: string
  bio?: string
  relationshipType: string // "spouse_partner" | "friend" | "coach" | ...
  voiceId?: string | null
  voiceStability?: number | null
  voiceSimilarity?: number | null
  facts?: Record<string, { value: string; category?: string; updatedAt?: string }> | null
}

type UserVoice = {
  id: string
  provider: string
  voiceId: string
  label?: string | null
  created_at?: string
}

type DefaultVoice = { id: string; name: string; tagline: string }

const auth = useAuth()

/** Default/preset voices (your list) */
const DEFAULT_VOICES: DefaultVoice[] = [
  { name: 'Jason',        tagline: 'Young man',                                  id: '5kMbtRSEKIkRZSdXxrZg' },
  { name: 'Miss Walker',  tagline: 'Southern Voice · Female',                    id: 'DLsHlh26Ugcm6ELvS0qi' },
  { name: 'Ms Moi',       tagline: 'Female American Voice',                      id: 'zubqz6JC54rePKNCKZLG' },
  { name: 'Miss Maysie',  tagline: 'Female · Conversational · Calm & Reassuring', id: 'QPBKI85w0cdXVqMSJ6WB' },
  { name: 'Biyanca',      tagline: 'Female · Conversational',                    id: '46o7SwbGIeXFJ5xZ3ZGX' },
  { name: 'Rusell',       tagline: 'Male · Young American',                      id: 'ZauUyVXAz5znrgRuElJ5' },
]

// ----- UI state -----
const loading = ref(true)
const saving = ref(false)
const msg = ref<string>('')

// Assistant profile model
const profile = ref<AssistantProfile>({
  name: 'Evo',
  gender: 'female',
  personality: 'friendly',
  speakingStyle: 'casual',
  bio: '',
  relationshipType: 'spouse_partner',
  voiceId: '',
  voiceStability: 0.5,
  voiceSimilarity: 0.75,
})

// selected voiceId is bound to profile.voiceId
const selectedVoiceId = computed({
  get: () => profile.value.voiceId || '',
  set: (v: string) => { profile.value.voiceId = v || null }
})

// Uploaded voices list
const uploads = ref<UserVoice[]>([])

// Upload form
const uploadFile = ref<File | null>(null)
const uploadLabel = ref<string>('')

// Facts management
const newFactKey = ref<string>('')
const newFactValue = ref<string>('')
const newFactCategory = ref<string>('general')

// Helpers
const $api = <T>(url: string, opts: any = {}) =>
  $fetch<T>(url, { credentials: 'include', ...opts })

async function load() {
  loading.value = true
  msg.value = ''
  try {
    await auth.ensure()
    const ap = await $api<{ profile: Partial<AssistantProfile> }>('/api/assistant-profile')
      .catch(() => ({ profile: {} } as any))

    if (ap?.profile) {
      profile.value = {
        ...profile.value,
        ...ap.profile,
        // ensure defaults when null/undefined
        name: ap.profile.name ?? profile.value.name,
        gender: (ap.profile.gender as any) ?? profile.value.gender,
        personality: ap.profile.personality ?? profile.value.personality,
        speakingStyle: ap.profile.speakingStyle ?? profile.value.speakingStyle,
        bio: ap.profile.bio ?? profile.value.bio,
        relationshipType: ap.profile.relationshipType ?? profile.value.relationshipType,
        voiceId: ap.profile.voiceId ?? profile.value.voiceId,
        voiceStability: ap.profile.voiceStability ?? profile.value.voiceStability,
        voiceSimilarity: ap.profile.voiceSimilarity ?? profile.value.voiceSimilarity,
      }
    }

    const v = await $api<{ items: UserVoice[] }>('/api/voices').catch(() => ({ items: [] }))
    uploads.value = Array.isArray(v?.items) ? v.items : []
  } catch (e: any) {
    msg.value = e?.data?.message || e?.message || 'Failed to load assistant profile'
  } finally {
    loading.value = false
  }
}

async function save() {
  saving.value = true
  msg.value = ''
  try {
    const body: AssistantProfile = {
      ...profile.value,
      voiceId: selectedVoiceId.value || null,
      voiceStability: profile.value.voiceStability ?? null,
      voiceSimilarity: profile.value.voiceSimilarity ?? null,
    }
    await $api('/api/assistant-profile', { method: 'POST', body })
    msg.value = 'Saved!'
  } catch (e: any) {
    msg.value = e?.data?.message || e?.message || 'Save failed'
  } finally {
    saving.value = false
  }
}

function onPickVoice(id: string) {
  selectedVoiceId.value = id
}

async function onUploadVoice() {
  msg.value = ''
  if (!uploadFile.value) { msg.value = 'Please choose an audio file.'; return }
  try {
    const fd = new FormData()
    fd.append('file', uploadFile.value)
    if (uploadLabel.value?.trim()) fd.append('label', uploadLabel.value.trim())
    // optional: fd.append('provider', 'elevenlabs')
    const r = await fetch('/api/voices/upload', {
      method: 'POST',
      credentials: 'include',
      body: fd
    })
    if (!r.ok) throw new Error(`Upload failed: ${r.status}`)
    const j = await r.json()
    if (j?.item) {
      uploads.value.unshift(j.item as UserVoice)
      // auto-select newly uploaded voice
      if (j.item.voiceId) selectedVoiceId.value = j.item.voiceId
    }
    uploadFile.value = null
    uploadLabel.value = ''
    msg.value = 'Voice uploaded.'
  } catch (e: any) {
    msg.value = e?.message || 'Upload failed'
  }
}

function removeUpload(id: string) {
  // optional: wire to DELETE /api/voices/:id
  // For now, just optimistically remove from list. Uncomment if you implement:
  // await $api(`/api/voices/${id}`, { method: 'DELETE' })
  uploads.value = uploads.value.filter(v => v.id !== id)
  if (!uploads.value.some(u => u.voiceId === selectedVoiceId.value)) {
    // if current selected was removed, clear selection
    if (!DEFAULT_VOICES.some(d => d.id === selectedVoiceId.value)) {
      selectedVoiceId.value = ''
    }
  }
}

const sortedUploads = computed(() =>
  [...uploads.value].sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''))
)

const factsArray = computed(() => {
  const facts = profile.value.facts || {}
  return Object.entries(facts).map(([key, data]) => ({
    key,
    value: data.value,
    category: data.category || 'general',
    updatedAt: data.updatedAt,
  }))
})

async function addFact() {
  msg.value = ''
  const key = newFactKey.value.trim()
  const value = newFactValue.value.trim()

  if (!key || !value) {
    msg.value = 'Both fact key and value are required'
    return
  }

  try {
    const result = await $api<{ ok: boolean; facts: any }>('/api/assistant-profile/fact', {
      method: 'POST',
      body: {
        key,
        value,
        category: newFactCategory.value || 'general',
      },
    })

    if (result.ok) {
      profile.value.facts = result.facts
      newFactKey.value = ''
      newFactValue.value = ''
      newFactCategory.value = 'general'
      msg.value = 'Fact added successfully!'
    }
  } catch (e: any) {
    msg.value = e?.data?.message || e?.message || 'Failed to add fact'
  }
}

async function deleteFact(key: string) {
  msg.value = ''
  try {
    const result = await $api<{ ok: boolean; facts: any }>('/api/assistant-profile/fact', {
      method: 'DELETE',
      body: { key },
    })

    if (result.ok) {
      profile.value.facts = result.facts
      msg.value = 'Fact deleted successfully!'
    }
  } catch (e: any) {
    msg.value = e?.data?.message || e?.message || 'Failed to delete fact'
  }
}

onMounted(load)
</script>

<template>
  <div class="mx-auto max-w-5xl p-6 space-y-8">
    <header class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-semibold">Assistant settings</h1>
        <p class="text-sm text-gray-600">Customize Evo’s identity and voice.</p>
      </div>
      <button
        class="px-4 py-2 rounded-md text-white bg-green-600 hover:bg-green-700 disabled:opacity-50"
        :disabled="saving || loading"
        @click="save"
      >
        {{ saving ? 'Saving…' : 'Save changes' }}
      </button>
    </header>

    <div v-if="msg" class="text-sm" :class="msg.includes('fail') || msg.includes('Failed') ? 'text-red-600' : 'text-green-600'">
      {{ msg }}
    </div>

    <div v-if="loading" class="text-gray-500">Loading…</div>

    <div v-else class="grid lg:grid-cols-3 gap-6">
      <!-- Left: Identity -->
      <section class="lg:col-span-1 p-4 bg-white rounded-xl shadow border border-gray-100 space-y-4">
        <h2 class="text-lg font-semibold">Identity</h2>
        <div>
          <label class="block text-sm font-medium text-gray-700">Name</label>
          <input v-model.trim="profile.name" class="mt-1 block w-full rounded-md border border-gray-300 p-2" />
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-sm font-medium text-gray-700">Gender</label>
            <input v-model.trim="profile.gender" class="mt-1 block w-full rounded-md border border-gray-300 p-2" placeholder="female" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700">Relationship</label>
            <select v-model="profile.relationshipType" class="mt-1 block w-full rounded-md border border-gray-300 p-2">
              <option value="spouse_partner">Spouse / Partner</option>
              <option value="friend">Friend</option>
              <option value="coach">Coach</option>
              <option value="assistant">Assistant</option>
            </select>
          </div>
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-sm font-medium text-gray-700">Personality</label>
            <input v-model.trim="profile.personality" class="mt-1 block w-full rounded-md border border-gray-300 p-2" placeholder="friendly" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700">Speaking style</label>
            <input v-model.trim="profile.speakingStyle" class="mt-1 block w-full rounded-md border border-gray-300 p-2" placeholder="casual" />
          </div>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700">Bio</label>
          <textarea v-model.trim="profile.bio" rows="4" class="mt-1 block w-full rounded-md border border-gray-300 p-2" placeholder="Short backstory or greeting…" />
        </div>
      </section>


      <!-- Right: Voice -->
      <section class="lg:col-span-2 p-4 bg-white rounded-xl shadow border border-gray-100 space-y-6">
        <div class="flex items-center justify-between">
          <h2 class="text-lg font-semibold">Voice</h2>
          <div class="flex items-center gap-3">
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-xs font-medium text-gray-700">Stability</label>
                <input type="number" step="0.01" min="0" max="1" v-model.number="profile.voiceStability" class="mt-1 block w-full rounded-md border border-gray-300 p-1.5" />
              </div>
              <div>
                <label class="block text-xs font-medium text-gray-700">Similarity</label>
                <input type="number" step="0.01" min="0" max="1" v-model.number="profile.voiceSimilarity" class="mt-1 block w-full rounded-md border border-gray-300 p-1.5" />
              </div>
            </div>
          </div>
        </div>

        <!-- Preset voices -->
        <div>
          <h3 class="text-sm font-medium text-gray-700 mb-2">Preset voices</h3>
          <div class="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
            <label
              v-for="v in DEFAULT_VOICES"
              :key="v.id"
              class="group relative cursor-pointer rounded-2xl border bg-white p-4 shadow-sm transition hover:shadow-md"
              :class="selectedVoiceId === v.id ? 'border-brand-600 ring-2 ring-brand-600 ring-offset-1' : 'border-gray-200 hover:border-gray-300'"
              @click="onPickVoice(v.id)"
            >
              <input
                class="sr-only"
                type="radio"
                name="voice"
                :value="v.id"
                :checked="selectedVoiceId === v.id"
                @change="onPickVoice(v.id)"
              />
              <div class="flex items-start gap-3">
                <span class="mt-1 inline-flex h-5 w-5 items-center justify-center rounded-full border"
                      :class="selectedVoiceId === v.id ? 'border-brand-600' : 'border-gray-300'">
                  <span class="h-3 w-3 rounded-full" :class="selectedVoiceId === v.id ? 'bg-brand-600' : 'bg-transparent'" />
                </span>
                <div>
                  <div class="font-semibold">{{ v.name }}</div>
                  <div class="text-sm text-gray-600">{{ v.tagline }}</div>
                  <code class="text-[11px] text-gray-500 mt-1 block">{{ v.id }}</code>
                </div>
              </div>
              <span aria-hidden="true" class="pointer-events-none absolute inset-0 rounded-2xl group-hover:bg-gray-50/40" />
            </label>
          </div>
        </div>

        <!-- Your uploads -->
        <div class="pt-2">
          <h3 class="text-sm font-medium text-gray-700 mb-2">Your uploaded voices</h3>
          <div v-if="sortedUploads.length === 0" class="text-sm text-gray-600">No uploads yet.</div>
          <div v-else class="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
            <label
              v-for="u in sortedUploads"
              :key="u.id"
              class="group relative cursor-pointer rounded-2xl border bg-white p-4 shadow-sm transition hover:shadow-md"
              :class="selectedVoiceId === u.voiceId ? 'border-brand-600 ring-2 ring-brand-600 ring-offset-1' : 'border-gray-200 hover:border-gray-300'"
              @click="onPickVoice(u.voiceId)"
            >
              <input
                class="sr-only"
                type="radio"
                name="voice"
                :value="u.voiceId"
                :checked="selectedVoiceId === u.voiceId"
                @change="onPickVoice(u.voiceId)"
              />
              <div class="flex items-start gap-3">
                <span class="mt-1 inline-flex h-5 w-5 items-center justify-center rounded-full border"
                      :class="selectedVoiceId === u.voiceId ? 'border-brand-600' : 'border-gray-300'">
                  <span class="h-3 w-3 rounded-full" :class="selectedVoiceId === u.voiceId ? 'bg-brand-600' : 'bg-transparent'" />
                </span>
                <div class="min-w-0">
                  <div class="flex items-center gap-2">
                    <div class="font-semibold truncate">{{ u.label || 'Custom voice' }}</div>
                    <span class="text-[11px] rounded bg-gray-50 px-1.5 py-0.5 text-gray-500">{{ u.provider }}</span>
                  </div>
                  <code class="text-[11px] text-gray-500 mt-0.5 block truncate">{{ u.voiceId }}</code>
                  <div class="mt-2 flex items-center gap-2">
                    <button type="button"
                            class="text-xs rounded-md border px-2 py-1 hover:bg-gray-50"
                            @click.stop="onPickVoice(u.voiceId)">
                      Use this
                    </button>
                    <button type="button"
                            class="text-xs rounded-md border px-2 py-1 hover:bg-gray-50"
                            @click.stop="removeUpload(u.id)">
                      Remove
                    </button>
                  </div>
                </div>
              </div>
              <span aria-hidden="true" class="pointer-events-none absolute inset-0 rounded-2xl group-hover:bg-gray-50/40" />
            </label>
          </div>
        </div>

        <!-- Upload new -->
        <div class="pt-4 border-t">
          <h3 class="text-sm font-medium text-gray-700 mb-2">Upload your own voice</h3>
          <div class="grid sm:grid-cols-5 gap-3 items-end">
            <div class="sm:col-span-3">
              <label class="block text-xs font-medium text-gray-700">Audio file</label>
              <input
                type="file"
                accept="audio/*"
                class="mt-1 block w-full text-sm"
                @change="(e:any)=>{ uploadFile = e?.target?.files?.[0] || null }"
              />
              <p class="text-xs text-gray-500 mt-1">We’ll create a provider voice and store its voiceId.</p>
            </div>
            <div class="sm:col-span-2">
              <label class="block text-xs font-medium text-gray-700">Label</label>
              <input v-model.trim="uploadLabel" class="mt-1 block w-full rounded-md border border-gray-300 p-2" placeholder="e.g., My Calm Voice" />
            </div>
            <div class="sm:col-span-5">
              <button
                type="button"
                class="mt-1 px-3 py-2 rounded-md border border-gray-300 hover:bg-gray-50"
                @click="onUploadVoice"
              >
                Upload
              </button>
            </div>
          </div>
        </div>

      </section>
    </div>

    <!-- Assistant Facts Section -->
    <div class="p-4 bg-white rounded-xl shadow border border-gray-100 space-y-4">
      <h2 class="text-lg font-semibold">Assistant Facts</h2>
      <p class="text-sm text-gray-600">Add biographical facts about your assistant (e.g., hobbies, background, preferences).</p>

      <!-- Add new fact form -->
      <div class="grid grid-cols-1 md:grid-cols-5 gap-3 p-4 bg-gray-50 rounded-lg">
        <div class="md:col-span-2">
          <label class="block text-sm font-medium text-gray-700">Fact Key</label>
          <input
            v-model.trim="newFactKey"
            class="mt-1 block w-full rounded-md border border-gray-300 p-2"
            placeholder="e.g., hometown, favorite_color"
          />
        </div>
        <div class="md:col-span-2">
          <label class="block text-sm font-medium text-gray-700">Fact Value</label>
          <input
            v-model.trim="newFactValue"
            class="mt-1 block w-full rounded-md border border-gray-300 p-2"
            placeholder="e.g., Seattle, blue"
          />
        </div>
        <div class="md:col-span-1">
          <label class="block text-sm font-medium text-gray-700">Category</label>
          <select
            v-model="newFactCategory"
            class="mt-1 block w-full rounded-md border border-gray-300 p-2"
          >
            <option value="general">General</option>
            <option value="background">Background</option>
            <option value="preferences">Preferences</option>
            <option value="personality">Personality</option>
            <option value="interests">Interests</option>
          </select>
        </div>
        <div class="md:col-span-5">
          <button
            type="button"
            class="px-4 py-2 rounded-md text-white bg-blue-600 hover:bg-blue-700"
            @click="addFact"
          >
            Add Fact
          </button>
        </div>
      </div>

      <!-- Facts list -->
      <div v-if="factsArray.length === 0" class="text-sm text-gray-600">
        No facts added yet.
      </div>
      <div v-else class="space-y-2">
        <div
          v-for="fact in factsArray"
          :key="fact.key"
          class="flex items-start justify-between p-3 bg-gray-50 rounded-lg"
        >
          <div class="flex-1">
            <div class="flex items-center gap-2">
              <span class="font-semibold text-gray-900">{{ fact.key }}</span>
              <span class="text-xs rounded bg-gray-200 px-2 py-0.5 text-gray-600">
                {{ fact.category }}
              </span>
            </div>
            <p class="text-sm text-gray-700 mt-1">{{ fact.value }}</p>
            <p v-if="fact.updatedAt" class="text-xs text-gray-500 mt-1">
              Updated: {{ new Date(fact.updatedAt).toLocaleString() }}
            </p>
          </div>
          <button
            type="button"
            class="ml-4 px-3 py-1 text-sm rounded-md border border-red-300 text-red-600 hover:bg-red-50"
            @click="deleteFact(fact.key)"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Use your brand CSS variables if defined */
:root {
  --brand-600: var(--color-primary-600, #016d77);
  --brand-700: var(--color-primary-700, #075860);
}
.bg-brand-600 { background-color: var(--brand-600); }
.hover\:bg-brand-700:hover { background-color: var(--brand-700); }
.border-brand-600 { border-color: var(--brand-600); }
.ring-brand-600 { --tw-ring-color: var(--brand-600); }
</style>
