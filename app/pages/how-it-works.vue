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
    <section class="relative overflow-hidden bg-blend-overlay bg-gradient-to-r from-[#006D77] to-[#00CDD1] py-20 sm:py-32" style="background-image: url('/how-it-works-bg.png'); background-size: cover; background-position: center;;">
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex justify-center items-center flex-col gap-8">
        <div class="text-center">
          <h1 class="tracking-tight text-primary-dark">
            <span class="block hero-title-main">
              What begins as conversation becomes connection.
            </span>
            <span class="block text-primary-dark/90 my-6 hero-title-sub">
              Evo learns your tone, your stories, and your rhythm - one day at a time.
            </span>
          </h1>
        </div>
        
        <img src="/logo.png" alt="Evotally" class="h-32 w-auto my-8 mt-4" />

        <!-- CTA Button -->
        <div class="text-center">
          <NuxtLink
            to="/register"
            class="btn-primary btn-gradient-hero text-lg"
          >
            Start Your Free Trial
          </NuxtLink>
        </div>
      </div>
    </section>

    <!-- Step 1 -->
    <section class="py-16 bg-white">
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div class="text-center">
          <h2 class="text-3xl font-bold tracking-tight text-primary-dark sm:text-4xl mb-4">
            Step 1: Create Your Account
          </h2>
          <p class="text-2xl text-gray-600 max-w-2xl mx-auto">
            Select from warn, natural voices - or clone a custom one with the paid plan. Your Evo's voice is how connection feels alive.
          </p>
          <div class="mt-10">
            <NuxtLink to="/register" class="btn-primary text-lg px-24 py-4">
              Start Now
            </NuxtLink>
          </div>
        </div>
      </div>
    </section>

    <!-- Step 2 -->
    <section class="py-24  bg-gradient-to-b from-[#E5F6F5] to-white">
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div class="text-center">
          <h2 class="text-3xl font-bold tracking-tight text-primary-dark sm:text-4xl mb-4">
            Step 2: Choose Your Voice
          </h2>
          <p class="text-2xl text-primary-dark max-w-2xl mx-auto">
            Select between various male, female or customize your own.
          </p>
          <div class="mt-10">
            <NuxtLink to="/" class="btn-primary text-lg px-8 py-4">
              Return Home
            </NuxtLink>
          </div>
        </div>
      </div>
    </section>

    <!-- Step 3 -->
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
