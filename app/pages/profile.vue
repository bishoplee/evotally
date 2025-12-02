<template>
  <div class="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50">
    <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <!-- Header -->
      <div class="flex items-center justify-between mb-8">
        <div>
          <h1 class="text-3xl font-bold text-gray-900">Your Evo Profile</h1>
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

      <div v-if="store.loading" class="text-center py-12 text-gray-500">Loading…</div>

      <div v-else class="space-y-4">
        <details
          v-for="(section, key) in (store.registry || {})"
          :key="key"
          class="card group hover:shadow-md transition-shadow"
        >
          <summary class="cursor-pointer font-semibold text-lg text-gray-900 flex items-center justify-between">
            <span>{{ title(key) }}</span>
            <span class="inline-flex items-center gap-2">
              <span class="text-xs font-normal px-2 py-1 bg-primary-100 text-primary-700 rounded">
                {{ section.weight }} pts
              </span>
              <svg class="w-5 h-5 text-gray-400 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
              </svg>
            </span>
          </summary>

          <div class="mt-6 space-y-6">
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
        </details>
      </div>
    </div>
  </div>

  <EvoProfileWizard v-if="showWizard" @close="closeWizard" />
</template>

<script setup lang="ts">
import { useEvoProfile } from '@/stores/evoProfile'
import EvoProfileProgress from "~/pages/components/EvoProfileProgress.vue"
import EvoProfileWizard from "~/pages/components/EvoProfileWizard.vue"

const store = useEvoProfile()
const showWizard = ref(false)

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

onMounted(async () => {
  await store.fetchProfile()

  // Ensure each section exists BEFORE template binds
  for (const k in (store.registry || {})) {
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
