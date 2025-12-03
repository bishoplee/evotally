<template>
  <div class="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50">
    <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
      <!-- Header -->
      <div class="flex items-center justify-between mb-8">
        <div>
          <h1 class="text-3xl font-bold text-gray-900">Your Profile</h1>
          <p class="text-gray-600 mt-1">Complete your profile for more personalized responses</p>
        </div>
        <EvoProfileProgress :pct="store.progressPct" :score="store.score" />
      </div>

      <!-- Progress Banner -->
      <div v-if="!showWizard && store.progressPct < 70" class="mb-8 card bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200">
        <div class="flex items-center justify-between gap-4">
          <div>
            <p class="font-semibold text-gray-900">Complete your profile</p>
            <p class="text-sm text-gray-600 mt-1">
              You're <span class="font-semibold text-primary-600">{{ store.progressPct }}%</span> done. Finish to get better personalized responses.
            </p>
          </div>
          <button class="btn-primary whitespace-nowrap" @click="showWizard = true">
            Quick Wizard
          </button>
        </div>
      </div>

      <div v-if="loading" class="text-center py-12 text-gray-500">Loading…</div>

      <div v-else class="space-y-6">
        <!-- Tab Navigation -->
        <div class="card">
          <div class="flex flex-wrap gap-2">
            <button
              class="px-4 py-2 rounded-lg font-medium transition-colors"
              :class="activeTab === 'basic' ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'"
              @click="activeTab = 'basic'"
            >
              Basic Info
            </button>
            <button
              v-for="(section, key) in (store.registry || {})"
              :key="key"
              class="px-4 py-2 rounded-lg font-medium transition-colors relative"
              :class="activeTab === key ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'"
              @click="activeTab = key"
            >
              {{ title(key) }}
              <span
                v-if="section.weight"
                class="ml-2 text-xs px-1.5 py-0.5 rounded"
                :class="activeTab === key ? 'bg-primary-700' : 'bg-gray-200 text-gray-600'"
              >
                {{ section.weight }}pts
              </span>
            </button>
          </div>
        </div>

        <!-- Basic Info Tab -->
        <div v-show="activeTab === 'basic'" class="card">
          <h2 class="text-2xl font-bold text-gray-900 mb-6">Basic Information</h2>

          <div class="space-y-8">
            <!-- Personal Information -->
            <div>
              <h3 class="text-lg font-semibold text-gray-900 mb-4">Personal Information</h3>
              <div class="grid md:grid-cols-2 gap-6">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">First Name</label>
                  <input v-model.trim="basicInfo.first_name" class="input-field" placeholder="Your first name" />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
                  <input v-model.trim="basicInfo.last_name" class="input-field" placeholder="Your last name" />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">Email</label>
                  <input v-model.trim="basicInfo.email" type="email" class="input-field" placeholder="you@example.com" />
                  <p class="text-xs text-gray-500 mt-1">Used only for context; not sent to third parties.</p>
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">Birthday</label>
                  <input v-model="basicInfo.birthday" type="date" class="input-field" />
                  <p class="text-xs text-gray-500 mt-1">Your birthday (YYYY-MM-DD)</p>
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">Timezone</label>
                  <input v-model.trim="basicInfo.timezone" class="input-field" placeholder="America/New_York" />
                  <p class="text-xs text-gray-500 mt-1">Detected: {{ detectedTz }}</p>
                </div>
              </div>
            </div>

            <!-- Residence -->
            <div>
              <h3 class="text-lg font-semibold text-gray-900 mb-4">Place of Residence</h3>
              <div class="grid md:grid-cols-3 gap-6">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">City</label>
                  <input v-model.trim="basicInfo.city" class="input-field" placeholder="Seattle" />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">State/Province</label>
                  <input v-model.trim="basicInfo.region" class="input-field" placeholder="Washington" />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">Country</label>
                  <input v-model.trim="basicInfo.country" class="input-field" placeholder="United States" />
                </div>
              </div>
              <p class="text-xs text-gray-500 mt-2">Where you permanently live (different from your current location)</p>
            </div>

            <!-- Current Location (Auto-Detected) -->
            <div v-if="currentLocation.city || currentLocation.region || currentLocation.country">
              <h3 class="text-lg font-semibold text-gray-900 mb-4">Current Location (Auto-Detected)</h3>
              <div class="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div class="flex items-start gap-3">
                  <span class="text-2xl">📍</span>
                  <div class="flex-1">
                    <p class="font-medium text-gray-900">
                      {{ currentLocation.city }}{{ currentLocation.region ? ', ' + currentLocation.region : '' }}{{ currentLocation.country ? ', ' + currentLocation.country : '' }}
                    </p>
                    <p class="text-xs text-gray-600 mt-1">
                      Automatically detected from your browser's location. This updates when you refresh the page.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="mt-6 pt-6 border-t">
            <button
              class="btn-primary"
              @click="saveBasicInfo"
              :disabled="savingBasic"
            >
              {{ savingBasic ? 'Saving…' : 'Save Basic Info' }}
            </button>
            <span v-if="basicMsg" class="ml-4 text-sm" :class="basicMsg.includes('fail') ? 'text-red-600' : 'text-green-600'">
              {{ basicMsg }}
            </span>
          </div>
        </div>

        <!-- Section Content -->
        <div
          v-for="(section, key) in (store.registry || {})"
          :key="key"
          v-show="activeTab === key"
          class="card"
        >
          <h2 class="text-2xl font-bold text-gray-900 mb-6">{{ title(key) }}</h2>

          <div class="space-y-6">
            <div v-for="q in (section?.questions || [])" :key="q.id" class="space-y-2">
              <label class="block text-sm font-medium text-gray-700">{{ q.prompt }}</label>

              <div class="flex gap-3 items-start">
                <textarea
                  v-model="sectionLocal(key)[q.id]"
                  class="input-field flex-1 min-h-24 resize-y"
                  :placeholder="q.placeholder || 'Your answer…'"
                  @input="onEdit(key, q.id)"
                  @blur="onBlur(key, q.id)"
                />
                <button
                  class="btn-secondary shrink-0 mt-0"
                  @click="saveOne(key, q.id)"
                  :disabled="savingKey === key + ':' + q.id"
                >
                  <span v-if="savedKey === key + ':' + q.id">✓ Saved</span>
                  <span v-else-if="savingKey === key + ':' + q.id">Saving…</span>
                  <span v-else>Save</span>
                </button>
              </div>

              <p class="text-xs text-gray-500 min-h-4">
                <span v-if="savingKey === key + ':' + q.id" class="text-primary-600">● Autosaving…</span>
                <span v-else-if="savedKey === key + ':' + q.id" class="text-green-600">● Saved</span>
              </p>
            </div>

            <div class="pt-4 border-t">
              <button
                class="btn-primary"
                @click="save(key)"
                :disabled="savingKey.startsWith(key + ':')"
              >
                Save All in {{ title(key) }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <EvoProfileWizard v-if="showWizard" @close="closeWizard" />
</template>

<script setup lang="ts">
import { useEvoProfile } from '@/stores/evoProfile'
import { useAuth } from '~/stores/auth'
import EvoProfileProgress from "~/pages/components/EvoProfileProgress.vue"
import EvoProfileWizard from "~/pages/components/EvoProfileWizard.vue"

const auth = useAuth()
const store = useEvoProfile()
const showWizard = ref(false)
const activeTab = ref<string>('basic')
const loading = ref(false)

// Basic info state
const detectedTz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/New_York'
const basicInfo = ref({
  first_name: '',
  last_name: '',
  email: '',
  birthday: '',
  timezone: detectedTz,
  city: '',
  region: '',
  country: ''
})
const currentLocation = ref({
  city: '',
  region: '',
  country: ''
})
const savingBasic = ref(false)
const basicMsg = ref('')

// local shadow state for edits
const local = reactive<Record<string, Record<string, string>>>({})
const savingKey = ref<string>('')   // "section:questionId" when saving
const savedKey  = ref<string>('')   // last saved key for ✔ flash

const timers = reactive<Record<string, ReturnType<typeof setTimeout> | undefined>>({})

function sectionLocal(sectionKey: string) {
  if (!local[sectionKey]) local[sectionKey] = reactive<Record<string, string>>({})
  return local[sectionKey]
}

const title = (k: string) => ({
  everyday: 'Everyday Talk',
  humor: 'Humor & Tone',
  personality: 'Personality Reflection',
  connection: 'Connection Preferences',
  emotional: 'Emotional Learning',
  memory: 'Memory Anchors',
  storytelling: 'Storytelling Style',
  life: 'Life Context',
  future: 'Future Orientation',
  calibration: 'Conversation Calibration',
}[k] || k)

async function saveOne(sectionKey: string, qid: string) {
  const k = `${sectionKey}:${qid}`
  try {
    savingKey.value = k
    const merged = { ...(store.sections[sectionKey] || {}), ...sectionLocal(sectionKey) }
    await store.saveSection(sectionKey, merged)
    store.sections[sectionKey] = { ...merged }
    savedKey.value = k
    setTimeout(() => { if (savedKey.value === k) savedKey.value = '' }, 1500)
  } finally {
    savingKey.value = ''
  }
}

async function onBlur(sectionKey: string, qid: string) {
  // Save immediately on blur (cancel pending debounce first)
  const id = `${sectionKey}:${qid}`
  if (timers[id]) { clearTimeout(timers[id]); timers[id] = undefined }
  // Only save if the value actually changed vs store snapshot
  const current = (local[sectionKey] || {})[qid] ?? ''
  const prev = (store.sections?.[sectionKey] || {})[qid] ?? ''
  if (current !== prev) await saveOne(sectionKey, qid)
}

function scheduleAutosave(sectionKey: string, qid: string, delay = 600) {
  const id = `${sectionKey}:${qid}`
  if (timers[id]) clearTimeout(timers[id])
  timers[id] = setTimeout(async () => {
    await saveOne(sectionKey, qid)
    timers[id] = undefined
  }, delay)
}

function onEdit(sectionKey: string, qid: string) {
  // Debounced autosave when typing stops
  scheduleAutosave(sectionKey, qid, 600)
}

// Load basic user info
async function loadBasicInfo() {
  try {
    loading.value = true
    await auth.ensure()
    const response = await $fetch<{ user: any }>('/api/auth/me', {
      credentials: 'include',
      headers: {
        Authorization: `Bearer ${auth.accessToken}`
      }
    })

    if (response?.user) {
      basicInfo.value.first_name = response.user.first_name || ''
      basicInfo.value.last_name = response.user.last_name || ''
      basicInfo.value.email = response.user.email || ''
      basicInfo.value.birthday = response.user.birthday || ''
      basicInfo.value.timezone = response.user.timezone || detectedTz
      basicInfo.value.city = response.user.city || ''
      basicInfo.value.region = response.user.region || ''
      basicInfo.value.country = response.user.country || ''

      // Load current location (auto-detected)
      currentLocation.value.city = response.user.currentCity || ''
      currentLocation.value.region = response.user.currentRegion || ''
      currentLocation.value.country = response.user.currentCountry || ''
    }
  } catch (e) {
    console.error('Failed to load basic info:', e)
  } finally {
    loading.value = false
  }
}

// Save basic user info
async function saveBasicInfo() {
  try {
    savingBasic.value = true
    basicMsg.value = ''

    await $fetch('/api/user/profile', {
      method: 'POST',
      credentials: 'include',
      headers: {
        Authorization: `Bearer ${auth.accessToken}`,
        'Content-Type': 'application/json'
      },
      body: {
        first_name: basicInfo.value.first_name?.trim() || null,
        last_name: basicInfo.value.last_name?.trim() || null,
        email: basicInfo.value.email?.trim() || null,
        birthday: basicInfo.value.birthday || null,
        timezone: basicInfo.value.timezone?.trim() || detectedTz,
        city: basicInfo.value.city?.trim() || null,
        region: basicInfo.value.region?.trim() || null,
        country: basicInfo.value.country?.trim() || null
      }
    })

    basicMsg.value = 'Saved!'
    setTimeout(() => { basicMsg.value = '' }, 2000)
  } catch (e: any) {
    basicMsg.value = e?.data?.message || e?.message || 'Save failed'
  } finally {
    savingBasic.value = false
  }
}

onMounted(async () => {
  await loadBasicInfo()
  await store.fetchProfile()

  // Ensure each section exists BEFORE template binds
  const keys = Object.keys(store.registry || {})
  for (const k of keys) {
    const target = sectionLocal(k)
    const existing = (store.sections?.[k] || {}) as Record<string, string>
    // copy existing answers in
    for (const qid in existing) target[qid] = existing[qid]
  }
})

async function save(key: string) {
  await store.saveSection(key, local[key])
  savedKey.value = '' // clear any single-field "Saved" badge
}

function closeWizard() {
  showWizard.value = false
}
</script>
