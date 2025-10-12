<template>
  <div class="max-w-3xl mx-auto p-6 space-y-6">

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
            <label class="block text-sm font-medium text-gray-700">First Name</label>
            <input
                v-model="profile.first_name"
                class="mt-1 block w-full rounded-md border border-gray-300 p-2"
                placeholder="Your name"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700">Last Name</label>
            <input
                v-model="profile.last_name"
                class="mt-1 block w-full rounded-md border border-gray-300 p-2"
                placeholder="Your name"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700">Email</label>
            <input
                v-model="profile.email"
                class="mt-1 block w-full rounded-md border border-gray-300 p-2"
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
                class="mt-1 block w-full rounded-md border border-gray-300 p-2"
                placeholder="America/New_York"
            />
            <p class="text-xs text-gray-500 mt-1">Detected: {{ detectedTz }}</p>
          </div>
        </div>
      </section>

      <!-- Voices management -->
      <section class="p-4 bg-white rounded-xl shadow border border-gray-100">
        <div class="flex items-center justify-between mb-3">
          <h2 class="text-lg font-semibold">Voices</h2>
          <span class="text-sm text-gray-600">
          {{ hasVoices ? `${voices.length} saved` : 'No voices yet' }}
        </span>
        </div>

        <div v-if="hasVoices" class="overflow-x-auto -mx-1">
          <table class="min-w-full text-sm">
            <thead>
            <tr class="text-left text-gray-600 border-b">
              <th class="py-2 pr-3">Provider</th>
              <th class="py-2 pr-3">Voice ID</th>
              <th class="py-2 pr-3">Stability</th>
              <th class="py-2 pr-3">Similarity</th>
              <th class="py-2 pr-3">Default</th>
              <th class="py-2 pr-3">Actions</th>
            </tr>
            </thead>
            <tbody>
            <tr v-for="v in voices" :key="v.id" class="border-b last:border-0">
              <td class="py-2 pr-3 font-medium">{{ v.provider }}</td>
              <td class="py-2 pr-3 break-all">{{ v.voiceId }}</td>
              <td class="py-2 pr-3">{{ v.stability ?? '—' }}</td>
              <td class="py-2 pr-3">{{ v.similarityBoost ?? '—' }}</td>
              <td class="py-2 pr-3">
                <span v-if="v.isDefault" class="px-2 py-0.5 rounded bg-green-50 text-green-700">Default</span>
                <button v-else class="text-brand-600 hover:text-brand-700" @click="makeDefault(v.id)">Make default</button>
              </td>
              <td class="py-2 pr-3">
                <button class="text-red-600 hover:text-red-700" @click="removeVoice(v.id)">Remove</button>
              </td>
            </tr>
            </tbody>
          </table>
        </div>

        <!-- Add voice form -->
        <div class="mt-4 p-3 rounded-lg border bg-gray-50">
          <h3 class="font-medium mb-2">Add / Update Voice</h3>
          <div class="grid sm:grid-cols-2 gap-3">
            <div>
              <label class="block text-xs text-gray-600">Provider</label>
              <input v-model="newVoice.provider" class="mt-1 block w-full rounded-md border-gray-300 p-2" placeholder="elevenlabs" />
            </div>
            <div>
              <label class="block text-xs text-gray-600">Voice ID</label>
              <input v-model="newVoice.voiceId" class="mt-1 block w-full rounded-md border-gray-300 p-2" placeholder="Voice identifier" />
            </div>
            <div>
              <label class="block text-xs text-gray-600">Stability (0..1)</label>
              <input type="number" min="0" max="1" step="0.01" v-model.number="newVoice.stability" class="mt-1 block w-full rounded-md border-gray-300 p-2" />
            </div>
            <div>
              <label class="block text-xs text-gray-600">Similarity (0..1)</label>
              <input type="number" min="0" max="1" step="0.01" v-model.number="newVoice.similarityBoost" class="mt-1 block w-full rounded-md border-gray-300 p-2" />
            </div>
            <div class="sm:col-span-2">
              <label class="block text-xs text-gray-600">Label</label>
              <input v-model="newVoice.label" class="mt-1 block w-full rounded-md border-gray-300 p-2" placeholder="Optional nickname" />
            </div>
            <label class="flex items-center gap-2 text-sm">
              <input type="checkbox" v-model="newVoice.isDefault" class="rounded" />
              Set as default
            </label>
          </div>
          <div class="mt-3 flex items-center gap-3">
            <button class="px-3 py-2 rounded-md bg-brand-600 text-white hover:bg-brand-700" @click="addVoice">Save voice</button>
            <span class="text-sm text-gray-600">{{ status }}</span>
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
                class="mt-1 block w-full rounded-md border border-gray-300 p-2"
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
                  class="mt-1 block w-full rounded-md border border-gray-300 p-2"
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
                  class="mt-1 block w-full rounded-md border border-gray-300 p-2"
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

    <section>
      <div class="flex flex-wrap items-center gap-2">
        <!-- Google -->
        <button @click="connectGoogle" class="px-3 py-2 rounded-md bg-brand-600 text-white hover:bg-brand-700">Connect Google</button>
        <button @click="checkStatus" class="px-3 py-2 rounded-md border border-gray-300 hover:bg-gray-50">Check status</button>
        <button @click="syncContacts" :disabled="!connected || syncing" class="px-3 py-2 rounded-md border border-gray-300 hover:bg-gray-50 disabled:opacity-50">
          {{ syncing ? 'Syncing…' : 'Sync contacts now' }}
        </button>

        <!-- Outlook -->
        <button @click="connectOutlook" class="px-3 py-2 rounded-md bg-brand-600 text-white hover:bg-brand-700">Connect Outlook</button>
        <button @click="checkOutlookStatus" class="px-3 py-2 rounded-md border border-gray-300 hover:bg-gray-50">Check Outlook</button>
        <button @click="syncOutlook" :disabled="syncing" class="px-3 py-2 rounded-md border border-gray-300 hover:bg-gray-50 disabled:opacity-50">
          {{ syncing ? 'Syncing…' : 'Sync Outlook now' }}
        </button>
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
              class="mt-1 block w-full rounded-md border border-gray-300 p-2"
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

const auth = useAuth()
await auth.ensure()

console.log('The auth', auth);

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
  first_name: '',
  last_name: '',
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
    if (meResp?.user?.first_name && !profile.value.first_name) profile.value.name = meResp.user.name

    // Pull stored memory/profile if your backend exposes it
    // (Keep these endpoints relative so cookies flow)
    const memory = await $api<any>('/api/memory').catch(() => null)

    if (memory?.profile) {
      profile.value.first_name = memory.profile.first_name ?? profile.value.first_name
      profile.value.last_name = memory.profile.last_name ?? profile.value.last_name
      profile.value.timezone = memory.profile.timezone ?? profile.value.timezone
      profile.value.email = memory.profile.email ?? profile.value.email
    }
    if (memory?.voices) {
      // voice.value.elevenVoiceId = memory.voice.elevenVoiceId ?? voice.value.elevenVoiceId
      // voice.value.stability = memory.voice.stability ?? voice.value.stability
      // voice.value.similarityBoost = memory.voice.similarityBoost ?? voice.value.similarityBoost
      voices.value = memory.voices
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

// <script setup> additions
async function connectOutlook() {
  const r = await $fetch<{ url: string }>('/api/integrations/outlook/start', { credentials: 'include' })
  window.open(r.url, '_blank', 'popup,width=520,height=720')
}

async function checkOutlookStatus() {
  const s = await $fetch<{ connected: boolean; expiry?: string }>('/api/integrations/outlook', { credentials: 'include' })
  statusMsg.value = s.connected ? 'Outlook connected.' : 'Outlook not connected.'
}

async function syncOutlook() {
  syncing.value = true; statusMsg.value = ''
  try {
    const res = await $fetch<{ upserts: number; seen: number }>('/api/contacts/import', {
      method: 'POST', credentials: 'include', body: { source: 'outlook' }
    })
    statusMsg.value = `Outlook: imported ${res.upserts} contacts (seen ${res.seen}).`
    await loadContacts()
  } catch (e: any) {
    statusMsg.value = e?.message || 'Outlook sync failed'
  } finally {
    syncing.value = false
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

// ---- voices state ----
type VoiceRow = {
  id: string
  provider: string
  voiceId: string
  stability?: number | null
  similarityBoost?: number | null
  isDefault: boolean
  label?: string | null
  settings?: any
}
const voices = ref<VoiceRow[]>([])
const currentVoice = ref<VoiceRow | null>(null)

// add/edit form
const newVoice = ref<{ provider: string; voiceId: string; stability?: number; similarityBoost?: number; label?: string; isDefault: boolean }>({
  provider: 'elevenlabs',
  voiceId: '',
  stability: 0.35,
  similarityBoost: 0.9,
  label: '',
  isDefault: true,
})

const hasVoices = computed(() => voices.value.length > 0)
const status = ref('')

// add/update a voice for provider (upsert) and optionally set default
async function addVoice() {
  status.value = ''
  const body = {
    provider: newVoice.value.provider.trim().toLowerCase(),
    voiceId: newVoice.value.voiceId.trim(),
    stability: newVoice.value.stability,
    similarityBoost: newVoice.value.similarityBoost,
    label: newVoice.value.label || undefined,
    isDefault: !!newVoice.value.isDefault,
  }
  if (!body.voiceId) { status.value = 'Voice ID is required.'; return }
  alert('got here');
  await $api('/api/voice', { method: 'POST', body })
  await load()
  // reset
  newVoice.value.voiceId = ''
  status.value = 'Voice saved.'
}
// delete a voice
async function removeVoice(id: string) {
  await $api(`/api/voice/${encodeURIComponent(id)}`, { method: 'DELETE' })
  await load()
}

// set default voice (by row id)
async function makeDefault(id: string) {
  await $api('/api/voice/select', { method: 'POST', body: { id } })
  await load()
}



onMounted(async () => {
  await load()
  await checkStatus().catch(() => {})
})
</script>
