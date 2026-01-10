<script setup lang="ts">
definePageMeta({ public: true })

useHead({
  title: 'FAQ - Evotally',
  meta: [
    { name: 'description', content: 'Frequently asked questions about Evotally and our AI companion platform.' }
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
              Frequently Asked Questions
            </span>
            <span class="block text-white/90 mt-2 hero-title-sub">
              Get Your Answers
            </span>
          </h1>
          <p class="mt-8 leading-relaxed text-white/80 hero-text max-w-3xl mx-auto">
            Find answers to common questions about Evotally, from getting started 
            to advanced features and privacy concerns.
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
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 class="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl mb-4">
            Coming Soon
          </h2>
          <p class="text-lg text-gray-600 max-w-2xl mx-auto">
            We're compiling the most helpful answers to your questions. 
            Check back soon for comprehensive FAQs about using Evotally.
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
