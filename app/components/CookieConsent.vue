<template>
  <Transition name="slide-up">
    <div
      v-if="showBanner"
      class="fixed bottom-0 left-0 right-0 z-[100] bg-white/95 backdrop-blur-lg border-t border-gray-200 shadow-2xl"
    >
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
        <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div class="flex-1">
            <h3 class="text-lg font-semibold text-gray-900 mb-2 font-heading">
              🍪 Cookie Settings
            </h3>
            <p class="text-sm text-gray-600 max-w-2xl">
              We use cookies to enhance your experience, analyze site traffic, and provide personalized content. 
              By clicking "Accept All", you consent to our use of cookies. 
              <a href="/privacy" class="text-primary-600 hover:text-primary-700 underline">Learn more</a>
            </p>
          </div>
          
          <div class="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <button
              @click="rejectCookies"
              class="btn-ghost text-sm px-6 py-2"
            >
              Reject All
            </button>
            <button
              @click="acceptCookies"
              class="btn-primary text-sm px-6 py-2"
            >
              Accept All
            </button>
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

const COOKIE_CONSENT_KEY = 'evotally_cookie_consent'
const COOKIE_CONSENT_VERSION = 'v1'

const showBanner = ref(false)

onMounted(() => {
  // Check if user has already made a choice
  const consent = getCookieConsent()
  if (!consent) {
    // Show banner after a short delay for better UX
    setTimeout(() => {
      showBanner.value = true
    }, 1000)
  } else {
    // Apply stored consent
    applyConsent(consent)
  }
})

function getCookieConsent() {
  if (process.client) {
    const stored = localStorage.getItem(COOKIE_CONSENT_KEY)
    if (stored) {
      try {
        return JSON.parse(stored)
      } catch {
        return null
      }
    }
  }
  return null
}

function saveConsent(accepted: boolean) {
  if (process.client) {
    const consent = {
      accepted,
      version: COOKIE_CONSENT_VERSION,
      timestamp: new Date().toISOString()
    }
    localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify(consent))
    applyConsent(consent)
  }
}

function applyConsent(consent: { accepted: boolean }) {
  if (process.client) {
    if (consent.accepted) {
      // Enable analytics/tracking cookies here
      console.log('Analytics cookies enabled')
      // Example: window.gtag?.('consent', 'update', { analytics_storage: 'granted' })
    } else {
      // Disable analytics/tracking cookies here
      console.log('Analytics cookies disabled')
      // Example: window.gtag?.('consent', 'update', { analytics_storage: 'denied' })
    }
  }
}

function acceptCookies() {
  saveConsent(true)
  showBanner.value = false
}

function rejectCookies() {
  saveConsent(false)
  showBanner.value = false
}
</script>

<style scoped>
.slide-up-enter-active,
.slide-up-leave-active {
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.slide-up-enter-from,
.slide-up-leave-to {
  transform: translateY(100%);
  opacity: 0;
}

.slide-up-enter-to,
.slide-up-leave-from {
  transform: translateY(0);
  opacity: 1;
}
</style>
