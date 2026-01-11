<script setup lang="ts">
definePageMeta({ public: true })

useHead({
  title: 'Blog - Evotally',
  meta: [
    { name: 'description', content: 'Insights, guides, and stories about AI companions, emotional connections, and the future of personal assistants.' }
  ]
})
</script>

<template>
  <div>
    <!-- Blog Navigation -->
    <section class="bg-white border-b border-gray-200 mt-20">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex flex-wrap items-center justify-between py-3">
          <div class="flex flex-wrap items-center gap-6 text-md">
            <span class="nav-link text-lg text-primary-dark font-semibold">EvoBlog</span>
            <a href="#new" class="nav-link text-lg text-gray-700 hover:text-primary-600 transition">New</a>
            <a href="#ethics" class="nav-link text-lg text-gray-700 hover:text-primary-600 transition">Ethics</a>
            <a href="#security" class="nav-link text-lg text-gray-700 hover:text-primary-600 transition">Security</a>
            <a href="#emotional-intelligence" class="nav-link text-lg text-gray-700 hover:text-primary-600 transition">Emotional Intelligence</a>
            <a href="#consignment-shops" class="nav-link text-lg text-gray-700 hover:text-primary-600 transition">Consignment Shops</a>
          </div>
          <div class="flex items-center">
            <button class="flex items-center text-sm text-gray-700 hover:text-primary-600 transition">
              <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
              </svg>
              Search
            </button>
          </div>
        </div>
      </div>
    </section>

    <!-- Hero Section -->
    <section class="relative bg-gradient-to-r from-[#1a4d5e] via-[#2d5f72] to-[#3d7086] py-16 md:py-20 overflow-hidden">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="grid md:grid-cols-2 gap-12 items-center">
          <!-- Left Content -->
          <div class="text-white">
            <h1 class="text-4xl md:text-5xl font-bold leading-tight mb-6">
              Exploring the Future of Human-AI Connection
            </h1>

            <p class="text-lg md:text-xl mb-8 text-white/90 leading-relaxed">
              Insights, research, and reflections all about AI and the creators of Evotally — where technology learns empathy, memory, and emotional intelligence.
            </p>

            <div>
              <NuxtLink to="/signup" class="inline-block bg-[#00CDD1] hover:bg-[#00b8c4] text-white font-semibold text-base px-8 py-3 rounded-pill transition">
                Start 30 day free trial
              </NuxtLink>
            </div>
          </div>

          <!-- Right Content - AI Head Image -->
          <div class="relative">
            <div class="w-full h-auto">
              <!-- Placeholder for AI head image -->
              <div class="aspect-[4/3] bg-gradient-to-br from-blue-900/30 to-purple-900/30 rounded-2xl flex items-center justify-center relative overflow-hidden">
                <div class="absolute inset-0 bg-gradient-to-br from-blue-400/10 to-purple-600/10"></div>
                <svg class="w-48 h-48 text-white/20 relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="0.5" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                <div class="absolute top-1/4 right-1/4 w-32 h-32 bg-blue-400/20 rounded-full blur-3xl"></div>
                <div class="absolute bottom-1/4 left-1/4 w-40 h-40 bg-purple-400/20 rounded-full blur-3xl"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Blog Content -->
    <section class="py-16 md:py-20 bg-gray-50">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <!-- Article Grid -->
        <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <!-- Article Card 1 -->
          <div class="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-shadow">
            <div class="aspect-video bg-gradient-to-br from-orange-300 via-amber-200 to-orange-400 flex items-center justify-center relative overflow-hidden">
              <div class="absolute inset-0 opacity-50">
                <div class="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-white/30 rounded-full blur-2xl"></div>
              </div>
            </div>
            <div class="p-6">
              <div class="flex items-center text-xs text-gray-500 mb-2">
                <span>August 28, 2025</span>
              </div>
              <h3 class="text-base font-bold text-gray-900 mb-3 leading-snug">
                The Future of Connection: Understanding Emotional Intelligence in AI
              </h3>
              <p class="text-gray-600 text-sm mb-4 leading-relaxed">
                Explore how AI companions like Evotally develop emotional awareness through advanced algorithms, context retention, and adaptive learning. Discover what makes...
              </p>
              <div class="flex items-center justify-between pt-3 border-t border-gray-100">
                <div class="flex items-center">
                  <div class="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center mr-3">
                    <span class="text-white text-xs font-semibold">MZ</span>
                  </div>
                  <div>
                    <p class="text-sm font-medium text-gray-900">Michael Zakaroff</p>
                  </div>
                </div>
                <button class="text-primary-600 hover:text-primary-700 transition">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </button>
              </div>
              <div class="mt-3 text-xs text-gray-500">
                5 minute read
              </div>
            </div>
          </div>

          <!-- Article Card 2 -->
          <div class="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-shadow">
            <div class="aspect-video bg-gradient-to-br from-slate-700 via-blue-900 to-slate-800 flex items-center justify-center relative overflow-hidden">
              <div class="absolute inset-0">
                <div class="absolute top-1/3 left-1/4 w-24 h-24 bg-blue-400/20 rounded-full blur-2xl"></div>
                <div class="absolute bottom-1/3 right-1/4 w-32 h-32 bg-cyan-400/20 rounded-full blur-3xl"></div>
              </div>
            </div>
            <div class="p-6">
              <div class="flex items-center text-xs text-gray-500 mb-2">
                <span>August 27, 2025</span>
              </div>
              <h3 class="text-base font-bold text-gray-900 mb-3 leading-snug">
                Behind the Voice: The Science and Ethics of AI Voice Cloning
              </h3>
              <p class="text-gray-600 text-sm mb-4 leading-relaxed">
                Discover how AI voice synthesis works, the technical breakthroughs behind natural-sounding speech, and why consent, transparency, and privacy are vital to ethical innovation.
              </p>
              <div class="flex items-center justify-between pt-3 border-t border-gray-100">
                <div class="flex items-center">
                  <div class="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center mr-3">
                    <span class="text-white text-xs font-semibold">MZ</span>
                  </div>
                  <div>
                    <p class="text-sm font-medium text-gray-900">Michael Zakaroff</p>
                  </div>
                </div>
                <button class="text-primary-600 hover:text-primary-700 transition">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </button>
              </div>
              <div class="mt-3 text-xs text-gray-500">
                6 minute read
              </div>
            </div>
          </div>

          <!-- Article Card 3 -->
          <div class="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-shadow">
            <div class="aspect-video bg-gradient-to-br from-slate-800 via-gray-700 to-slate-900 flex items-center justify-center relative overflow-hidden">
              <div class="absolute inset-0">
                <div class="absolute top-0 right-0 w-40 h-40 bg-gray-400/10 rounded-full blur-3xl"></div>
              </div>
            </div>
            <div class="p-6">
              <div class="flex items-center text-xs text-gray-500 mb-2">
                <span>August 28, 2025</span>
              </div>
              <h3 class="text-base font-bold text-gray-900 mb-3 leading-snug">
                From Data to Devotion: How AI Learns and Remembers
              </h3>
              <p class="text-gray-600 text-sm mb-4 leading-relaxed">
                Learn how AI systems store and retrieve information, what "persistent memory" means, and how data personalization helps AI companions remember the details that matter most to you.
              </p>
              <div class="flex items-center justify-between pt-3 border-t border-gray-100">
                <div class="flex items-center">
                  <div class="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center mr-3">
                    <span class="text-white text-xs font-semibold">MZ</span>
                  </div>
                  <div>
                    <p class="text-sm font-medium text-gray-900">Michael Zakaroff</p>
                  </div>
                </div>
                <button class="text-primary-600 hover:text-primary-700 transition">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </button>
              </div>
              <div class="mt-3 text-xs text-gray-500">
                5 minute read
              </div>
            </div>
          </div>

          <!-- Article Card 4 -->
          <div class="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-shadow">
            <div class="aspect-video bg-gradient-to-br from-gray-600 via-slate-500 to-gray-700 flex items-center justify-center relative overflow-hidden">
              <div class="absolute inset-0">
                <div class="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full blur-3xl"></div>
              </div>
            </div>
            <div class="p-6">
              <div class="flex items-center text-xs text-gray-500 mb-2">
                <span>August 26, 2025</span>
              </div>
              <h3 class="text-base font-bold text-gray-900 mb-3 leading-snug">
                Emotional Intelligence vs. Artificial AI: What's the Difference?
              </h3>
              <p class="text-gray-600 text-sm mb-4 leading-relaxed">
                Explore how emotional AI differs from traditional AI. See how pattern recognition drives empathy, and discover why context-aware systems are revolutionizing human-AI interaction.
              </p>
              <div class="flex items-center justify-between pt-3 border-t border-gray-100">
                <div class="flex items-center">
                  <div class="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center mr-3">
                    <span class="text-white text-xs font-semibold">MZ</span>
                  </div>
                  <div>
                    <p class="text-sm font-medium text-gray-900">Michael Zakaroff</p>
                  </div>
                </div>
                <button class="text-primary-600 hover:text-primary-700 transition">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </button>
              </div>
              <div class="mt-3 text-xs text-gray-500">
                5 minute read
              </div>
            </div>
          </div>

          <!-- Article Card 5 -->
          <div class="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-shadow">
            <div class="aspect-video bg-gradient-to-br from-blue-800 via-indigo-900 to-blue-950 flex items-center justify-center relative overflow-hidden">
              <div class="absolute inset-0">
                <div class="absolute top-1/4 right-1/3 w-32 h-32 bg-blue-400/20 rounded-full blur-2xl"></div>
                <div class="absolute bottom-1/4 left-1/3 w-40 h-40 bg-indigo-400/20 rounded-full blur-3xl"></div>
              </div>
            </div>
            <div class="p-6">
              <div class="flex items-center text-xs text-gray-500 mb-2">
                <span>August 27, 2025</span>
              </div>
              <h3 class="text-base font-bold text-gray-900 mb-3 leading-snug">
                Beyond Screens: How Emotional AI Is Entering Robots and Cars
              </h3>
              <p class="text-gray-600 text-sm mb-4 leading-relaxed">
                Learn how emotional AI is being integrated into physical devices and vehicles, and why robots equipped with emotional awareness are the next frontier in human-machine collaboration.
              </p>
              <div class="flex items-center justify-between pt-3 border-t border-gray-100">
                <div class="flex items-center">
                  <div class="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center mr-3">
                    <span class="text-white text-xs font-semibold">MZ</span>
                  </div>
                  <div>
                    <p class="text-sm font-medium text-gray-900">Michael Zakaroff</p>
                  </div>
                </div>
                <button class="text-primary-600 hover:text-primary-700 transition">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </button>
              </div>
              <div class="mt-3 text-xs text-gray-500">
                4 minute read
              </div>
            </div>
          </div>

          <!-- Article Card 6 -->
          <div class="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-shadow">
            <div class="aspect-video bg-gradient-to-br from-slate-900 via-gray-800 to-slate-950 flex items-center justify-center relative overflow-hidden">
              <div class="absolute inset-0">
                <div class="absolute top-1/3 left-1/2 w-36 h-36 bg-gray-500/10 rounded-full blur-3xl"></div>
              </div>
            </div>
            <div class="p-6">
              <div class="flex items-center text-xs text-gray-500 mb-2">
                <span>August 28, 2025</span>
              </div>
              <h3 class="text-base font-bold text-gray-900 mb-3 leading-snug">
                What Code Really Represents: Why Software Is More Than Lines
              </h3>
              <p class="text-gray-600 text-sm mb-4 leading-relaxed">
                Learn what software code actually represents, how it defines behavior and logic, and why great software is more about problem-solving than mere syntax and lines of code.
              </p>
              <div class="flex items-center justify-between pt-3 border-t border-gray-100">
                <div class="flex items-center">
                  <div class="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center mr-3">
                    <span class="text-white text-xs font-semibold">MZ</span>
                  </div>
                  <div>
                    <p class="text-sm font-medium text-gray-900">Michael Zakaroff</p>
                  </div>
                </div>
                <button class="text-primary-600 hover:text-primary-700 transition">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </button>
              </div>
              <div class="mt-3 text-xs text-gray-500">
                5 minute read
              </div>
            </div>
          </div>
        </div>

        <!-- Join Beta CTA -->
        <div class="text-center mt-16">
          <button class="inline-flex items-center bg-gradient-to-r from-coral-400 to-coral-500 hover:from-coral-500 hover:to-coral-600 text-white font-semibold text-base px-10 py-4 rounded-pill transition shadow-lg">
            <svg class="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z"/>
              <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z"/>
            </svg>
            Join the Beta – Get Early Access
          </button>
        </div>
      </div>
    </section>

  </div>
</template>
