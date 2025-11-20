<template>
  <div class="facts-wrap">
    <h1 class="page-title">Your Facts</h1>

    <!-- Add fact form -->
    <form class="fact-form" @submit.prevent="add">
      <div class="form-row">
        <label class="label">Type</label>
        <select v-model="type" class="input">
          <option value="trait">trait</option>
          <option value="preference">preference</option>
          <option value="bio">bio</option>
          <option value="goal">goal</option>
          <option value="note">note</option>
        </select>
      </div>

      <div class="form-row">
        <label class="label">Key (optional)</label>
        <input v-model="key" class="input" placeholder="e.g. favorite_food" />
      </div>

      <div class="form-row">
        <label class="label">Value (optional)</label>
        <input v-model="value" class="input" placeholder="e.g. jollof rice" />
      </div>

      <div class="form-row full">
        <label class="label">Full text</label>
        <textarea
          v-model="text"
          class="textarea"
          placeholder="Full text (required)"
          required
        />
      </div>

      <div class="form-actions">
        <button class="btn-primary" :disabled="busy">
          {{ busy ? 'Adding…' : 'Add fact' }}
        </button>
        <p v-if="err" class="err">{{ err }}</p>
      </div>
    </form>

    <!-- Facts list -->
    <section class="facts-section">
      <div class="facts-header">
        <h2>All your facts</h2>
        <p v-if="loading" class="muted">Loading facts…</p>
        <p v-else-if="!loading && facts.length === 0" class="muted">
          You don’t have any facts yet. Add one above to get started.
        </p>
      </div>

      <ul v-if="!loading && pagedFacts.length > 0" class="facts-list">
        <li v-for="f in pagedFacts" :key="f.id" class="fact-item">
          <div class="fact-header">
            <div class="fact-meta">
              <span class="badge">{{ f.type }}</span>
              <span v-if="f.key" class="meta-kv">
                {{ f.key }}<span v-if="f.value">: {{ f.value }}</span>
              </span>
            </div>
            <button class="btn-danger" @click="del(f.id)" :disabled="deletingId === f.id">
              {{ deletingId === f.id ? 'Deleting…' : 'Delete' }}
            </button>
          </div>
          <p class="fact-text">
            {{ f.text }}
          </p>
          <p v-if="f.created_at" class="fact-date">
            Added: {{ new Date(f.created_at).toLocaleString() }}
          </p>
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

type Fact = {
  id: string
  type: string
  key?: string | null
  value?: string | null
  text: string
  created_at?: string
}

const auth = useAuth()

// Data
const facts = ref<Fact[]>([])

const type = ref('trait')
const key = ref('')
const value = ref('')
const text = ref('')

const busy = ref(false)
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
    facts.value = await $fetch<Fact[]>('/api/facts', {
      headers: auth.bearer
    })
    // Reset to page 1 whenever we reload
    page.value = 1
  } catch (e: any) {
    err.value = e?.data?.message || 'Failed to load facts'
  } finally {
    loading.value = false
  }
}

async function add() {
  busy.value = true
  err.value = ''
  try {
    await auth.ensure()
    await $fetch('/api/facts', {
      method: 'POST',
      headers: {
        ...auth.bearer,
        'Content-Type': 'application/json'
      },
      body: {
        type: type.value,
        key: key.value || undefined,
        value: value.value || undefined,
        text: text.value
      }
    })
    // Reset form (keep type)
    key.value = ''
    value.value = ''
    text.value = ''
    await load()
  } catch (e: any) {
    err.value = e?.data?.message || 'Failed to add fact'
  } finally {
    busy.value = false
  }
}

async function del(id: string) {
  err.value = ''
  deletingId.value = id
  try {
    await auth.ensure()
    await $fetch(`/api/facts/${id}`, {
      method: 'DELETE',
      headers: auth.bearer
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
  margin-bottom: 1rem;
}

/* Form */
.fact-form {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: .75rem;
  padding: 1rem;
  border-radius: .75rem;
  border: 1px solid #e5e7eb;
  margin-bottom: 1.5rem;
  background: #fafafa;
}

.form-row {
  display: flex;
  flex-direction: column;
}

.form-row.full {
  grid-column: 1 / -1;
}

.label {
  font-size: .8rem;
  color: #4b5563;
  margin-bottom: .2rem;
}

.input,
.textarea,
select.input {
  border: 1px solid #d1d5db;
  border-radius: .5rem;
  padding: .4rem .55rem;
  font-size: .9rem;
  outline: none;
}

.input:focus,
.textarea:focus,
select.input:focus {
  border-color: #016d77;
  box-shadow: 0 0 0 1px rgba(1, 109, 119, 0.15);
}

.textarea {
  min-height: 80px;
  resize: vertical;
}

.form-actions {
  grid-column: 1 / -1;
  display: flex;
  align-items: center;
  gap: .75rem;
}

.btn-primary {
  background-color: #016d77;
  color: white;
  border-radius: .5rem;
  padding: .4rem .9rem;
  border: none;
  font-size: .9rem;
  cursor: pointer;
}
.btn-primary:disabled {
  opacity: .6;
  cursor: default;
}
.btn-primary:not(:disabled):hover {
  background-color: #075860;
}

.err {
  color: #b91c1c;
  font-size: .85rem;
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

.fact-text {
  margin-top: .35rem;
  font-size: .9rem;
  color: #111827;
}

.fact-date {
  margin-top: .15rem;
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

@media (max-width: 640px) {
  .fact-form {
    grid-template-columns: 1fr;
  }
}
</style>
