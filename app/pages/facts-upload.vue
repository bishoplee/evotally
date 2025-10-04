<template>
  <div class="wrap">
    <h3>Bulk upload facts (CSV)</h3>
    <p>Headers: <code>type,key,value,text</code></p>
    <input type="file" @change="pick" accept=".csv" />
    <button :disabled="!file||busy" @click="send">{{ busy ? 'Uploading…' : 'Upload' }}</button>
    <p v-if="msg">{{ msg }}</p>
  </div>
</template>
<script setup lang="ts">
import { ref } from 'vue'
import { useAuth } from '~/stores/auth'
const auth = useAuth()
const file = ref<File|null>(null)
const busy = ref(false); const msg = ref('')
function pick(e:any){ file.value = e.target.files?.[0] || null }
async function send(){
  if(!file.value) return
  busy.value=true; msg.value=''
  try{
    await auth.ensure()
    const fd = new FormData(); fd.append('file', file.value)
    const r = await $fetch('/api/facts/bulk', { method:'POST', body: fd, headers: auth.bearer })
    msg.value = `Uploaded ${r.count} facts.`
  }catch(e:any){ msg.value = e?.data?.message || 'Upload failed' }
  finally{ busy.value=false }
}
</script>
<style scoped>.wrap{max-width:600px}</style>

