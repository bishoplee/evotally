<script setup lang="ts">
import { useAuth } from '~/stores/auth'
const auth = useAuth()
const email = ref(''); const password = ref(''); const err = ref('')
async function submit() {
  err.value = ''
  try { await auth.login(email.value, password.value); await navigateTo('/facts') }
  catch (e:any) { err.value = e?.data?.message || e?.message || 'Login failed' }
}
</script>

<template>
  <form class="max-w-md space-y-3" @submit.prevent="submit">
    <h2 class="text-xl font-semibold">Login</h2>
    <input v-model="email" class="w-full border rounded p-2" type="email" placeholder="Email" required />
    <input v-model="password" class="w-full border rounded p-2" type="password" placeholder="Password" required />
    <button class="px-4 py-2 bg-indigo-600 text-white rounded">Login</button>
    <p v-if="err" class="text-red-600 text-sm">{{ err }}</p>
    <p class="text-sm">No account? <NuxtLink to="/register" class="text-indigo-600">Register</NuxtLink></p>
  </form>
</template>

