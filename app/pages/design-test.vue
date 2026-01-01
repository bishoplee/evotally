<script setup lang="ts">
definePageMeta({ public: true })

const testEmail = ref('')
</script>

<template>
  <div class="container-evotally py-section-desktop">
    <div class="max-w-4xl mx-auto">
      <h1 class="heading-hero text-center mb-8">Evotally Design System</h1>
      
      <!-- Logo Section -->
      <section class="mb-12">
        <h2 class="heading-section mb-4">Logo</h2>
        <div class="card flex items-center justify-center p-8 bg-gray-50">
          <img src="/logo.svg" alt="Evotally Logo" class="h-20 w-auto" />
        </div>
      </section>

      <!-- Buttons Section -->
      <section class="mb-12">
        <h2 class="heading-section mb-4">Buttons</h2>
        <div class="card space-y-4">
          <div class="flex flex-wrap gap-4">
            <UiButton variant="primary">Primary Button</UiButton>
            <UiButton variant="secondary">Secondary Button</UiButton>
            <UiButton variant="ghost">Ghost Button</UiButton>
            <UiButton variant="gradient">Gradient Button</UiButton>
          </div>
          
          <div class="flex flex-wrap gap-4">
            <UiButton variant="primary" :disabled="true">Disabled</UiButton>
            <UiButton variant="primary" :loading="true">Loading</UiButton>
            <UiButton variant="primary" full-width>Full Width Button</UiButton>
          </div>
        </div>
      </section>

      <!-- Cards Section -->
      <section class="mb-12">
        <h2 class="heading-section mb-4">Cards</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <UiCard>
            <h3 class="heading-card mb-2">Standard Card</h3>
            <p class="text-gray-600">This is a standard card with default padding and shadow.</p>
          </UiCard>
          
          <UiCard :hover="true">
            <h3 class="heading-card mb-2">Hover Card</h3>
            <p class="text-gray-600">This card has a hover effect. Hover over it to see the animation.</p>
          </UiCard>
        </div>
      </section>

      <!-- Forms Section -->
      <section class="mb-12">
        <h2 class="heading-section mb-4">Form Elements</h2>
        <div class="card space-y-4">
          <UiInput
            v-model="testEmail"
            label="Email Address"
            type="email"
            placeholder="you@example.com"
            hint="We'll never share your email"
          />
          
          <UiInput
            label="Password"
            type="password"
            placeholder="Enter password"
            required
          />
          
          <UiInput
            label="Error State"
            error="This field has an error"
            placeholder="Input with error"
          />
          
          <UiInput
            label="Disabled Input"
            :disabled="true"
            placeholder="Disabled field"
          />
        </div>
      </section>

      <!-- Colors Section -->
      <section class="mb-12">
        <h2 class="heading-section mb-4">Color Palette</h2>
        <div class="card">
          <h3 class="heading-card mb-4">Teal Scale</h3>
          <div class="grid grid-cols-5 gap-2 mb-6">
            <div class="text-center">
              <div class="h-16 bg-teal-900 rounded-lg mb-2"></div>
              <p class="text-xs text-gray-600">Teal 900</p>
            </div>
            <div class="text-center">
              <div class="h-16 bg-teal-800 rounded-lg mb-2"></div>
              <p class="text-xs text-gray-600">Teal 800</p>
            </div>
            <div class="text-center">
              <div class="h-16 bg-teal-600 rounded-lg mb-2"></div>
              <p class="text-xs text-gray-600">Teal 600</p>
            </div>
            <div class="text-center">
              <div class="h-16 bg-teal-500 rounded-lg mb-2"></div>
              <p class="text-xs text-gray-600">Teal 500</p>
            </div>
            <div class="text-center">
              <div class="h-16 bg-teal-400 rounded-lg mb-2"></div>
              <p class="text-xs text-gray-600">Teal 400</p>
            </div>
          </div>

          <h3 class="heading-card mb-4">Coral CTAs</h3>
          <div class="grid grid-cols-2 gap-2 mb-6">
            <div class="text-center">
              <div class="h-16 bg-coral-500 rounded-lg mb-2"></div>
              <p class="text-xs text-gray-600">Coral 500</p>
            </div>
            <div class="text-center">
              <div class="h-16 bg-coral-400 rounded-lg mb-2"></div>
              <p class="text-xs text-gray-600">Coral 400</p>
            </div>
          </div>

          <h3 class="heading-card mb-4">Gradient (Evo Orb)</h3>
          <div class="h-24 rounded-lg mb-2" style="background: var(--ev-gradient-orb);"></div>
        </div>
      </section>

      <!-- Typography Section -->
      <section class="mb-12">
        <h2 class="heading-section mb-4">Typography</h2>
        <div class="card space-y-4">
          <div>
            <h1 class="heading-hero">Hero Heading (H1)</h1>
            <p class="text-sm text-gray-500">Montserrat Bold - Responsive sizing</p>
          </div>
          <div>
            <h2 class="heading-section">Section Heading (H2)</h2>
            <p class="text-sm text-gray-500">Montserrat Bold - Responsive sizing</p>
          </div>
          <div>
            <h3 class="heading-card">Card Heading (H3)</h3>
            <p class="text-sm text-gray-500">Montserrat Semibold - Responsive sizing</p>
          </div>
          <div>
            <p class="text-base text-gray-900">
              Body text uses Roboto with a line-height of 1.6 for optimal readability. 
              This is what regular paragraph text looks like in the Evotally design system.
            </p>
            <p class="text-sm text-gray-500">Roboto Regular - 16px/15px/14px (D/T/M)</p>
          </div>
        </div>
      </section>

      <!-- Spacing Section -->
      <section class="mb-12">
        <h2 class="heading-section mb-4">Spacing Scale</h2>
        <div class="card space-y-4">
          <div class="bg-teal-100 p-section-mobile">
            <p class="text-sm">Section Mobile: 48px</p>
          </div>
          <div class="bg-teal-100 p-section-tablet">
            <p class="text-sm">Section Tablet: 64px</p>
          </div>
          <div class="bg-teal-100 p-section-desktop">
            <p class="text-sm">Section Desktop: 80px</p>
          </div>
        </div>
      </section>

      <!-- Back to Home -->
      <div class="text-center">
        <NuxtLink to="/" class="text-teal-600 hover:text-teal-800 font-medium">
          ← Back to Home
        </NuxtLink>
      </div>
    </div>
  </div>
</template>
