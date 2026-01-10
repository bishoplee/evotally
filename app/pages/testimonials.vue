<script setup lang="ts">
definePageMeta({ public: true })

useHead({
  title: 'Testimonials - Evotally',
  meta: [
    { name: 'description', content: 'Real people. Real connection. Hear how Evo became part of their lives.' }
  ]
})

import { ref, computed } from 'vue'
import { useAuth } from '~/stores/auth'

const auth = useAuth()
const isAuthed = computed(() => auth.isAuthed)
</script>

<template>
  <div>
    <!-- Hero Section -->
    <section class="relative overflow-hidden bg-gradient-to-r from-[#006D77] to-[#00CDD1] pt-32 pb-16">
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div class="text-center text-white">
          <h1 class="hero-title-main mb-4">
            A Relationship That Evolves With You
          </h1>
          <p class="text-xl sm:text-2xl font-normal leading-relaxed text-white/90 max-w-3xl mx-auto">
            Real people. Real connection. From first conversations to daily companionship. 
            Hear how Evo became part of their lives.
          </p>
        </div>
      </div>
    </section>

    <!-- Testimonials Section -->
    <section class="py-16 bg-white">
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div class="text-center mb-16">
          <h2 class="text-3xl font-bold tracking-tight sm:text-4xl text-primary-dark">
            User Stories
          </h2>
          <p class="mt-4 text-lg text-primary-dark-80">
            Discover how Evo transforms everyday moments into meaningful connections
          </p>
        </div>

        <div class="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          <!-- Testimonial cards will go here -->
          <div class="card">
            <div class="mb-4">
              <svg class="w-8 h-8 text-primary-600" fill="currentColor" viewBox="0 0 24 24">
                <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z"/>
              </svg>
            </div>
            <p class="text-primary-dark-70 mb-4">
              Coming soon - Real testimonials from Evo users
            </p>
            <div class="flex items-center">
              <div class="ml-3">
                <p class="text-sm font-semibold text-primary-dark">User Name</p>
                <p class="text-sm text-primary-dark-70">Early Adopter</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- CTA Section -->
    <section class="py-16 bg-gradient-to-r from-[#00CDD1] to-[#006D77]">
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div class="text-center">
          <h2 class="text-3xl font-bold text-white sm:text-4xl">
            Ready to Start Your Journey?
          </h2>
          <p class="mt-4 text-lg text-white/90">
            Join our community and experience the future of AI companionship
          </p>
          <div class="mt-8">
            <NuxtLink
              v-if="!isAuthed"
              to="/register"
              class="btn-primary text-lg px-8 py-4"
            >
              Start Your Free Trial
            </NuxtLink>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>
