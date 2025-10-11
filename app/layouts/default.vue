<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useAuth } from '~/stores/auth'

// grab route once in setup (Nuxt auto-imports useRoute)
const route = useRoute()
const auth = useAuth()
const { ready, isAuthed, accessToken } = storeToRefs(auth)

const links = [
  { to: '/', label: 'Home' },
  { to: '/facts', label: 'Facts' },
  { to: '/voice', label: 'Voice' },
  { to: '/profile', label: 'Profile' },
]

async function onLogout() {
  //try {
    await auth.logout()
  // } finally {
  //   const redirect = encodeURIComponent(route.fullPath || '/')
  //   await navigateTo(`/login?redirect=${redirect}`, { replace: true })
  // }
}
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <header class="border-b bg-white">
      <nav class="mx-auto max-w-5xl px-4 h-14 flex items-center justify-between">
        <div class="flex items-center gap-4">
          <span class="font-semibold">Companion</span>
          <NuxtLink v-for="l in links" :key="l.to" :to="l.to" class="text-sm text-gray-600 hover:text-black">
            {{ l.label }}
          </NuxtLink>
        </div>

        <div class="flex items-center gap-3">
          <div v-if="!ready" class="w-16 h-6 rounded bg-black/5 animate-pulse" />
          <template v-else>
            <NuxtLink v-if="isAuthed ? !isAuthed : !accessToken" to="/login" class="text-sm text-indigo-600">
              Login
            </NuxtLink>
            <button
              v-else
              type="button"
              class="text-sm text-gray-600 hover:text-black"
              @click="onLogout"
            >
              Logout
            </button>
          </template>
        </div>
      </nav>
    </header>

    <main class="mx-auto max-w-5xl p-4">
      <slot />
    </main>
  </div>
</template>
