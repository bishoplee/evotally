<template>
  <div class="w-full">
    <div class="flex items-center justify-between mb-1">
      <span class="text-sm font-medium" :style="{color:'var(--color-primary-800)'}">Profile completeness</span>
      <span class="text-sm font-semibold">{{ pct }}%</span>
    </div>
    <div class="w-full h-3 bg-gray-200/70 rounded-full overflow-hidden">
      <div class="h-3 rounded-full" :style="{ width: pct + '%', background: 'var(--color-primary-600)' }"></div>
    </div>
    <p class="text-xs mt-1 text-gray-500">Weighted by importance. Total score {{ score }}/200.</p>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{ pct:number, score:number }>()
const pct = computed(() => Math.max(0, Math.min(100, Math.round(props.pct))))
</script>
