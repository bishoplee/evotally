<script setup lang="ts">
definePageMeta({ 
  public: true,
  layout: false // Remove default layout (no header/footer)
})

import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuth } from '~/stores/auth'

const route = useRoute()
const router = useRouter()
const auth = useAuth()

// Get the page user came from (either from query param or document.referrer)
const backUrl = computed(() => {
  const from = route.query.from as string
  if (from && from !== '/login' && from !== '/register') {
    return from
  }
  return '/'
})

function goBack() {
  router.push(backUrl.value)
}

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
  <div class="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-primary-50 via-white to-secondary-50">
    <!-- Back Button -->
    <button
      @click="goBack"
      class="absolute top-6 left-6 flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors duration-200"
    >
      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
      </svg>
      <span class="text-sm font-medium">Back</span>
    </button>

    <div class="max-w-lg w-full">
      <!-- Header -->
      <div class="text-center mb-8">
        <div class="flex gap-4 items-center justify-center mb-4">
          <img src="/logo.png" alt="Evotally" class="h-12 w-auto transition-transform group-hover:scale-105" />
          <span class="text-3xl font-bold font-primary text-primary-900 hidden sm:inline">
            EVOTALLY
          </span>
        </div>
      </div>
      
      <!-- Register Card -->
      <div class="bg-white rounded-2xl shadow-xl border border-gray-200 p-8">
        <h2 class="text-3xl font-bold text-primary-dark text-center">Join the Evotally Family</h2>
        <p class="mt-2 text-lg text-gray-600 text-center mb-8">
          Meet Evo - your personalized voice companion, assistant, plus memory that evolves with you.
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

            <button 
              type="submit" 
              :disabled="loading"
              class="btn-primary w-full"
            >
              {{ loading ? 'Creating account...' : 'Create account' }}
            </button>
            <p v-if="msg" :class="['text-sm text-center', ok ? 'text-green-600' : 'text-red-600']">{{ msg }}</p>
        </form>
      </div>

      <!-- Sign In Link -->
      <p class="mt-6 text-center text-sm text-gray-600">
        Already have an account?
        <NuxtLink to="/login" class="font-medium text-primary-600 hover:text-primary-500">
          Sign in
        </NuxtLink>
      </p>
    </div>
  </div>
</template>

