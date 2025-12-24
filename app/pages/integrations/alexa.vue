<script setup lang="ts">
const auth = useAuth()
const router = useRouter()

const loading = ref(false)
const status = ref<{
  isLinked: boolean
  linkedAt: string | null
  expiresAt: string | null
  activeConnections: number
  tokens: Array<{
    id: string
    linkedAt: string
    expiresAt: string
    clientId: string
  }>
} | null>(null)

const message = ref('')
const showInstructions = ref(false)

// Load Alexa linking status
async function loadStatus() {
  try {
    loading.value = true
    const response = await $fetch('/api/alexa/status', {
      credentials: 'include',
      headers: {
        Authorization: `Bearer ${auth.accessToken}`
      }
    })
    status.value = response
  } catch (e: any) {
    message.value = e?.data?.message || e?.message || 'Failed to load Alexa status'
  } finally {
    loading.value = false
  }
}

// Revoke Alexa access
async function revokeAccess() {
  if (!confirm('Are you sure you want to unlink your Alexa account? You will need to re-enable the skill to reconnect.')) {
    return
  }

  try {
    loading.value = true
    const response = await $fetch('/api/alexa/revoke', {
      method: 'POST',
      credentials: 'include',
      headers: {
        Authorization: `Bearer ${auth.accessToken}`
      }
    })
    message.value = response.message || 'Alexa access revoked successfully'
    await loadStatus()
  } catch (e: any) {
    message.value = e?.data?.message || e?.message || 'Failed to revoke access'
  } finally {
    loading.value = false
  }
}

// Copy skill ID to clipboard
async function copySkillId() {
  const skillId = 'amzn1.ask.skill.YOUR-SKILL-ID' // TODO: Replace with actual skill ID
  await navigator.clipboard.writeText(skillId)
  message.value = 'Skill ID copied to clipboard!'
  setTimeout(() => { message.value = '' }, 2000)
}

// Format date
function formatDate(dateStr: string | null) {
  if (!dateStr) return 'Never'
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// Calculate days until expiration
function daysUntilExpiration(expiresAt: string | null) {
  if (!expiresAt) return null
  const days = Math.floor((new Date(expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
  return days
}

onMounted(async () => {
  await auth.ensure()
  await loadStatus()
})
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50">
    <div class="max-w-4xl mx-auto p-6">
      <!-- Header -->
      <div class="mb-8">
        <button
          @click="router.push('/profile')"
          class="text-primary-600 hover:text-primary-700 mb-4 flex items-center gap-2"
        >
          ← Back to Profile
        </button>
        <h1 class="text-4xl font-bold text-gray-900 mb-2">Alexa Integration</h1>
        <p class="text-gray-600">Connect your Amazon Alexa devices to your account</p>
      </div>

      <!-- Message Alert -->
      <div v-if="message" class="mb-6 p-4 rounded-lg" :class="{
        'bg-green-50 border border-green-200 text-green-800': message.includes('success'),
        'bg-red-50 border border-red-200 text-red-800': message.includes('Failed') || message.includes('Error'),
        'bg-blue-50 border border-blue-200 text-blue-800': !message.includes('success') && !message.includes('Failed')
      }">
        {{ message }}
      </div>

      <!-- Loading State -->
      <div v-if="loading && !status" class="card">
        <div class="text-center py-12">
          <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p class="text-gray-600">Loading Alexa integration status...</p>
        </div>
      </div>

      <!-- Status Card -->
      <div v-else-if="status" class="space-y-6">
        <!-- Connection Status -->
        <div class="card">
          <div class="flex items-start justify-between mb-6">
            <div>
              <h2 class="text-2xl font-bold text-gray-900 mb-2">Connection Status</h2>
              <p class="text-gray-600">Manage your Alexa account linking</p>
            </div>
            <div class="flex items-center gap-3">
              <div class="px-4 py-2 rounded-full font-medium" :class="{
                'bg-green-100 text-green-700': status.isLinked,
                'bg-gray-100 text-gray-600': !status.isLinked
              }">
                <span class="mr-2">{{ status.isLinked ? '✓' : '○' }}</span>
                {{ status.isLinked ? 'Connected' : 'Not Connected' }}
              </div>
            </div>
          </div>

          <!-- Connected State -->
          <div v-if="status.isLinked" class="space-y-4">
            <div class="grid md:grid-cols-2 gap-4">
              <div class="p-4 bg-gray-50 rounded-lg">
                <p class="text-sm text-gray-600 mb-1">Linked Since</p>
                <p class="text-lg font-semibold text-gray-900">{{ formatDate(status.linkedAt) }}</p>
              </div>
              <div class="p-4 bg-gray-50 rounded-lg">
                <p class="text-sm text-gray-600 mb-1">Expires In</p>
                <p class="text-lg font-semibold text-gray-900">
                  {{ daysUntilExpiration(status.expiresAt) }} days
                </p>
              </div>
            </div>

            <div class="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p class="text-sm text-blue-800">
                <strong>{{ status.activeConnections }}</strong> active connection{{ status.activeConnections !== 1 ? 's' : '' }}
              </p>
            </div>

            <!-- Active Connections -->
            <div v-if="status.tokens.length > 0" class="space-y-2">
              <h3 class="font-semibold text-gray-900">Active Devices</h3>
              <div
                v-for="token in status.tokens"
                :key="token.id"
                class="p-3 bg-gray-50 rounded-lg flex items-center justify-between"
              >
                <div>
                  <p class="text-sm font-medium text-gray-900">Alexa Device</p>
                  <p class="text-xs text-gray-500">
                    Linked {{ formatDate(token.linkedAt) }}
                  </p>
                </div>
                <div class="text-right">
                  <p class="text-xs text-gray-500">
                    Expires {{ formatDate(token.expiresAt) }}
                  </p>
                </div>
              </div>
            </div>

            <!-- Unlink Button -->
            <div class="pt-4 border-t border-gray-200">
              <button
                @click="revokeAccess"
                :disabled="loading"
                class="px-6 py-3 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {{ loading ? 'Unlinking...' : 'Unlink Alexa Account' }}
              </button>
              <p class="text-xs text-gray-500 mt-2">
                This will disconnect all your Alexa devices. You'll need to re-enable the skill to reconnect.
              </p>
            </div>
          </div>

          <!-- Not Connected State -->
          <div v-else class="space-y-4">
            <div class="p-6 bg-gray-50 rounded-lg text-center">
              <div class="text-6xl mb-4">🔗</div>
              <h3 class="text-xl font-bold text-gray-900 mb-2">Link Your Alexa Account</h3>
              <p class="text-gray-600 mb-4">
                Connect your Amazon Alexa to access your account through voice commands
              </p>
              <button
                @click="showInstructions = !showInstructions"
                class="btn-primary"
              >
                {{ showInstructions ? 'Hide Instructions' : 'Show Setup Instructions' }}
              </button>
            </div>
          </div>
        </div>

        <!-- Setup Instructions -->
        <div v-if="showInstructions || !status.isLinked" class="card">
          <h2 class="text-2xl font-bold text-gray-900 mb-6">How to Link Your Alexa</h2>

          <div class="space-y-6">
            <!-- Step 1 -->
            <div class="flex gap-4">
              <div class="flex-shrink-0 w-10 h-10 bg-primary-600 text-white rounded-full flex items-center justify-center font-bold">
                1
              </div>
              <div class="flex-1">
                <h3 class="font-semibold text-gray-900 mb-2">Open the Alexa App</h3>
                <p class="text-gray-600 mb-3">
                  Open the Amazon Alexa app on your mobile device or visit
                  <a href="https://alexa.amazon.com" target="_blank" class="text-primary-600 hover:underline">
                    alexa.amazon.com
                  </a>
                </p>
              </div>
            </div>

            <!-- Step 2 -->
            <div class="flex gap-4">
              <div class="flex-shrink-0 w-10 h-10 bg-primary-600 text-white rounded-full flex items-center justify-center font-bold">
                2
              </div>
              <div class="flex-1">
                <h3 class="font-semibold text-gray-900 mb-2">Find the Skill</h3>
                <p class="text-gray-600 mb-3">
                  Go to <strong>Skills & Games</strong> and search for your skill name
                </p>
                <div class="flex gap-2">
                  <button
                    @click="copySkillId"
                    class="text-sm px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Copy Skill ID
                  </button>
                </div>
              </div>
            </div>

            <!-- Step 3 -->
            <div class="flex gap-4">
              <div class="flex-shrink-0 w-10 h-10 bg-primary-600 text-white rounded-full flex items-center justify-center font-bold">
                3
              </div>
              <div class="flex-1">
                <h3 class="font-semibold text-gray-900 mb-2">Enable the Skill</h3>
                <p class="text-gray-600 mb-3">
                  Tap <strong>"Enable to Use"</strong> and then <strong>"Link Account"</strong>
                </p>
              </div>
            </div>

            <!-- Step 4 -->
            <div class="flex gap-4">
              <div class="flex-shrink-0 w-10 h-10 bg-primary-600 text-white rounded-full flex items-center justify-center font-bold">
                4
              </div>
              <div class="flex-1">
                <h3 class="font-semibold text-gray-900 mb-2">Sign In</h3>
                <p class="text-gray-600 mb-3">
                  You'll be redirected to sign in with your account. Use the same email and password you use here.
                </p>
              </div>
            </div>

            <!-- Step 5 -->
            <div class="flex gap-4">
              <div class="flex-shrink-0 w-10 h-10 bg-primary-600 text-white rounded-full flex items-center justify-center font-bold">
                5
              </div>
              <div class="flex-1">
                <h3 class="font-semibold text-gray-900 mb-2">Start Using</h3>
                <p class="text-gray-600 mb-3">
                  Once linked, you can use voice commands with Alexa to interact with your account!
                </p>
                <button
                  @click="loadStatus"
                  class="text-sm px-4 py-2 bg-primary-100 text-primary-700 rounded-lg hover:bg-primary-200 transition-colors"
                >
                  Refresh Status
                </button>
              </div>
            </div>
          </div>

          <!-- Help -->
          <div class="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p class="text-sm text-yellow-800">
              <strong>Need help?</strong> If you're having trouble linking your account, make sure you're using the same email address for both your account here and in the Alexa app.
            </p>
          </div>
        </div>

        <!-- Features Card -->
        <div class="card">
          <h2 class="text-2xl font-bold text-gray-900 mb-4">What You Can Do with Alexa</h2>
          <div class="grid md:grid-cols-2 gap-4">
            <div class="flex gap-3">
              <div class="text-2xl">🗣️</div>
              <div>
                <h3 class="font-semibold text-gray-900 mb-1">Voice Commands</h3>
                <p class="text-sm text-gray-600">Control your account using natural voice commands</p>
              </div>
            </div>
            <div class="flex gap-3">
              <div class="text-2xl">🔔</div>
              <div>
                <h3 class="font-semibold text-gray-900 mb-1">Notifications</h3>
                <p class="text-sm text-gray-600">Receive important updates through Alexa</p>
              </div>
            </div>
            <div class="flex gap-3">
              <div class="text-2xl">⚡</div>
              <div>
                <h3 class="font-semibold text-gray-900 mb-1">Quick Actions</h3>
                <p class="text-sm text-gray-600">Perform common tasks hands-free</p>
              </div>
            </div>
            <div class="flex gap-3">
              <div class="text-2xl">🔒</div>
              <div>
                <h3 class="font-semibold text-gray-900 mb-1">Secure Access</h3>
                <p class="text-sm text-gray-600">Your data is protected with industry-standard security</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.card {
  @apply bg-white rounded-2xl shadow-lg p-8;
}

.btn-primary {
  @apply px-6 py-3 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed;
}
</style>
