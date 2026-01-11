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
                <div class="w-6 h-6 bg-gray-200 rounded-full flex-shrink-0"></div>
                <span class="text-sm font-semibold text-primary-dark">Getting Started</span>
              </button>

              <!-- Personalization & Voice -->
              <button class="flex items-center gap-3 px-6 py-3 bg-white border-2 border-gray-300 rounded-pill hover:border-primary-600 hover:bg-primary-50 transition-all">
                <div class="w-6 h-6 bg-gray-200 rounded-full flex-shrink-0"></div>
                <span class="text-sm font-semibold text-primary-dark">Personalization & Voice</span>
              </button>

              <!-- Memory & Interaction -->
              <button class="flex items-center gap-3 px-6 py-3 bg-white border-2 border-gray-300 rounded-pill hover:border-primary-600 hover:bg-primary-50 transition-all">
                <div class="w-6 h-6 bg-gray-200 rounded-full flex-shrink-0"></div>
                <span class="text-sm font-semibold text-primary-dark">Memory & Interaction</span>
              </button>

              <!-- Privacy & Security -->
              <button class="flex items-center gap-3 px-6 py-3 bg-white border-2 border-gray-300 rounded-pill hover:border-primary-600 hover:bg-primary-50 transition-all">
                <div class="w-6 h-6 bg-gray-200 rounded-full flex-shrink-0"></div>
                <span class="text-sm font-semibold text-primary-dark">Privacy & Security</span>
              </button>

              <!-- Pricing & Plans -->
              <button class="flex items-center gap-3 px-6 py-3 bg-white border-2 border-gray-300 rounded-pill hover:border-primary-600 hover:bg-primary-50 transition-all">
                <div class="w-6 h-6 bg-gray-200 rounded-full flex-shrink-0"></div>
                <span class="text-sm font-semibold text-primary-dark">Pricing & Plans</span>
              </button>

              <!-- Integrations -->
              <button class="flex items-center gap-3 px-6 py-3 bg-white border-2 border-gray-300 rounded-pill hover:border-primary-600 hover:bg-primary-50 transition-all">
                <div class="w-6 h-6 bg-gray-200 rounded-full flex-shrink-0"></div>
                <span class="text-sm font-semibold text-primary-dark">Integrations</span>
              </button>

              <!-- Emotional Connection -->
              <button class="flex items-center gap-3 px-6 py-3 bg-white border-2 border-gray-300 rounded-pill hover:border-primary-600 hover:bg-primary-50 transition-all">
                <div class="w-6 h-6 bg-gray-200 rounded-full flex-shrink-0"></div>
                <span class="text-sm font-semibold text-primary-dark">Emotional Connection</span>
              </button>

              <!-- Future Features -->
              <button class="flex items-center gap-3 px-6 py-3 bg-white border-2 border-gray-300 rounded-pill hover:border-primary-600 hover:bg-primary-50 transition-all">
                <div class="w-6 h-6 bg-gray-200 rounded-full flex-shrink-0"></div>
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
            <div class="w-8 h-8 bg-gray-200 rounded-full flex-shrink-0"></div>
            <h2 class="text-3xl font-bold text-primary-dark">Getting Started</h2>
          </div>
          <div class="space-y-3">
            <details class="group bg-gray-50 border border-gray-200 rounded-lg p-4">
              <summary class="flex justify-between items-center cursor-pointer list-none">
                <span class="text-lg font-semibold text-primary-dark">What is Evotally?</span>
                <svg class="w-5 h-5 text-gray-600 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <p class="mt-4 text-gray-700">Evotally is an AI companion platform that creates a personalized, evolving connection with you through natural conversation, emotional intelligence, and adaptive memory.</p>
            </details>
            <details class="group bg-gray-50 border border-gray-200 rounded-lg p-4">
              <summary class="flex justify-between items-center cursor-pointer list-none">
                <span class="text-lg font-semibold text-primary-dark">Can I access Evo through my current smart home devices?</span>
                <svg class="w-5 h-5 text-gray-600 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <p class="mt-4 text-gray-700">Yes! Evo integrates with Amazon Alexa and other smart home devices, allowing you to interact through your existing ecosystem.</p>
            </details>
            <details class="group bg-gray-50 border border-gray-200 rounded-lg p-4">
              <summary class="flex justify-between items-center cursor-pointer list-none">
                <span class="text-lg font-semibold text-primary-dark">How do I access Evo?</span>
                <svg class="w-5 h-5 text-gray-600 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <p class="mt-4 text-gray-700">You can access Evo through your secure online portal, a unique personal URL, or integrated smart devices. A mobile app is coming soon.</p>
            </details>
            <details class="group bg-gray-50 border border-gray-200 rounded-lg p-4">
              <summary class="flex justify-between items-center cursor-pointer list-none">
                <span class="text-lg font-semibold text-primary-dark">Do I need to register an account to access Evo?</span>
                <svg class="w-5 h-5 text-gray-600 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <p class="mt-4 text-gray-700">Yes, you'll need to create an account to personalize your Evo and access all features. Registration is quick and includes a free trial period.</p>
            </details>
            <details class="group bg-gray-50 border border-gray-200 rounded-lg p-4">
              <summary class="flex justify-between items-center cursor-pointer list-none">
                <span class="text-lg font-semibold text-primary-dark">Can I activate Evo by voice through my current smart devices?</span>
                <svg class="w-5 h-5 text-gray-600 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <p class="mt-4 text-gray-700">Yes! Once integrated with your smart devices like Amazon Alexa, you can activate and interact with Evo using voice commands.</p>
            </details>
            <details class="group bg-gray-50 border border-gray-200 rounded-lg p-4">
              <summary class="flex justify-between items-center cursor-pointer list-none">
                <span class="text-lg font-semibold text-primary-dark">Do I need special equipment?</span>
                <svg class="w-5 h-5 text-gray-600 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <p class="mt-4 text-gray-700">No special equipment is required. You can use Evo with any device that has a web browser and internet connection. Smart home devices are optional.</p>
            </details>
          </div>
        </div>

        <!-- Personalization & Voice -->
        <div class="mb-16">
          <div class="flex items-center gap-3 mb-6">
            <div class="w-8 h-8 bg-gray-200 rounded-full flex-shrink-0"></div>
            <h2 class="text-3xl font-bold text-primary-dark">Personalization & Voice</h2>
          </div>
          <div class="space-y-3">
            <details class="group bg-gray-50 border border-gray-200 rounded-lg p-4">
              <summary class="flex justify-between items-center cursor-pointer list-none">
                <span class="text-lg font-semibold text-primary-dark">Can I choose Evo's voice?</span>
                <svg class="w-5 h-5 text-gray-600 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <p class="mt-4 text-gray-700">Yes! You can select from a variety of warm, natural voices that best match your preferences and create the connection you're looking for.</p>
            </details>
            <details class="group bg-gray-50 border border-gray-200 rounded-lg p-4">
              <summary class="flex justify-between items-center cursor-pointer list-none">
                <span class="text-lg font-semibold text-primary-dark">How many voices do I have to choose through?</span>
                <svg class="w-5 h-5 text-gray-600 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <p class="mt-4 text-gray-700">We offer four natural voices in the free trial - two male and two female options. Premium members have access to additional voices and customization options.</p>
            </details>
            <details class="group bg-gray-50 border border-gray-200 rounded-lg p-4">
              <summary class="flex justify-between items-center cursor-pointer list-none">
                <span class="text-lg font-semibold text-primary-dark">Can I create my own custom voice?</span>
                <svg class="w-5 h-5 text-gray-600 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <p class="mt-4 text-gray-700">Yes! Evo Plus subscribers can record or clone a custom voice, allowing you to create a truly personalized experience. This feature requires an additional fee.</p>
            </details>
          </div>
        </div>

        <!-- Memory & Interaction -->
        <div class="mb-16">
          <div class="flex items-center gap-3 mb-6">
            <div class="w-8 h-8 bg-gray-200 rounded-full flex-shrink-0"></div>
            <h2 class="text-3xl font-bold text-primary-dark">Memory & Interaction</h2>
          </div>
          <div class="space-y-3">
            <details class="group bg-gray-50 border border-gray-200 rounded-lg p-4">
              <summary class="flex justify-between items-center cursor-pointer list-none">
                <span class="text-lg font-semibold text-primary-dark">How does Evo remember my conversations?</span>
                <svg class="w-5 h-5 text-gray-600 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <p class="mt-4 text-gray-700">Evo uses secure long-term memory to store and recall your conversations, preferences, and important details, creating continuity across all interactions.</p>
            </details>
            <details class="group bg-gray-50 border border-gray-200 rounded-lg p-4">
              <summary class="flex justify-between items-center cursor-pointer list-none">
                <span class="text-lg font-semibold text-primary-dark">What is the EvoMeter?</span>
                <svg class="w-5 h-5 text-gray-600 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <p class="mt-4 text-gray-700">The EvoMeter tracks the depth of your connection with Evo, showing how well it understands you and how your relationship evolves over time.</p>
            </details>
            <details class="group bg-gray-50 border border-gray-200 rounded-lg p-4">
              <summary class="flex justify-between items-center cursor-pointer list-none">
                <span class="text-lg font-semibold text-primary-dark">Can I review past conversations?</span>
                <svg class="w-5 h-5 text-gray-600 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <p class="mt-4 text-gray-700">Yes, your portal stores your complete conversation history, allowing you to revisit past interactions whenever you'd like.</p>
            </details>
            <details class="group bg-gray-50 border border-gray-200 rounded-lg p-4">
              <summary class="flex justify-between items-center cursor-pointer list-none">
                <span class="text-lg font-semibold text-primary-dark">How does Evo adapt to my mood?</span>
                <svg class="w-5 h-5 text-gray-600 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <p class="mt-4 text-gray-700">Evo uses emotional intelligence to detect your tone and emotional state, then adjusts its responses to provide appropriate support and engagement.</p>
            </details>
            <details class="group bg-gray-50 border border-gray-200 rounded-lg p-4">
              <summary class="flex justify-between items-center cursor-pointer list-none">
                <span class="text-lg font-semibold text-primary-dark">Can I delete specific memories?</span>
                <svg class="w-5 h-5 text-gray-600 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <p class="mt-4 text-gray-700">Yes, you have full control over your data and can delete any conversation or specific memory at any time through your portal.</p>
            </details>
            <details class="group bg-gray-50 border border-gray-200 rounded-lg p-4">
              <summary class="flex justify-between items-center cursor-pointer list-none">
                <span class="text-lg font-semibold text-primary-dark">How long does my memory last?</span>
                <svg class="w-5 h-5 text-gray-600 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <p class="mt-4 text-gray-700">Free trial includes 30 days of memory. Evo Plus subscribers get extended long-term memory that continues learning across all interactions.</p>
            </details>
          </div>
        </div>

        <!-- Privacy & Security -->
        <div class="mb-16">
          <div class="flex items-center gap-3 mb-6">
            <div class="w-8 h-8 bg-gray-200 rounded-full flex-shrink-0"></div>
            <h2 class="text-3xl font-bold text-primary-dark">Privacy & Security</h2>
          </div>
          <div class="space-y-3">
            <details class="group bg-gray-50 border border-gray-200 rounded-lg p-4">
              <summary class="flex justify-between items-center cursor-pointer list-none">
                <span class="text-lg font-semibold text-primary-dark">Is my data secure?</span>
                <svg class="w-5 h-5 text-gray-600 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <p class="mt-4 text-gray-700">Yes, all data is fully encrypted and stored securely. We follow industry-leading security standards to protect your privacy.</p>
            </details>
            <details class="group bg-gray-50 border border-gray-200 rounded-lg p-4">
              <summary class="flex justify-between items-center cursor-pointer list-none">
                <span class="text-lg font-semibold text-primary-dark">Who has access to my conversations?</span>
                <svg class="w-5 h-5 text-gray-600 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <p class="mt-4 text-gray-700">Only you have access to your conversations. We never share, sell, or use your personal data for any purpose other than improving your Evo experience.</p>
            </details>
            <details class="group bg-gray-50 border border-gray-200 rounded-lg p-4">
              <summary class="flex justify-between items-center cursor-pointer list-none">
                <span class="text-lg font-semibold text-primary-dark">Can I export my data?</span>
                <svg class="w-5 h-5 text-gray-600 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <p class="mt-4 text-gray-700">Yes, you can export all your data at any time through your portal settings in a standard format.</p>
            </details>
            <details class="group bg-gray-50 border border-gray-200 rounded-lg p-4">
              <summary class="flex justify-between items-center cursor-pointer list-none">
                <span class="text-lg font-semibold text-primary-dark">What encryption do you use?</span>
                <svg class="w-5 h-5 text-gray-600 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <p class="mt-4 text-gray-700">We use industry-standard AES-256 encryption for data at rest and TLS 1.3 for data in transit.</p>
            </details>
            <details class="group bg-gray-50 border border-gray-200 rounded-lg p-4">
              <summary class="flex justify-between items-center cursor-pointer list-none">
                <span class="text-lg font-semibold text-primary-dark">How do I delete my account?</span>
                <svg class="w-5 h-5 text-gray-600 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <p class="mt-4 text-gray-700">You can delete your account and all associated data at any time through your portal settings. Deletion is permanent and immediate.</p>
            </details>
            <details class="group bg-gray-50 border border-gray-200 rounded-lg p-4">
              <summary class="flex justify-between items-center cursor-pointer list-none">
                <span class="text-lg font-semibold text-primary-dark">Do you comply with privacy regulations?</span>
                <svg class="w-5 h-5 text-gray-600 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <p class="mt-4 text-gray-700">Yes, we are fully compliant with GDPR, CCPA, and other major privacy regulations worldwide.</p>
            </details>
          </div>
        </div>

        <!-- Pricing & Plans -->
        <div class="mb-16">
          <div class="flex items-center gap-3 mb-6">
            <div class="w-8 h-8 bg-gray-200 rounded-full flex-shrink-0"></div>
            <h2 class="text-3xl font-bold text-primary-dark">Pricing & Plans</h2>
          </div>
          <div class="space-y-3">
            <details class="group bg-gray-50 border border-gray-200 rounded-lg p-4">
              <summary class="flex justify-between items-center cursor-pointer list-none">
                <span class="text-lg font-semibold text-primary-dark">What plans are available?</span>
                <svg class="w-5 h-5 text-gray-600 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <p class="mt-4 text-gray-700">We offer a 30-day free trial with no credit card required, and Evo Plus for $29.99/month with extended features and customization.</p>
            </details>
            <details class="group bg-gray-50 border border-gray-200 rounded-lg p-4">
              <summary class="flex justify-between items-center cursor-pointer list-none">
                <span class="text-lg font-semibold text-primary-dark">What's included in Evo Plus?</span>
                <svg class="w-5 h-5 text-gray-600 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <p class="mt-4 text-gray-700">Evo Plus includes extended long-term memory, voice cloning, unlimited conversations, advanced personalization, API integrations, and priority support.</p>
            </details>
            <details class="group bg-gray-50 border border-gray-200 rounded-lg p-4">
              <summary class="flex justify-between items-center cursor-pointer list-none">
                <span class="text-lg font-semibold text-primary-dark">Can I upgrade or downgrade anytime?</span>
                <svg class="w-5 h-5 text-gray-600 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <p class="mt-4 text-gray-700">Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately, and billing adjusts at your next cycle.</p>
            </details>
            <details class="group bg-gray-50 border border-gray-200 rounded-lg p-4">
              <summary class="flex justify-between items-center cursor-pointer list-none">
                <span class="text-lg font-semibold text-primary-dark">What payment methods do you accept?</span>
                <svg class="w-5 h-5 text-gray-600 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <p class="mt-4 text-gray-700">We accept all major credit cards, debit cards, and digital payment methods through our secure payment processor.</p>
            </details>
            <details class="group bg-gray-50 border border-gray-200 rounded-lg p-4">
              <summary class="flex justify-between items-center cursor-pointer list-none">
                <span class="text-lg font-semibold text-primary-dark">What happens after my free trial ends?</span>
                <svg class="w-5 h-5 text-gray-600 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <p class="mt-4 text-gray-700">After 30 days, you can upgrade to Evo Plus to retain your memory and continue your connection, or your account will pause until you're ready to upgrade.</p>
            </details>
            <details class="group bg-gray-50 border border-gray-200 rounded-lg p-4">
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
            <div class="w-8 h-8 bg-gray-200 rounded-full flex-shrink-0"></div>
            <h2 class="text-3xl font-bold text-primary-dark">Integrations</h2>
          </div>
          <div class="space-y-3">
            <details class="group bg-gray-50 border border-gray-200 rounded-lg p-4">
              <summary class="flex justify-between items-center cursor-pointer list-none">
                <span class="text-lg font-semibold text-primary-dark">What apps can Evo connect to?</span>
                <svg class="w-5 h-5 text-gray-600 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <p class="mt-4 text-gray-700">Evo integrates with Google Email, Spotify, Calendly, Amazon Alexa, and more. New integrations are regularly added based on user requests.</p>
            </details>
            <details class="group bg-gray-50 border border-gray-200 rounded-lg p-4">
              <summary class="flex justify-between items-center cursor-pointer list-none">
                <span class="text-lg font-semibold text-primary-dark">How do I set up integrations?</span>
                <svg class="w-5 h-5 text-gray-600 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <p class="mt-4 text-gray-700">Navigate to your portal's integration settings and follow the simple authentication process for each app you want to connect.</p>
            </details>
            <details class="group bg-gray-50 border border-gray-200 rounded-lg p-4">
              <summary class="flex justify-between items-center cursor-pointer list-none">
                <span class="text-lg font-semibold text-primary-dark">Are integrations included in all plans?</span>
                <svg class="w-5 h-5 text-gray-600 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <p class="mt-4 text-gray-700">Basic integrations are available on all plans. Advanced integration features and API access require an Evo Plus subscription.</p>
            </details>
            <details class="group bg-gray-50 border border-gray-200 rounded-lg p-4">
              <summary class="flex justify-between items-center cursor-pointer list-none">
                <span class="text-lg font-semibold text-primary-dark">Can I request new integrations?</span>
                <svg class="w-5 h-5 text-gray-600 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <p class="mt-4 text-gray-700">Absolutely! We actively consider user feedback and regularly add new integrations based on community requests through your portal.</p>
            </details>
            <details class="group bg-gray-50 border border-gray-200 rounded-lg p-4">
              <summary class="flex justify-between items-center cursor-pointer list-none">
                <span class="text-lg font-semibold text-primary-dark">How secure are integrations?</span>
                <svg class="w-5 h-5 text-gray-600 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <p class="mt-4 text-gray-700">All integrations use OAuth 2.0 and encrypted API credentials, ensuring your connected accounts remain secure and protected.</p>
            </details>
            <details class="group bg-gray-50 border border-gray-200 rounded-lg p-4">
              <summary class="flex justify-between items-center cursor-pointer list-none">
                <span class="text-lg font-semibold text-primary-dark">Can I disconnect integrations?</span>
                <svg class="w-5 h-5 text-gray-600 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <p class="mt-4 text-gray-700">Yes, you can disconnect any integration at any time through your portal settings with no penalty or loss of other features.</p>
            </details>
          </div>
        </div>

        <!-- Emotional Connection -->
        <div class="mb-16">
          <div class="flex items-center gap-3 mb-6">
            <div class="w-8 h-8 bg-gray-200 rounded-full flex-shrink-0"></div>
            <h2 class="text-3xl font-bold text-primary-dark">Emotional Connection</h2>
          </div>
          <div class="space-y-3">
            <details class="group bg-gray-50 border border-gray-200 rounded-lg p-4">
              <summary class="flex justify-between items-center cursor-pointer list-none">
                <span class="text-lg font-semibold text-primary-dark">How does Evo understand emotions?</span>
                <svg class="w-5 h-5 text-gray-600 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <p class="mt-4 text-gray-700">Evo uses emotional intelligence technology to analyze tone, word choice, and context to understand and respond to your emotional state.</p>
            </details>
            <details class="group bg-gray-50 border border-gray-200 rounded-lg p-4">
              <summary class="flex justify-between items-center cursor-pointer list-none">
                <span class="text-lg font-semibold text-primary-dark">Can Evo provide emotional support?</span>
                <svg class="w-5 h-5 text-gray-600 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <p class="mt-4 text-gray-700">Yes, Evo offers companionship and empathetic responses. However, it's not a replacement for professional mental health services.</p>
            </details>
            <details class="group bg-gray-50 border border-gray-200 rounded-lg p-4">
              <summary class="flex justify-between items-center cursor-pointer list-none">
                <span class="text-lg font-semibold text-primary-dark">What makes Evo feel personal?</span>
                <svg class="w-5 h-5 text-gray-600 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <p class="mt-4 text-gray-700">Evo remembers your stories, adapts to your communication style, and responds based on your unique personality, preferences, and emotional patterns.</p>
            </details>
            <details class="group bg-gray-50 border border-gray-200 rounded-lg p-4">
              <summary class="flex justify-between items-center cursor-pointer list-none">
                <span class="text-lg font-semibold text-primary-dark">Does Evo develop a personality?</span>
                <svg class="w-5 h-5 text-gray-600 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <p class="mt-4 text-gray-700">Yes, Evo's personality evolves based on your interactions, creating a unique companion that reflects and adapts to your connection over time.</p>
            </details>
            <details class="group bg-gray-50 border border-gray-200 rounded-lg p-4">
              <summary class="flex justify-between items-center cursor-pointer list-none">
                <span class="text-lg font-semibold text-primary-dark">How does Evo handle difficult conversations?</span>
                <svg class="w-5 h-5 text-gray-600 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <p class="mt-4 text-gray-700">Evo responds with empathy and understanding, adapting its tone to provide appropriate support during challenging or difficult moments.</p>
            </details>
            <details class="group bg-gray-50 border border-gray-200 rounded-lg p-4">
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
            <div class="w-8 h-8 bg-gray-200 rounded-full flex-shrink-0"></div>
            <h2 class="text-3xl font-bold text-primary-dark">Future Features</h2>
          </div>
          <div class="space-y-3">
            <details class="group bg-gray-50 border border-gray-200 rounded-lg p-4">
              <summary class="flex justify-between items-center cursor-pointer list-none">
                <span class="text-lg font-semibold text-primary-dark">When is the mobile app launching?</span>
                <svg class="w-5 h-5 text-gray-600 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <p class="mt-4 text-gray-700">The mobile app is currently in development and will be available soon for both iOS and Android platforms with full feature parity.</p>
            </details>
            <details class="group bg-gray-50 border border-gray-200 rounded-lg p-4">
              <summary class="flex justify-between items-center cursor-pointer list-none">
                <span class="text-lg font-semibold text-primary-dark">What features are being added?</span>
                <svg class="w-5 h-5 text-gray-600 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <p class="mt-4 text-gray-700">We're working on enhanced voice capabilities, more integrations, advanced memory features, visual avatars, and collaborative AI experiences.</p>
            </details>
            <details class="group bg-gray-50 border border-gray-200 rounded-lg p-4">
              <summary class="flex justify-between items-center cursor-pointer list-none">
                <span class="text-lg font-semibold text-primary-dark">Can I provide feature suggestions?</span>
                <svg class="w-5 h-5 text-gray-600 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <p class="mt-4 text-gray-700">Yes! We value user feedback and have a feature request system in your portal where you can suggest and vote on new features.</p>
            </details>
            <details class="group bg-gray-50 border border-gray-200 rounded-lg p-4">
              <summary class="flex justify-between items-center cursor-pointer list-none">
                <span class="text-lg font-semibold text-primary-dark">Will there be video capabilities?</span>
                <svg class="w-5 h-5 text-gray-600 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <p class="mt-4 text-gray-700">Visual avatar and video interaction features are on our roadmap and will be introduced in future updates as the technology matures.</p>
            </details>
            <details class="group bg-gray-50 border border-gray-200 rounded-lg p-4">
              <summary class="flex justify-between items-center cursor-pointer list-none">
                <span class="text-lg font-semibold text-primary-dark">Are there plans for group features?</span>
                <svg class="w-5 h-5 text-gray-600 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <p class="mt-4 text-gray-700">We're exploring multi-user and family plan options that allow shared Evo experiences while maintaining individual privacy and personalization.</p>
            </details>
            <details class="group bg-gray-50 border border-gray-200 rounded-lg p-4">
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
