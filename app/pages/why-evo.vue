<script setup lang="ts">
definePageMeta({ public: true })

useHead({
  title: 'Why Evo - Evotally',
  meta: [
    { name: 'description', content: 'Discover why Evotally is different from other AI assistants and how it can transform your daily interactions.' }
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
              Why Choose Evotally?
            </span>
            <span class="block text-white/90 mt-2 hero-title-sub">
              More Than Just Another AI
            </span>
          </h1>
          <p class="mt-8 leading-relaxed text-white/80 hero-text max-w-3xl mx-auto">
            Experience the difference of an AI companion that truly understands you, 
            remembers your conversations, and grows with you over time.
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
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h2 class="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl mb-4">
            Coming Soon
          </h2>
          <p class="text-lg text-gray-600 max-w-2xl mx-auto">
            We're crafting an amazing experience to show you why Evotally stands out. 
            Check back soon to learn about our unique approach to AI companionship.
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
