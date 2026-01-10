<script setup lang="ts">
definePageMeta({ public: true })

useHead({
  title: 'Blog - Evotally',
  meta: [
    { name: 'description', content: 'Latest news, updates, and insights from the Evotally team about AI and personal assistants.' }
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
              Evotally Blog
            </span>
            <span class="block text-white/90 mt-2 hero-title-sub">
              Insights & Updates
            </span>
          </h1>
          <p class="mt-8 leading-relaxed text-white/80 hero-text max-w-3xl mx-auto">
            Stay informed with the latest updates, tips, and stories from the world 
            of AI companions and personal assistants.
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
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
            </svg>
          </div>
          <h2 class="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl mb-4">
            Coming Soon
          </h2>
          <p class="text-lg text-gray-600 max-w-2xl mx-auto">
            We're preparing engaging content about AI, technology, and how Evotally is evolving. 
            Check back soon for our latest articles and updates.
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
