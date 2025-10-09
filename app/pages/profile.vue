<template>
  <div class="max-w-3xl mx-auto px-4 py-8">
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-bold" :style="{color:'var(--color-primary-800)'}">Your Evo Profile</h1>
      <EvoProfileProgress :pct="store.progressPct" :score="store.score" />
    </div>

    <div v-if="store.loading">Loading…</div>

    <div v-else class="space-y-6">
      <details v-for="(section, key) in store.registry" :key="key" class="bg-white rounded-xl border p-4 open:shadow">
        <summary class="cursor-pointer font-semibold">{{ title(key) }} <span class="text-xs text-gray-500">({{ section.weight }} pts)</span></summary>
        <div class="mt-3 space-y-3">
          <div v-for="q in section.questions" :key="q.id" class="space-y-1">
            <label class="text-sm font-medium">{{ q.prompt }}</label>
            <textarea v-model="local[key][q.id]" class="w-full input min-h-20" placeholder="Your answer…" />
          </div>
          <button class="btn-primary" @click="save(key)">Save {{ title(key) }}</button>
        </div>
      </details>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useEvoProfile } from '@/stores/evoProfile'
import EvoProfileProgress from "./components/EvoProfileProgress.vue";
const store = useEvoProfile()
const local = reactive<Record<string, Record<string,string>>>({})

const title = (k:string) => {
  return ({
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
  } as Record<string,string>)[k] || k
}

onMounted(async () => {
  await store.fetchProfile()
  for (const k in store.registry) {
    local[k] = { ...(store.sections?.[k] || {}) }
  }
})

async function save(key:string) {
  await store.saveSection(key, local[key])
}
</script>

<style scoped>
.input{
  border: 1px solid var(--color-primary-200);
  background: white;
  border-radius: 8px;
  padding: 8px 10px;
  outline: none;
}
.input:focus{
  border-color: var(--color-primary-400);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-primary-400) 25%, transparent);
}
.btn-primary{
  background: linear-gradient(90deg, var(--color-primary-600), var(--color-secondary-600));
  color: white; padding: 8px 14px; border-radius: 10px; font-weight: 600;
  border: 1px solid color-mix(in srgb, var(--color-primary-700) 30%, transparent);
}
</style>
