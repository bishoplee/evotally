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
const err = ref('')
const loading = ref(false)
const googleLoaded = ref(false)

// Google OAuth Client ID - this should be set in environment variables
const GOOGLE_CLIENT_ID = '179969774646-5rfe880t0dckkuqaepekuj0v62tjrcam.apps.googleusercontent.com'

onMounted(async () => {
  try { await auth.ensure() } catch {}
  if (auth.isAuthed) {
    const redirect = (route.query.redirect as string) || '/'
    await navigateTo(redirect, { replace: true })
    return
  }

  // Load Google Sign-In script
  if (GOOGLE_CLIENT_ID) {
    const script = document.createElement('script')
    script.src = 'https://accounts.google.com/gsi/client'
    script.async = true
    script.defer = true
    script.onload = initializeGoogleSignIn
    document.head.appendChild(script)
  }
})

function initializeGoogleSignIn() {
  if (typeof window === 'undefined' || !(window as any).google) return

  ;(window as any).google.accounts.id.initialize({
    client_id: GOOGLE_CLIENT_ID,
    callback: handleGoogleCallback
  })

  googleLoaded.value = true
}

async function handleGoogleCallback(response: any) {
  err.value = ''
  loading.value = true

  try {
    const result = await $fetch('/api/auth/google', {
      method: 'POST',
      body: {
        credential: response.credential
      }
    })

    // Store the access token
    if ((result as any).access_token) {
      auth.setAccessToken((result as any).access_token)
      const redirect = (route.query.redirect as string) || '/'
      await navigateTo(redirect, { replace: true })
    }
  } catch (e: any) {
    err.value = e?.data?.message || e?.message || 'Google sign-in failed'
  } finally {
    loading.value = false
  }
}

async function submit() {
  err.value = ''
  loading.value = true
  try {
    await auth.login(email.value, password.value)
    const redirect = (route.query.redirect as string) || '/'
    await navigateTo(redirect, { replace: true })
  } catch (e: any) {
    err.value = e?.data?.message || e?.message || 'Login failed'
  } finally {
    loading.value = false
  }
}

function loginWithGoogle() {
  if (typeof window === 'undefined' || !(window as any).google) {
    err.value = 'Google Sign-In is not loaded yet. Please try again.'
    return
  }

  ;(window as any).google.accounts.id.prompt()
}
</script>

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

    <div class="max-w-md w-full">
      <!-- Header -->
      <div class="text-center mb-8">
        <div class="flex gap-4 items-center justify-center mb-4">
          <img src="/logo.png" alt="Evotally" class="h-12 w-auto transition-transform group-hover:scale-105" />
          <span class="text-3xl font-bold text-primary-900 hidden sm:inline">
            EVOTALLY
          </span>
        </div>
        <h2 class="text-3xl font-bold text-primary-dark mt-6">Welcome back</h2>
        <p class="mt-2 text-lg text-gray-600">
          Sign in to continue to Evotally
        </p>
      </div>

      <!-- Login Card -->
      <div class="bg-white rounded-2xl shadow-xl border border-gray-200 p-8">
        <!-- Google Sign In -->
        <button
          type="button"
          class="w-full flex items-center justify-center gap-3 px-4 py-3 border border-gray-300 rounded-lg shadow-sm bg-white hover:bg-gray-50 transition-colors duration-200 mb-6"
          @click="loginWithGoogle"
        >
          <svg class="w-5 h-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          <span class="text-sm font-medium text-gray-700">Continue with Google</span>
        </button>

        <!-- Divider -->
        <div class="relative my-6">
          <div class="absolute inset-0 flex items-center">
            <div class="w-full border-t border-gray-300"></div>
          </div>
          <div class="relative flex justify-center text-sm">
            <span class="px-2 bg-white text-gray-500">Or continue with email</span>
          </div>
        </div>

        <!-- Email/Password Form -->
        <form @submit.prevent="submit" class="space-y-4">
          <div>
            <label for="email" class="block text-sm font-medium text-gray-700 mb-1">
              Email address
            </label>
            <input
              id="email"
              v-model="email"
              type="email"
              required
              autocomplete="username"
              class="input-field"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label for="password" class="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              id="password"
              v-model="password"
              type="password"
              required
              autocomplete="current-password"
              class="input-field"
              placeholder="••••••••"
            />
          </div>

          <div class="flex items-center justify-between">
            <div class="flex items-center">
              <input
                id="remember-me"
                type="checkbox"
                class="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <label for="remember-me" class="ml-2 block text-sm text-gray-700">
                Remember me
              </label>
            </div>

            <a href="#" class="text-sm font-medium text-primary-600 hover:text-primary-500">
              Forgot password?
            </a>
          </div>

          <button
            type="submit"
            :disabled="loading"
            class="btn-primary w-full"
          >
            {{ loading ? 'Signing in...' : 'Sign in' }}
          </button>

          <p v-if="err" class="text-sm text-red-600 text-center">{{ err }}</p>
        </form>
      </div>

      <!-- Sign Up Link -->
      <p class="mt-6 text-center text-sm text-gray-600">
        Don't have an account?
        <NuxtLink to="/register" class="font-medium text-primary-600 hover:text-primary-500">
          Sign up for free
        </NuxtLink>
      </p>
    </div>
  </div>
</template>
