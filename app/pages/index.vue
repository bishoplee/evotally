<script setup lang="ts">
definePageMeta({ public: true })

useHead({
  title: 'Your AI that grows with you - Evotally',
  meta: [
    { name: 'description', content: 'Experience conversations that feel real. Evotally learns from every interaction, remembers what matters to you, and adapts to your needs.' }
  ]
})

import { ref, computed, onMounted } from 'vue'
import { useAuth } from '~/stores/auth'

const auth = useAuth()
const isAuthed = computed(() => auth.isAuthed)

const features = [
  {
    icon: '🎤',
    title: 'Natural Voice Conversations',
    description: 'Talk naturally with your AI companion using advanced voice recognition and realistic text-to-speech.'
  },
  {
    icon: '🧠',
    title: 'Long-Term Memory',
    description: 'Your assistant remembers your preferences, past conversations, and important details about your life.'
  },
  {
    icon: '🤝',
    title: 'Personalized Relationship',
    description: 'Customize your assistant\'s personality, voice, and relationship style to match your needs.'
  },
  {
    icon: '🔒',
    title: 'Private & Secure',
    description: 'Your conversations and data are encrypted and stored securely. You have full control over your information.'
  }
]

const stats = [
  { value: '24/7', label: 'Always Available' },
  { value: '100%', label: 'Private' },
  { value: '∞', label: 'Unlimited Conversations' }
]
</script>

<template>
  <div>
    <!-- Hero Section -->
    <section class="relative overflow-hidden bg-gradient-to-br from-primary-50 via-white to-secondary-50 py-20 sm:py-32">
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div class="lg:grid lg:grid-cols-12 lg:gap-x-8 lg:gap-y-20">
          <!-- Hero Content -->
          <div class="relative z-10 mx-auto max-w-2xl lg:col-span-7 lg:max-w-none lg:pt-6 xl:col-span-7">
            <h1 class="tracking-tight text-gray-900 mt-12">
              <span class="block hero-title-main">
                Your AI Companion
              </span>
              <span class="block text-primary-600 mt-2 hero-title-sub">
                That Actually Knows You
              </span>
            </h1>
            <p class="mt-8 leading-relaxed text-gray-600 hero-text">
              Experience conversations that feel real. Evotally learns from every interaction,
              remembers what matters to you, and adapts to your needs — whether you need a friend,
              coach, or partner.
            </p>
            <div class="mt-10">
              <NuxtLink
                v-if="!isAuthed"
                to="/register"
                class="btn-primary text-lg px-8 py-4 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all inline-flex items-center gap-3"
              >
                Try Evotally
                <span class="w-5 h-5 bg-white rounded flex items-center justify-center">
                  <svg class="w-4 h-4 text-coral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M7 17L17 7M17 7H7M17 7v10" />
                  </svg>
                </span>
              </NuxtLink>
              <NuxtLink
                v-else
                to="/voice"
                class="btn-primary text-lg px-8 py-4 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all inline-flex items-center gap-3"
              >
                Start Talking
                <span class="w-5 h-5 bg-white rounded flex items-center justify-center">
                  <svg class="w-4 h-4 text-coral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M7 17L17 7M17 7H7M17 7v10" />
                  </svg>
                </span>
              </NuxtLink>
            </div>

            <!-- Stats -->
            <div class="mt-12 grid grid-cols-3 gap-8">
              <div v-for="stat in stats" :key="stat.label" class="text-center">
                <div class="text-3xl font-bold text-primary-600">{{ stat.value }}</div>
                <div class="mt-1 text-sm text-gray-600">{{ stat.label }}</div>
              </div>
            </div>
          </div>

          <!-- Hero Visual -->
          <div class="relative mt-10 sm:mt-20 lg:col-span-5 lg:row-span-2 lg:mt-0 xl:col-span-5">
            <div class="relative mx-auto aspect-square max-w-lg lg:max-w-none">
              <!-- Animated Orb Preview -->
              <div class="absolute inset-0 flex items-center justify-center">
                <div class="relative">
                  <!-- Outer glow layers with official gradient -->
                  <div class="absolute inset-0 rounded-full blur-[100px] animate-pulse hero-orb-glow-1"></div>
                  <div class="absolute inset-0 rounded-full blur-[80px] animate-pulse hero-orb-glow-2" style="animation-delay: 0.5s;"></div>
                  <div class="absolute inset-0 rounded-full blur-[60px] animate-pulse hero-orb-glow-3" style="animation-delay: 1s;"></div>
                  
                  <!-- Main orb with official Evotally gradient -->
                  <div class="relative h-64 w-64 rounded-full shadow-2xl flex items-center justify-center animate-float hero-orb">
                    <!-- Inner glow for depth --
                    <div class="absolute inset-8 rounded-full opacity-40" style="background: linear-gradient(315deg, rgba(255, 255, 255, 0.4) 0%, rgba(255, 255, 255, 0.1) 100%);"></div>
                    -->
                    
                    <!-- Microphone icon -->
                    <svg class="relative z-10 w-32 h-32 text-white drop-shadow-lg" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 14a3 3 0 0 0 3-3V6a3 3 0 1 0-6 0v5a3 3 0 0 0 3 3Zm5-3a5 5 0 0 1-10 0H5a7 7 0 0 0 14 0h-2ZM11 19v3h2v-3h-2Z"/>
                    </svg>
                  </div>
                  
                  <!-- Floating particles with brand colors -->
                  <div class="absolute top-0 left-0 w-6 h-6 rounded-full opacity-70 animate-bounce particle-pink" style="animation-delay: 0s;"></div>
                  <div class="absolute top-1/4 right-0 w-5 h-5 rounded-full opacity-70 animate-bounce particle-cyan" style="animation-delay: 0.5s;"></div>
                  <div class="absolute bottom-1/4 left-0 w-5 h-5 rounded-full opacity-70 animate-bounce particle-teal" style="animation-delay: 1s;"></div>
                  <div class="absolute bottom-0 right-1/4 w-4 h-4 rounded-full opacity-70 animate-bounce particle-purple" style="animation-delay: 1.5s;"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Features Section -->
    <section class="py-24 bg-white">
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div class="text-center">
          <h2 class="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Everything you need in an AI companion
          </h2>
          <p class="mt-4 text-lg text-gray-600">
            Built for meaningful, long-term relationships with AI that truly understands you.
          </p>
        </div>

        <div class="mt-20 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div
            v-for="feature in features"
            :key="feature.title"
            class="card hover:shadow-lg transition-shadow duration-300"
          >
            <div class="text-5xl mb-4">{{ feature.icon }}</div>
            <h3 class="text-lg font-semibold text-gray-900 mb-2">{{ feature.title }}</h3>
            <p class="text-gray-600 text-sm">{{ feature.description }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- How It Works Section -->
    <section class="py-24 bg-gray-50">
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div class="text-center mb-16">
          <h2 class="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            How Evotally Works
          </h2>
          <p class="mt-4 text-lg text-gray-600">
            Getting started is simple. Start talking in minutes.
          </p>
        </div>

        <div class="grid gap-8 lg:grid-cols-3">
          <div class="relative">
            <div class="absolute -top-4 -left-4 w-12 h-12 rounded-full bg-primary-600 text-white flex items-center justify-center font-bold text-xl shadow-lg">
              1
            </div>
            <div class="card ml-4">
              <h3 class="text-xl font-semibold text-gray-900 mb-3">Create Your Account</h3>
              <p class="text-gray-600">
                Sign up with email or Google in seconds. No credit card required to start.
              </p>
            </div>
          </div>

          <div class="relative">
            <div class="absolute -top-4 -left-4 w-12 h-12 rounded-full bg-primary-600 text-white flex items-center justify-center font-bold text-xl shadow-lg">
              2
            </div>
            <div class="card ml-4">
              <h3 class="text-xl font-semibold text-gray-900 mb-3">Customize Your Assistant</h3>
              <p class="text-gray-600">
                Choose your assistant's personality, voice, and relationship type to match your needs.
              </p>
            </div>
          </div>

          <div class="relative">
            <div class="absolute -top-4 -left-4 w-12 h-12 rounded-full bg-primary-600 text-white flex items-center justify-center font-bold text-xl shadow-lg">
              3
            </div>
            <div class="card ml-4">
              <h3 class="text-xl font-semibold text-gray-900 mb-3">Start Conversations</h3>
              <p class="text-gray-600">
                Click to talk or type to chat. Your assistant learns more about you with every interaction.
              </p>
            </div>
          </div>
        </div>

        <div class="mt-12 text-center">
          <NuxtLink
            v-if="!isAuthed"
            to="/register"
            class="btn-primary text-lg px-8 py-4"
          >
            Start Your Journey
          </NuxtLink>
        </div>
      </div>
    </section>

    <!-- CTA Section -->
    <section class="bg-gradient-to-r from-primary-600 to-primary-700 py-16">
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div class="text-center">
          <h2 class="text-3xl font-bold text-white sm:text-4xl">
            Ready to meet your AI companion?
          </h2>
          <p class="mt-4 text-lg text-primary-100">
            Join thousands experiencing the future of AI conversation.
          </p>
          <div class="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
            <NuxtLink
              v-if="!isAuthed"
              to="/register"
              class="btn-secondary bg-white text-primary-700 hover:bg-gray-50 text-lg px-8 py-4"
            >
              Get Started Free
            </NuxtLink>
            <NuxtLink
              v-else
              to="/voice"
              class="btn-secondary bg-white text-primary-700 hover:bg-gray-50 text-lg px-8 py-4"
            >
              Go to Voice Chat
            </NuxtLink>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
@keyframes float {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-20px); }
}

.animate-float {
  animation: float 3s ease-in-out infinite;
}
</style>
