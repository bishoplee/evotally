<template>
  <div class="max-w-3xl mx-auto px-4 py-8">
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-bold" :style="{color:'var(--color-primary-800)'}">Your Evo Profile</h1>
      <EvoProfileProgress :pct="store.progressPct" :score="store.score" />
    </div>

    <!-- Nudging banner -->
    <div v-if="!showWizard && store.progressPct < 70" class="mb-6 p-4 rounded-xl border bg-amber-50">
      <div class="flex items-center justify-between gap-4">
        <p class="text-sm">
          Complete your Evo profile so responses match your style.
          <span class="font-semibold">{{ store.progressPct }}% done.</span>
        </p>
        <button class="btn-primary" @click="showWizard = true">Open quick wizard</button>
      </div>
    </div>

    <div v-if="store.loading">Loading…</div>

    <div v-else class="space-y-6">
      <details v-for="(section, key) in (store.registry || {})" :key="key" class="bg-white rounded-xl border p-4 open:shadow">
        <summary class="cursor-pointer font-semibold">
          {{ title(key) }} <span class="text-xs text-gray-500">({{ section.weight }} pts)</span>
        </summary>

        <div class="mt-3 space-y-3">
          <div v-for="q in (section?.questions || [])" :key="q.id" class="space-y-1">
            <label class="text-sm font-medium">{{ q.prompt }}</label>

            <!-- use sectionLocal(key) to ensure the object exists -->
            <div class="flex gap-2 items-start">
        <textarea
            v-model="sectionLocal(key)[q.id]"
            class="w-full input min-h-20"
            :placeholder="q.placeholder || 'Your answer…'"
            @input="onEdit(key, q.id)"
            @blur="onBlur(key, q.id)"
        />
              <button
                  class="btn-primary shrink-0"
                  @click="saveOne(key, q.id)"
                  :disabled="savingKey === key + ':' + q.id"
              >
                <span v-if="savedKey === key + ':' + q.id">Saved ✓</span>
                <span v-else-if="savingKey === key + ':' + q.id">Saving…</span>
                <span v-else>Save</span>
              </button>
            </div>

            <p class="text-xs text-gray-500 h-4">
              <span v-if="savingKey === key + ':' + q.id">Autosaving…</span>
              <span v-else-if="savedKey === key + ':' + q.id">Saved ✓</span>
            </p>
          </div>

          <button class="p-2 bg-green-600 text-white rounded-s" @click="save(key)">Save {{ title(key) }}</button>
        </div>
      </details>
    </div>
  </div>

  <EvoProfileWizard v-if="showWizard" @close="closeWizard" />
</template>

<script setup lang="ts">
import { useEvoProfile } from '@/stores/evoProfile'
import EvoProfileProgress from "~/pages/components/EvoProfileProgress.vue";
import EvoProfileWizard from "~/pages/components/EvoProfileWizard.vue";
const store = useEvoProfile()

// local shadow state for edits
const local = reactive<Record<string, Record<string, string>>>({})
const savingKey = ref<string>('')   // "section:questionId" when saving
const savedKey  = ref<string>('')   // last saved key for ✔ flash

const timers = reactive<Record<string, ReturnType<typeof setTimeout> | undefined>>({})

function ensureSection(key: string) {
  if (!local[key]) local[key] = reactive({})
  return local[key]
}
function getVal(key: string, id: string) {
  return (local[key]?.[id] ?? '')
}
function setVal(key: string, id: string, v: string) {
  ensureSection(key)[id] = v
}

function sectionLocal(sectionKey: string) {
  if (!local[sectionKey]) local[sectionKey] = reactive<Record<string, string>>({})
  return local[sectionKey]
}

const title = (k:string) => ({
  everyday:'Everyday Talk',
  humor:'Humor & Tone',
  personality:'Personality Reflection',
  connection:'Connection Preferences',
  emotional:'Emotional Learning',
  memory:'Memory Anchors',
  storytelling:'Storytelling Style',
  life:'Life Context',
  future:'Future Orientation',
  calibration:'Conversation Calibration',
}[k] || k)

async function saveOne(sectionKey:string, qid:string) {
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

async function onBlur(sectionKey:string, qid:string) {
  // Save immediately on blur (cancel pending debounce first)
  const id = `${sectionKey}:${qid}`
  if (timers[id]) { clearTimeout(timers[id]); timers[id] = undefined }
  // Only save if the value actually changed vs store snapshot
  const current = (local[sectionKey] || {})[qid] ?? ''
  const prev = (store.sections?.[sectionKey] || {})[qid] ?? ''
  if (current !== prev) await saveOne(sectionKey, qid)
}

function scheduleAutosave(sectionKey:string, qid:string, delay=600) {
  const id = `${sectionKey}:${qid}`
  if (timers[id]) clearTimeout(timers[id])
  timers[id] = setTimeout(async () => {
    await saveOne(sectionKey, qid)
    timers[id] = undefined
  }, delay)
}

function onEdit(sectionKey:string, qid:string) {
  // Debounced autosave when typing stops
  scheduleAutosave(sectionKey, qid, 600)
}

// onMounted(async () => {
//   await store.fetchProfile()
//
//   // seed local from server sections, but ensure every section exists
//   for (const k of Object.keys(store.registry || {})) {
//     local[k] = reactive({ ...(store.sections?.[k] || {}) })
//   }
// })


onMounted(async () => {
  await store.fetchProfile()

  // Ensure each section exists BEFORE template binds
  for (const k in (store.registry || {})) {
    const target = sectionLocal(k)
    const existing = (store.sections?.[k] || {}) as Record<string,string>
    // copy existing answers in
    for (const qid in existing) target[qid] = existing[qid]
  }
})

async function save(key:string) {
  await store.saveSection(key, local[key])
  savedKey.value = '' // clear any single-field "Saved" badge
}
</script>

<style scoped>
.input{ border:1px solid var(--color-primary-200); background:white; border-radius:8px; padding:8px 10px; outline:none; }
.input:focus{ border-color:var(--color-primary-400); box-shadow:0 0 0 3px color-mix(in srgb, var(--color-primary-400) 25%, transparent); }
.btn-primary{
  background: linear-gradient(90deg, var(--color-primary-600), var(--color-secondary-600));
  color:white; padding:8px 14px; border-radius:10px; font-weight:600;
  border:1px solid color-mix(in srgb, var(--color-primary-700) 30%, transparent);
}
</style>
