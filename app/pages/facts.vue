<template>
  <div class="facts-wrap">
    <h1 class="page-title">Your Facts</h1>
    <p class="subtitle">Facts about you learned through conversations</p>

    <p v-if="err" class="err">{{ err }}</p>

    <!-- Facts list -->
    <section class="facts-section">
      <div class="facts-header">
        <h2>All your facts</h2>
        <p v-if="loading" class="muted">Loading facts…</p>
        <p v-else-if="!loading && facts.length === 0" class="muted">
          No facts yet. Your assistant will learn about you through conversations.
        </p>
      </div>

      <ul v-if="!loading && pagedFacts.length > 0" class="facts-list">
        <li v-for="f in pagedFacts" :key="f.id" class="fact-item">
          <div class="fact-header">
            <div class="fact-meta">
              <span class="badge">{{ f.category }}</span>
              <span class="meta-kv">
                <strong>{{ f.factKey }}</strong>
              </span>
              <span v-if="f.verified" class="verified-badge">✓ Verified</span>
              <span class="confidence-badge">{{ f.confidence }}</span>
            </div>
            <button class="btn-danger" @click="del(f.id)" :disabled="deletingId === f.id">
              {{ deletingId === f.id ? 'Deleting…' : 'Delete' }}
            </button>
          </div>
          <p class="fact-text">
            {{ f.factValue }}
          </p>
          <p v-if="f.rawAnswer" class="fact-raw-answer">
            <em>Original: "{{ f.rawAnswer }}"</em>
          </p>
          <div class="fact-footer">
            <span v-if="f.createdAt" class="fact-date">
              Added: {{ new Date(f.createdAt).toLocaleString() }}
            </span>
            <span v-if="f.source" class="fact-source">
              Source: {{ f.source }}
            </span>
          </div>
        </li>
      </ul>

      <!-- Pagination controls -->
      <div v-if="!loading && totalPages > 1" class="pagination">
        <button
          class="btn-secondary"
          :disabled="page === 1"
          @click="goToPage(page - 1)"
        >
          Previous
        </button>

        <span class="page-info">
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
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { useAuth } from '~/stores/auth'

type UserFact = {
  id: string
  userId: string
  category: string
  factKey: string
  factValue: string
  rawAnswer?: string | null
  source: string
  verified: boolean
  confidence: string
  lastUpdated: string
  createdAt: string
  metadata?: any
}

const auth = useAuth()

// Data
const facts = ref<UserFact[]>([])

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
      page.value = totalPages.value
    }
  }
)

async function load() {
  await auth.ensure()
  loading.value = true
  err.value = ''
  try {
    facts.value = await $fetch<UserFact[]>('/api/user-facts', {
      credentials: 'include'
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
    await $fetch(`/api/user-facts/${id}`, {
      method: 'DELETE',
      credentials: 'include'
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

<style scoped>
.facts-wrap {
  max-width: 760px;
  margin: 0 auto;
  padding: 1.5rem 1rem;
}

.page-title {
  font-size: 1.5rem;
  font-weight: 600;
  margin-bottom: 0.25rem;
}

.subtitle {
  font-size: 0.9rem;
  color: #6b7280;
  margin-bottom: 1.5rem;
}

.err {
  color: #b91c1c;
  font-size: .85rem;
  margin-top: 0.5rem;
}

/* Facts list */
.facts-section {
  margin-top: 1rem;
}

.facts-header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: .5rem;
  margin-bottom: .5rem;
}

.facts-header h2 {
  font-size: 1.1rem;
  font-weight: 600;
}

.muted {
  font-size: .85rem;
  color: #6b7280;
}

.facts-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.fact-item {
  border: 1px solid #e5e7eb;
  border-radius: .75rem;
  padding: .65rem .8rem;
  margin-bottom: .5rem;
  background-color: white;
}

.fact-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: .75rem;
}

.fact-meta {
  display: flex;
  align-items: center;
  gap: .5rem;
  flex-wrap: wrap;
}

.badge {
  font-size: .75rem;
  text-transform: uppercase;
  padding: 0.1rem .4rem;
  border-radius: 999px;
  background: #e5f3f4;
  color: #075860;
  letter-spacing: .03em;
}

.meta-kv {
  font-size: .85rem;
  color: #4b5563;
}

.verified-badge {
  font-size: .7rem;
  padding: 0.1rem .4rem;
  border-radius: 999px;
  background: #d1fae5;
  color: #065f46;
  letter-spacing: .03em;
}

.confidence-badge {
  font-size: .7rem;
  padding: 0.1rem .4rem;
  border-radius: 999px;
  background: #dbeafe;
  color: #1e40af;
  text-transform: capitalize;
}

.fact-text {
  margin-top: .35rem;
  font-size: .95rem;
  color: #111827;
  font-weight: 500;
}

.fact-raw-answer {
  margin-top: .25rem;
  font-size: .8rem;
  color: #6b7280;
  font-style: italic;
}

.fact-footer {
  margin-top: .35rem;
  display: flex;
  gap: .75rem;
  flex-wrap: wrap;
}

.fact-date,
.fact-source {
  font-size: .75rem;
  color: #6b7280;
}

/* Buttons */
.btn-danger {
  border-radius: 999px;
  padding: .2rem .7rem;
  font-size: .8rem;
  border: 1px solid #fee2e2;
  background: #fee2e2;
  color: #b91c1c;
  cursor: pointer;
}
.btn-danger:disabled {
  opacity: .6;
  cursor: default;
}
.btn-danger:not(:disabled):hover {
  background: #fecaca;
}

.btn-secondary {
  border-radius: .5rem;
  padding: .3rem .7rem;
  font-size: .85rem;
  border: 1px solid #d1d5db;
  background: white;
  color: #374151;
  cursor: pointer;
}
.btn-secondary:disabled {
  opacity: .5;
  cursor: default;
}
.btn-secondary:not(:disabled):hover {
  background: #f3f4f6;
}

/* Pagination */
.pagination {
  margin-top: .75rem;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: .75rem;
}

.page-info {
  font-size: .85rem;
  color: #4b5563;
}
</style>
