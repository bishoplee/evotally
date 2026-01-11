<script setup lang="ts">
definePageMeta({ public: true })

useHead({
  title: 'Pricing - Evotally',
  meta: [
    { name: 'description', content: 'Choose the perfect plan for your AI companion experience with Evotally.' }
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
              Simple, Transparent Pricing
            </span>
            <span class="block text-white/90 mt-2 hero-title-sub">
              Choose Your Plan
            </span>
          </h1>
          <p class="mt-8 leading-relaxed text-white/80 hero-text max-w-3xl mx-auto">
            Start free and upgrade when you're ready. No hidden fees, no surprises.
            Just straightforward pricing for your AI companion.
          </p>
        </div>
      </div>
    </section>

    <!-- Pricing Hero Text -->
    <section class="py-12 bg-gradient-to-b from-[#E5F6F5] to-white">
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div class="text-center">
          <h2 class="text-4xl font-bold text-primary-dark mb-4">Simple tiers.<br>Powerful companionship.</h2>
          <p class="text-xl text-primary-dark-80 max-w-3xl mx-auto">
            Start free for 30 days. Upgrade to unlock deep memory, integrations, and optional custom voice.
          </p>
        </div>
      </div>
    </section>

    <!-- Pricing Cards -->
    <section class="py-16 bg-gradient-to-b from-white to-[#E5F6F5]">
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          
          <!-- Free Trial Card -->
          <div class="bg-white rounded-3xl p-8 border-4 border-primary-600 flex flex-col">
            <div class="text-center mb-6">
              <h3 class="text-2xl font-bold text-primary-dark mb-2">Free Trial</h3>
              <div class="mb-4">
                <span class="text-5xl font-bold text-primary-dark">$0</span>
                <span class="text-gray-600">/first 30 days</span>
              </div>
            </div>
            <p class="text-center text-gray-700 mb-6">
              Start building your Evo now and begin evolving with real voice and developing memory.
            </p>
            <div class="flex-grow mb-6">
              <p class="text-sm text-gray-500 italic text-center">"Your Evo's first hello"</p>
            </div>
            <NuxtLink to="/register" class="w-full text-center btn-secondary py-4 text-lg font-semibold">
              Start 30 day free trial
            </NuxtLink>
          </div>

          <!-- Evo Plus Card (Featured) -->
          <div class="bg-white rounded-3xl p-8 border-4 border-coral-500 flex flex-col relative">
            <!-- Best Value Badge -->
            <div class="absolute -top-4 left-1/2 -translate-x-1/2">
              <div class="bg-coral-500 text-white px-6 py-2 rounded-full text-sm font-bold shadow-lg">
                BEST VALUE
              </div>
            </div>
            <div class="text-center mb-6 mt-4">
              <h3 class="text-2xl font-bold text-primary-dark mb-2">Evo Plus</h3>
              <div class="mb-4">
                <span class="text-5xl font-bold text-primary-dark">$29.99</span>
                <span class="text-gray-600">/month</span>
              </div>
            </div>
            <p class="text-center text-gray-700 mb-6">
              Unlimited deep memory and seamless APP connection integrations.
            </p>
            <div class="flex-grow mb-6">
              <p class="text-sm text-gray-500 italic text-center">"Where your Evo becomes truly yours"</p>
            </div>
            <NuxtLink to="/register" class="w-full text-center text-white font-semibold py-4 text-lg rounded-pill" style="background: linear-gradient(135deg, #FB7A57 0%, #FF8D68 100%);">
              Start Now
            </NuxtLink>
          </div>

          <!-- Custom Voice Add-on Card -->
          <div class="bg-white rounded-3xl p-8 border-4 border-purple-400 flex flex-col">
            <div class="text-center mb-6">
              <h3 class="text-2xl font-bold text-primary-dark mb-2">Custom Voice<br><span class="text-lg">(add on)</span></h3>
              <div class="mb-4">
                <span class="text-5xl font-bold text-primary-dark">$19.99</span>
                <span class="text-gray-600">/month</span>
              </div>
            </div>
            <p class="text-center text-gray-700 mb-6">
              Make Evo sound like a familiar voice that feels real.
            </p>
            <div class="flex-grow mb-6">
              <p class="text-sm text-gray-500 italic text-center">"Enhance your Evo's life"</p>
            </div>
            <NuxtLink to="/register" class="w-full text-center btn-primary py-4 text-lg font-semibold">
              Add on
            </NuxtLink>
          </div>
        </div>
      </div>
    </section>

    <!-- Feature Comparison -->
    <section class="py-16 bg-white">
      <div class="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <h2 class="text-3xl font-bold text-center text-primary-dark mb-12">Feature Comparison</h2>
        
        <div class="overflow-x-auto">
          <table class="w-full border-2 border-gray-200 rounded-2xl overflow-hidden">
            <thead>
              <tr class="bg-coral-400 text-white">
                <th class="py-4 px-6 text-left font-semibold">Feature</th>
                <th class="py-4 px-6 text-center font-semibold">Free Trial</th>
                <th class="py-4 px-6 text-center font-semibold">Evo Plus</th>
              </tr>
            </thead>
            <tbody class="bg-white">
              <tr class="border-b border-gray-200">
                <td class="py-4 px-6 text-primary-dark">Text chat</td>
                <td class="py-4 px-6 text-center">
                  <svg class="w-6 h-6 text-teal-600 mx-auto" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/></svg>
                </td>
                <td class="py-4 px-6 text-center">
                  <svg class="w-6 h-6 text-teal-600 mx-auto" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/></svg>
                </td>
              </tr>
              <tr class="border-b border-gray-200 bg-gray-50">
                <td class="py-4 px-6 text-primary-dark">Voice selections (two male & two female)</td>
                <td class="py-4 px-6 text-center">
                  <svg class="w-6 h-6 text-teal-600 mx-auto" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/></svg>
                </td>
                <td class="py-4 px-6 text-center">
                  <svg class="w-6 h-6 text-teal-600 mx-auto" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/></svg>
                </td>
              </tr>
              <tr class="border-b border-gray-200">
                <td class="py-4 px-6 text-primary-dark">Create or clone a familiar voice</td>
                <td class="py-4 px-6 text-center">
                  <svg class="w-6 h-6 text-red-500 mx-auto" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/></svg>
                </td>
                <td class="py-4 px-6 text-center text-gray-600">Add-on</td>
              </tr>
              <tr class="border-b border-gray-200 bg-gray-50">
                <td class="py-4 px-6 text-primary-dark">Emotional adaptation</td>
                <td class="py-4 px-6 text-center text-gray-600">Basic</td>
                <td class="py-4 px-6 text-center">
                  <svg class="w-6 h-6 text-teal-600 mx-auto" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/></svg>
                </td>
              </tr>
              <tr class="border-b border-gray-200">
                <td class="py-4 px-6 text-primary-dark">Memory</td>
                <td class="py-4 px-6 text-center text-gray-600">30 days</td>
                <td class="py-4 px-6 text-center text-gray-600">Unlimited</td>
              </tr>
              <tr class="border-b border-gray-200 bg-gray-50">
                <td class="py-4 px-6 text-primary-dark">File uploads</td>
                <td class="py-4 px-6 text-center">
                  <svg class="w-6 h-6 text-teal-600 mx-auto" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/></svg>
                </td>
                <td class="py-4 px-6 text-center">
                  <svg class="w-6 h-6 text-teal-600 mx-auto" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/></svg>
                </td>
              </tr>
              <tr class="border-b border-gray-200">
                <td class="py-4 px-6 text-primary-dark">Bookmark conversations</td>
                <td class="py-4 px-6 text-center">
                  <svg class="w-6 h-6 text-teal-600 mx-auto" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/></svg>
                </td>
                <td class="py-4 px-6 text-center">
                  <svg class="w-6 h-6 text-teal-600 mx-auto" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/></svg>
                </td>
              </tr>
              <tr class="border-b border-gray-200 bg-gray-50">
                <td class="py-4 px-6 text-primary-dark">EvoMeter Dashboard</td>
                <td class="py-4 px-6 text-center">
                  <svg class="w-6 h-6 text-teal-600 mx-auto" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/></svg>
                </td>
                <td class="py-4 px-6 text-center">
                  <svg class="w-6 h-6 text-teal-600 mx-auto" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/></svg>
                </td>
              </tr>
              <tr class="border-b border-gray-200">
                <td class="py-4 px-6 text-primary-dark">Alexa integrations</td>
                <td class="py-4 px-6 text-center">
                  <svg class="w-6 h-6 text-teal-600 mx-auto" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/></svg>
                </td>
                <td class="py-4 px-6 text-center">
                  <svg class="w-6 h-6 text-teal-600 mx-auto" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/></svg>
                </td>
              </tr>
              <tr class="border-b border-gray-200 bg-gray-50">
                <td class="py-4 px-6 text-primary-dark">Private data security</td>
                <td class="py-4 px-6 text-center text-gray-600">30 days</td>
                <td class="py-4 px-6 text-center text-gray-600">On-going</td>
              </tr>
              <tr class="border-b border-gray-200">
                <td class="py-4 px-6 text-primary-dark">Calendar & email integration</td>
                <td class="py-4 px-6 text-center">
                  <svg class="w-6 h-6 text-red-500 mx-auto" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/></svg>
                </td>
                <td class="py-4 px-6 text-center">
                  <svg class="w-6 h-6 text-teal-600 mx-auto" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/></svg>
                </td>
              </tr>
              <tr class="border-b border-gray-200 bg-gray-50">
                <td class="py-4 px-6 text-primary-dark">Third party App releases</td>
                <td class="py-4 px-6 text-center">
                  <svg class="w-6 h-6 text-red-500 mx-auto" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/></svg>
                </td>
                <td class="py-4 px-6 text-center">
                  <svg class="w-6 h-6 text-teal-600 mx-auto" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/></svg>
                </td>
              </tr>
              <tr class="border-b border-gray-200">
                <td class="py-4 px-6 text-primary-dark">Smart car integration</td>
                <td class="py-4 px-6 text-center">
                  <svg class="w-6 h-6 text-red-500 mx-auto" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/></svg>
                </td>
                <td class="py-4 px-6 text-center text-gray-600">Coming soon!</td>
              </tr>
              <tr class="border-b border-gray-200 bg-gray-50">
                <td class="py-4 px-6 text-primary-dark">Robot integration</td>
                <td class="py-4 px-6 text-center">
                  <svg class="w-6 h-6 text-red-500 mx-auto" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/></svg>
                </td>
                <td class="py-4 px-6 text-center text-gray-600">Coming soon!</td>
              </tr>
              <tr class="bg-gray-50">
                <td class="py-4 px-6 text-primary-dark">Create Avatar</td>
                <td class="py-4 px-6 text-center">
                  <svg class="w-6 h-6 text-red-500 mx-auto" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/></svg>
                </td>
                <td class="py-4 px-6 text-center text-gray-600">Coming soon!</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </section>

    <!-- Pricing Summary -->
    <section class="py-16 bg-gradient-to-b from-[#E5F6F5] to-white">
      <div class="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <div class="text-center">
          <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div>
              <h3 class="text-xl font-bold text-primary-dark mb-2">Evo Plus <span class="text-gray-600">(monthly)</span></h3>
              <p class="text-3xl font-bold text-primary-dark">$29.99</p>
            </div>
            <div>
              <h3 class="text-xl font-bold text-primary-dark mb-2">Custom voice <span class="text-gray-600">(monthly)</span></h3>
              <p class="text-3xl font-bold text-primary-dark">$19.99</p>
            </div>
            <div>
              <h3 class="text-xl font-bold text-primary-dark mb-2">Your Monthly Plan</h3>
              <p class="text-3xl font-bold text-primary-dark">$49.98</p>
            </div>
          </div>
          <NuxtLink to="/register" class="btn-secondary text-lg px-12 py-4 font-semibold" style="background: linear-gradient(135deg, #FB7A57 0%, #FF8D68 100%); color: white;">
            Start My Evo Journey
          </NuxtLink>
        </div>
      </div>
    </section>
  </div>
</template>
