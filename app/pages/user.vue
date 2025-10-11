<template>
  <div class="max-w-3xl mx-auto p-6 space-y-6">
    <Breadcrumbs :items="[{ label: 'Home', to: '/' }, { label: 'Profile' }]" />

    <div>
      <h1 class="text-2xl font-semibold">Your Profile</h1>
      <p class="text-sm text-gray-600 mt-1">
        Want to change how I sound?
        <NuxtLink to="/voice" class="text-brand-600 hover:text-brand-700">
          Go to Voice settings →
        </NuxtLink>
      </p>
    </div>

    <div class="grid md:grid-cols-2 gap-6">
      <!-- Profile -->
      <section class="p-4 bg-white rounded-xl shadow border border-gray-100">
        <h2 class="text-lg font-semibold mb-3">Basic info</h2>
        <div class="space-y-3">
          <div>
            <label class="block text-sm font-medium text-gray-700">Name</label>
            <input
              v-model="profile.name"
              class="mt-1 block w-full rounded-md border-gray-300"
              placeholder="Your name"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700">Email</label>
            <input
              v-model="profile.email"
              class="mt-1 block w-full rounded-md border-gray-300"
              placeholder="you@example.com"
            />
            <p class="text-xs text-gray-500 mt-1">
              Used only for context; not sent to third parties unless you wire email access.
            </p>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700">Timezone</label>
            <input
              v-model="profile.timezone"
              class="mt-1 block w-full rounded-md border-gray-300"
              placeholder="America/New_York"
            />
            <p class="text-xs text-gray-500 mt-1">Detected: {{ detectedTz }}</p>
          </div>
        </div>
      </section>

      <!-- Voice quick controls -->
      <section class="p-4 bg-white rounded-xl shadow border border-gray-100">
        <h2 class="text-lg font-semibold mb-3">Voice (ElevenLabs)</h2>
        <div class="space-y-3">
          <div>
            <label class="block text-sm font-medium text-gray-700">Voice ID</label>
            <input
              v-model="voice.elevenVoiceId"
              class="mt-1 block w-full rounded-md border-gray-300"
              placeholder="VOICEXXXXXXXXXXXXXXXX"
            />
            <p class="text-xs text-gray-500 mt-1">
              Paste your ElevenLabs <em>voice_id</em>. For uploads and browsing, use
              <NuxtLink to="/voice" class="text-brand-600 hover:text-brand-700">Voice settings</NuxtLink>.
            </p>
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-sm font-medium text-gray-700">Stability</label>
              <input
                type="number"
                step="0.01"
                min="0"
                max="1"
                v-model.number="voice.stability"
                class="mt-1 block w-full rounded-md border-gray-300"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700">Similarity boost</label>
              <input
                type="number"
                step="0.01"
                min="0"
                max="1"
                v-model.number="voice.similarityBoost"
                class="mt-1 block w-full rounded-md border-gray-300"
              />
            </div>
          </div>
          <p class="text-xs text-gray-500">Good starting values: Stability ~0.35 and Similarity ~0.9.</p>
        </div>
      </section>
    </div>

    <div class="mt-2 flex items-center gap-3">
      <button
        @click="save"
        :disabled="saving"
        class="px-4 py-2 rounded-md text-white bg-brand-600 hover:bg-brand-700 disabled:opacity-50"
      >
        {{ saving ? 'Saving…' : 'Save profile' }}
      </button>

      <label class="flex items-center gap-2 text-sm">
        <input type="checkbox" v-model="autoReindexAfterSave" class="rounded" />
        Auto reindex facts after save
      </label>

      <span class="text-sm" :class="ok ? 'text-green-600' : 'text-gray-600'">{{ msg }}</span>
    </div>

    <!-- Google Integration Card -->
    <section class="p-4 bg-white rounded-xl shadow border border-gray-100">
      <div class="flex items-center justify-between mb-3">
        <h2 class="text-lg font-semibold">Google Calendar & Contacts</h2>
        <span class="text-sm" :class="connected ? 'text-green-600' : 'text-gray-500'">
          {{ connected ? 'Connected' : 'Not connected' }}
        </span>
      </div>

      <div class="flex flex-wrap items-center gap-2">
        <button @click="connectGoogle" class="px-3 py-2 rounded-md bg-brand-600 text-white hover:bg-brand-700">
          Connect Google
        </button>
        <button @click="checkStatus" class="px-3 py-2 rounded-md border border-gray-300 hover:bg-gray-50">
          Check status
        </button>
        <button
          @click="syncContacts"
          :disabled="!connected || syncing"
          class="px-3 py-2 rounded-md border border-gray-300 hover:bg-gray-50 disabled:opacity-50"
        >
          {{ syncing ? 'Syncing…' : 'Sync contacts now' }}
        </button>
      </div>
      <p class="text-sm mt-2" :class="statusMsgClass">{{ statusMsg }}</p>

      <div v-if="connected && expiry" class="text-xs text-gray-500 mt-1">
        Token expiry: {{ new Date(expiry).toLocaleString() }}
      </div>
    </section>

    <section class="p-4 bg-white rounded-xl shadow border border-gray-100">
      <div class="flex items-center justify-between mb-3">
        <h2 class="text-lg font-semibold">Contacts</h2>
        <div class="flex items-center gap-2">
          <input
            v-model="q"
            @input="loadContacts"
            placeholder="Search name or email"
            class="block w-64 rounded-md border-gray-300 text-sm"
          />
        </div>
      </div>
      <div v-if="contacts.length === 0" class="text-sm text-gray-600">
        No contacts yet. Connect Google and sync.
      </div>
      <ul v-else class="divide-y divide-gray-100">
        <li v-for="c in contacts" :key="c.id" class="py-2 flex items-center justify-between text-sm">
          <div>
            <div class="font-medium">{{ c.name || c.email || 'Unnamed' }}</div>
            <div class="text-gray-600">{{ c.email || '—' }}</div>
          </div>
          <div v-if="c.phone" class="text-gray-600">{{ c.phone }}</div>
        </li>
      </ul>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import Breadcrumbs from '@/components/Breadcrumbs.vue'
import { useAuth } from '@/app/stores/auth'

// Page meta
useHead({ title: 'Your Profile · Evo' })

const auth = useAuth()
await auth.ensure()

// Helpers
const detectedTz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/New_York'
const $api = <T>(url: string, opts: any = {}) =>
  $fetch<T>(url, { credentials: 'include', ...opts }) // always include cookies

// UI state
const saving = ref(false)
const ok = ref(false)
const msg = ref('')
const autoReindexAfterSave = ref(false)

const profile = ref<{ name?: string; email?: string; timezone?: string }>({
  name: '',
  email: '',
  timezone: detectedTz,
})

const voice = ref<{ elevenVoiceId?: string; stability?: number; similarityBoost?: number }>({
  elevenVoiceId: '',
  stability: 0.35,
  similarityBoost: 0.9,
})

const connected = ref(false)
const expiry = ref<string | null>(null)
const statusMsg = ref('')
const syncing = ref(false)
const contacts = ref<any[]>([])
const q = ref('')

const statusMsgClass = computed(() =>
  /failed|error|not connected/i.test(statusMsg.value) ? 'text-red-600' : 'text-gray-600'
)

// --- Load current values (auth + memory/profile) ---
async function load() {
  try {
    // Prefer SSR-provided identity via /api/auth/me
    const meResp = await $api<{ user: { email?: string; name?: string } | null }>('/api/auth/me')
    if (meResp?.user?.email && !profile.value.email) profile.value.email = meResp.user.email
    if (meResp?.user?.name && !profile.value.name) profile.value.name = meResp.user.name

    // Pull stored memory/profile if your backend exposes it
    // (Keep these endpoints relative so cookies flow)
    const memory = await $api<any>('/api/memory').catch(() => null)

    if (memory?.profile) {
      profile.value.name = memory.profile.name ?? profile.value.name
      profile.value.timezone = memory.profile.timezone ?? profile.value.timezone
      profile.value.email = memory.profile.email ?? profile.value.email
    }
    if (memory?.voice) {
      voice.value.elevenVoiceId = memory.voice.elevenVoiceId ?? voice.value.elevenVoiceId
      voice.value.stability = memory.voice.stability ?? voice.value.stability
      voice.value.similarityBoost = memory.voice.similarityBoost ?? voice.value.similarityBoost
    }
  } catch {
    /* non-fatal */
  }
}

// --- Google OAuth flow (server should set Location or handle redirect) ---
async function connectGoogle() {
  try {
    // Open your backend start endpoint in a popup; cookies handle auth
    const popup = window.open(
      '/api/integrations/google/start',
      '_blank',
      'popup,width=520,height=720'
    )
    if (popup) {
      statusMsg.value = 'A Google window opened. After granting access, click "Check status".'
    } else {
      statusMsg.value = 'Popup blocked. Allow popups for this site and try again.'
    }
  } catch (e: any) {
    statusMsg.value = e?.message || 'Failed to start Google OAuth'
  }
}

async function checkStatus() {
  try {
    const data = await $api<{ connected: boolean; expiry?: string }>('/api/integrations/google')
    connected.value = !!data.connected
    expiry.value = data.expiry || null
    statusMsg.value = connected.value ? 'Google is connected.' : 'Google is not connected yet.'
    if (connected.value) await loadContacts()
  } catch (e: any) {
    statusMsg.value = e?.message || 'Failed to check status'
  }
}

async function syncContacts() {
  try {
    syncing.value = true
    statusMsg.value = ''
    const data = await $api<{ upserts: number; seen: number }>('/api/contacts/import', { method: 'POST' })
    statusMsg.value = `Imported ${data.upserts} contacts (seen ${data.seen}).`
    await loadContacts()
  } catch (e: any) {
    statusMsg.value = e?.message || 'Failed to import contacts'
  } finally {
    syncing.value = false
  }
}

async function loadContacts() {
  try {
    const data = await $api<{ items: any[] }>(`/api/contacts?q=${encodeURIComponent(q.value)}`)
    contacts.value = data.items || []
  } catch {
    contacts.value = []
  }
}

// --- Save profile/voice preferences ---
async function save() {
  try {
    saving.value = true
    msg.value = ''
    ok.value = false

    // Persist to your memory/settings endpoint
    await $api('/api/memory', {
      method: 'POST',
      body: {
        profile: {
          name: (profile.value.name || '').trim(),
          email: (profile.value.email || '').trim(),
          timezone: profile.value.timezone || detectedTz,
        },
        preferences: {
          locale: 'en-US',
          voice: {
            elevenVoiceId: (voice.value.elevenVoiceId || '').trim(),
            stability: Number(voice.value.stability ?? 0.35),
            similarityBoost: Number(voice.value.similarityBoost ?? 0.9),
          },
        },
      },
    })

    if (autoReindexAfterSave.value) {
      // Optional: if your backend supports it
      await $api('/api/facts/reindex', {
        method: 'POST',
        body: { dryRun: false, onlyMissing: true },
      }).catch(() => {
        /* not fatal */
      })
      msg.value = 'Saved! Reindexed facts.'
    } else {
      msg.value = 'Saved!'
    }

    ok.value = true
  } catch (e: any) {
    ok.value = false
    msg.value = e?.message || 'Save failed'
  } finally {
    saving.value = false
  }
}

onMounted(async () => {
  await load()
  await checkStatus().catch(() => {})
})
</script>
