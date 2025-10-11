<template>
<div class="max-w-3xl mx-auto p-6">
<h1 class="text-2xl font-bold mb-4">Your Evo Profile</h1>


<div class="h-3 bg-gray-200 rounded-full overflow-hidden mb-6">
<div class="h-full bg-emerald-500 transition-all" :style="{ width: progress + '%' }"></div>
</div>
<p class="text-sm text-gray-600 mb-6">Completion: {{ progress }}%</p>


<EvoProfileWizard v-model="answers" @save="save" />


<div class="mt-6 flex gap-3">
<button class="px-4 py-2 rounded bg-gray-100" @click="load">Reset</button>
<button class="px-4 py-2 rounded bg-black text-white" @click="save">Save</button>
</div>
</div>
</template>

<script setup lang="ts">
  import { ref, watch } from 'vue'
import EvoProfileWizard from './components/EvoProfileWizard.vue'


const answers = ref<Record<string, any>>({})
const progress = ref(0)


async function load(){
const r = await $fetch('/api/profile', { method: 'GET', headers: { 'x-user-id': 'demo-user' } })
if (r?.ok){
answers.value = r.profile || {}
progress.value = r.progress || 0
}
}
</script>