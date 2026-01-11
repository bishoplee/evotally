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
            Select from warm, natural voices - or clone a custom one with the paid plan. Your Evo's voice is how connection feels alive.
          </p>
          
          <!-- Two Cards -->
          <div class="mt-12 grid grid-cols-1 md:grid-cols-2 gap-4 mx-auto">
            <!-- Card 1 -->
            <div class="bg-white rounded-3xl p-8 flex flex-col" style="border: 4px solid #006D77;">
              <!-- Title Section -->
              <div class="">
                <h3 class="text-2xl font-bold text-primary-dark mb-3">
                  Free Trial Version
                </h3>
                <p class="text-xl text-primary-dark font-bold">
                  $0.00
                </p>
              </div>
              
              <!-- What's Included Section (flex-grow) -->
              <div class="flex-grow text-left mt-4">
                <h4 class="text-md font-semibold text-primary-dark mb-4">
                  What's Included
                </h4>
                <ul class="space-y-3 text-left list-disc list-inside text-sm leading-tight">
                  <li class="">
                    Free 30 day secure memory saves your progress as Evo begins to know you
                  </li>
                  <li class="">
                    No credit card required
                  </li>
                  <li class="">
                    Four natural voices - Access to (two male, two female)
                  </li>
                  <li class="">
                    Secure data- Fully encrypted
                  </li>
                  <li class="">
                    Upgrade within 30 days to retain memory and progress
                  </li>
                </ul>
              </div>
              
              <!-- CTA Section -->
              <div class="mt-6">
                <NuxtLink to="/register" class="text-center btn-secondary btn-gradient-hero text-base py-4 px-16">
                  Start 30 day free trial
                </NuxtLink>
              </div>
            </div>

            <!-- Card 2 -->
            <div class="bg-white rounded-3xl p-8 flex flex-col" style="border: 4px solid #FF8D68;">
              <!-- Title Section -->
              <div class="">
                <h3 class="text-2xl font-bold text-primary-dark mb-3">
                  Evo Plus Version
                </h3>
                <p class="text-xl text-primary-dark font-bold">
                  $29.99/month
                </p>
              </div>
              
              <!-- What's Included Section (flex-grow) -->
              <div class="flex-grow text-left mt-4">
                <h4 class="text-md font-semibold text-primary-dark mb-4">
                  What's Included
                </h4>
                <ul class="space-y-3 text-left list-disc list-inside text-sm leading-tight">
                  <li class="">
                    Extended long-term memory that keeps learning across every interaction
                  </li>
                  <li class="">
                    Expanded emotional intelligence - Evo adapts its tone to your moods and moments
                  </li>
                  <li class="">
                    Voice personalization - record or clone a voice you love (additional fee)
                  </li>
                  <li class="">
                    Secure data- Fully encrypted
                  </li>
                  <li class="">
                    Smart connections - API access to sync your popular APPS.
                  </li>
                </ul>
              </div>
              
              <!-- CTA Section -->
              <div class="mt-6">
                <NuxtLink to="/register" class="text-center btn-secondary bg-gradient-to-r from-[#FB7A57] to-[#FBBD68] text-base py-4 px-32">
                  Start Now
                </NuxtLink>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Step 2 -->
    <section class="py-16 bg-gradient-to-b from-[#E5F6F5] to-white">
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div class="text-center">
          <h2 class="text-3xl font-bold tracking-tight text-primary-dark sm:text-4xl mb-4">
            Step 2: Choose Your Voice
          </h2>
          <p class="text-2xl text-primary-dark max-w-2xl mx-auto">
            Select between various male, female or customize your own.
          </p>
          
          <!-- Voice Images Grid -->
          <div class="mt-12 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8 max-w-6xl mx-auto">
            <!-- Tom -->
            <div class="flex flex-col items-center">
              <img src="/tom.png" alt="Tom" class="w-full h-auto rounded-lg mb-3" />
              <h3 class="text-lg font-semibold text-primary-dark">Tom</h3>
            </div>
            
            <!-- Jake -->
            <div class="flex flex-col items-center">
              <img src="/jake.png" alt="Jake" class="w-full h-auto rounded-lg mb-3" />
              <h3 class="text-lg font-semibold text-primary-dark">Jake</h3>
            </div>
            
            <!-- Lisa -->
            <div class="flex flex-col items-center">
              <img src="/lisa.png" alt="Lisa" class="w-full h-auto rounded-lg mb-3" />
              <h3 class="text-lg font-semibold text-primary-dark">Lisa</h3>
            </div>
            
            <!-- Mel -->
            <div class="flex flex-col items-center">
              <img src="/mel.png" alt="Mel" class="w-full h-auto rounded-lg mb-3" />
              <h3 class="text-lg font-semibold text-primary-dark">Mel</h3>
            </div>
            
            <!-- Customize Pro -->
            <div class="flex flex-col items-center">
              <img src="/customize-pro.png" alt="Customize Pro" class="w-full h-auto rounded-lg mb-3" />
              <h3 class="text-lg font-semibold text-primary-dark">Customize<br>(pro)</h3>
            </div>
          </div>          
        </div>
      </div>
    </section>

    <!-- Step 3 -->
    <section class="py-16 bg-gradient-to-b from-[#E5F6F5] to-white">
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div class="text-center">
          <h2 class="text-3xl font-bold tracking-tight text-primary-dark sm:text-4xl mb-4">
            Step 3: Name Your Evo
          </h2>
          <p class="text-2xl text-primary-dark max-w-2xl mx-auto">
            Give your Evo a name - any name you want. Once you name it. Evo begins to learn your story, tone, and preferences.
          </p>
          
        </div>

        <div class="flex flex-col items-center text-center gap-6">
          <!-- Hero Orb -->
          <div class="relative">
            <!-- Floating Greeting -->
            <div class="absolute top-1/2 left-1/2 -translate-x-1/2 bg-white py-4 px-16 rounded-lg shadow-lg text-2xl font-semibold text-primary-dark z-10 whitespace-nowrap border-2 border-gray-300" style="transform: translate(-50%, calc(-50% + 16px));">
              Hello, I'm Mike
            </div>
            
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

          <!-- CTA Section -->
          <div class="mt-6">
            <NuxtLink to="/register" class="text-center btn-secondary bg-gradient-to-r from-[#FB7A57] to-[#FBBD68] text-base py-4 px-16">
              Start Your Free Trial
            </NuxtLink>
          </div>
        </div>
      </div>
    </section>

    <!-- Step 4 -->
    <section class="py-16 bg-gradient-to-b from-[#026F78] to-[#BEFBFC]">
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div class="text-center">
          <h2 class="text-3xl font-bold tracking-tight text-white sm:text-4xl mb-4">
            Step 4: Let Evo Start Learning About You
          </h2>
          <p class="text-2xl text-white max-w-4xl mx-auto">
            Evo adapts to you through conversation, your likes, dislikes, and preferences. Keep chatting and see Evo's understanding of you deepen and evolve.
          </p>
          
        </div>

        <div class="flex flex-col items-center text-center gap-6">
          <!-- Hero Orb -->
          <div class="relative">            
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
        </div>
      </div>
    </section>

    <!-- Step 5 -->
    <section class="py-16">
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div class="text-center">
          <h2 class="text-3xl font-bold tracking-tight text-primary-dark sm:text-4xl mb-4">
            Step 5: Connect Your World (Optional)
          </h2>
          <p class="text-2xl text-primary-dark max-w-5xl mx-auto">
            Connect Evo to your daily tools or voice assistants. Add API credentials, manage connections, and expand your Evo's abilities - all through your personal portal.
          </p>
          
          <!-- Integration Images Grid -->
          <div class="mt-12 grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
            <!-- Google Email -->
            <div class="flex flex-col items-center">
              <div class="w-auto h-[110px] rounded-lg mb-3 overflow-hidden flex items-center justify-center bg-gray-50">
                <img src="/google_email.png" alt="Google Email" class="w-full h-full object-contain" />
              </div>
              <h3 class="text-lg font-semibold text-primary-dark">Google Email</h3>
            </div>
            
            <!-- Spotify -->
            <div class="flex flex-col items-center">
              <div class="w-auto h-[110px] rounded-lg mb-3 overflow-hidden flex items-center justify-center bg-gray-50">
                <img src="/spotify.png" alt="Spotify" class="w-full h-full object-contain" />
              </div>
              <h3 class="text-lg font-semibold text-primary-dark">Spotify</h3>
            </div>
            
            <!-- Calendly -->
            <div class="flex flex-col items-center">
              <div class="w-auto h-[110px] rounded-lg mb-3 overflow-hidden flex items-center justify-center bg-gray-50">
                <img src="/calendly.png" alt="Calendly" class="w-full h-full object-contain" />
              </div>
              <h3 class="text-lg font-semibold text-primary-dark">Calendly</h3>
            </div>
            
            <!-- Amazon Alexa -->
            <div class="flex flex-col items-center">
              <div class="w-auto h-[110px] rounded-lg mb-3 overflow-hidden flex items-center justify-center bg-gray-50">
                <img src="/amazon_alexa.png" alt="Amazon Alexa" class="w-full h-full object-contain" />
              </div>
              <h3 class="text-lg font-semibold text-primary-dark">Amazon Alexa</h3>
            </div>
          </div>
        </div>

        <div class="flex justify-center text-center">
          <h3 class="text-2xl mt-8 text-primary-dark">New API's are always released!</h3>
        </div>
      </div>
    </section>

    <!-- Step 6 -->
    <section class="py-16 bg-gradient-to-b from-[#E5F6F5] to-white">
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div class="text-center">
          <h2 class="text-3xl font-bold tracking-tight text-primary-dark sm:text-4xl mb-4">
            Step 6: Access Your Evo Anywhere
          </h2>
          <p class="text-2xl text-primary-dark mx-auto">
            Once you create your Evo, you'll access it through your secure online portal - You'll also receive a floating URL that you can use from any device, anytime. Your Evo stays connected wherever life takes you. Mobile app coming soon.
          </p>
          
          <!-- Three Cards -->
          <div class="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
            <!-- Card 1: Online Portal -->
            <div class="bg-white rounded-2xl p-6 flex flex-col border-2 border-gray-300">
              <h3 class="text-2xl font-bold text-primary-dark mb-4">
                Online Portal
              </h3>
              <div class="w-full h-[190px] rounded-lg mb-4 overflow-hidden flex items-center justify-center">
                <img src="/online_portal.png" alt="Online Portal" class="w-full h-full object-contain" />
              </div>
              <p class="text-base text-primary-dark text-lg">
                Your personal dashboard that stores your memories and preferences.
              </p>
            </div>

            <!-- Card 2: Unique URL Link -->
            <div class="bg-white rounded-2xl p-6 flex flex-col border-2 border-gray-300">
              <h3 class="text-2xl font-bold text-primary-dark mb-4">
                Unique URL Link
              </h3>
              <div class="w-full h-[190px] rounded-lg mb-4 overflow-hidden flex items-center justify-center">
                <img src="/url_link.png" alt="Unique URL Link" class="w-full h-full object-contain" />
              </div>
              <p class="text-base text-primary-dark text-lg">
                A unique link tied to your username. Open it anywhere, anytime or pin it as a shortcut
              </p>
            </div>

            <!-- Card 3: Mobile App -->
            <div class="bg-white rounded-2xl p-6 flex flex-col border-2 border-gray-300">
              <h3 class="text-2xl font-bold text-primary-dark mb-4">
                Mobile App
                <span class="text-lg block">(Coming Soon)</span>
              </h3>
              <div class="w-full h-[190px] rounded-lg mb-4 overflow-hidden flex items-center justify-center">
                <img src="/mobile.png" alt="Mobile App" class="w-full h-full object-contain" />
              </div>
              <p class="text-base text-primary-dark text-lg">
                Seamless on-the-go access that stays in sync with your portal and URL.
              </p>
            </div>
          </div>
        </div>

        <div class="flex flex-col items-center text-center gap-6">
          <!-- CTA Section -->
          <div class="mt-16">
            <NuxtLink to="/register" class="text-center text-white font-semibold text-base py-4 px-16 rounded-3xl bg-gradient-to-r from-[#FB7A57] to-[#FBBD68]">
              Start Your Free Trial
            </NuxtLink>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>
