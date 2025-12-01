<script setup lang="ts">
definePageMeta({ public: true })

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
          <div class="relative z-10 mx-auto max-w-2xl lg:col-span-7 lg:max-w-none lg:pt-6 xl:col-span-6">
            <h1 class="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
              Your AI Companion
              <span class="block text-primary-600 mt-2">That Actually Knows You</span>
            </h1>
            <p class="mt-6 text-lg leading-8 text-gray-600">
              Experience conversations that feel real. Evotally learns from every interaction,
              remembers what matters to you, and adapts to your needs—whether you need a friend,
              coach, or partner.
            </p>
            <div class="mt-10 flex flex-col sm:flex-row gap-4">
              <NuxtLink
                v-if="!isAuthed"
                to="/register"
                class="btn-primary text-lg px-8 py-4 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all"
              >
                Get Started Free
              </NuxtLink>
              <NuxtLink
                v-else
                to="/voice"
                class="btn-primary text-lg px-8 py-4 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all"
              >
                Start Talking
              </NuxtLink>
              <NuxtLink
                v-if="!isAuthed"
                to="/login"
                class="btn-secondary text-lg px-8 py-4"
              >
                Sign In
              </NuxtLink>
              <NuxtLink
                v-else
                to="/assistant"
                class="btn-secondary text-lg px-8 py-4"
              >
                Customize Assistant
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
          <div class="relative mt-10 sm:mt-20 lg:col-span-5 lg:row-span-2 lg:mt-0 xl:col-span-6">
            <div class="relative mx-auto aspect-square max-w-lg lg:max-w-none">
              <!-- Animated Orb Preview -->
              <div class="absolute inset-0 flex items-center justify-center">
                <div class="relative">
                  <div class="absolute inset-0 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 opacity-20 blur-3xl animate-pulse"></div>
                  <div class="relative h-64 w-64 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 shadow-2xl flex items-center justify-center">
                    <svg class="w-24 h-24 text-white" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 14a3 3 0 0 0 3-3V6a3 3 0 1 0-6 0v5a3 3 0 0 0 3 3Zm5-3a5 5 0 0 1-10 0H5a7 7 0 0 0 14 0h-2ZM11 19v3h2v-3h-2Z"/>
                    </svg>
                  </div>
                  <!-- Floating particles -->
                  <div class="absolute top-0 left-0 w-4 h-4 rounded-full bg-secondary-400 opacity-60 animate-bounce" style="animation-delay: 0s;"></div>
                  <div class="absolute top-1/4 right-0 w-3 h-3 rounded-full bg-primary-400 opacity-60 animate-bounce" style="animation-delay: 0.5s;"></div>
                  <div class="absolute bottom-1/4 left-0 w-3 h-3 rounded-full bg-secondary-500 opacity-60 animate-bounce" style="animation-delay: 1s;"></div>
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
