<script setup lang="ts">
import { ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useAuth } from '~/stores/auth'

const route = useRoute()
const auth = useAuth()
const { ready, isAuthed, accessToken } = storeToRefs(auth)
const mobileMenuOpen = ref(false)

const navLinks = [
  { to: '/', label: 'Home', icon: '🏠' },
  { to: '/assistant', label: 'Assistant', icon: '🤖' },
  { to: '/profile', label: 'Your Profile', icon: '👤' },
  { to: '/facts', label: 'Facts', icon: '📝' },
  { to: '/voice', label: 'Voice', icon: '🎤' },
]

async function onLogout() {
  await auth.logout()
  await navigateTo('/login', { replace: true })
}

function closeMobileMenu() {
  mobileMenuOpen.value = false
}
</script>

<template>
  <div class="min-h-screen flex flex-col bg-gray-50">
    <!-- Header -->
    <header class="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
      <nav class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div class="flex items-center justify-between h-16">
          <!-- Logo -->
          <NuxtLink to="/" class="flex items-center gap-3 group">
            <div class="w-10 h-10 rounded-lg bg-gradient-to-br from-primary-600 to-primary-700 flex items-center justify-center text-white font-bold text-xl shadow-md group-hover:shadow-lg transition-shadow">
              E
            </div>
            <span class="text-xl font-bold text-gray-900 hidden sm:inline">Evotally</span>
          </NuxtLink>

          <!-- Desktop Navigation -->
          <div class="hidden md:flex items-center gap-1">
            <NuxtLink
              v-for="link in navLinks"
              :key="link.to"
              :to="link.to"
              class="px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200"
              :class="route.path === link.to
                ? 'bg-primary-50 text-primary-700'
                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'"
            >
              <span class="mr-1.5">{{ link.icon }}</span>
              {{ link.label }}
            </NuxtLink>
          </div>

          <!-- Auth Actions -->
          <div class="flex items-center gap-3">
            <div v-if="!ready" class="w-20 h-9 rounded-lg bg-gray-200 animate-pulse" />
            <template v-else>
              <template v-if="isAuthed || accessToken">
                <button
                  type="button"
                  class="btn-outline text-sm"
                  @click="onLogout"
                >
                  Logout
                </button>
              </template>
              <template v-else>
                <NuxtLink to="/login" class="btn-outline text-sm">
                  Login
                </NuxtLink>
                <NuxtLink to="/register" class="btn-primary text-sm">
                  Sign Up
                </NuxtLink>
              </template>
            </template>

            <!-- Mobile menu button -->
            <button
              type="button"
              class="md:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100"
              @click="mobileMenuOpen = !mobileMenuOpen"
            >
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path v-if="!mobileMenuOpen" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
                <path v-else stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <!-- Mobile Navigation -->
        <div v-if="mobileMenuOpen" class="md:hidden py-4 border-t border-gray-200">
          <div class="flex flex-col gap-1">
            <NuxtLink
              v-for="link in navLinks"
              :key="link.to"
              :to="link.to"
              class="px-4 py-2.5 rounded-lg text-sm font-medium transition-colors duration-200"
              :class="route.path === link.to
                ? 'bg-primary-50 text-primary-700'
                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'"
              @click="closeMobileMenu"
            >
              <span class="mr-2">{{ link.icon }}</span>
              {{ link.label }}
            </NuxtLink>
          </div>
        </div>
      </nav>
    </header>

    <!-- Main Content -->
    <main class="flex-1">
      <slot />
    </main>

    <!-- Footer -->
    <footer class="bg-white border-t border-gray-200 mt-auto">
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div class="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div class="col-span-1 md:col-span-2">
            <div class="flex items-center gap-3 mb-4">
              <div class="w-10 h-10 rounded-lg bg-gradient-to-br from-primary-600 to-primary-700 flex items-center justify-center text-white font-bold text-xl">
                E
              </div>
              <span class="text-xl font-bold text-gray-900">Evotally</span>
            </div>
            <p class="text-sm text-gray-600 max-w-md">
              Your AI companion with memory. Have natural conversations and build a relationship with an assistant that truly knows you.
            </p>
          </div>
          <div>
            <h3 class="font-semibold text-gray-900 mb-3">Product</h3>
            <ul class="space-y-2 text-sm">
              <li><NuxtLink to="/assistant" class="text-gray-600 hover:text-primary-600">Assistant</NuxtLink></li>
              <li><NuxtLink to="/voice" class="text-gray-600 hover:text-primary-600">Voice</NuxtLink></li>
              <li><NuxtLink to="/facts" class="text-gray-600 hover:text-primary-600">Facts</NuxtLink></li>
            </ul>
          </div>
          <div>
            <h3 class="font-semibold text-gray-900 mb-3">Company</h3>
            <ul class="space-y-2 text-sm">
              <li><a href="#" class="text-gray-600 hover:text-primary-600">About</a></li>
              <li><a href="#" class="text-gray-600 hover:text-primary-600">Privacy</a></li>
              <li><a href="#" class="text-gray-600 hover:text-primary-600">Terms</a></li>
            </ul>
          </div>
        </div>
        <div class="mt-8 pt-8 border-t border-gray-200 text-center text-sm text-gray-500">
          © {{ new Date().getFullYear() }} Evotally. All rights reserved.
        </div>
      </div>
    </footer>
  </div>
</template>
