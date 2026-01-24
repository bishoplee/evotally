<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useAuth } from '~/stores/auth'

const route = useRoute()
const auth = useAuth()
const { ready, isAuthed, accessToken } = storeToRefs(auth)
const mobileMenuOpen = ref(false)
const isScrolled = ref(false)

const navLinks = [
  { to: '/how-it-works', label: 'How it works' },
  { to: '/faq', label: 'FAQ' },
  { to: '/pricing', label: 'Pricing' },
  { to: '/blog', label: 'Blog' },
  { to: '/login', label: 'Login' },
]

async function onLogout() {
  await auth.logout()
  await navigateTo('/login', { replace: true })
}

function closeMobileMenu() {
  mobileMenuOpen.value = false
}

function handleScroll() {
  isScrolled.value = window.scrollY > 5
}

onMounted(() => {
  window.addEventListener('scroll', handleScroll)
  handleScroll() // Check initial state
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
})
</script>

<template>
  <div class="min-h-screen flex flex-col bg-gray-50">
    <!-- Header -->
    <header 
      class="fixed top-0 left-0 right-0 z-50 border-b-2 border-solid border-gray-200 transition-all duration-300 ease-in-out py-4"
      :class="[
        isScrolled 
          ? 'bg-white/70 backdrop-blur-lg border-b border-gray-200/50 shadow-sm' 
          : 'bg-white/90 border-b'
      ]"
    >
      <nav class="w-full px-4 lg:px-8">
        <div class="flex items-center justify-between">
          <!-- Logo -->
          <NuxtLink to="/" class="flex items-center gap-3 group">
            <img src="/logo.png" alt="Evotally" class="h-12 w-auto transition-transform group-hover:scale-105" />
            <span class="text-3xl font-bold font-primary text-primary-900 sm:inline">
              EVOTALLY
            </span>
          </NuxtLink>

          <!-- Desktop Navigation & Auth Actions -->
          <div class="hidden md:flex items-center gap-16 flex-1">
            <!-- Nav Links -->
            <div class="flex flex-1 items-center justify-center gap-8">
              <NuxtLink
                v-for="link in navLinks"
                :key="link.to"
                :to="link.to"
                class="px-4 py-2 rounded-lg nav-link transition-colors duration-200 text-lg"
                :class="route.path === link.to
                  ? 'text-primary-700'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'"
              >
                {{ link.label }}
              </NuxtLink>
            </div>

            <!-- Auth Actions -->
            <div class="flex items-center gap-3">
              <div v-if="!ready" class="w-32 h-9 rounded-lg bg-gray-200 animate-pulse" />
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
                  <NuxtLink :to="`/login?from=${route.path}`" class="btn-primary text-md flex items-center gap-2">
                    Start Free Trial
                    <span class="w-4 h-4 bg-white rounded flex items-center justify-center">
                      <svg class="w-3 h-3 text-coral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M7 17L17 7M17 7H7M17 7v10" />
                      </svg>
                    </span>
                  </NuxtLink>
                </template>
              </template>
            </div>
          </div>

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

        <!-- Mobile Navigation -->
        <div v-if="mobileMenuOpen" class="md:hidden absolute top-full left-0 right-0 bg-white border-t border-gray-200 shadow-lg">
          <div class="flex flex-col gap-1 py-4 px-4">
            <NuxtLink
              v-for="link in navLinks"
              :key="link.to"
              :to="link.to"
              class="px-4 py-2.5 rounded-lg nav-link transition-colors duration-200"
              :class="route.path === link.to
                ? 'text-primary-700'
                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'"
              @click="closeMobileMenu"
            >
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

    <!-- Cookie Consent Banner -->
    <CookieConsent />

    <!-- Footer -->
    <footer class="bg-teal-800 text-white py-12 mt-auto">
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div class="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <!-- Company Info -->
          <div class="md:col-span-2">
            <div class="flex items-center mb-4">
              <!-- <img src="/logo.png" alt="Evotally" class="h-8 w-auto" /> -->
              <span class="text-3xl font-normal font-primary">EVOTALLY</span>
            </div>
            <p class="text-teal-100 text-md mb-4">
              Your personalized voice companion,<br>
              assistant, plus memory that evolves<br>
              with you.
            </p>
            <NuxtLink
              v-if="!isAuthed"
              :to="`/login?from=${route.path}`"
              class="inline-block bg-coral-500 hover:bg-coral-400 text-white font-semibold px-6 py-3 rounded-3xl transition mb-6"
            >
              Start Free - Upgrade When Ready
            </NuxtLink>
            
            <!-- Social Links -->
            <div class="flex space-x-6">
              <!-- Instagram -->
              <a href="https://instagram.com/evotally" target="_blank" rel="noopener noreferrer" class="w-10 h-10 rounded-full flex items-center justify-center">
                <svg class="w-9 h-9" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073z"/>
                  <path d="M12 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
              </a>
              <!-- Facebook -->
              <a href="https://facebook.com/evotally" target="_blank" rel="noopener noreferrer" class="w-10 h-10 rounded-full flex items-center justify-center">
                <svg class="w-9 h-9" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
              </a>
              <!-- X (Twitter) -->
              <a href="https://x.com/evotally" target="_blank" rel="noopener noreferrer" class="w-10 h-10 rounded-full flex items-center justify-center">
                <svg class="w-9 h-9" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
              </a>
              <!-- LinkedIn -->
              <a href="https://linkedin.com/company/evotally" target="_blank" rel="noopener noreferrer" class="w-10 h-10 rounded-full flex items-center justify-center">
                <svg class="w-9 h-9" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                </svg>
              </a>
              <!-- YouTube -->
              <a href="https://youtube.com/@evotally" target="_blank" rel="noopener noreferrer" class="w-10 h-10 rounded-full flex items-center justify-center">
                <svg class="w-9 h-9" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                </svg>
              </a>
            </div>
          </div>

          <!-- Quick Links -->
          <div>
            <h4 class="font-semibold mb-4 text-2xl">Quick Links</h4>
            <ul class="space-y-2 text-teal-100">
              <li><NuxtLink to="/how-it-works" class="hover:text-white transition">How it Works</NuxtLink></li>
              <li><NuxtLink to="/pricing" class="hover:text-white transition">Pricing</NuxtLink></li>
              <li><NuxtLink to="/blog" class="hover:text-white transition">Blog</NuxtLink></li>
              <li><NuxtLink to="/faq" class="hover:text-white transition">FAQ</NuxtLink></li>
              <li><NuxtLink to="/login" class="hover:text-white transition">Log in</NuxtLink></li>
            </ul>
          </div>

          <!-- Get in Touch -->
          <div>
            <h4 class="font-semibold mb-4 text-2xl">Get in Touch</h4>
            <p class="text-teal-100 mb-2">Questions or feedback?</p>
            <p class="text-teal-100 mb-4">Reach us at:</p>
            <a href="mailto:hello@evotally.com" class="text-white hover:text-teal-100 transition underline">
              hello@evotally.com
            </a>
          </div>
        </div>

        <!-- Copyright -->
        <div class="border-t border-teal-700 pt-4 flex flex-col md:flex-row justify-between items-center text-teal-100 text-sm">
          <p class="mb-2 md:mb-0 gap-8 flex font-primary text-sm">
            © {{ new Date().getFullYear() }} Evotally. All rights reserved
            <NuxtLink to="/privacy" class="hover:text-white transition">Privacy</NuxtLink>
            <NuxtLink to="/terms" class="hover:text-white transition">Terms</NuxtLink>
          </p>
        </div>
      </div>
    </footer>
  </div>
</template>
