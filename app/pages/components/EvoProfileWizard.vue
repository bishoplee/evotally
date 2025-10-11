<template>
  <div class="fixed inset-0 bg-black/30 z-40 flex items-center justify-center">
    <div class="bg-white w-full max-w-2xl rounded-2xl shadow-xl p-6">
      <div class="flex items-center justify-between mb-3">
        <h2 class="text-xl font-bold">Set up your Evo profile</h2>
        <button class="text-gray-500 hover:text-black" @click="$emit('close')">✕</button>
      </div>

      <p class="text-sm text-gray-600 mb-4">
        Answer a few quick questions so Evo can speak in your style.
        <span class="font-medium">{{ step+1 }} / {{ steps.length }}</span>
      </p>

      <div v-if="current" class="space-y-3">
        <h3 class="font-semibold">{{ titles[currentKey] || currentKey }}</h3>
        <div v-for="q in current.questions" :key="q.id" class="space-y-1">
          <label class="text-sm font-medium">{{ q.prompt }}</label>
          <textarea v-model="local[currentKey][q.id]" class="w-full border rounded-md p-2 min-h-20"/>
        </div>
      </div>

      <div class="mt-5 flex items-center justify-between">
        <button class="px-3 py-2 rounded-md border" :disabled="step===0" @click="prev">Back</button>
        <div class="flex items-center gap-2">
          <span class="text-sm text-gray-500">{{ pct }}% complete</span>
          <button class="px-4 py-2 rounded-md text-white bg-gradient-to-r from-indigo-600 to-violet-600"
                  @click="next">{{ step === steps.length-1 ? 'Finish' : 'Save & Next' }}</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useEvoProfile } from '@/stores/evoProfile'
const emit = defineEmits<{ (e:'close'):void }>()
const titles: Record<string,string> = {
  everyday:'Everyday Talk', humor:'Humor & Tone', personality:'Personality Reflection',
  connection:'Connection Preferences', emotional:'Emotional Learning', memory:'Memory Anchors',
  storytelling:'Storytelling Style', life:'Life Context', future:'Future Orientation',
  calibration:'Conversation Calibration',
}

const store = useEvoProfile()
const local = reactive<Record<string, Record<string,string>>>({})
const steps = computed(() => Object.keys(store.registry))
const step = ref(0)
const currentKey = computed(() => steps.value[step.value])
const current = computed(() => store.registry[currentKey.value])
const pct = computed(() => store.progressPct)

onMounted(() => {
  console.log(store.registry);
  for (const k in store.registry) local[k] = { ...(store.sections?.[k] || {}) }
  // Jump to first incomplete section
  const idx = steps.value.findIndex(k => {
    const answers = local[k] || {}
    const unanswered = (store.registry[k]?.questions || []).some(q => !answers[q.id])
    return unanswered
  })
  if (idx >= 0) step.value = idx
})

async function saveSection(key:string) {
  await store.saveSection(key, local[key])
  await store.fetchProfile() // refresh progress
}

async function next() {
  await saveSection(currentKey.value)
  if (step.value < steps.value.length - 1) step.value++
  else emit('close')
}
function prev(){ if (step.value > 0) step.value-- }
</script>
