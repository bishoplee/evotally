<template>
  <form @submit.prevent="go" class="login">
    <input v-model="email" type="email" placeholder="email" required />
    <input v-model="password" type="password" placeholder="password" required />
    <button :disabled="busy">{{ busy ? '…' : 'Create account' }}</button>
    <p v-if="err" class="err">{{ err }}</p>
  </form>
</template>
<script setup lang="ts">
import { ref } from 'vue'
const email = ref(''), password = ref(''), busy=ref(false), err=ref('')
async function go(){
  busy.value=true; err.value=''
  try { await $fetch('/api/auth/register',{method:'POST',body:{email:email.value,password:password.value}}); await navigateTo('/login') }
  catch(e:any){ err.value=e?.data?.message||'Failed' } finally{ busy.value=false }
}
</script>
<style scoped>.login{display:flex;gap:.5rem;flex-direction:column;max-width:320px}.err{color:#c00}</style>

