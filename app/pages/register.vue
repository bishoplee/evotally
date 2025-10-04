<script setup lang="ts">
const email = ref(''); const password = ref(''); const display_name = ref(''); const ok = ref('')
async function submit() {
	console.log('this is the new thing')
  ok.value = ''
  await $fetch('/api/auth/register', { method: 'POST', body: { email: email.value, password: password.value, display_name: display_name.value || undefined } })
  ok.value = 'Registered! You can now login.'; setTimeout(()=>navigateTo('/login'), 600)
}
</script>

<template>
  <form class="max-w-md space-y-3" @submit.prevent="submit">
    <h2 class="text-xl font-semibold">Register</h2>
    <input v-model="email" class="w-full border rounded p-2" type="email" placeholder="Email" required />
    <input v-model="password" class="w-full border rounded p-2" type="password" placeholder="Password" required />
    <input v-model="display_name" class="w-full border rounded p-2" placeholder="Display name (optional)" />
    <button class="px-4 py-2 bg-indigo-600 text-white rounded">Create account</button>
    <p v-if="ok" class="text-green-700 text-sm">{{ ok }}</p>
  </form>
</template>

