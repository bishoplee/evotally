<script setup lang="ts">
import { useAuth } from '~/stores/auth'
const auth = useAuth()
const file = ref<File|null>(null)
const text = ref('') // newline separated as a fallback
const msg = ref('')
async function uploadFile() {
  if (!file.value) return
  const fd = new FormData(); fd.append('file', file.value)
  await $fetch('/api/facts/bulk', { method: 'POST', body: fd, headers: { ...auth.bearer } })
  msg.value = 'Uploaded!'
}
async function uploadText() {
  const lines = text.value.split('\n').map(s=>s.trim()).filter(Boolean)
  for (const line of lines) { await $fetch('/api/facts',{ method:'POST', body:{ type:'memory', text: line }, headers:{...auth.bearer}}) }
  msg.value = 'Imported!'
}
</script>

<template>
  <div class="space-y-6">
    <div class="space-y-2 border rounded p-3">
      <div class="font-medium">Upload CSV</div>
      <input type="file" accept=".csv,text/csv" @change="e => file = (e.target as HTMLInputElement).files?.[0] || null" />
      <button class="px-3 py-2 bg-indigo-600 text-white rounded" @click="uploadFile">Upload</button>
    </div>
    <div class="space-y-2 border rounded p-3">
      <div class="font-medium">Or paste lines</div>
      <textarea v-model="text" class="w-full border rounded p-2 h-40" placeholder="One fact per line…"></textarea>
      <button class="px-3 py-2 bg-indigo-600 text-white rounded" @click="uploadText">Import</button>
    </div>
    <p v-if="msg" class="text-green-700 text-sm">{{ msg }}</p>
  </div>
</template>

