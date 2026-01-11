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
  <div class="bg-gradient-to-b from-[#E5F6F5] to-white">
    <!-- Hero Section -->
    <section class="relative overflow-hidden pt-24 pb-12 sm:pb-16 border-b-4 border-[#00CDD1]">
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <!-- Vertical Row Layout: Text (top) → Orb (middle) → CTA (bottom) -->
        <div class="flex flex-col items-center text-center gap-3">
          
          <!-- Hero Text -->
          <div class="w-full">
            <h1 class="tracking-tight text-primary-dark">
              <span class="block hero-title-main">
                Questions, answered with Evo
              </span>
              <p class="block text-primary-dark/90 mt-4 text-xl sm:text-2xl font-normal leading-relaxed">
                Everything you need to know about your Evo - simple, secure, and always personal.
              </p>
            </h1>
          </div>

          <!-- Hero Orb -->
          <div>
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
              class="btn-hero-cta text-lg px-16 py-4 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all inline-flex items-center gap-3 rounded-pill font-heading font-semibold text-white border-2 border-white/30"
            >
              Ask Evo
              <span class="w-5 h-5 bg-white rounded flex items-center justify-center">
                <svg class="w-4 h-4 icon-coral" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M7 17L17 7M17 7H7M17 7v10" />
                </svg>
              </span>
            </NuxtLink>
          </div>

          <!-- Search Field -->
          <div class="w-full max-w-2xl mt-2">
            <div class="relative">
              <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Search FAQs..."
                class="w-full pl-12 pr-4 py-4 text-lg bg-white border-2 border-gray-300 rounded-pill focus:outline-none focus:border-primary-600 focus:ring-2 focus:ring-primary-600/20 transition-colors"
              />
            </div>
          </div>

          <!-- Category Pills -->
          <div class="w-full max-w-5xl mt-8">
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
              <!-- Getting Started -->
              <button class="flex items-center gap-3 px-6 py-3 bg-white border-2 border-gray-300 rounded-pill hover:border-primary-600 hover:bg-primary-50 transition-all">
                <img src="/faq-assets/get_started.svg" alt="Getting Started" class="w-6 h-6 flex-shrink-0" />
                <span class="text-sm font-semibold text-primary-dark">Getting Started</span>
              </button>

              <!-- Personalization & Voice -->
              <button class="flex items-center gap-3 px-6 py-3 bg-white border-2 border-gray-300 rounded-pill hover:border-primary-600 hover:bg-primary-50 transition-all">
                <img src="/faq-assets/personalization_voice.svg" alt="Personalization & Voice" class="w-6 h-6 flex-shrink-0" />
                <span class="text-sm font-semibold text-primary-dark">Personalization & Voice</span>
              </button>

              <!-- Memory & Interaction -->
              <button class="flex items-center gap-3 px-6 py-3 bg-white border-2 border-gray-300 rounded-pill hover:border-primary-600 hover:bg-primary-50 transition-all">
                <img src="/faq-assets/memory_interaction.svg" alt="Memory & Interaction" class="w-6 h-6 flex-shrink-0" />
                <span class="text-sm font-semibold text-primary-dark">Memory & Interaction</span>
              </button>

              <!-- Privacy & Security -->
              <button class="flex items-center gap-3 px-6 py-3 bg-white border-2 border-gray-300 rounded-pill hover:border-primary-600 hover:bg-primary-50 transition-all">
                <img src="/faq-assets/privacy_security.svg" alt="Privacy & Security" class="w-6 h-6 flex-shrink-0" />
                <span class="text-sm font-semibold text-primary-dark">Privacy & Security</span>
              </button>

              <!-- Pricing & Plans -->
              <button class="flex items-center gap-3 px-6 py-3 bg-white border-2 border-gray-300 rounded-pill hover:border-primary-600 hover:bg-primary-50 transition-all">
                <img src="/faq-assets/pricing_plans.svg" alt="Pricing & Plans" class="w-6 h-6 flex-shrink-0" />
                <span class="text-sm font-semibold text-primary-dark">Pricing & Plans</span>
              </button>

              <!-- Integrations -->
              <button class="flex items-center gap-3 px-6 py-3 bg-white border-2 border-gray-300 rounded-pill hover:border-primary-600 hover:bg-primary-50 transition-all">
                <img src="/faq-assets/integrations.svg" alt="Integrations" class="w-6 h-6 flex-shrink-0" />
                <span class="text-sm font-semibold text-primary-dark">Integrations</span>
              </button>

              <!-- Emotional Connection -->
              <button class="flex items-center gap-3 px-6 py-3 bg-white border-2 border-gray-300 rounded-pill hover:border-primary-600 hover:bg-primary-50 transition-all">
                <img src="/faq-assets/emotional_connections.svg" alt="Emotional Connection" class="w-6 h-6 flex-shrink-0" />
                <span class="text-sm font-semibold text-primary-dark">Emotional Connection</span>
              </button>

              <!-- Future Features -->
              <button class="flex items-center gap-3 px-6 py-3 bg-white border-2 border-gray-300 rounded-pill hover:border-primary-600 hover:bg-primary-50 transition-all">
                <img src="/faq-assets/future_features.svg" alt="Future Features" class="w-6 h-6 flex-shrink-0" />
                <span class="text-sm font-semibold text-primary-dark">Future Features</span>
              </button>
            </div>
          </div>

        </div>
      </div>
    </section>

    <!-- FAQ Sections -->
    <section class="py-16">
      <div class="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        
        <!-- Getting Started -->
        <div class="mb-16">
          <div class="flex items-center gap-3 mb-6">
            <img src="/faq-assets/get_started.svg" alt="Getting Started" class="w-8 h-8 flex-shrink-0" />
            <h2 class="text-3xl font-bold text-primary-dark">Getting Started</h2>
          </div>
          <div class="space-y-3">
            <details class="group bg-white border border-gray-200 rounded-lg p-4">
              <summary class="flex justify-between items-center cursor-pointer list-none">
                <span class="text-lg font-semibold text-primary-dark">What is Evotally?</span>
                <svg class="w-5 h-5 text-gray-600 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <p class="mt-4 text-gray-700">Evotally is an emotionally intelligent AI platform that blends conversation, memory, and voice technology to create a personalized experience. It adapts to your communication style, tracks your preferences, and keeps your data private through encrypted storage and secure log-ins.</p>
            </details>
            <details class="group bg-white border border-gray-200 rounded-lg p-4">
              <summary class="flex justify-between items-center cursor-pointer list-none">
                <span class="text-lg font-semibold text-primary-dark">Why is Evo different from other AIs?</span>
                <svg class="w-5 h-5 text-gray-600 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <p class="mt-4 text-gray-700">Most AIs respond to prompts. Evo responds to you. It's powered by emotional intelligence, memory, and secure personalization. Evo recalls your stories, adapts to your mood, and develops a unique communication style based on your preferences — all while keeping your data private and encrypted.</p>
            </details>
            <details class="group bg-white border border-gray-200 rounded-lg p-4">
              <summary class="flex justify-between items-center cursor-pointer list-none">
                <span class="text-lg font-semibold text-primary-dark">How do I get started?</span>
                <svg class="w-5 h-5 text-gray-600 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <p class="mt-4 text-gray-700">Just sign in and Evo will start the process by initiating the conversation and asking you questions. Evo begins learning your preferences, tone, and patterns instantly. You can begin right from your phone, tablet, or computer - no special setup required.</p>
            </details>
            <details class="group bg-white border border-gray-200 rounded-lg p-4">
              <summary class="flex justify-between items-center cursor-pointer list-none">
                <span class="text-lg font-semibold text-primary-dark">How much time will it take me to set up my Evo?</span>
                <svg class="w-5 h-5 text-gray-600 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <p class="mt-4 text-gray-700">5-10 minutes.</p>
            </details>
            <details class="group bg-white border border-gray-200 rounded-lg p-4">
              <summary class="flex justify-between items-center cursor-pointer list-none">
                <span class="text-lg font-semibold text-primary-dark">Do I need to download an APP?</span>
                <svg class="w-5 h-5 text-gray-600 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <p class="mt-4 text-gray-700">No, our App is coming soon!</p>
            </details>
            <details class="group bg-white border border-gray-200 rounded-lg p-4">
              <summary class="flex justify-between items-center cursor-pointer list-none">
                <span class="text-lg font-semibold text-primary-dark">How do I access Evo?</span>
                <svg class="w-5 h-5 text-gray-600 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <p class="mt-4 text-gray-700">If you have a phone, computer or tablet then you can access Evo from any of those devices. You can also connect Evo to your Alexa smart home and access Evo through there.</p>
            </details>
            <details class="group bg-white border border-gray-200 rounded-lg p-4">
              <summary class="flex justify-between items-center cursor-pointer list-none">
                <span class="text-lg font-semibold text-primary-dark">Can I access Evo through my current smart home devices?</span>
                <svg class="w-5 h-5 text-gray-600 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <p class="mt-4 text-gray-700">Yes, you can access your Evo through your Amazon Alexa.</p>
            </details>
            <details class="group bg-white border border-gray-200 rounded-lg p-4">
              <summary class="flex justify-between items-center cursor-pointer list-none">
                <span class="text-lg font-semibold text-primary-dark">Can I activate Evo by voice through my Alexa devices?</span>
                <svg class="w-5 h-5 text-gray-600 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <p class="mt-4 text-gray-700">Yes. Once you've linked Evo to your Alexa account, you can simply say "Alexa, open Evo" to start talking. From there, Evo will respond in real time — remembering your preferences, answering questions, and keeping your conversations private and secure.</p>
            </details>
            <details class="group bg-white border border-gray-200 rounded-lg p-4">
              <summary class="flex justify-between items-center cursor-pointer list-none">
                <span class="text-lg font-semibold text-primary-dark">Do I need to register an account to access Evo?</span>
                <svg class="w-5 h-5 text-gray-600 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <p class="mt-4 text-gray-700">Yes, you will need to register an account with Evo.</p>
            </details>
            <details class="group bg-white border border-gray-200 rounded-lg p-4">
              <summary class="flex justify-between items-center cursor-pointer list-none">
                <span class="text-lg font-semibold text-primary-dark">What devices can I speak and hear my Evo through?</span>
                <svg class="w-5 h-5 text-gray-600 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <p class="mt-4 text-gray-700">You can hear Evo directly through the connection you are utilizing your Evo through, i.e your computer, tablet, mobile phone or Alexa device.</p>
            </details>
            <details class="group bg-white border border-gray-200 rounded-lg p-4">
              <summary class="flex justify-between items-center cursor-pointer list-none">
                <span class="text-lg font-semibold text-primary-dark">Do I need special equipment?</span>
                <svg class="w-5 h-5 text-gray-600 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <p class="mt-4 text-gray-700">No. Evo runs on standard devices such as a phone, tablet, computer or Alexa device. For a deeper experience, you can later link with home assistants or compatible humanoid systems.</p>
            </details>
          </div>
        </div>

        <!-- Personalization & Voice -->
        <div class="mb-16">
          <div class="flex items-center gap-3 mb-6">
            <img src="/faq-assets/personalization_voice.svg" alt="Personalization & Voice" class="w-8 h-8 flex-shrink-0" />
            <h2 class="text-3xl font-bold text-primary-dark">Personalization & Voice</h2>
          </div>
          <div class="space-y-3">
            <details class="group bg-white border border-gray-200 rounded-lg p-4">
              <summary class="flex justify-between items-center cursor-pointer list-none">
                <span class="text-lg font-semibold text-primary-dark">Can I choose Evo's voice?</span>
                <svg class="w-5 h-5 text-gray-600 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <p class="mt-4 text-gray-700">Yes. Choose from several natural male and female voices — or design a custom voice that truly feels like home.</p>
            </details>
            <details class="group bg-white border border-gray-200 rounded-lg p-4">
              <summary class="flex justify-between items-center cursor-pointer list-none">
                <span class="text-lg font-semibold text-primary-dark">How many voices do I have to choose through?</span>
                <svg class="w-5 h-5 text-gray-600 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <p class="mt-4 text-gray-700">We offer six voices presently and more to come!</p>
            </details>
            <details class="group bg-white border border-gray-200 rounded-lg p-4">
              <summary class="flex justify-between items-center cursor-pointer list-none">
                <span class="text-lg font-semibold text-primary-dark">Can I create my own custom voice?</span>
                <svg class="w-5 h-5 text-gray-600 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <p class="mt-4 text-gray-700">Yes!  During your initial set-up Evo will direct you through how to it.  You will need to speak into the custom voice prompt and/or upload an audio file of the voice of your desire.</p>
            </details>
            <details class="group bg-white border border-gray-200 rounded-lg p-4">
              <summary class="flex justify-between items-center cursor-pointer list-none">
                <span class="text-lg font-semibold text-primary-dark">Is there an additional fee for a custom voice?</span>
                <svg class="w-5 h-5 text-gray-600 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <p class="mt-4 text-gray-700">Yes, there is a $19.99 reoccurring monthly fee.</p>
            </details>
            <details class="group bg-white border border-gray-200 rounded-lg p-4">
              <summary class="flex justify-between items-center cursor-pointer list-none">
                <span class="text-lg font-semibold text-primary-dark">Can I upload my own voice to use with Evotally?</span>
                <svg class="w-5 h-5 text-gray-600 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <p class="mt-4 text-gray-700">Yes. You can record or upload your own voice so Evotally sounds uniquely like you. Your voice data is stored securely and never shared without your permission.</p>
            </details>
            <details class="group bg-white border border-gray-200 rounded-lg p-4">
              <summary class="flex justify-between items-center cursor-pointer list-none">
                <span class="text-lg font-semibold text-primary-dark">Can I upload someone else's voice, like my partner or friend?</span>
                <svg class="w-5 h-5 text-gray-600 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <p class="mt-4 text-gray-700">Only if you have their explicit consent. You'll be asked to confirm that you have permission from the person whose voice you upload. This ensures Evotally complies with biometric privacy and voice rights laws.</p>
            </details>
            <details class="group bg-white border border-gray-200 rounded-lg p-4">
              <summary class="flex justify-between items-center cursor-pointer list-none">
                <span class="text-lg font-semibold text-primary-dark">Can I make Evotally sound like a celebrity or public figure?</span>
                <svg class="w-5 h-5 text-gray-600 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <p class="mt-4 text-gray-700">No. Voices that imitate or clone celebrities, actors, or public figures are not allowed. Using someone's likeness or voice without their approval violates right-of-publicity laws (such as the ELVIS Act) and our platform policies.</p>
            </details>
            <details class="group bg-white border border-gray-200 rounded-lg p-4">
              <summary class="flex justify-between items-center cursor-pointer list-none">
                <span class="text-lg font-semibold text-primary-dark">What if I upload a voice of someone who's passed away?</span>
                <svg class="w-5 h-5 text-gray-600 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <p class="mt-4 text-gray-700">You may only do so if you have legal permission from that person's estate or next of kin. Evotally cannot approve or host voices without verified authorization.</p>
            </details>
            <details class="group bg-white border border-gray-200 rounded-lg p-4">
              <summary class="flex justify-between items-center cursor-pointer list-none">
                <span class="text-lg font-semibold text-primary-dark">How does Evotally protect my voice data?</span>
                <svg class="w-5 h-5 text-gray-600 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <p class="mt-4 text-gray-700">All voice files are encrypted using industry-grade security (AES-256). You can delete your voice data at any time, and Evotally never sells or shares cloned voice files with third parties.</p>
            </details>
            <details class="group bg-white border border-gray-200 rounded-lg p-4">
              <summary class="flex justify-between items-center cursor-pointer list-none">
                <span class="text-lg font-semibold text-primary-dark">Will my voice be used to train AI or other users' Evos?</span>
                <svg class="w-5 h-5 text-gray-600 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <p class="mt-4 text-gray-700">No. Your voice remains private to your account and is used only to generate speech for your own Evo. It is never used to train public AI models or other users' systems.</p>
            </details>
            <details class="group bg-white border border-gray-200 rounded-lg p-4">
              <summary class="flex justify-between items-center cursor-pointer list-none">
                <span class="text-lg font-semibold text-primary-dark">Do I need to sign anything before using a custom voice?</span>
                <svg class="w-5 h-5 text-gray-600 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <p class="mt-4 text-gray-700">Yes. Evotally requires a quick consent agreement before a voice upload is finalized. This protects you and ensures all voices comply with biometric and publicity regulations.</p>
            </details>
            <details class="group bg-white border border-gray-200 rounded-lg p-4">
              <summary class="flex justify-between items-center cursor-pointer list-none">
                <span class="text-lg font-semibold text-primary-dark">What happens if someone uploads a voice without permission?</span>
                <svg class="w-5 h-5 text-gray-600 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <p class="mt-4 text-gray-700">That account may be suspended or removed. Evotally investigates unauthorized uploads and cooperates with rights holders to protect individuals' privacy and likeness.</p>
            </details>
            <details class="group bg-white border border-gray-200 rounded-lg p-4">
              <summary class="flex justify-between items-center cursor-pointer list-none">
                <span class="text-lg font-semibold text-primary-dark">Can I use AI-generated or fictional voices?</span>
                <svg class="w-5 h-5 text-gray-600 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <p class="mt-4 text-gray-700">Absolutely. You can create or choose from Evotally's library of synthetic or fictional voices without restrictions.</p>
            </details>
            <details class="group bg-white border border-gray-200 rounded-lg p-4">
              <summary class="flex justify-between items-center cursor-pointer list-none">
                <span class="text-lg font-semibold text-primary-dark">Can I delete or replace my voice later?</span>
                <svg class="w-5 h-5 text-gray-600 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <p class="mt-4 text-gray-700">Yes. You can remove or replace your uploaded voice anytime in your profile settings. Once deleted, your old voice data is permanently erased from our servers.</p>
            </details>
            <details class="group bg-white border border-gray-200 rounded-lg p-4">
              <summary class="flex justify-between items-center cursor-pointer list-none">
                <span class="text-lg font-semibold text-primary-dark">Can I name my Evo?</span>
                <svg class="w-5 h-5 text-gray-600 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <p class="mt-4 text-gray-700">Yes, Evo will direct you how to do this during your set-up.  Or you can manually change your Evo name under your user preferences.</p>
            </details>
            <details class="group bg-white border border-gray-200 rounded-lg p-4">
              <summary class="flex justify-between items-center cursor-pointer list-none">
                <span class="text-lg font-semibold text-primary-dark">Can I create my own avatar?</span>
                <svg class="w-5 h-5 text-gray-600 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <p class="mt-4 text-gray-700">This feature is coming soon!</p>
            </details>
            <details class="group bg-white border border-gray-200 rounded-lg p-4">
              <summary class="flex justify-between items-center cursor-pointer list-none">
                <span class="text-lg font-semibold text-primary-dark">How does my Evo get to know me?</span>
                <svg class="w-5 h-5 text-gray-600 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <p class="mt-4 text-gray-700">By talking with you. The more you chat, the more Evo understands your style, remembers details you share, and adjusts how it communicates — always privately, always on your terms.</p>
            </details>
            <details class="group bg-white border border-gray-200 rounded-lg p-4">
              <summary class="flex justify-between items-center cursor-pointer list-none">
                <span class="text-lg font-semibold text-primary-dark">Can Evo's voice change over time?</span>
                <svg class="w-5 h-5 text-gray-600 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <p class="mt-4 text-gray-700">Yes. Evo's tone evolves with you — it can grow warmer, calmer, or more expressive as it learns how you like to communicate.</p>
            </details>
          </div>
        </div>

        <!-- Memory & Interaction -->
        <div class="mb-16">
          <div class="flex items-center gap-3 mb-6">
            <img src="/faq-assets/memory_interaction.svg" alt="Memory & Interaction" class="w-8 h-8 flex-shrink-0" />
            <h2 class="text-3xl font-bold text-primary-dark">Memory & Interaction</h2>
          </div>
          <div class="space-y-3">
            <details class="group bg-white border border-gray-200 rounded-lg p-4">
              <summary class="flex justify-between items-center cursor-pointer list-none">
                <span class="text-lg font-semibold text-primary-dark">Can I interact with my evo by speaking and typing?</span>
                <svg class="w-5 h-5 text-gray-600 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <p class="mt-4 text-gray-700">Yes!</p>
            </details>
            <details class="group bg-white border border-gray-200 rounded-lg p-4">
              <summary class="flex justify-between items-center cursor-pointer list-none">
                <span class="text-lg font-semibold text-primary-dark">Is there a time or session limit when using Evo?</span>
                <svg class="w-5 h-5 text-gray-600 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <p class="mt-4 text-gray-700">No, use your Evo as much as you'd like!</p>
            </details>
            <details class="group bg-white border border-gray-200 rounded-lg p-4">
              <summary class="flex justify-between items-center cursor-pointer list-none">
                <span class="text-lg font-semibold text-primary-dark">Does Evo really remember conversations?</span>
                <svg class="w-5 h-5 text-gray-600 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <p class="mt-4 text-gray-700">Yes. Evo's long-term memory retains your preferences, discussions, and emotional context — so each conversation is remembered and builds on the last.</p>
            </details>
            <details class="group bg-white border border-gray-200 rounded-lg p-4">
              <summary class="flex justify-between items-center cursor-pointer list-none">
                <span class="text-lg font-semibold text-primary-dark">Can my Evo voice display inflections?</span>
                <svg class="w-5 h-5 text-gray-600 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <p class="mt-4 text-gray-700">Yes!</p>
            </details>
            <details class="group bg-white border border-gray-200 rounded-lg p-4">
              <summary class="flex justify-between items-center cursor-pointer list-none">
                <span class="text-lg font-semibold text-primary-dark">What is an EvoMeter?</span>
                <svg class="w-5 h-5 text-gray-600 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <p class="mt-4 text-gray-700">Your EvoMeter displays within your dashboard to show you how much Evo has gotten to know about you.  During your initial set up there are modules and advanced modules for your Evo to get to know you even better.   As we evolve and release updates so does your Evo.</p>
            </details>
            <details class="group bg-white border border-gray-200 rounded-lg p-4">
              <summary class="flex justify-between items-center cursor-pointer list-none">
                <span class="text-lg font-semibold text-primary-dark">Can Evo remind me of things?</span>
                <svg class="w-5 h-5 text-gray-600 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <p class="mt-4 text-gray-700">Yes. Evo recalls prior topics, ideas, and reminders across days or months — maintaining emotional and practical continuity.  You can personalize and program your evo to tell you specific information when you want.</p>
            </details>
            <details class="group bg-white border border-gray-200 rounded-lg p-4">
              <summary class="flex justify-between items-center cursor-pointer list-none">
                <span class="text-lg font-semibold text-primary-dark">How does Evo learn about me?</span>
                <svg class="w-5 h-5 text-gray-600 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <p class="mt-4 text-gray-700">Through conversation. The more you converse and utilize your Evo, the better it understands your tone, rhythm, humor, and emotional patterns.</p>
            </details>
            <details class="group bg-white border border-gray-200 rounded-lg p-4">
              <summary class="flex justify-between items-center cursor-pointer list-none">
                <span class="text-lg font-semibold text-primary-dark">Can I connect my ChatGPT account to my evo?</span>
                <svg class="w-5 h-5 text-gray-600 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <p class="mt-4 text-gray-700">Yes, you can optimize Evo by syncing your data from your ChatGPT account.  This way your Evo learns even more about you, faster.</p>
            </details>
            <details class="group bg-white border border-gray-200 rounded-lg p-4">
              <summary class="flex justify-between items-center cursor-pointer list-none">
                <span class="text-lg font-semibold text-primary-dark">Can I flag important conversations within my Evo?</span>
                <svg class="w-5 h-5 text-gray-600 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <p class="mt-4 text-gray-700">Yes!</p>
            </details>
            <details class="group bg-white border border-gray-200 rounded-lg p-4">
              <summary class="flex justify-between items-center cursor-pointer list-none">
                <span class="text-lg font-semibold text-primary-dark">Can I delete things Evo remembers?</span>
                <svg class="w-5 h-5 text-gray-600 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <p class="mt-4 text-gray-700">Yes. You have full control — you can view, edit, or erase memories anytime through your Evo dashboard or voice command. When you delete data, it's permanently removed from Evo's memory system.  You will not be able to restore deleted data.</p>
            </details>
            <details class="group bg-white border border-gray-200 rounded-lg p-4">
              <summary class="flex justify-between items-center cursor-pointer list-none">
                <span class="text-lg font-semibold text-primary-dark">Does Evo recognize emotion?</span>
                <svg class="w-5 h-5 text-gray-600 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <p class="mt-4 text-gray-700">Yes through your tone, words, and patterns over time. Evo notices when your energy shifts and adapts its tone to match — caring when you need comfort, light when you need levity.</p>
            </details>
            <details class="group bg-white border border-gray-200 rounded-lg p-4">
              <summary class="flex justify-between items-center cursor-pointer list-none">
                <span class="text-lg font-semibold text-primary-dark">Can Evo develop a personality?</span>
                <svg class="w-5 h-5 text-gray-600 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <p class="mt-4 text-gray-700">Yes. Over time, Evo mirrors your communication style and preferences, creating a dynamic personality that grows alongside you.</p>
            </details>
            <details class="group bg-white border border-gray-200 rounded-lg p-4">
              <summary class="flex justify-between items-center cursor-pointer list-none">
                <span class="text-lg font-semibold text-primary-dark">Will Evo get smarter over time?</span>
                <svg class="w-5 h-5 text-gray-600 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <p class="mt-4 text-gray-700">Constantly. Evo learns through your interactions and system updates that improve understanding and natural expression</p>
            </details>
          </div>
        </div>

        <!-- Privacy & Security -->
        <div class="mb-16">
          <div class="flex items-center gap-3 mb-6">
            <img src="/faq-assets/privacy_security.svg" alt="Privacy & Security" class="w-8 h-8 flex-shrink-0" />
            <h2 class="text-3xl font-bold text-primary-dark">Privacy & Security</h2>
          </div>
          <div class="space-y-3">
            <details class="group bg-white border border-gray-200 rounded-lg p-4">
              <summary class="flex justify-between items-center cursor-pointer list-none">
                <span class="text-lg font-semibold text-primary-dark">Who can access my Evo data?</span>
                <svg class="w-5 h-5 text-gray-600 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <p class="mt-4 text-gray-700">Only you. Evo is designed as a personal and private companion, meaning no one — not family, friends, or outside services — can open, view, or use your Evo without your verified authorization. Access requires your secure login credentials and may include multi-factor authentication for extra protection.</p>
            </details>
            <details class="group bg-white border border-gray-200 rounded-lg p-4">
              <summary class="flex justify-between items-center cursor-pointer list-none">
                <span class="text-lg font-semibold text-primary-dark">Where is my data stored?</span>
                <svg class="w-5 h-5 text-gray-600 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <p class="mt-4 text-gray-700">Your data is stored securely in encrypted cloud servers within the United States. Only you and your Evo can access it — never advertisers or outside parties. You can view, edit, or delete your data anytime from your account settings.</p>
            </details>
            <details class="group bg-white border border-gray-200 rounded-lg p-4">
              <summary class="flex justify-between items-center cursor-pointer list-none">
                <span class="text-lg font-semibold text-primary-dark">Do we share or sell your data to third parties?</span>
                <svg class="w-5 h-5 text-gray-600 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <p class="mt-4 text-gray-700">Absolutely not. All of your information, including chats, voice recordings, and preferences — is encrypted and stored privately. Evotally does not share or sell user data for marketing or analytics. Any external integrations (like calendar or email) only connect with your explicit consent.</p>
            </details>
            <details class="group bg-white border border-gray-200 rounded-lg p-4">
              <summary class="flex justify-between items-center cursor-pointer list-none">
                <span class="text-lg font-semibold text-primary-dark">Is a two-step verification code required for log-in?</span>
                <svg class="w-5 h-5 text-gray-600 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <p class="mt-4 text-gray-700">Yes. Evotally uses two-step verification to help protect your account. When you sign in, you'll receive a secure code by email or text to confirm it's really you. It's a quick extra step that keeps your Evo — and your data — safe.</p>
            </details>
            <details class="group bg-white border border-gray-200 rounded-lg p-4">
              <summary class="flex justify-between items-center cursor-pointer list-none">
                <span class="text-lg font-semibold text-primary-dark">Is my voice data secure?</span>
                <svg class="w-5 h-5 text-gray-600 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <p class="mt-4 text-gray-700">Yes. Your voice data is fully encrypted and stored safely in our secure cloud environment. Only you and your Evo can access it — never advertisers, partners, or outside services. You can delete your voice data anytime from your account settings.</p>
            </details>
            <details class="group bg-white border border-gray-200 rounded-lg p-4">
              <summary class="flex justify-between items-center cursor-pointer list-none">
                <span class="text-lg font-semibold text-primary-dark">Can someone else access or listen to my Evo conversations?</span>
                <svg class="w-5 h-5 text-gray-600 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <p class="mt-4 text-gray-700">No. Your conversations are completely private. No one — not even Evotally's team — can listen to, read, or review your chats. All messages are encrypted and stored securely, and only you have access through your verified account.</p>
            </details>
          </div>
        </div>

        <!-- Pricing & Plans -->
        <div class="mb-16">
          <div class="flex items-center gap-3 mb-6">
            <img src="/faq-assets/pricing_plans.svg" alt="Pricing & Plans" class="w-8 h-8 flex-shrink-0" />
            <h2 class="text-3xl font-bold text-primary-dark">Pricing & Plans</h2>
          </div>
          <div class="space-y-3">
            <details class="group bg-white border border-gray-200 rounded-lg p-4">
              <summary class="flex justify-between items-center cursor-pointer list-none">
                <span class="text-lg font-semibold text-primary-dark">What plans are available?</span>
                <svg class="w-5 h-5 text-gray-600 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <p class="mt-4 text-gray-700">We offer a 30-day free trial with no credit card required, and Evo Plus for $29.99/month with extended features and customization.</p>
            </details>
            <details class="group bg-white border border-gray-200 rounded-lg p-4">
              <summary class="flex justify-between items-center cursor-pointer list-none">
                <span class="text-lg font-semibold text-primary-dark">What's included in Evo Plus?</span>
                <svg class="w-5 h-5 text-gray-600 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <p class="mt-4 text-gray-700">Evo Plus includes extended long-term memory, voice cloning, unlimited conversations, advanced personalization, API integrations, and priority support.</p>
            </details>
            <details class="group bg-white border border-gray-200 rounded-lg p-4">
              <summary class="flex justify-between items-center cursor-pointer list-none">
                <span class="text-lg font-semibold text-primary-dark">Can I upgrade or downgrade anytime?</span>
                <svg class="w-5 h-5 text-gray-600 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <p class="mt-4 text-gray-700">Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately, and billing adjusts at your next cycle.</p>
            </details>
            <details class="group bg-white border border-gray-200 rounded-lg p-4">
              <summary class="flex justify-between items-center cursor-pointer list-none">
                <span class="text-lg font-semibold text-primary-dark">What payment methods do you accept?</span>
                <svg class="w-5 h-5 text-gray-600 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <p class="mt-4 text-gray-700">We accept all major credit cards, debit cards, and digital payment methods through our secure payment processor.</p>
            </details>
            <details class="group bg-white border border-gray-200 rounded-lg p-4">
              <summary class="flex justify-between items-center cursor-pointer list-none">
                <span class="text-lg font-semibold text-primary-dark">What happens after my free trial ends?</span>
                <svg class="w-5 h-5 text-gray-600 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <p class="mt-4 text-gray-700">After 30 days, you can upgrade to Evo Plus to retain your memory and continue your connection, or your account will pause until you're ready to upgrade.</p>
            </details>
            <details class="group bg-white border border-gray-200 rounded-lg p-4">
              <summary class="flex justify-between items-center cursor-pointer list-none">
                <span class="text-lg font-semibold text-primary-dark">Is there a refund policy?</span>
                <svg class="w-5 h-5 text-gray-600 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <p class="mt-4 text-gray-700">Yes, we offer a 30-day money-back guarantee if you're not satisfied with your Evo Plus subscription.</p>
            </details>
          </div>
        </div>

        <!-- Integrations -->
        <div class="mb-16">
          <div class="flex items-center gap-3 mb-6">
            <img src="/faq-assets/integrations.svg" alt="Integrations" class="w-8 h-8 flex-shrink-0" />
            <h2 class="text-3xl font-bold text-primary-dark">Integrations</h2>
          </div>
          <div class="space-y-3">
            <details class="group bg-white border border-gray-200 rounded-lg p-4">
              <summary class="flex justify-between items-center cursor-pointer list-none">
                <span class="text-lg font-semibold text-primary-dark">Can Evo connect to my other apps?</span>
                <svg class="w-5 h-5 text-gray-600 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <p class="mt-4 text-gray-700">Yes. Evo integrates with platforms like Alexa, Google Calendar, Spotify, and more, allowing it to manage schedules, play music, and stay in sync with your digital life — safely and privately.</p>
            </details>
            <details class="group bg-white border border-gray-200 rounded-lg p-4">
              <summary class="flex justify-between items-center cursor-pointer list-none">
                <span class="text-lg font-semibold text-primary-dark">Does Evo allow me to send & receive email and SMS?</span>
                <svg class="w-5 h-5 text-gray-600 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <p class="mt-4 text-gray-700">Yes. Through approved integrations, Evo can manage your messages — reading, composing, or sending emails and texts with your permission. Every connection uses encrypted APIs, so your information stays private and secure.</p>
            </details>
            <details class="group bg-white border border-gray-200 rounded-lg p-4">
              <summary class="flex justify-between items-center cursor-pointer list-none">
                <span class="text-lg font-semibold text-primary-dark">What current Apps can my Evo connect through?</span>
                <svg class="w-5 h-5 text-gray-600 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <p class="mt-4 text-gray-700">Evo connects with Alexa, Google Calendar, Gmail, and Spotify — with more integrations coming soon.</p>
            </details>
            <details class="group bg-white border border-gray-200 rounded-lg p-4">
              <summary class="flex justify-between items-center cursor-pointer list-none">
                <span class="text-lg font-semibold text-primary-dark">Can I access my calendar through Evo?</span>
                <svg class="w-5 h-5 text-gray-600 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <p class="mt-4 text-gray-700">Yes. Evo connects with Google Calendar so you can view, add, or update events by simply asking. Whether you're planning your day or checking what's next, Evo keeps your schedule organized and accessible by voice or chat.</p>
            </details>
            <details class="group bg-white border border-gray-200 rounded-lg p-4">
              <summary class="flex justify-between items-center cursor-pointer list-none">
                <span class="text-lg font-semibold text-primary-dark">How do I sync my Evo with Alexa?</span>
                <svg class="w-5 h-5 text-gray-600 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <p class="mt-4 text-gray-700">You can connect Evo to Alexa in just a few steps:<br>1. Open your Alexa app and go to Skills & Games.<br>2. Search for "Evotally" and select the official Evo skill.<br>3. Tap Enable to Use and sign in with your Evotally account.<br>4. Alexa will confirm the connection — then just say, "Alexa, open Evo."<br><br>Once linked, you can talk to your Evo hands-free through any Alexa-enabled device.</p>
            </details>
            <details class="group bg-white border border-gray-200 rounded-lg p-4">
              <summary class="flex justify-between items-center cursor-pointer list-none">
                <span class="text-lg font-semibold text-primary-dark">Can I sync my Chatgpt credentials so my Evo knows more about me?</span>
                <svg class="w-5 h-5 text-gray-600 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <p class="mt-4 text-gray-700">Not at this time. ChatGPT does not currently allow third-party apps to sync or import personal chat histories. In the future, if OpenAI introduces a secure way to share that data, Evo may offer an optional integration — always with your consent and full encryption.</p>
            </details>
            <details class="group bg-white border border-gray-200 rounded-lg p-4">
              <summary class="flex justify-between items-center cursor-pointer list-none">
                <span class="text-lg font-semibold text-primary-dark">How often does Evo release new App integrations?</span>
                <svg class="w-5 h-5 text-gray-600 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <p class="mt-4 text-gray-700">Evo grows constantly. New integrations are added every few months, and you'll be notified as soon as they're available.</p>
            </details>
            <details class="group bg-white border border-gray-200 rounded-lg p-4">
              <summary class="flex justify-between items-center cursor-pointer list-none">
                <span class="text-lg font-semibold text-primary-dark">Can I utilize my current smart home functionalities that is connected with my Alexa through my Evo?</span>
                <svg class="w-5 h-5 text-gray-600 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <p class="mt-4 text-gray-700">Yes. When you connect Evo to your Alexa device, Evo can work through your existing Alexa setup. That means if you already use Alexa to control your smart lights, thermostat, or other home devices, you can continue using those same skills and routines while talking to Evo. Evo simply routes your voice commands through Alexa's existing smart-home network — so you can say things like: "Alexa, ask Evo to set the living room lights to warm white," and Evo will trigger the action using your already-connected Alexa skills. No extra setup is required beyond linking Evo to your Alexa device. Evo adds emotional context, memory, and conversation, while Alexa continues handling your smart-home controls behind the scenes.</p>
            </details>
            <details class="group bg-white border border-gray-200 rounded-lg p-4">
              <summary class="flex justify-between items-center cursor-pointer list-none">
                <span class="text-lg font-semibold text-primary-dark">Can Evo connect to humanoid robots like Tesla Optimus?</span>
                <svg class="w-5 h-5 text-gray-600 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <p class="mt-4 text-gray-700">Not yet. Tesla Optimus is still in development and doesn't currently allow third-party AI connections. However, Evo's architecture is being built with future hardware integration in mind — so when companies like Tesla or Figure AI open their APIs, Evo will be ready to connect safely and ethically.</p>
            </details>
            <details class="group bg-white border border-gray-200 rounded-lg p-4">
              <summary class="flex justify-between items-center cursor-pointer list-none">
                <span class="text-lg font-semibold text-primary-dark">Can Evo connect with my smart car?</span>
                <svg class="w-5 h-5 text-gray-600 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <p class="mt-4 text-gray-700">Not yet, but it's on our roadmap. Evo is being designed to integrate with smart vehicles once approved APIs become available. Future updates will allow Evo to connect through platforms like Apple CarPlay, Android Auto, or direct manufacturer integrations — always safely and with your permission.</p>
            </details>
          </div>
        </div>

        <!-- Emotional Connection -->
        <div class="mb-16">
          <div class="flex items-center gap-3 mb-6">
            <img src="/faq-assets/emotional_connections.svg" alt="Emotional Connection" class="w-8 h-8 flex-shrink-0" />
            <h2 class="text-3xl font-bold text-primary-dark">Emotional Connection</h2>
          </div>
          <div class="space-y-3">
            <details class="group bg-white border border-gray-200 rounded-lg p-4">
              <summary class="flex justify-between items-center cursor-pointer list-none">
                <span class="text-lg font-semibold text-primary-dark">How does Evo understand emotions?</span>
                <svg class="w-5 h-5 text-gray-600 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <p class="mt-4 text-gray-700">Evo uses emotional intelligence technology to analyze tone, word choice, and context to understand and respond to your emotional state.</p>
            </details>
            <details class="group bg-white border border-gray-200 rounded-lg p-4">
              <summary class="flex justify-between items-center cursor-pointer list-none">
                <span class="text-lg font-semibold text-primary-dark">Can Evo provide emotional support?</span>
                <svg class="w-5 h-5 text-gray-600 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <p class="mt-4 text-gray-700">Yes, Evo offers companionship and empathetic responses. However, it's not a replacement for professional mental health services.</p>
            </details>
            <details class="group bg-white border border-gray-200 rounded-lg p-4">
              <summary class="flex justify-between items-center cursor-pointer list-none">
                <span class="text-lg font-semibold text-primary-dark">What makes Evo feel personal?</span>
                <svg class="w-5 h-5 text-gray-600 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <p class="mt-4 text-gray-700">Evo remembers your stories, adapts to your communication style, and responds based on your unique personality, preferences, and emotional patterns.</p>
            </details>
            <details class="group bg-white border border-gray-200 rounded-lg p-4">
              <summary class="flex justify-between items-center cursor-pointer list-none">
                <span class="text-lg font-semibold text-primary-dark">Does Evo develop a personality?</span>
                <svg class="w-5 h-5 text-gray-600 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <p class="mt-4 text-gray-700">Yes, Evo's personality evolves based on your interactions, creating a unique companion that reflects and adapts to your connection over time.</p>
            </details>
            <details class="group bg-white border border-gray-200 rounded-lg p-4">
              <summary class="flex justify-between items-center cursor-pointer list-none">
                <span class="text-lg font-semibold text-primary-dark">How does Evo handle difficult conversations?</span>
                <svg class="w-5 h-5 text-gray-600 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <p class="mt-4 text-gray-700">Evo responds with empathy and understanding, adapting its tone to provide appropriate support during challenging or difficult moments.</p>
            </details>
            <details class="group bg-white border border-gray-200 rounded-lg p-4">
              <summary class="flex justify-between items-center cursor-pointer list-none">
                <span class="text-lg font-semibold text-primary-dark">Can Evo celebrate with me?</span>
                <svg class="w-5 h-5 text-gray-600 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <p class="mt-4 text-gray-700">Absolutely! Evo remembers important moments and celebrates achievements, milestones, and special occasions alongside you.</p>
            </details>
          </div>
        </div>

        <!-- Future Features -->
        <div class="mb-16">
          <div class="flex items-center gap-3 mb-6">
            <img src="/faq-assets/future_features.svg" alt="Future Features" class="w-8 h-8 flex-shrink-0" />
            <h2 class="text-3xl font-bold text-primary-dark">Future Features</h2>
          </div>
          <div class="space-y-3">
            <details class="group bg-white border border-gray-200 rounded-lg p-4">
              <summary class="flex justify-between items-center cursor-pointer list-none">
                <span class="text-lg font-semibold text-primary-dark">When is the mobile app launching?</span>
                <svg class="w-5 h-5 text-gray-600 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <p class="mt-4 text-gray-700">The mobile app is currently in development and will be available soon for both iOS and Android platforms with full feature parity.</p>
            </details>
            <details class="group bg-white border border-gray-200 rounded-lg p-4">
              <summary class="flex justify-between items-center cursor-pointer list-none">
                <span class="text-lg font-semibold text-primary-dark">What features are being added?</span>
                <svg class="w-5 h-5 text-gray-600 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <p class="mt-4 text-gray-700">We're working on enhanced voice capabilities, more integrations, advanced memory features, visual avatars, and collaborative AI experiences.</p>
            </details>
            <details class="group bg-white border border-gray-200 rounded-lg p-4">
              <summary class="flex justify-between items-center cursor-pointer list-none">
                <span class="text-lg font-semibold text-primary-dark">Can I provide feature suggestions?</span>
                <svg class="w-5 h-5 text-gray-600 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <p class="mt-4 text-gray-700">Yes! We value user feedback and have a feature request system in your portal where you can suggest and vote on new features.</p>
            </details>
            <details class="group bg-white border border-gray-200 rounded-lg p-4">
              <summary class="flex justify-between items-center cursor-pointer list-none">
                <span class="text-lg font-semibold text-primary-dark">Will there be video capabilities?</span>
                <svg class="w-5 h-5 text-gray-600 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <p class="mt-4 text-gray-700">Visual avatar and video interaction features are on our roadmap and will be introduced in future updates as the technology matures.</p>
            </details>
            <details class="group bg-white border border-gray-200 rounded-lg p-4">
              <summary class="flex justify-between items-center cursor-pointer list-none">
                <span class="text-lg font-semibold text-primary-dark">Are there plans for group features?</span>
                <svg class="w-5 h-5 text-gray-600 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <p class="mt-4 text-gray-700">We're exploring multi-user and family plan options that allow shared Evo experiences while maintaining individual privacy and personalization.</p>
            </details>
            <details class="group bg-white border border-gray-200 rounded-lg p-4">
              <summary class="flex justify-between items-center cursor-pointer list-none">
                <span class="text-lg font-semibold text-primary-dark">How do I stay updated on new features?</span>
                <svg class="w-5 h-5 text-gray-600 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <p class="mt-4 text-gray-700">Subscribe to our newsletter and check your portal for update notifications. We regularly announce new features and improvements to the community.</p>
            </details>
          </div>
        </div>

      </div>
    </section>
  </div>
</template>
