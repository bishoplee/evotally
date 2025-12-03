<template>
  <div class="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50">
    <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
      <!-- Header -->
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-gray-900">Your Facts</h1>
        <p class="text-gray-600 mt-1">Facts about you learned through conversations</p>
      </div>

      <!-- Error Display -->
      <div v-if="err" class="mb-6">
        <div class="rounded-lg bg-red-50 border border-red-200 p-4 text-sm text-red-700">
          {{ err }}
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="text-center py-12 text-gray-500">Loading facts…</div>

      <!-- Empty State -->
      <div v-else-if="!loading && facts.length === 0" class="card text-center py-12">
        <div class="text-5xl mb-4">📝</div>
        <h3 class="text-lg font-semibold text-gray-900 mb-2">No facts yet</h3>
        <p class="text-gray-600">
          Your assistant will learn about you through conversations and store important facts here.
        </p>
      </div>

      <!-- Facts List -->
      <div v-else class="space-y-4">
        <div
          v-for="f in pagedFacts"
          :key="f.id"
          class="card hover:shadow-md transition-shadow"
        >
          <div class="flex items-start justify-between gap-4 mb-3">
            <div class="flex-1">
              <div class="flex items-center gap-2 mb-2 flex-wrap">
                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
                  {{ f.type }}
                </span>
                <span
                  v-if="f.status !== 'active'"
                  class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                  :class="{
                    'bg-gray-100 text-gray-800': f.status === 'past',
                    'bg-yellow-100 text-yellow-800': f.status === 'outdated',
                    'bg-red-100 text-red-800': f.status === 'deleted'
                  }"
                >
                  {{ f.status }}
                </span>
                <span
                  v-if="f.importance && f.importance >= 7"
                  class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-secondary-100 text-secondary-800"
                >
                  ⭐ Important ({{ f.importance }}/10)
                </span>
              </div>

              <div v-if="f.key && f.value" class="mb-2">
                <span class="font-semibold text-gray-900">{{ f.key }}:</span>
                <span class="text-gray-700 ml-2">{{ f.value }}</span>
              </div>

              <p class="text-gray-800">{{ f.text }}</p>
            </div>

            <button
              class="btn-outline text-sm text-red-600 border-red-300 hover:bg-red-50"
              @click="del(f.id)"
              :disabled="deletingId === f.id"
            >
              {{ deletingId === f.id ? 'Deleting…' : 'Delete' }}
            </button>
          </div>

          <div class="flex items-center gap-4 text-xs text-gray-500 pt-3 border-t border-gray-100">
            <span v-if="f.created_at">
              Added: {{ new Date(f.created_at).toLocaleDateString() }}
            </span>
            <span v-if="f.source">
              Source: {{ f.source }}
            </span>
            <span v-if="f.validFrom && f.status !== 'active'">
              Valid: {{ new Date(f.validFrom).toLocaleDateString() }}
              <template v-if="f.validUntil">
                - {{ new Date(f.validUntil).toLocaleDateString() }}
              </template>
            </span>
          </div>
        </div>

        <!-- Pagination -->
        <div v-if="totalPages > 1" class="flex items-center justify-center gap-4 mt-8">
          <button
            class="btn-secondary"
            :disabled="page === 1"
            @click="goToPage(page - 1)"
          >
            Previous
          </button>

          <span class="text-sm text-gray-600">
            Page {{ page }} of {{ totalPages }}
          </span>

          <button
            class="btn-secondary"
            :disabled="page === totalPages"
            @click="goToPage(page + 1)"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useAuth } from '~/stores/auth'

type Fact = {
  id: string
  userId: string
  owner: string // "user" or "assistant"
  type: string // preference, personal, goal, concern, routine
  text: string
  key?: string | null
  value?: string | null
  qdrant_point_id?: string | null
  importance: number // 1-10
  source_turn_id?: string | null
  last_accessed_at?: string | null
  created_at: string
  updated_at: string

  // Temporal tracking
  status: string // "active", "past", "outdated", "deleted"
  validFrom: string
  validUntil?: string | null

  // Metadata
  source: string // "conversation", "consolidation", "pattern", "explicit"
  metadata?: any
  tags?: string[] | null
  embedding?: any
}

const auth = useAuth()

// Data
const facts = ref<Fact[]>([])
const err = ref('')
const loading = ref(false)
const deletingId = ref<string | null>(null)

// Pagination
const page = ref(1)
const pageSize = ref(10)

const totalPages = computed(() => {
  if (facts.value.length === 0) return 1
  return Math.ceil(facts.value.length / pageSize.value)
})

const pagedFacts = computed(() => {
  const start = (page.value - 1) * pageSize.value
  const end = start + pageSize.value
  return facts.value.slice(start, end)
})

function goToPage(p: number) {
  if (p < 1) p = 1
  if (p > totalPages.value) p = totalPages.value
  page.value = p
}

// Clamp page when facts list changes
watch(
  () => facts.value.length,
  () => {
    if (page.value > totalPages.value) {
      page.value = totalPages.value || 1
    }
  }
)

async function load() {
  await auth.ensure()
  loading.value = true
  err.value = ''
  try {
    facts.value = await $fetch<Fact[]>('/api/facts?owner=user', {
      credentials: 'include',
      headers: {
        Authorization: `Bearer ${auth.accessToken}`
      }
    })
    // Reset to page 1 whenever we reload
    page.value = 1
  } catch (e: any) {
    err.value = e?.data?.message || 'Failed to load facts'
  } finally {
    loading.value = false
  }
}

async function del(id: string) {
  err.value = ''
  deletingId.value = id
  try {
    await auth.ensure()
    await $fetch(`/api/facts/${id}`, {
      method: 'DELETE',
      credentials: 'include',
      headers: {
        Authorization: `Bearer ${auth.accessToken}`
      }
    })
    await load()
  } catch (e: any) {
    err.value = e?.data?.message || 'Failed to delete fact'
  } finally {
    deletingId.value = null
  }
}

onMounted(load)
</script>
