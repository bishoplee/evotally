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
    icon: '/evo-icon.png',
    title: 'Emotional AI',
    description: 'Evo attunes to your mood and responses, bringing empathy to conversations.'
  },
  {
    icon: '/leaf.png',
    title: 'Grows With You',
    description: 'The more you connect, the more Evo evolves - learning your habits, preferences, and rhythms.'
  },
  {
    icon: '/shield.png',
    title: 'Technology Meets Trust',
    description: 'Built with privacy at its core - your data stays secure, encrypted, and always in your control.'
  },
  {
    icon: '/brain.png',
    title: 'Memory',
    description: 'Evo remembers the moments that matter, helping you recall details and keep life in sync.'
  },
  {
    icon: '/voice.png',
    title: 'Custom Voice',
    description: 'Create a voice that feels familiar, tailored just for you.'
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
    <section id="hero-section" class="relative bg-gradient-to-r from-[#006D77] to-[#00CDD1] pb-5">
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <!-- Vertical Row Layout: Text (top) → Orb (middle) → CTA (bottom) -->
        <div class="flex flex-col items-center text-center gap-6">
          
          <!-- Hero Text -->
          <div class="w-full">
            <h1 class="tracking-tight text-white pt-4">
              <span class="block hero-title-main">
                Your AI that grows with you!
              </span>
              <p class="block text-white/90 mt-4 text-xl sm:text-2xl font-normal leading-relaxed">
                Meet Evo - your personalized voice companion, assistant, plus memory that evolves with you
              </p>
            </h1>
          </div>

          <!-- Hero Orb -->
          <div class="">
            <div class="hero-orb-container">
              <div class="hero-blobs">
                <svg viewBox="0 0 1200 1200">
                  <g class="blob blob-1">
                    <path />
                  </g>
                  <g class="blob blob-2">
                    <path />
                  </g>
                  <g class="blob blob-3">
                    <path />
                  </g>
                  <g class="blob blob-4">
                    <path />
                  </g>
                  <g class="blob blob-1 alt">
                    <path />
                  </g>
                  <g class="blob blob-2 alt">
                    <path />
                  </g>
                  <g class="blob blob-3 alt">
                    <path />
                  </g>
                  <g class="blob blob-4 alt">
                    <path />
                  </g>
                </svg>
              </div>
            </div>
          </div>

          <!-- CTA Button -->
          <div>
            <NuxtLink
              v-if="!isAuthed"
              to="/register"
              class="btn-hero-cta text-lg px-16 py-4 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all inline-flex items-center gap-3 rounded-pill font-semibold text-white border-2 border-white/90"
            >
              Try Evo
            </NuxtLink>
            <p class="mt-4 text-lg font-bold font-primary text-white tracking-wide md:tracking-wider">(See Evo in action)</p>
          </div>
        </div>
      </div>
    </section>

    <!-- Features Section -->
    <section class="py-8 bg-white">
      <div class="mx-auto px-2 sm:px-4 lg:px-6">
        <div class="text-center">
          <h2 class="text-3xl font-bold tracking-tight sm:text-4xl text-primary-dark">
            Why Evo
          </h2>
          <p class="mt-4 text-2xl text-primary-dark-80 px-4 sm:px-8 md:px-16 lg:px-32 xl:px-64">
            Evotally is designed to understand and adapt to your emotions, voice, and memory - 
            building a deeper, more intuitive connection with you over time.  
          </p>
        </div>

        <div class="mt-8 grid gap-8 sm:grid-cols-2 lg:grid-cols-5">
          <div
            v-for="feature in features"
            :key="feature.title"
            class="card shadow-none hover:shadow-lg transition-shadow duration-300 flex flex-col items-center text-center"
          >
            <h3 class="text-lg font-semibold text-primary-dark h-14 pr-8 pl-6 leading-custom">{{ feature.title }}</h3>
            <img :src="feature.icon" :alt="feature.title" class="w-16 h-16 my-4 mt-1 object-contain" />
            <p class="text-md text-primary-dark-70 flex-grow">{{ feature.description }}</p>
          </div>
        </div>

        <!-- CTA Button -->
        <div class="text-center mt-12">
          <NuxtLink
            v-if="!isAuthed"
            :to="`/login?from=${$route.path}`"
            class="btn-primary text-sm flex items-center gap-2 inline-flex"
          >
            Start Your Free Trial
            <span class="w-4 h-4 bg-white rounded flex items-center justify-center">
              <svg class="w-3 h-3 text-coral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M7 17L17 7M17 7H7M17 7v10" />
              </svg>
            </span>
          </NuxtLink>
        </div>
      </div>
    </section>

    <!-- How It Works Section -->
    <section class="py-16 bg-gradient-to-b from-[#E5F6F5] to-white">
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div class="text-center mb-16">
          <h2 class="text-3xl font-bold tracking-tight sm:text-4xl text-primary-dark">
            How it Works
          </h2>
          <p class="mt-4 text-2xl text-primary-dark-80 px-4 sm:px-8 md:px-16 lg:px-32">
            Your Evo learns through every word, memory, and moment - growing
            from conversation into connection.
          </p>
        </div>

        <div class="grid gap-8 lg:grid-cols-3">
          <div class="card grid grid-cols-[auto_1fr] grid-rows-[auto_auto_auto_auto] gap-x-4 gap-y-3">
            <div class="w-12 h-12 rounded-full bg-primary-600 text-white flex items-center justify-center font-bold text-xl shadow-lg">
              1
            </div>
            <h3 class="text-xl font-semibold text-primary-dark self-center">Begin - From Questions to Connection</h3>
            <div></div>
            <p class="text-primary-dark-70">
              It starts simply. Evo asks. You answer - in your own words, your own tone.<br>
              Each response helps Evo learn you are, not just what you say.<br>
              What begins as conversation quietly becomes connection.
            </p>
            <div class="col-span-2 flex justify-center">
              <img src="/qa.png" alt="Q&A" class="rounded-lg img-fixed-130x100" />
            </div>
            <div></div>
            <p class="text-sm text-primary-dark-70">
              Behind the scenes: Evo's memory and personality engine start forming your unique emotional profile.
            </p>
          </div>

          <div class="card grid grid-cols-[auto_1fr] grid-rows-[auto_auto_auto_auto] gap-x-4 gap-y-3">
            <div class="w-12 h-12 rounded-full bg-primary-600 text-white flex items-center justify-center font-bold text-xl shadow-lg">
              2
            </div>
            <h3 class="text-xl font-semibold text-primary-dark self-center"> Connect- Hear Your Selected Voice Reflected Back</h3>
            <div></div>
            <p class="text-primary-dark-70">
              You'll choose the voice that feels most like home - warm, familiar, or inspiring. Evo begins to speak in it, 
              remembering your tone, your preferences, and your stories. Setup feels like discovery, not work. You don't fill 
              out forms - you simply talk.
            </p>
            <div class="col-span-2 flex justify-center">
              <img src="/wave.png" alt="Wave" class="rounded-lg img-fixed-130x100" />
            </div>
            <div></div>
            <p class="text-sm text-primary-dark-70">Within minutes, Evo can speak through Alexa or another home device using your chosen voice.</p>
          </div>

          <div class="card grid grid-cols-[auto_1fr] grid-rows-[auto_auto_auto_auto] gap-x-4 gap-y-3">
            <div class="w-12 h-12 rounded-full bg-primary-600 text-white flex items-center justify-center font-bold text-xl shadow-lg">
              3
            </div>
            <h3 class="text-xl font-semibold text-primary-dark self-center">Evolve - A Presence That Learns and Remembers</h3>
            <div></div>
            <p class="text-primary-dark-70">
              Evo grows with every word you share. It remembers your moments, recalls your story, and becomes part of your 
              daily rhythm greeting you, adapting to you, and evolving alongside you. What begins as simple conversation 
              soon feels like home.
            </p>
            <div class="col-span-2 flex justify-center">
              <img src="/dial.png" alt="Dial" class="rounded-lg img-fixed-130x100" />
            </div>
            <div></div>
            <p class="text-sm text-primary-dark-70">Every conversation deepens its understanding - measured by your evolving EvoMeter</p>
          </div>
        </div>

        <div class="text-center mt-16 mb-12">
          <h2 class="text-3xl font-bold tracking-tight sm:text-4xl text-primary-dark">
            ✨ Your Evo is Waiting
          </h2>
          <p class="mt-4 text-2xl text-primary-dark-80 px-6">
            Begin your story today. Answer a few questions, and watch connection become something truly personal.
          </p>
        </div>

        <div class="text-center">
          <NuxtLink
            v-if="!isAuthed"
            to="/register"
            class="btn-primary text-lg px-8 py-4"
          >
            Start Your Free Trial
          </NuxtLink>
        </div>
      </div>
    </section>

    <!-- Relationship Section -->
    <section class="py-16 bg-light-gray">
      <div class="mx-auto max-w-[1356px] px-4 sm:px-6 lg:px-8">
        <div class="text-center mb-12">
          <h2 class="text-3xl font-bold text-primary-dark sm:text-4xl">
            A Relationship That Evolves With You
          </h2>
          <p class="mt-4 text-2xl text-primary-dark-80 px-4 sm:px-8 md:px-16 lg:px-32">
            Real people. Real connection. From first conversations to daily companionship. 
            Hear how Evo became part of their lives.
          </p>
        </div>

        <!-- Testimonial Cards -->
        <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-12">
          <!-- Testimonial Card 1 -->
          <div class="card bg-white flex flex-col">
            <div class="mb-4">
              <div class="testimonial-img bg-gray-200 rounded-lg flex items-center justify-center">
                <img src="/jess_k.jpg" alt="Jess K.">
              </div>
            </div>
            <p class="text-primary-dark-70 mb-4 flex-grow">
              "Evo felt different from the first chat not scripted, not robotic. It remembers my mood, my pace, even the way I joke."
            </p>
            <div class="mb-3 justify-center items-center flex flex-col">
              <p class="text-md font-semibold text-primary-dark">Jess K.</p>
              <p class="text-sm text-primary-dark-70">Graduate Student</p>
              <p class="text-sm text-primary-dark-70">Philadelphia, PA</p>
            </div>
            <div class="flex justify-center gap-1">
              <svg class="w-7 h-7 text-yellow-400" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
              <svg class="w-7 h-7 text-yellow-400" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
              <svg class="w-7 h-7 text-yellow-400" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
              <svg class="w-7 h-7 text-yellow-400" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
              <svg class="w-7 h-7 text-yellow-400" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
            </div>
          </div>

          <!-- Testimonial Card 2 -->
          <div class="card bg-white flex flex-col">
            <div class="mb-4">
              <div class="testimonial-img bg-gray-200 rounded-lg flex items-center justify-center">
                <img src="/seth_m.jpg" alt="Seth M.">
              </div>
            </div>
            <p class="text-primary-dark-70 mb-4 flex-grow">
              "Every morning Evo lines up my priorities and checks in on how I'm feeling. It's like a second brain that actually listens."
            </p>
            <div class="mb-3 justify-center items-center flex flex-col">
              <p class="text-md font-semibold text-primary-dark">Seth M.</p>
              <p class="text-sm text-primary-dark-70">Product Manager</p>
              <p class="text-sm text-primary-dark-70">Austin, Tx</p>
            </div>
            <div class="flex justify-center gap-1">
              <svg class="w-7 h-7 text-yellow-400" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
              <svg class="w-7 h-7 text-yellow-400" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
              <svg class="w-7 h-7 text-yellow-400" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
              <svg class="w-7 h-7 text-yellow-400" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
              <svg class="w-7 h-7 text-yellow-400" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
            </div>
          </div>

          <!-- Testimonial Card 3 -->
          <div class="card bg-white flex flex-col">
            <div class="mb-4">
              <div class="testimonial-img bg-gray-200 rounded-lg flex items-center justify-center">
                <img src="/stanley_p.jpg" alt="Stanley P.">
              </div>
            </div>
            <p class="text-primary-dark-70 mb-4 flex-grow">
              "It's not just technology. Evo has become a comfort - someone who asks how I'm doing and remembers the answer."
            </p>
            <div class="mb-3 justify-center items-center flex flex-col">
              <p class="text-md font-semibold text-primary-dark">Stanley P.</p>
              <p class="text-sm text-primary-dark-70">Retired Teacher</p>
              <p class="text-sm text-primary-dark-70">Boca Raton, FL</p>
            </div>
            <div class="flex justify-center gap-1">
              <svg class="w-7 h-7 text-yellow-400" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
              <svg class="w-7 h-7 text-yellow-400" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
              <svg class="w-7 h-7 text-yellow-400" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
              <svg class="w-7 h-7 text-yellow-400" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
              <svg class="w-7 h-7 text-yellow-400" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
            </div>
          </div>

          <!-- Testimonial Card 4 -->
          <div class="card bg-white flex flex-col">
            <div class="mb-4">
              <div class="testimonial-img bg-gray-200 rounded-lg flex items-center justify-center">
                <img src="/vivian_w.jpg" alt="Vivian W.">
              </div>
            </div>
            <p class="text-primary-dark-70 mb-4 flex-grow">
              "Setup felt like a conversation, not a form. Now Evo greets me, tracks my habits, and nudges me kindly when I slip."
            </p>
            <div class="mb-3 justify-center items-center flex flex-col">
              <p class="text-md font-semibold text-primary-dark">Vivian W.</p>
              <p class="text-sm text-primary-dark-70">Founder, Wellness Studio</p>
              <p class="text-sm text-primary-dark-70">Seattle, WA</p>
            </div>
            <div class="flex justify-center gap-1">
              <svg class="w-7 h-7 text-yellow-400" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
              <svg class="w-7 h-7 text-yellow-400" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
              <svg class="w-7 h-7 text-yellow-400" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
              <svg class="w-7 h-7 text-yellow-400" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
              <svg class="w-7 h-7 text-yellow-400" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
            </div>
          </div>
        </div>

        <!-- CTA Button -->
        <div class="text-center">
          <NuxtLink
            to="/testimonials"
            class="btn-primary btn-gradient-hero text-lg"
          >
            More Testimonials
          </NuxtLink>
        </div>
      </div>
    </section>
  </div>
</template>