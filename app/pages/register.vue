<script setup lang="ts">
definePageMeta({ public: true })

import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useAuth } from '~/stores/auth'

const route = useRoute()
const auth = useAuth()

const email = ref('')
const password = ref('')
const confirm = ref('')
const display_name = ref('')
const first_name = ref('')
const last_name = ref('')
const timezone = ref('')
const detectedTz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/New_York'

const loading = ref(false)
const ok = ref(false)
const msg = ref('')

onMounted(() => { timezone.value = detectedTz })

async function onSubmit() {
  msg.value = ''
  ok.value = false

  if (!first_name.value || !last_name.value || !email.value || !password.value) {
    msg.value = 'Please fill in first_name, last_name, email, and password.'
    return
  }
  if (password.value !== confirm.value) {
    msg.value = 'Passwords do not match.'
    return
  }

  try {
    loading.value = true

    // 1) Create account
    await $fetch('/api/auth/register', {
      method: 'POST',
      body: {
        email: email.value,
        password: password.value,
        display_name: display_name.value || undefined,
        first_name: first_name.value || undefined,
        last_name: last_name.value || undefined,
        timezone: timezone.value || undefined,
      },
    })

    // 2) Auto-login (optional but nice UX)
    await auth.login(email.value, password.value)

    ok.value = true
    msg.value = 'Account created! Redirecting…'
    const redirect = (route.query.redirect as string) || '/profile'
    await navigateTo(redirect, { replace: true })
  } catch (e: any) {
    // h3 errors often surface as e.data.statusMessage
    msg.value = e?.data?.statusMessage || e?.data?.message || e?.message || 'Signup failed'
  } finally {
    loading.value = false
  }
}
</script>


<!--<template>-->
<!--  <form class="max-w-md space-y-3" @submit.prevent="submit">-->
<!--    <h2 class="text-xl font-semibold">Register</h2>-->
<!--    <input v-model="email" class="w-full border rounded p-2" type="email" placeholder="Email" required />-->
<!--    <input v-model="password" class="w-full border rounded p-2" type="password" placeholder="Password" required />-->
<!--    <input v-model="display_name" class="w-full border rounded p-2" placeholder="Display name (optional)" />-->
<!--    <button class="px-4 py-2 bg-indigo-600 text-white rounded">Create account</button>-->
<!--    <p v-if="ok" class="text-green-700 text-sm">{{ ok }}</p>-->
<!--  </form>-->
<!--</template>-->

<template>
    <div class="max-w-md mx-auto mt-16 p-6 bg-white rounded-xl shadow border border-gray-100">
        <Breadcrumbs :items="[{ label: 'Home', to: '/' }, { label: 'Register' }]" />
        <h2 class="text-2xl font-semibold mb-1">Create your account</h2>
        <p class="text-sm text-gray-600 mb-4">Register and set up your profile so the assistant can use your context.
        </p>

        <form @submit.prevent="onSubmit" class="space-y-4">
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">First Name</label>
                <input v-model.trim="first_name" class="mt-1 block w-full rounded-md border border-gray-300 p-2"
                    placeholder="First name" />
            </div>

            <div>
                <label class="block text-sm font-medium text-gray-700">Last Name</label>
                <input v-model.trim="last_name" class="mt-1 block w-full rounded-md border border-gray-300 p-2"
                    placeholder="Last name" />
            </div>

            <div>
                <label class="block text-sm font-medium text-gray-700">Display Name</label>
                <input v-model.trim="display_name" class="mt-1 block w-full rounded-md border border-gray-300 p-2"
                    placeholder="Display Name / Nickname" />
            </div>

            <div>
                <label class="block text-sm font-medium text-gray-700">Email</label>
                <input v-model.trim="email" type="email" class="mt-1 block w-full rounded-md border border-gray-300 p-2"
                    placeholder="you@example.com" />
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700">Password</label>
                    <input v-model="password" type="password" class="mt-1 block w-full rounded-md border border-gray-300 p-2"
                        placeholder="••••••••" />
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700">Confirm</label>
                    <input v-model="confirm" type="password" class="mt-1 block w-full rounded-md border border-gray-300 p-2"
                        placeholder="••••••••" />
                </div>
            </div>

            <div>
                <label class="block text-sm font-medium text-gray-700">Timezone</label>
                <input v-model="timezone" class="mt-1 block w-full rounded-md border border-gray-300 p-2"
                    placeholder="America/New_York" />
                <p class="text-xs text-gray-500 mt-1">Detected: {{ detectedTz }}</p>
            </div>

            <div class="flex items-center justify-between">
                <button type="submit" :disabled="loading"
                    class="px-4 py-2 rounded-md text-white bg-green-600 hover:bg-brand-700 disabled:opacity-50">
                    {{ loading ? 'Creating...' : 'Create account' }}
                </button>
                <NuxtLink to="/login" class="text-sm text-brand-600 hover:text-brand-700">Have an account? Sign in</NuxtLink>
            </div>
            <p v-if="msg" :class="['text-sm', ok ? 'text-green-600' : 'text-red-600']">{{ msg }}</p>
        </form>
    </div>
</template>

