<script setup lang="ts">
const route = useRoute()
const auth = useAuth()
const router = useRouter()

const loading = ref(false)
const error = ref('')
const success = ref(false)

// Get OAuth parameters from URL
const client_id = String(route.query.client_id || '')
const redirect_uri = String(route.query.redirect_uri || '')
const state = String(route.query.state || '')
const response_type = String(route.query.response_type || '')
const scope = String(route.query.scope || '')

// Validate parameters
if (!client_id || !redirect_uri || !state || response_type !== 'code') {
  error.value = 'Invalid authorization request. Missing or invalid parameters.'
}

async function authorize() {
  try {
    loading.value = true
    error.value = ''

    // Ensure user is authenticated
    await auth.ensure()

    // Make request to authorization endpoint
    const response = await $fetch('/api/alexa/authorize', {
      method: 'GET',
      credentials: 'include',
      headers: {
        Authorization: `Bearer ${auth.accessToken}`
      },
      params: {
        client_id,
        redirect_uri,
        state,
        response_type,
        scope
      }
    })

    // If requiresAuth is returned, user needs to login first (shouldn't happen since we call ensure())
    if (response && typeof response === 'object' && 'requiresAuth' in response) {
      error.value = 'Please log in to continue'
      return
    }

    // Authorization successful
    success.value = true
  } catch (e: any) {
    error.value = e?.data?.message || e?.message || 'Failed to authorize Alexa connection'
  } finally {
    loading.value = false
  }
}

async function cancel() {
  // Redirect back to Alexa with error
  const redirectUrl = new URL(redirect_uri)
  redirectUrl.searchParams.set('error', 'access_denied')
  redirectUrl.searchParams.set('state', state)
  window.location.href = redirectUrl.toString()
}

// Auto-authorize if already logged in
onMounted(async () => {
  if (auth.accessToken && !error.value) {
    await authorize()
  }
})
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 flex items-center justify-center p-4">
    <div class="max-w-md w-full">
      <div class="card">
        <div class="text-center mb-6">
          <h1 class="text-3xl font-bold text-gray-900 mb-2">Alexa Account Linking</h1>
          <p class="text-gray-600">Connect your Alexa device to your account</p>
        </div>

        <!-- Error State -->
        <div v-if="error" class="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p class="text-red-800 text-sm">{{ error }}</p>
        </div>

        <!-- Success State -->
        <div v-else-if="success" class="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
          <div class="text-green-600 text-5xl mb-4">✓</div>
          <h2 class="text-xl font-bold text-gray-900 mb-2">Authorization Successful!</h2>
          <p class="text-gray-600 mb-4">You can now close this window and return to your Alexa app.</p>
          <p class="text-sm text-gray-500">Redirecting...</p>
        </div>

        <!-- Authorization Form -->
        <div v-else-if="!auth.accessToken">
          <div class="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
            <h3 class="font-semibold text-gray-900 mb-2">Authorization Request</h3>
            <p class="text-sm text-gray-600 mb-4">
              An Alexa skill is requesting access to your account. Please log in to continue.
            </p>
            <div class="text-xs text-gray-500 space-y-1">
              <p v-if="scope"><strong>Requested permissions:</strong> {{ scope }}</p>
            </div>
          </div>

          <div class="flex gap-3">
            <button
              class="btn-primary flex-1"
              @click="router.push(`/login?redirect=${encodeURIComponent(route.fullPath)}`)"
            >
              Log In
            </button>
            <button
              class="btn-secondary flex-1"
              @click="cancel"
            >
              Cancel
            </button>
          </div>
        </div>

        <!-- Authorizing State -->
        <div v-else class="text-center py-8">
          <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p class="text-gray-600">Authorizing your account...</p>
        </div>

        <!-- Info -->
        <div class="mt-6 pt-6 border-t border-gray-200">
          <p class="text-xs text-gray-500 text-center">
            By authorizing, you allow the Alexa skill to access your account information and interact on your behalf.
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.card {
  @apply bg-white rounded-2xl shadow-xl p-8;
}

.btn-primary {
  @apply px-6 py-3 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed;
}

.btn-secondary {
  @apply px-6 py-3 bg-gray-100 text-gray-700 font-semibold rounded-lg hover:bg-gray-200 transition-colors;
}
</style>
