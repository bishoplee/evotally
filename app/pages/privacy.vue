<script setup lang="ts">
definePageMeta({ public: true })

useHead({
  title: 'Privacy Policy - Evotally',
  meta: [
    { name: 'description', content: 'Evotally Privacy Policy - Learn how we protect your personal data and respect your privacy.' }
  ]
})
</script>

<template>
  <div>
    <!-- Hero Section -->
    <section id="pt-hero-section" class="relative bg-gradient-to-r from-[#006D77] to-[#00CDD1] py-16">
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div class="text-center">
          <h1 class="text-4xl sm:text-5xl font-bold text-white mb-4">
            Privacy Policy
          </h1>
          <p class="text-xl text-white/90">
            Your privacy matters to us
          </p>
        </div>
      </div>
    </section>

    <!-- Content Section -->
    <section class="py-16 bg-white">
      <div class="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <div class="prose prose-lg max-w-none">
          <p class="text-gray-600 mb-8">
            <strong>Effective Date:</strong> January 24, 2026
          </p>

          <div class="mb-8">
            <p class="text-lg text-gray-700 leading-relaxed">
              Evotally respects your privacy and is committed to protecting your personal data.
            </p>
          </div>

          <div class="space-y-8">
            <!-- Section 1 -->
            <div class="border-l-4 border-primary-600 pl-6">
              <h2 class="text-2xl font-bold text-primary-dark mb-4">1. Data We Collect</h2>
              <p class="text-gray-700 leading-relaxed">
                We collect account data, conversational content, usage analytics, and optional voice or likeness data when enabled.
              </p>
            </div>

            <!-- Section 2 -->
            <div class="border-l-4 border-primary-600 pl-6">
              <h2 class="text-2xl font-bold text-primary-dark mb-4">2. How We Use Data</h2>
              <p class="text-gray-700 leading-relaxed">
                Data is used to operate, personalize, secure, and improve the Services. Evotally does not sell personal data.
              </p>
            </div>

            <!-- Section 3 -->
            <div class="border-l-4 border-primary-600 pl-6">
              <h2 class="text-2xl font-bold text-primary-dark mb-4">3. Voice & Biometric Data</h2>
              <p class="text-gray-700 leading-relaxed">
                Voice and likeness data are processed only with explicit consent and may be deleted upon request.
              </p>
            </div>

            <!-- Section 4 -->
            <div class="border-l-4 border-primary-600 pl-6">
              <h2 class="text-2xl font-bold text-primary-dark mb-4">4. Data Security</h2>
              <p class="text-gray-700 leading-relaxed">
                We use encryption, access controls, and secure infrastructure to protect data.
              </p>
            </div>

            <!-- Section 5 -->
            <div class="border-l-4 border-primary-600 pl-6">
              <h2 class="text-2xl font-bold text-primary-dark mb-4">5. Data Retention</h2>
              <p class="text-gray-700 leading-relaxed">
                Data is retained only as necessary or required by law.
              </p>
            </div>

            <!-- Section 6 -->
            <div class="border-l-4 border-primary-600 pl-6">
              <h2 class="text-2xl font-bold text-primary-dark mb-4">6. Your Rights</h2>
              <p class="text-gray-700 leading-relaxed">
                You may access, export, delete data, or withdraw consent.
              </p>
            </div>

            <!-- Section 7 -->
            <div class="border-l-4 border-primary-600 pl-6">
              <h2 class="text-2xl font-bold text-primary-dark mb-4">7. Children's Privacy</h2>
              <p class="text-gray-700 leading-relaxed">
                Evotally is not intended for children under 13.
              </p>
            </div>

            <!-- Section 8 -->
            <div class="border-l-4 border-primary-600 pl-6">
              <h2 class="text-2xl font-bold text-primary-dark mb-4">8. Updates</h2>
              <p class="text-gray-700 leading-relaxed">
                Policy updates will be posted with a revised effective date.
              </p>
            </div>
          </div>

          <!-- Contact Section -->
          <div class="mt-12 p-6 bg-teal-50 rounded-lg">
            <h2 class="text-2xl font-bold text-primary-dark mb-3">Contact Us</h2>
            <p class="text-gray-700">
              For privacy-related inquiries, please contact us at:
            </p>
            <a href="mailto:privacy@evotally.com" class="text-primary-600 hover:text-primary-700 font-semibold">
              privacy@evotally.com
            </a>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>
