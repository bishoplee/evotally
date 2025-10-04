<template>
  <div class="wrap">
    <form @submit.prevent="add">
      <select v-model="type"><option>trait</option><option>preference</option><option>bio</option><option>goal</option><option>note</option></select>
      <input v-model="key" placeholder="key (optional)" />
      <input v-model="value" placeholder="value (optional)" />
      <textarea v-model="text" placeholder="Full text (required)" required />
      <button :disabled="busy">{{ busy ? 'Adding…' : 'Add fact' }}</button>
      <p v-if="err" class="err">{{ err }}</p>
    </form>

    <h3>Your facts</h3>
    <ul>
      <li v-for="f in facts" :key="f.id">
        <strong>{{ f.type }}</strong>
        <span v-if="f.key"> • {{ f.key }}: {{ f.value }}</span>
        <div>{{ f.text }}</div>
        <button @click="del(f.id)">Delete</button>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useAuth } from '~/stores/auth'
type Fact = { id:string, type:string, key?:string|null, value?:string|null, text:string }

const auth = useAuth()
const facts = ref<Fact[]>([])
const type = ref('trait'), key = ref(''), value = ref(''), text = ref('')
const busy = ref(false), err = ref('')

async function load() {
  await auth.ensure()
  facts.value = await $fetch<Fact[]>('/api/facts', { headers: auth.bearer })
}
async function add() {
  busy.value = true; err.value = ''
  try {
    await auth.ensure()
    await $fetch('/api/facts', { method: 'POST', headers: auth.bearer,
      body: { type: type.value, key: key.value || undefined, value: value.value || undefined, text: text.value } })
    text.value = ''; key.value=''; value.value=''
    await load()
  } catch (e:any) { err.value = e?.data?.message || 'Failed' }
  finally { busy.value = false }
}
async function del(id:string) {
  await auth.ensure()
  await $fetch(`/api/facts/${id}`, { method: 'DELETE', headers: auth.bearer })
  await load()
}
onMounted(load)
</script>

<style scoped>
.wrap{max-width:700px}
form{display:grid;grid-template-columns:1fr 1fr;gap:.5rem;margin-bottom:1rem}
textarea{grid-column:1/-1;min-height:80px}
button{justify-self:start}
li{margin:.5rem 0;padding:.5rem;border:1px solid #eee;border-radius:8px}
.err{color:#c00}
</style>

