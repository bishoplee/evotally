<script setup lang="ts">
definePageMeta({ public: true })

useHead({
  title: 'How It Works - Evotally',
  meta: [
    { name: 'description', content: 'Learn how Evotally works and how to get started with your AI companion.' }
  ]
})
</script>

<template>
  <div>
    <!-- Hero Section -->
    <section class="relative overflow-hidden bg-gradient-to-r from-[#006D77] to-[#00CDD1] py-20 sm:py-32">
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div class="text-center">
          <h1 class="tracking-tight text-white">
            <span class="block hero-title-main">
              How Evotally Works
            </span>
            <span class="block text-white/90 mt-2 hero-title-sub">
              Simple, Powerful, Personal
            </span>
          </h1>
          <p class="mt-8 leading-relaxed text-white/80 hero-text max-w-3xl mx-auto">
            Getting started with your AI companion is easy. Learn how Evotally's 
            memory and personality features create a truly personalized experience.
          </p>
        </div>
      </div>
    </section>

    <!-- Content Coming Soon -->
    <section class="py-24 bg-white">
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div class="text-center">
          <div class="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary-100 mb-6">
            <svg class="w-10 h-10 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <h2 class="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl mb-4">
            Coming Soon
          </h2>
          <p class="text-lg text-gray-600 max-w-2xl mx-auto">
            We're creating detailed guides to help you understand and get the most out of Evotally. 
            Stay tuned for step-by-step walkthroughs and tutorials.
          </p>
          <div class="mt-10">
            <NuxtLink to="/" class="btn-primary text-lg px-8 py-4">
              Return Home
            </NuxtLink>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>
