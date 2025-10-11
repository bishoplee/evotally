<script setup lang="ts">
definePageMeta({ public: true })

import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useAuth } from '~/stores/auth'

const route = useRoute()
const auth = useAuth()

const email = ref('')
const password = ref('')
const err = ref('')
const loading = ref(false)

onMounted(async () => {
  // If already logged in, bounce to redirect target
  // (ensure() should not throw; it just sets readiness)
  try { await auth.ensure() } catch {}
  if (auth.isAuthed) {
    const redirect = (route.query.redirect as string) || '/facts'
    await navigateTo(redirect, { replace: true })
  }
})

async function submit() {
  err.value = ''
  loading.value = true
  //try {
    await auth.login(email.value, password.value)
    const redirect = (route.query.redirect as string) || '/facts'
    await navigateTo(redirect, { replace: true })
  // } catch (e: any) {
  //   err.value = e?.data?.message || e?.message || 'Login failed'
  // } finally {
  //   loading.value = false
  // }
}
</script>

<template>
  <form class="max-w-md space-y-3" @submit.prevent="submit">
    <h2 class="text-xl font-semibold">Login</h2>

    <input
      v-model="email"
      class="w-full border rounded p-2"
      type="email"
      placeholder="Email"
      required
      autocomplete="username"
    />

    <input
      v-model="password"
      class="w-full border rounded p-2"
      type="password"
      placeholder="Password"
      required
      autocomplete="current-password"
    />

    <button
      class="px-4 py-2 bg-indigo-600 text-white rounded disabled:opacity-60"
      :disabled="loading"
      type="submit"
    >
      {{ loading ? 'Logging in…' : 'Login' }}
    </button>

    <p v-if="err" class="text-red-600 text-sm">{{ err }}</p>

    <p class="text-sm">
      No account?
      <NuxtLink to="/register" class="text-indigo-600">Register</NuxtLink>
    </p>
  </form>
</template>
