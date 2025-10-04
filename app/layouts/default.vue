<script setup lang="ts">
import { useAuth } from '~/stores/auth'
const auth = useAuth()
const links = [
  { to: '/', label: 'Home' },
  { to: '/facts', label: 'Facts' },
  { to: '/facts/upload', label: 'Upload' },
  { to: '/voice', label: 'Voice' },
]
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
          <NuxtLink v-if="!auth.accessToken" to="/login" class="text-sm text-indigo-600">Login</NuxtLink>
          <button v-else class="text-sm text-gray-600 hover:text-black" @click="auth.logout().then(()=>navigateTo('/login'))">
            Logout
          </button>
        </div>
      </nav>
    </header>
    <main class="mx-auto max-w-5xl p-4">
      <slot />
    </main>
  </div>
</template>

