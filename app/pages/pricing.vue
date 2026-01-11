<script setup lang="ts">
definePageMeta({ public: true })

useHead({
  title: 'Pricing - Evotally',
  meta: [
    { name: 'description', content: 'Choose the perfect plan for your AI companion experience with Evotally.' }
  ]
})

const isYearly = ref(false)

const evoPlusPrice = computed(() => isYearly.value ? 299.99 : 29.99)
const customVoicePrice = computed(() => isYearly.value ? 199.99 : 19.99)
const totalPrice = computed(() => isYearly.value ? 499.98 : 49.98)
const billingPeriod = computed(() => isYearly.value ? 'year' : 'month')
</script>

<template>
  <div>
    <!-- Hero Section -->
    <section class="bg-gradient-to-b from-[#E5F6F5] to-white pb-16 pt-20 sm:pt-32">
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
    <section class="pb-16 bg-gradient-to-b from-white to-[#E5F6F5]">
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        <!-- Billing Toggle -->
        <div class="flex justify-center items-center mb-12">
          <div class="inline-flex bg-gray-200 rounded-full p-1">
            <button 
              @click="isYearly = false"
              class="px-8 py-3 rounded-full text-lg font-semibold transition-all"
              :class="!isYearly ? 'btn-gradient-hero text-primary-dark shadow-md' : 'text-gray-600 hover:text-primary-dark'"
            >
              Monthly
            </button>
            <button 
              @click="isYearly = true"
              class="px-8 py-3 rounded-full text-lg font-semibold transition-all flex items-center gap-2"
              :class="isYearly ? 'btn-gradient-hero text-primary-dark shadow-md' : 'text-gray-600 hover:text-primary-dark'"
            >
              Yearly
            </button>
          </div>
        </div>
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
            <NuxtLink to="/register" class="w-full text-center btn-secondary btn-gradient-hero py-4 text-lg font-semibold">
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
                <span class="text-5xl font-bold text-primary-dark">${{ evoPlusPrice.toFixed(2) }}</span>
                <span class="text-gray-600">/{{ billingPeriod }}</span>
              </div>
            </div>
            <p class="text-center text-gray-700 mb-6">
              Unlimited deep memory and seamless APP connection integrations.
            </p>
            <div class="flex-grow mb-6">
              <p class="text-sm text-gray-500 italic text-center">"Where your Evo becomes truly yours"</p>
            </div>
            <NuxtLink to="/register" class="w-full text-center text-white font-semibold py-4 text-lg rounded-pill bg-gradient-to-r from-[#FB7A57] to-[#FBBD68]">
              Start Now
            </NuxtLink>
          </div>

          <!-- Custom Voice Add-on Card -->
          <div class="bg-white rounded-3xl p-8 border-4 border-purple-400 flex flex-col">
            <div class="text-center mb-6">
              <h3 class="text-2xl font-bold text-primary-dark mb-2">Custom Voice<br><span class="text-lg">(add on)</span></h3>
              <div class="mb-4">
                <span class="text-5xl font-bold text-primary-dark">${{ customVoicePrice.toFixed(2) }}</span>
                <span class="text-gray-600">/{{ billingPeriod }}</span>
              </div>
            </div>
            <p class="text-center text-gray-700 mb-6">
              Make Evo sound like a familiar voice that feels real.
            </p>
            <div class="flex-grow mb-6">
              <p class="text-sm text-gray-500 italic text-center">"Enhance your Evo's life"</p>
            </div>
            <NuxtLink to="/register" class="w-full text-center btn-primary py-4 text-lg font-semibold btn-hero-cta">
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
              <h3 class="text-xl font-bold text-primary-dark mb-2">Evo Plus <span class="text-gray-600">({{ billingPeriod }}ly)</span></h3>
              <p class="text-3xl font-bold text-primary-dark">${{ evoPlusPrice.toFixed(2) }}</p>
            </div>
            <div>
              <h3 class="text-xl font-bold text-primary-dark mb-2">Custom voice <span class="text-gray-600">({{ billingPeriod }}ly)</span></h3>
              <p class="text-3xl font-bold text-primary-dark">${{ customVoicePrice.toFixed(2) }}</p>
            </div>
            <div>
              <h3 class="text-xl font-bold text-primary-dark mb-2">Your {{ isYearly ? 'Yearly' : 'Monthly' }} Plan</h3>
              <p class="text-3xl font-bold text-primary-dark">${{ totalPrice.toFixed(2) }}</p>
            </div>
          </div>
          <NuxtLink to="/register" class="btn-secondary text-lg px-12 py-4 font-semibold bg-gradient-to-r from-[#FB7A57] to-[#FBBD68]">
            Start My Evo Journey
          </NuxtLink>
        </div>
      </div>
    </section>
  </div>
</template>
