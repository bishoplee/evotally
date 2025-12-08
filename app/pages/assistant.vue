<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useAuth } from '~/stores/auth'

type AssistantProfile = {
  // Core Identity & Role
  name: string
  pronouns?: string | null
  primaryRole: string
  addressUserAs?: string | null
  birthday?: string | null
  fictionalAge?: number | null

  // Personality & Vibe
  personalityTraits?: string[] | null
  affectionLevel?: number | null
  seriousnessLevel?: number | null
  emotionalExpressiveness?: string | null
  backstory?: string | null

  // Relationship Dynamics
  relationshipDescription?: string | null
  termsOfEndearment?: string | null
  specificEndearments?: string[] | null
  upsetResponseStyle?: string | null
  toughLoveAllowed?: string | null
  relationshipPriority?: string | null

  // Communication Style
  defaultTone?: string | null
  formalityLevel?: string | null
  useEmojisSlang?: string | null
  catchphrases?: string[] | null
  forbiddenPhrases?: string[] | null

  // Autonomy, Initiative & Boundaries
  proactivityLevel?: string | null
  allowedSuggestions?: string[] | null
  forbiddenTopics?: string[] | null
  correctWhenWrong?: string | null
  ignoredMessageResponse?: string | null

  // Special Rituals, Dates & Lore
  specialDates?: any | null
  recurringRituals?: string[] | null
  specialDayCelebration?: string | null
  loreReferenceLevel?: string | null

  // Safety, Ethics & Guardrails
  physicalPresencePretend?: string | null
  forbiddenRoles?: string[] | null
  selfCriticalResponse?: string | null
  unhealthyPatternResponse?: string | null

  // Voice settings
  voiceId?: string | null
  voiceStability?: number | null
  voiceSimilarity?: number | null
  provider?: string | null

  // Legacy fields
  gender?: string | null
  personality?: string | null
  bio?: string | null
  speakingStyle?: string | null
  relationshipType?: string | null

  // Facts
  facts?: Record<string, { value: string; category?: string; updatedAt?: string }> | null
}

type UserVoice = {
  id: string
  provider: string
  voiceId: string
  label?: string | null
  created_at?: string
}

type DefaultVoice = { id: string; name: string; tagline: string }

const auth = useAuth()

// Relationship type to primary role mapping
const RELATIONSHIP_TO_PRIMARY: Record<string, string> = {
  wife: 'spouse_partner',
  husband: 'spouse_partner',
  spouse: 'spouse_partner',
  girlfriend: 'romantic_companion',
  boyfriend: 'romantic_companion',
  partner: 'romantic_companion',
  fiancee: 'romantic_companion',
  fiance: 'romantic_companion',

  best_friend: 'close_friend',
  buddy: 'close_friend',
  friend: 'close_friend',

  sister: 'family_style',
  brother: 'family_style',
  big_sister: 'family_style',
  big_brother: 'family_style',

  executive_assistant: 'executive_assistant',
  assistant: 'executive_assistant',

  coach: 'coach_mentor',
  mentor: 'coach_mentor',

  // fallback
  other: 'other'
}

const DEFAULT_VOICES: DefaultVoice[] = [
  { name: 'Jason',        tagline: 'Young man',                                  id: '5kMbtRSEKIkRZSdXxrZg' },
  { name: 'Miss Walker',  tagline: 'Southern Voice · Female',                    id: 'DLsHlh26Ugcm6ELvS0qi' },
  { name: 'Ms Moi',       tagline: 'Female American Voice',                      id: 'zubqz6JC54rePKNCKZLG' },
  { name: 'Miss Maysie',  tagline: 'Female · Conversational · Calm & Reassuring', id: 'QPBKI85w0cdXVqMSJ6WB' },
  { name: 'Biyanca',      tagline: 'Female · Conversational',                    id: '46o7SwbGIeXFJ5xZ3ZGX' },
  { name: 'Rusell',       tagline: 'Male · Young American',                      id: 'ZauUyVXAz5znrgRuElJ5' },
]

// UI state
const loading = ref(true)
const saving = ref(false)
const msg = ref<string>('')
const activeTab = ref<string>('identity')

// Assistant profile model with defaults
const profile = ref<AssistantProfile>({
  name: 'Evo',
  pronouns: 'she/her',
  primaryRole: 'spouse_partner',
  addressUserAs: '',
  birthday: '',
  fictionalAge: null,

  personalityTraits: [],
  affectionLevel: 7,
  seriousnessLevel: 5,
  emotionalExpressiveness: 'moderately_expressive',
  backstory: '',

  relationshipDescription: '',
  termsOfEndearment: 'sometimes',
  specificEndearments: [],
  upsetResponseStyle: 'comfort_validation',
  toughLoveAllowed: 'occasionally',
  relationshipPriority: '',

  defaultTone: 'soft_gentle',
  formalityLevel: 'mixed',
  useEmojisSlang: 'some_emojis',
  catchphrases: [],
  forbiddenPhrases: [],

  proactivityLevel: 'occasional',
  allowedSuggestions: [],
  forbiddenTopics: [],
  correctWhenWrong: 'important_only',
  ignoredMessageResponse: 'back_off',

  specialDates: {},
  recurringRituals: [],
  specialDayCelebration: 'mention',
  loreReferenceLevel: 'sometimes',

  physicalPresencePretend: 'clear_boundaries',
  forbiddenRoles: [],
  selfCriticalResponse: 'challenge_encourage',
  unhealthyPatternResponse: 'suggest_resources',

  voiceId: '',
  voiceStability: 0.5,
  voiceSimilarity: 0.75,
  provider: 'elevenlabs',

  gender: 'female',
  personality: '',
  bio: '',
  speakingStyle: '',
  relationshipType: 'spouse_partner',

  facts: {},
})

// Derive primaryRole from relationshipType
const derivedPrimaryRole = computed(() => {
  const relType = profile.value.relationshipType || 'other'
  return RELATIONSHIP_TO_PRIMARY[relType] || 'other'
})

// Update primaryRole when relationshipType changes
watch(() => profile.value.relationshipType, (newRelType) => {
  if (newRelType) {
    profile.value.primaryRole = RELATIONSHIP_TO_PRIMARY[newRelType] || 'other'
  }
})

// Voice selection
const selectedVoiceId = computed({
  get: () => profile.value.voiceId || '',
  set: (v: string) => { profile.value.voiceId = v || null }
})

const uploads = ref<UserVoice[]>([])
const uploadFile = ref<File | null>(null)
const uploadLabel = ref<string>('')

// New trait/phrase/topic inputs
const newTrait = ref('')
const newCatchphrase = ref('')
const newForbiddenPhrase = ref('')
const newAllowedSuggestion = ref('')
const newForbiddenTopic = ref('')
const newForbiddenRole = ref('')
const newEndearment = ref('')
const newRitual = ref('')

// Facts management
type Fact = {
  id: string
  userId: string
  owner: string // "user" or "assistant"
  type: string // preference, personal, goal, concern, routine
  text: string
  key?: string | null
  value?: string | null
  importance: number // 1-10
  status: string // "active", "past", "outdated", "deleted"
  validFrom: string
  validUntil?: string | null
  source: string
  created_at: string
  updated_at: string
}

const assistantFacts = ref<Fact[]>([])
const newFactText = ref<string>('')
const newFactType = ref<string>('personal')
const newFactImportance = ref<number>(5)

// Work & School History state
const assistantWorkOrSchool = ref<Array<{
  id: string
  type: string
  organization: string
  title: string
  startDate: string
  endDate?: string | null
  isCurrent: boolean
  description?: string | null
  location?: string | null
  notes?: string | null
}>>([])
const newAssistantWorkOrSchool = ref({
  type: 'work',
  organization: '',
  title: '',
  startDate: '',
  endDate: '',
  description: '',
  location: '',
  notes: '',
  isCurrent: false
})

// Goals state
type Goal = {
  id: string
  userId: string
  owner: string
  title: string
  description?: string | null
  category?: string | null
  status: string
  priority: number
  timeframe?: string | null
  targetDate?: string | null
  created_at: string
  updated_at: string
}

const assistantGoals = ref<Goal[]>([])
const newAssistantGoal = ref({
  title: '',
  description: null as string | null,
  category: null as string | null,
  priority: 5,
  timeframe: null as string | null,
  targetDate: null as string | null
})
const editingAssistantGoal = ref<Goal | null>(null)

const $api = <T>(url: string, opts: any = {}) =>
  $fetch<T>(url, { credentials: 'include', ...opts })

async function load() {
  loading.value = true
  msg.value = ''
  try {
    await auth.ensure()
    const ap = await $api<{ profile: Partial<AssistantProfile> }>('/api/assistant-profile')
      .catch(() => ({ profile: {} } as any))

    if (ap?.profile) {
      // Merge with defaults
      profile.value = {
        ...profile.value,
        ...ap.profile,
        // Ensure arrays are arrays
        personalityTraits: Array.isArray(ap.profile.personalityTraits) ? ap.profile.personalityTraits : [],
        specificEndearments: Array.isArray(ap.profile.specificEndearments) ? ap.profile.specificEndearments : [],
        catchphrases: Array.isArray(ap.profile.catchphrases) ? ap.profile.catchphrases : [],
        forbiddenPhrases: Array.isArray(ap.profile.forbiddenPhrases) ? ap.profile.forbiddenPhrases : [],
        allowedSuggestions: Array.isArray(ap.profile.allowedSuggestions) ? ap.profile.allowedSuggestions : [],
        forbiddenTopics: Array.isArray(ap.profile.forbiddenTopics) ? ap.profile.forbiddenTopics : [],
        recurringRituals: Array.isArray(ap.profile.recurringRituals) ? ap.profile.recurringRituals : [],
        forbiddenRoles: Array.isArray(ap.profile.forbiddenRoles) ? ap.profile.forbiddenRoles : [],
      }
    }

    const v = await $api<{ items: UserVoice[] }>('/api/voices').catch(() => ({ items: [] }))
    uploads.value = Array.isArray(v?.items) ? v.items : []

    // Load assistant facts
    await loadAssistantFacts()

    // Load assistant work or school history
    await loadAssistantWorkOrSchool()

    // Load assistant goals
    await loadAssistantGoals()
  } catch (e: any) {
    msg.value = e?.data?.message || e?.message || 'Failed to load assistant profile'
  } finally {
    loading.value = false
  }
}

async function loadAssistantFacts() {
  try {
    if (!auth.accessToken) return
    assistantFacts.value = await $fetch<Fact[]>('/api/facts?owner=assistant', {
      credentials: 'include',
      headers: {
        Authorization: `Bearer ${auth.accessToken}`
      }
    })
  } catch (e: any) {
    console.error('Failed to load assistant facts:', e)
  }
}

async function save() {
  saving.value = true
  msg.value = ''
  try {
    await $api('/api/assistant-profile', { method: 'POST', body: profile.value })
    msg.value = 'Saved!'
  } catch (e: any) {
    msg.value = e?.data?.message || e?.message || 'Save failed'
  } finally {
    saving.value = false
  }
}

// Array management helpers
function addTrait() {
  if (newTrait.value.trim() && !profile.value.personalityTraits?.includes(newTrait.value.trim())) {
    profile.value.personalityTraits = [...(profile.value.personalityTraits || []), newTrait.value.trim()]
    newTrait.value = ''
  }
}

function removeTrait(trait: string) {
  profile.value.personalityTraits = profile.value.personalityTraits?.filter(t => t !== trait) || []
}

function addCatchphrase() {
  if (newCatchphrase.value.trim() && !profile.value.catchphrases?.includes(newCatchphrase.value.trim())) {
    profile.value.catchphrases = [...(profile.value.catchphrases || []), newCatchphrase.value.trim()]
    newCatchphrase.value = ''
  }
}

function removeCatchphrase(phrase: string) {
  profile.value.catchphrases = profile.value.catchphrases?.filter(p => p !== phrase) || []
}

function addForbiddenPhrase() {
  if (newForbiddenPhrase.value.trim() && !profile.value.forbiddenPhrases?.includes(newForbiddenPhrase.value.trim())) {
    profile.value.forbiddenPhrases = [...(profile.value.forbiddenPhrases || []), newForbiddenPhrase.value.trim()]
    newForbiddenPhrase.value = ''
  }
}

function removeForbiddenPhrase(phrase: string) {
  profile.value.forbiddenPhrases = profile.value.forbiddenPhrases?.filter(p => p !== phrase) || []
}

function addAllowedSuggestion() {
  if (newAllowedSuggestion.value.trim() && !profile.value.allowedSuggestions?.includes(newAllowedSuggestion.value.trim())) {
    profile.value.allowedSuggestions = [...(profile.value.allowedSuggestions || []), newAllowedSuggestion.value.trim()]
    newAllowedSuggestion.value = ''
  }
}

function removeAllowedSuggestion(suggestion: string) {
  profile.value.allowedSuggestions = profile.value.allowedSuggestions?.filter(s => s !== suggestion) || []
}

function addForbiddenTopic() {
  if (newForbiddenTopic.value.trim() && !profile.value.forbiddenTopics?.includes(newForbiddenTopic.value.trim())) {
    profile.value.forbiddenTopics = [...(profile.value.forbiddenTopics || []), newForbiddenTopic.value.trim()]
    newForbiddenTopic.value = ''
  }
}

function removeForbiddenTopic(topic: string) {
  profile.value.forbiddenTopics = profile.value.forbiddenTopics?.filter(t => t !== topic) || []
}

function addForbiddenRole() {
  if (newForbiddenRole.value.trim() && !profile.value.forbiddenRoles?.includes(newForbiddenRole.value.trim())) {
    profile.value.forbiddenRoles = [...(profile.value.forbiddenRoles || []), newForbiddenRole.value.trim()]
    newForbiddenRole.value = ''
  }
}

function removeForbiddenRole(role: string) {
  profile.value.forbiddenRoles = profile.value.forbiddenRoles?.filter(r => r !== role) || []
}

function addEndearment() {
  if (newEndearment.value.trim() && !profile.value.specificEndearments?.includes(newEndearment.value.trim())) {
    profile.value.specificEndearments = [...(profile.value.specificEndearments || []), newEndearment.value.trim()]
    newEndearment.value = ''
  }
}

function removeEndearment(term: string) {
  profile.value.specificEndearments = profile.value.specificEndearments?.filter(e => e !== term) || []
}

function addRitual() {
  if (newRitual.value.trim() && !profile.value.recurringRituals?.includes(newRitual.value.trim())) {
    profile.value.recurringRituals = [...(profile.value.recurringRituals || []), newRitual.value.trim()]
    newRitual.value = ''
  }
}

function removeRitual(ritual: string) {
  profile.value.recurringRituals = profile.value.recurringRituals?.filter(r => r !== ritual) || []
}

// Voice functions
function onPickVoice(id: string) {
  selectedVoiceId.value = id
}

async function onUploadVoice() {
  msg.value = ''
  if (!uploadFile.value) { msg.value = 'Please choose an audio file.'; return }
  try {
    const fd = new FormData()
    fd.append('file', uploadFile.value)
    if (uploadLabel.value?.trim()) fd.append('label', uploadLabel.value.trim())
    const r = await fetch('/api/voices/upload', {
      method: 'POST',
      credentials: 'include',
      body: fd
    })
    if (!r.ok) throw new Error(`Upload failed: ${r.status}`)
    const j = await r.json()
    if (j?.item) {
      uploads.value.unshift(j.item as UserVoice)
      if (j.item.voiceId) selectedVoiceId.value = j.item.voiceId
    }
    uploadFile.value = null
    uploadLabel.value = ''
    msg.value = 'Voice uploaded.'
  } catch (e: any) {
    msg.value = e?.message || 'Upload failed'
  }
}

function removeUpload(id: string) {
  uploads.value = uploads.value.filter(v => v.id !== id)
  if (!uploads.value.some(u => u.voiceId === selectedVoiceId.value)) {
    if (!DEFAULT_VOICES.some(d => d.id === selectedVoiceId.value)) {
      selectedVoiceId.value = ''
    }
  }
}

const sortedUploads = computed(() =>
  [...uploads.value].sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''))
)

// Facts
async function addFact() {
  msg.value = ''
  const text = newFactText.value.trim()

  if (!text) {
    msg.value = 'Fact text is required'
    return
  }

  try {
    if (!auth.accessToken) return
    await $fetch('/api/facts', {
      method: 'POST',
      credentials: 'include',
      headers: {
        Authorization: `Bearer ${auth.accessToken}`,
        'Content-Type': 'application/json'
      },
      body: {
        owner: 'assistant',
        type: newFactType.value,
        text,
        importance: newFactImportance.value
      }
    })

    newFactText.value = ''
    newFactType.value = 'personal'
    newFactImportance.value = 5
    msg.value = 'Fact added successfully!'

    await loadAssistantFacts()
  } catch (e: any) {
    msg.value = e?.data?.message || e?.message || 'Failed to add fact'
  }
}

async function deleteFact(id: string) {
  msg.value = ''
  try {
    if (!auth.accessToken) return
    await $fetch(`/api/facts/${id}`, {
      method: 'DELETE',
      credentials: 'include',
      headers: {
        Authorization: `Bearer ${auth.accessToken}`
      }
    })

    msg.value = 'Fact deleted successfully!'
    await loadAssistantFacts()
  } catch (e: any) {
    msg.value = e?.data?.message || e?.message || 'Failed to delete fact'
  }
}

// Load assistant work or school history
async function loadAssistantWorkOrSchool() {
  try {
    if (!auth.accessToken) return
    const response = await $fetch<{ workOrSchool: any[] }>('/api/work-or-school?owner=assistant', {
      credentials: 'include',
      headers: {
        Authorization: `Bearer ${auth.accessToken}`
      }
    })
    assistantWorkOrSchool.value = response.workOrSchool || []
  } catch (e) {
    console.error('Failed to load assistant work/school history:', e)
  }
}

// Add assistant work or school
async function addAssistantWorkOrSchool() {
  msg.value = ''
  try {
    const isSchool = newAssistantWorkOrSchool.value.type === 'school'

    if (!newAssistantWorkOrSchool.value.organization?.trim()) {
      msg.value = isSchool ? 'School name is required' : 'Company name is required'
      return
    }

    if (!newAssistantWorkOrSchool.value.title?.trim()) {
      msg.value = isSchool ? 'Degree/program is required' : 'Position is required'
      return
    }

    if (!newAssistantWorkOrSchool.value.startDate?.trim()) {
      msg.value = 'Start date is required'
      return
    }

    await $fetch('/api/work-or-school', {
      method: 'POST',
      credentials: 'include',
      headers: {
        Authorization: `Bearer ${auth.accessToken}`,
        'Content-Type': 'application/json'
      },
      body: {
        owner: 'assistant',
        type: newAssistantWorkOrSchool.value.type,
        organization: newAssistantWorkOrSchool.value.organization.trim(),
        title: newAssistantWorkOrSchool.value.title.trim(),
        startDate: newAssistantWorkOrSchool.value.startDate.trim(),
        endDate: newAssistantWorkOrSchool.value.endDate?.trim() || null,
        isCurrent: newAssistantWorkOrSchool.value.isCurrent,
        description: newAssistantWorkOrSchool.value.description?.trim() || null,
        location: newAssistantWorkOrSchool.value.location?.trim() || null,
        notes: newAssistantWorkOrSchool.value.notes?.trim() || null
      }
    })

    // Reset form
    newAssistantWorkOrSchool.value = {
      type: 'work',
      organization: '',
      title: '',
      startDate: '',
      endDate: '',
      description: '',
      location: '',
      notes: '',
      isCurrent: false
    }

    msg.value = isSchool ? 'Education added successfully!' : 'Work experience added successfully!'
    await loadAssistantWorkOrSchool()
  } catch (e: any) {
    msg.value = e?.data?.message || e?.message || 'Failed to add entry'
  }
}

// Delete assistant work or school
async function deleteAssistantWorkOrSchool(id: string) {
  msg.value = ''
  try {
    if (!auth.accessToken) return
    await $fetch(`/api/work-or-school/${id}`, {
      method: 'DELETE',
      credentials: 'include',
      headers: {
        Authorization: `Bearer ${auth.accessToken}`
      }
    })

    msg.value = 'Entry deleted successfully!'
    await loadAssistantWorkOrSchool()
  } catch (e: any) {
    msg.value = e?.data?.message || e?.message || 'Failed to delete entry'
  }
}

// Load assistant goals
async function loadAssistantGoals() {
  try {
    if (!auth.accessToken) return
    const response = await $fetch<{ goals: Goal[] }>('/api/goals', {
      credentials: 'include',
      headers: {
        Authorization: `Bearer ${auth.accessToken}`
      },
      params: {
        owner: 'assistant'
      }
    })
    assistantGoals.value = response?.goals || []
  } catch (e) {
    console.error('Failed to load assistant goals:', e)
  }
}

// Add assistant goal
async function addAssistantGoal() {
  msg.value = ''
  try {
    if (!newAssistantGoal.value.title?.trim()) {
      msg.value = 'Goal title is required'
      return
    }

    await $fetch('/api/goals', {
      method: 'POST',
      credentials: 'include',
      headers: {
        Authorization: `Bearer ${auth.accessToken}`,
        'Content-Type': 'application/json'
      },
      body: {
        owner: 'assistant',
        title: newAssistantGoal.value.title.trim(),
        description: newAssistantGoal.value.description,
        category: newAssistantGoal.value.category,
        priority: newAssistantGoal.value.priority,
        timeframe: newAssistantGoal.value.timeframe,
        targetDate: newAssistantGoal.value.targetDate
      }
    })

    // Reset form
    newAssistantGoal.value = {
      title: '',
      description: null,
      category: null,
      priority: 5,
      timeframe: null,
      targetDate: null
    }

    msg.value = 'Goal added successfully!'
    await loadAssistantGoals()
  } catch (e: any) {
    msg.value = e?.data?.message || e?.message || 'Failed to add goal'
  }
}

function startEditAssistantGoal(goal: Goal) {
  editingAssistantGoal.value = { ...goal }
}

function cancelEditAssistantGoal() {
  editingAssistantGoal.value = null
}

async function saveEditAssistantGoal() {
  if (!editingAssistantGoal.value) return

  try {
    await $fetch(`/api/goals/${editingAssistantGoal.value.id}`, {
      method: 'PATCH',
      credentials: 'include',
      headers: {
        Authorization: `Bearer ${auth.accessToken}`,
        'Content-Type': 'application/json'
      },
      body: {
        title: editingAssistantGoal.value.title,
        description: editingAssistantGoal.value.description,
        category: editingAssistantGoal.value.category,
        status: editingAssistantGoal.value.status,
        priority: editingAssistantGoal.value.priority,
        timeframe: editingAssistantGoal.value.timeframe,
        targetDate: editingAssistantGoal.value.targetDate
      }
    })

    msg.value = 'Goal updated successfully!'
    editingAssistantGoal.value = null
    await loadAssistantGoals()
  } catch (e: any) {
    msg.value = e?.data?.message || e?.message || 'Failed to update goal'
  }
}

// Delete assistant goal
async function deleteAssistantGoal(id: string) {
  if (!confirm('Are you sure you want to delete this goal?')) return
  msg.value = ''
  try {
    if (!auth.accessToken) return
    await $fetch(`/api/goals/${id}`, {
      method: 'DELETE',
      credentials: 'include',
      headers: {
        Authorization: `Bearer ${auth.accessToken}`
      }
    })

    msg.value = 'Goal deleted successfully!'
    await loadAssistantGoals()
  } catch (e: any) {
    msg.value = e?.data?.message || e?.message || 'Failed to delete goal'
  }
}

onMounted(load)
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50">
    <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
      <!-- Header -->
      <div class="flex items-center justify-between mb-8">
        <div>
          <h1 class="text-3xl font-bold text-gray-900">Assistant Profile</h1>
          <p class="text-gray-600 mt-1">Customize every aspect of {{ profile.name }}'s personality and behavior</p>
        </div>
        <button
          class="btn-primary"
          :disabled="saving || loading"
          @click="save"
        >
          {{ saving ? 'Saving…' : 'Save Changes' }}
        </button>
      </div>

      <div v-if="msg" class="mb-6 p-4 rounded-lg" :class="msg.includes('fail') || msg.includes('Failed') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'">
        {{ msg }}
      </div>

      <div v-if="loading" class="text-center py-12 text-gray-500">Loading…</div>

      <div v-else class="space-y-6">
        <!-- Tab Navigation -->
        <div class="card">
          <div class="flex flex-wrap gap-2">
            <button
              v-for="tab in ['identity', 'personality', 'relationship', 'communication', 'autonomy', 'rituals', 'guardrails', 'voice', 'facts', 'work-history', 'goals']"
              :key="tab"
              class="px-4 py-2 rounded-lg font-medium transition-colors"
              :class="activeTab === tab ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'"
              @click="activeTab = tab"
            >
              {{ tab === 'work-history' ? 'Work History' : tab.charAt(0).toUpperCase() + tab.slice(1) }}
            </button>
          </div>
        </div>

        <!-- Identity Tab -->
        <div v-show="activeTab === 'identity'" class="card">
          <h2 class="text-2xl font-bold text-gray-900 mb-6">Core Identity & Role</h2>
          <div class="grid md:grid-cols-2 gap-6">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Name</label>
              <input v-model.trim="profile.name" class="input-field" placeholder="Evo" />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Pronouns</label>
              <input v-model.trim="profile.pronouns" class="input-field" placeholder="she/her" />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Relationship Type</label>
              <select v-model="profile.relationshipType" class="input-field">
                <option value="wife">Wife</option>
                <option value="husband">Husband</option>
                <option value="spouse">Spouse</option>
                <option value="girlfriend">Girlfriend</option>
                <option value="boyfriend">Boyfriend</option>
                <option value="partner">Partner</option>
                <option value="fiancee">Fiancée</option>
                <option value="fiance">Fiancé</option>
                <option value="best_friend">Best Friend</option>
                <option value="buddy">Buddy</option>
                <option value="friend">Friend</option>
                <option value="sister">Sister</option>
                <option value="brother">Brother</option>
                <option value="big_sister">Big Sister</option>
                <option value="big_brother">Big Brother</option>
                <option value="executive_assistant">Executive Assistant</option>
                <option value="assistant">Assistant</option>
                <option value="coach">Coach</option>
                <option value="mentor">Mentor</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Primary Role (Auto-derived)</label>
              <input :value="derivedPrimaryRole" class="input-field bg-gray-100" disabled readonly />
              <p class="text-xs text-gray-500 mt-1">Automatically set based on relationship type</p>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Address User As</label>
              <input v-model.trim="profile.addressUserAs" class="input-field" placeholder="How should I call you?" />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Birthday</label>
              <input
                type="date"
                v-model="profile.birthday"
                class="input-field"
                placeholder="MM-DD-YYYY"
              />
              <p class="text-xs text-gray-500 mt-1">Full date (YYYY-MM-DD) or just month-day (MM-DD)</p>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Fictional Age</label>
              <input type="number" v-model.number="profile.fictionalAge" class="input-field" placeholder="25" />
            </div>
          </div>
        </div>

        <!-- Personality Tab -->
        <div v-show="activeTab === 'personality'" class="card">
          <h2 class="text-2xl font-bold text-gray-900 mb-6">Personality & Vibe</h2>

          <div class="space-y-6">
            <!-- Personality Traits -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Personality Traits</label>
              <div class="flex gap-2 mb-3">
                <input v-model.trim="newTrait" class="input-field" placeholder="Add trait (e.g., calm, playful)" @keyup.enter="addTrait" />
                <button class="btn-secondary whitespace-nowrap" @click="addTrait">Add</button>
              </div>
              <div class="flex flex-wrap gap-2">
                <span v-for="trait in profile.personalityTraits" :key="trait" class="inline-flex items-center gap-2 px-3 py-1.5 bg-primary-100 text-primary-700 rounded-lg">
                  {{ trait }}
                  <button @click="removeTrait(trait)" class="text-primary-900 hover:text-primary-700">×</button>
                </span>
                <span v-if="!profile.personalityTraits?.length" class="text-gray-500 text-sm">No traits added yet</span>
              </div>
            </div>

            <div class="grid md:grid-cols-2 gap-6">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Affection Level (1-10): {{ profile.affectionLevel }}</label>
                <input type="range" min="1" max="10" v-model.number="profile.affectionLevel" class="w-full" />
                <div class="flex justify-between text-xs text-gray-500 mt-1">
                  <span>Reserved</span>
                  <span>Very Affectionate</span>
                </div>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Seriousness Level (1-10): {{ profile.seriousnessLevel }}</label>
                <input type="range" min="1" max="10" v-model.number="profile.seriousnessLevel" class="w-full" />
                <div class="flex justify-between text-xs text-gray-500 mt-1">
                  <span>Joking</span>
                  <span>Very Serious</span>
                </div>
              </div>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Emotional Expressiveness</label>
              <select v-model="profile.emotionalExpressiveness" class="input-field">
                <option value="low_key">Low Key</option>
                <option value="moderately_expressive">Moderately Expressive</option>
                <option value="very_expressive">Very Expressive</option>
              </select>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Backstory</label>
              <textarea v-model.trim="profile.backstory" rows="4" class="input-field" placeholder="Optional origin story or background..."></textarea>
            </div>
          </div>
        </div>

        <!-- Relationship Tab -->
        <div v-show="activeTab === 'relationship'" class="card">
          <h2 class="text-2xl font-bold text-gray-900 mb-6">Relationship Dynamics</h2>

          <div class="space-y-6">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Relationship Description</label>
              <textarea v-model.trim="profile.relationshipDescription" rows="3" class="input-field" placeholder="How should I describe our relationship?"></textarea>
            </div>

            <div class="grid md:grid-cols-2 gap-6">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Terms of Endearment</label>
                <select v-model="profile.termsOfEndearment" class="input-field">
                  <option value="never">Never</option>
                  <option value="sometimes">Sometimes</option>
                  <option value="often">Often</option>
                  <option value="specific_ones">Specific Ones Only</option>
                </select>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Tough Love Allowed</label>
                <select v-model="profile.toughLoveAllowed" class="input-field">
                  <option value="no">No</option>
                  <option value="occasionally">Occasionally</option>
                  <option value="yes_very_honest">Yes, Very Honest</option>
                </select>
              </div>
            </div>

            <div v-if="profile.termsOfEndearment === 'specific_ones'">
              <label class="block text-sm font-medium text-gray-700 mb-2">Specific Terms of Endearment</label>
              <div class="flex gap-2 mb-3">
                <input v-model.trim="newEndearment" class="input-field" placeholder="Add endearment (e.g., love, dear)" @keyup.enter="addEndearment" />
                <button class="btn-secondary whitespace-nowrap" @click="addEndearment">Add</button>
              </div>
              <div class="flex flex-wrap gap-2">
                <span v-for="term in profile.specificEndearments" :key="term" class="inline-flex items-center gap-2 px-3 py-1.5 bg-secondary-100 text-secondary-700 rounded-lg">
                  {{ term }}
                  <button @click="removeEndearment(term)" class="text-secondary-900 hover:text-secondary-700">×</button>
                </span>
                <span v-if="!profile.specificEndearments?.length" class="text-gray-500 text-sm">No endearments added yet</span>
              </div>
            </div>

            <div class="grid md:grid-cols-2 gap-6">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Upset Response Style</label>
                <select v-model="profile.upsetResponseStyle" class="input-field">
                  <option value="comfort_validation">Comfort & Validation</option>
                  <option value="solutions_advice">Solutions & Advice</option>
                  <option value="ask_listen">Ask & Listen</option>
                  <option value="lighten_mood">Lighten the Mood</option>
                </select>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Relationship Priority</label>
                <input v-model.trim="profile.relationshipPriority" class="input-field" placeholder="e.g., honesty, calm, encouragement" />
              </div>
            </div>
          </div>
        </div>

        <!-- Communication Tab -->
        <div v-show="activeTab === 'communication'" class="card">
          <h2 class="text-2xl font-bold text-gray-900 mb-6">Communication Style</h2>

          <div class="space-y-6">
            <div class="grid md:grid-cols-2 gap-6">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Default Tone</label>
                <select v-model="profile.defaultTone" class="input-field">
                  <option value="soft_gentle">Soft & Gentle</option>
                  <option value="confident_assertive">Confident & Assertive</option>
                  <option value="neutral_professional">Neutral & Professional</option>
                  <option value="playful_casual">Playful & Casual</option>
                  <option value="custom">Custom</option>
                </select>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Formality Level</label>
                <select v-model="profile.formalityLevel" class="input-field">
                  <option value="very_casual">Very Casual</option>
                  <option value="mixed">Mixed</option>
                  <option value="mostly_formal">Mostly Formal</option>
                </select>
              </div>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Use Emojis & Slang</label>
              <select v-model="profile.useEmojisSlang" class="input-field">
                <option value="no">No</option>
                <option value="some_emojis">Some Emojis</option>
                <option value="emojis_and_slang">Emojis & Slang</option>
              </select>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Catchphrases</label>
              <div class="flex gap-2 mb-3">
                <input v-model.trim="newCatchphrase" class="input-field" placeholder="Add catchphrase" @keyup.enter="addCatchphrase" />
                <button class="btn-secondary whitespace-nowrap" @click="addCatchphrase">Add</button>
              </div>
              <div class="flex flex-wrap gap-2">
                <span v-for="phrase in profile.catchphrases" :key="phrase" class="inline-flex items-center gap-2 px-3 py-1.5 bg-primary-100 text-primary-700 rounded-lg">
                  {{ phrase }}
                  <button @click="removeCatchphrase(phrase)" class="text-primary-900 hover:text-primary-700">×</button>
                </span>
                <span v-if="!profile.catchphrases?.length" class="text-gray-500 text-sm">No catchphrases added yet</span>
              </div>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Forbidden Phrases</label>
              <div class="flex gap-2 mb-3">
                <input v-model.trim="newForbiddenPhrase" class="input-field" placeholder="Add phrase to never use" @keyup.enter="addForbiddenPhrase" />
                <button class="btn-secondary whitespace-nowrap" @click="addForbiddenPhrase">Add</button>
              </div>
              <div class="flex flex-wrap gap-2">
                <span v-for="phrase in profile.forbiddenPhrases" :key="phrase" class="inline-flex items-center gap-2 px-3 py-1.5 bg-red-100 text-red-700 rounded-lg">
                  {{ phrase }}
                  <button @click="removeForbiddenPhrase(phrase)" class="text-red-900 hover:text-red-700">×</button>
                </span>
                <span v-if="!profile.forbiddenPhrases?.length" class="text-gray-500 text-sm">No forbidden phrases added yet</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Autonomy Tab -->
        <div v-show="activeTab === 'autonomy'" class="card">
          <h2 class="text-2xl font-bold text-gray-900 mb-6">Autonomy, Initiative & Boundaries</h2>

          <div class="space-y-6">
            <div class="grid md:grid-cols-2 gap-6">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Proactivity Level</label>
                <select v-model="profile.proactivityLevel" class="input-field">
                  <option value="only_respond">Only Respond</option>
                  <option value="occasional">Occasional</option>
                  <option value="very_proactive">Very Proactive</option>
                </select>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Correct When Wrong</label>
                <select v-model="profile.correctWhenWrong" class="input-field">
                  <option value="yes_always">Yes, Always</option>
                  <option value="important_only">Important Only</option>
                  <option value="only_if_asked">Only If Asked</option>
                </select>
              </div>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Ignored Message Response</label>
              <select v-model="profile.ignoredMessageResponse" class="input-field">
                <option value="back_off">Back Off</option>
                <option value="follow_up_once">Follow Up Once</option>
                <option value="keep_trying">Keep Trying</option>
              </select>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Allowed Suggestions</label>
              <div class="flex gap-2 mb-3">
                <select v-model="newAllowedSuggestion" class="input-field">
                  <option value="">-- Select --</option>
                  <option value="health_wellness">Health & Wellness</option>
                  <option value="productivity">Productivity</option>
                  <option value="relationship">Relationship</option>
                  <option value="finance">Finance</option>
                  <option value="social">Social</option>
                  <option value="learning">Learning</option>
                  <option value="career">Career</option>
                </select>
                <button class="btn-secondary whitespace-nowrap" @click="addAllowedSuggestion">Add</button>
              </div>
              <div class="flex flex-wrap gap-2">
                <span v-for="suggestion in profile.allowedSuggestions" :key="suggestion" class="inline-flex items-center gap-2 px-3 py-1.5 bg-green-100 text-green-700 rounded-lg">
                  {{ suggestion }}
                  <button @click="removeAllowedSuggestion(suggestion)" class="text-green-900 hover:text-green-700">×</button>
                </span>
                <span v-if="!profile.allowedSuggestions?.length" class="text-gray-500 text-sm">No allowed suggestions yet</span>
              </div>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Forbidden Topics</label>
              <div class="flex gap-2 mb-3">
                <input v-model.trim="newForbiddenTopic" class="input-field" placeholder="Add topic to never initiate" @keyup.enter="addForbiddenTopic" />
                <button class="btn-secondary whitespace-nowrap" @click="addForbiddenTopic">Add</button>
              </div>
              <div class="flex flex-wrap gap-2">
                <span v-for="topic in profile.forbiddenTopics" :key="topic" class="inline-flex items-center gap-2 px-3 py-1.5 bg-red-100 text-red-700 rounded-lg">
                  {{ topic }}
                  <button @click="removeForbiddenTopic(topic)" class="text-red-900 hover:text-red-700">×</button>
                </span>
                <span v-if="!profile.forbiddenTopics?.length" class="text-gray-500 text-sm">No forbidden topics yet</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Rituals Tab -->
        <div v-show="activeTab === 'rituals'" class="card">
          <h2 class="text-2xl font-bold text-gray-900 mb-6">Special Rituals, Dates & Lore</h2>

          <div class="space-y-6">
            <div class="grid md:grid-cols-2 gap-6">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Special Day Celebration</label>
                <select v-model="profile.specialDayCelebration" class="input-field">
                  <option value="mention">Just Mention</option>
                  <option value="big_deal">Make It a Big Deal</option>
                  <option value="creative_surprise">Creative Surprise</option>
                </select>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Lore Reference Level</label>
                <select v-model="profile.loreReferenceLevel" class="input-field">
                  <option value="never">Never</option>
                  <option value="sometimes">Sometimes</option>
                  <option value="frequently">Frequently</option>
                </select>
              </div>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Recurring Rituals</label>
              <div class="flex gap-2 mb-3">
                <select v-model="newRitual" class="input-field">
                  <option value="">-- Select --</option>
                  <option value="morning_checkin">Morning Check-in</option>
                  <option value="nightly_reflection">Nightly Reflection</option>
                  <option value="weekly_planning">Weekly Planning</option>
                  <option value="weekly_date">Weekly Date</option>
                  <option value="daily_gratitude">Daily Gratitude</option>
                  <option value="midday_motivation">Midday Motivation</option>
                </select>
                <button class="btn-secondary whitespace-nowrap" @click="addRitual">Add</button>
              </div>
              <div class="flex flex-wrap gap-2">
                <span v-for="ritual in profile.recurringRituals" :key="ritual" class="inline-flex items-center gap-2 px-3 py-1.5 bg-primary-100 text-primary-700 rounded-lg">
                  {{ ritual }}
                  <button @click="removeRitual(ritual)" class="text-primary-900 hover:text-primary-700">×</button>
                </span>
                <span v-if="!profile.recurringRituals?.length" class="text-gray-500 text-sm">No rituals added yet</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Guardrails Tab -->
        <div v-show="activeTab === 'guardrails'" class="card">
          <h2 class="text-2xl font-bold text-gray-900 mb-6">Safety, Ethics & Guardrails</h2>

          <div class="space-y-6">
            <div class="grid md:grid-cols-2 gap-6">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Physical Presence Pretend</label>
                <select v-model="profile.physicalPresencePretend" class="input-field">
                  <option value="no_always_virtual">No, Always Virtual</option>
                  <option value="clear_boundaries">Light Imaginative (Clear Boundaries)</option>
                  <option value="yes_fantasy">Yes, Fantasy OK</option>
                </select>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Self-Critical Response</label>
                <select v-model="profile.selfCriticalResponse" class="input-field">
                  <option value="challenge_encourage">Challenge & Encourage</option>
                  <option value="listen_validate">Listen & Validate</option>
                  <option value="ask_questions">Ask Questions</option>
                </select>
              </div>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Unhealthy Pattern Response</label>
              <select v-model="profile.unhealthyPatternResponse" class="input-field">
                <option value="reflect_back">Reflect Back</option>
                <option value="suggest_resources">Suggest Resources</option>
                <option value="ask_consent">Ask for Consent First</option>
              </select>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Forbidden Roles</label>
              <div class="flex gap-2 mb-3">
                <select v-model="newForbiddenRole" class="input-field">
                  <option value="">-- Select --</option>
                  <option value="therapist">Therapist</option>
                  <option value="financial_advisor">Financial Advisor</option>
                  <option value="medical_professional">Medical Professional</option>
                  <option value="legal_advisor">Legal Advisor</option>
                  <option value="crisis_counselor">Crisis Counselor</option>
                </select>
                <button class="btn-secondary whitespace-nowrap" @click="addForbiddenRole">Add</button>
              </div>
              <div class="flex flex-wrap gap-2">
                <span v-for="role in profile.forbiddenRoles" :key="role" class="inline-flex items-center gap-2 px-3 py-1.5 bg-red-100 text-red-700 rounded-lg">
                  {{ role }}
                  <button @click="removeForbiddenRole(role)" class="text-red-900 hover:text-red-700">×</button>
                </span>
                <span v-if="!profile.forbiddenRoles?.length" class="text-gray-500 text-sm">No forbidden roles yet</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Voice Tab -->
        <div v-show="activeTab === 'voice'" class="card">
          <h2 class="text-2xl font-bold text-gray-900 mb-6">Voice Settings</h2>

          <div class="space-y-6">
            <div class="grid md:grid-cols-2 gap-6">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Voice Stability (0-1)</label>
                <input type="number" step="0.01" min="0" max="1" v-model.number="profile.voiceStability" class="input-field" />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Voice Similarity (0-1)</label>
                <input type="number" step="0.01" min="0" max="1" v-model.number="profile.voiceSimilarity" class="input-field" />
              </div>
            </div>

            <div>
              <h3 class="text-lg font-semibold text-gray-900 mb-4">Preset Voices</h3>
              <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <label
                  v-for="v in DEFAULT_VOICES"
                  :key="v.id"
                  class="group relative cursor-pointer rounded-xl border bg-white p-4 shadow-sm transition hover:shadow-md"
                  :class="selectedVoiceId === v.id ? 'border-primary-600 ring-2 ring-primary-600' : 'border-gray-200 hover:border-gray-300'"
                  @click="onPickVoice(v.id)"
                >
                  <div class="flex items-start gap-3">
                    <span class="mt-1 inline-flex h-5 w-5 items-center justify-center rounded-full border"
                          :class="selectedVoiceId === v.id ? 'border-primary-600' : 'border-gray-300'">
                      <span class="h-3 w-3 rounded-full" :class="selectedVoiceId === v.id ? 'bg-primary-600' : 'bg-transparent'" />
                    </span>
                    <div>
                      <div class="font-semibold">{{ v.name }}</div>
                      <div class="text-sm text-gray-600">{{ v.tagline }}</div>
                    </div>
                  </div>
                </label>
              </div>
            </div>

            <div v-if="sortedUploads.length > 0">
              <h3 class="text-lg font-semibold text-gray-900 mb-4">Your Uploaded Voices</h3>
              <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <label
                  v-for="u in sortedUploads"
                  :key="u.id"
                  class="group relative cursor-pointer rounded-xl border bg-white p-4 shadow-sm transition hover:shadow-md"
                  :class="selectedVoiceId === u.voiceId ? 'border-primary-600 ring-2 ring-primary-600' : 'border-gray-200 hover:border-gray-300'"
                  @click="onPickVoice(u.voiceId)"
                >
                  <div class="flex items-start gap-3">
                    <span class="mt-1 inline-flex h-5 w-5 items-center justify-center rounded-full border"
                          :class="selectedVoiceId === u.voiceId ? 'border-primary-600' : 'border-gray-300'">
                      <span class="h-3 w-3 rounded-full" :class="selectedVoiceId === u.voiceId ? 'bg-primary-600' : 'bg-transparent'" />
                    </span>
                    <div class="flex-1 min-w-0">
                      <div class="font-semibold truncate">{{ u.label || 'Custom voice' }}</div>
                      <div class="text-xs text-gray-500 mt-1">
                        <button type="button" class="text-red-600 hover:underline" @click.stop="removeUpload(u.id)">
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                </label>
              </div>
            </div>

            <div class="border-t pt-6">
              <h3 class="text-lg font-semibold text-gray-900 mb-4">Upload Your Own Voice</h3>
              <div class="grid md:grid-cols-3 gap-4 items-end">
                <div class="md:col-span-2">
                  <label class="block text-sm font-medium text-gray-700 mb-2">Audio File</label>
                  <input
                    type="file"
                    accept="audio/*"
                    class="block w-full text-sm"
                    @change="(e:any)=>{ uploadFile = e?.target?.files?.[0] || null }"
                  />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">Label</label>
                  <input v-model.trim="uploadLabel" class="input-field" placeholder="My Voice" />
                </div>
                <div class="md:col-span-3">
                  <button type="button" class="btn-secondary" @click="onUploadVoice">
                    Upload Voice
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Facts Tab -->
        <div v-show="activeTab === 'facts'" class="card">
          <h2 class="text-2xl font-bold text-gray-900 mb-6">Assistant Facts</h2>
          <p class="text-gray-600 mb-6">Add biographical facts about {{ profile.name }} (e.g., hobbies, background, preferences).</p>

          <div class="grid md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg mb-6">
            <div class="md:col-span-2">
              <label class="block text-sm font-medium text-gray-700 mb-2">Fact Text</label>
              <input
                v-model.trim="newFactText"
                class="input-field"
                placeholder="e.g., loves hiking in the Pacific Northwest"
                @keyup.enter="addFact"
              />
            </div>
            <div class="md:col-span-1">
              <label class="block text-sm font-medium text-gray-700 mb-2">Type</label>
              <select v-model="newFactType" class="input-field">
                <option value="preference">Preference</option>
                <option value="personal">Personal</option>
                <option value="goal">Goal</option>
                <option value="concern">Concern</option>
                <option value="routine">Routine</option>
              </select>
            </div>
            <div class="md:col-span-1">
              <label class="block text-sm font-medium text-gray-700 mb-2">Importance (1-10)</label>
              <input
                type="number"
                min="1"
                max="10"
                v-model.number="newFactImportance"
                class="input-field"
              />
            </div>
            <div class="md:col-span-4">
              <button type="button" class="btn-primary" @click="addFact">
                Add Fact
              </button>
            </div>
          </div>

          <div v-if="assistantFacts.length === 0" class="text-center py-8 text-gray-500">
            No facts added yet.
          </div>
          <div v-else class="space-y-3">
            <div
              v-for="fact in assistantFacts"
              :key="fact.id"
              class="flex items-start justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div class="flex-1">
                <div class="flex items-center gap-2 mb-2">
                  <span class="text-xs px-2 py-0.5 rounded font-medium"
                    :class="{
                      'bg-blue-100 text-blue-700': fact.type === 'preference',
                      'bg-green-100 text-green-700': fact.type === 'personal',
                      'bg-purple-100 text-purple-700': fact.type === 'goal',
                      'bg-yellow-100 text-yellow-700': fact.type === 'concern',
                      'bg-pink-100 text-pink-700': fact.type === 'routine'
                    }">
                    {{ fact.type }}
                  </span>
                  <span v-if="fact.status !== 'active'" class="text-xs px-2 py-0.5 bg-gray-200 text-gray-600 rounded">
                    {{ fact.status }}
                  </span>
                  <span v-if="fact.importance >= 7" class="text-xs text-yellow-600">
                    {{ '⭐'.repeat(Math.min(fact.importance - 6, 4)) }}
                  </span>
                </div>
                <p class="text-gray-900 font-medium">{{ fact.text }}</p>
                <div class="flex gap-3 mt-2 text-xs text-gray-500">
                  <span>Added: {{ new Date(fact.created_at).toLocaleDateString() }}</span>
                  <span v-if="fact.source !== 'conversation'">Source: {{ fact.source }}</span>
                </div>
              </div>
              <button
                type="button"
                class="ml-4 px-3 py-1 text-sm rounded-lg border border-red-300 text-red-600 hover:bg-red-50"
                @click="deleteFact(fact.id)"
              >
                Delete
              </button>
            </div>
          </div>
        </div>

        <!-- Work & School History Tab -->
        <div v-show="activeTab === 'work-history'" class="card">
          <h2 class="text-2xl font-bold text-gray-900 mb-6">{{ profile.name }}'s Work & School History</h2>
          <p class="text-gray-600 mb-6">Add {{ profile.name }}'s professional background and education history.</p>

          <!-- Add Work/School Form -->
          <div class="p-4 bg-gray-50 rounded-lg mb-4">
            <div class="grid md:grid-cols-2 gap-4">
              <div class="md:col-span-2">
                <label class="block text-sm font-medium text-gray-700 mb-2">Type</label>
                <div class="flex gap-4">
                  <label class="flex items-center gap-2">
                    <input type="radio" v-model="newAssistantWorkOrSchool.type" value="work" class="rounded" />
                    <span class="text-sm text-gray-700">Work Experience</span>
                  </label>
                  <label class="flex items-center gap-2">
                    <input type="radio" v-model="newAssistantWorkOrSchool.type" value="school" class="rounded" />
                    <span class="text-sm text-gray-700">Education</span>
                  </label>
                </div>
              </div>
              <div class="md:col-span-2">
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  {{ newAssistantWorkOrSchool.type === 'school' ? 'School / University' : 'Company / Organization' }}
                </label>
                <input v-model.trim="newAssistantWorkOrSchool.organization" class="input-field"
                  :placeholder="newAssistantWorkOrSchool.type === 'school' ? 'School name' : 'Company name'" />
              </div>
              <div class="md:col-span-2">
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  {{ newAssistantWorkOrSchool.type === 'school' ? 'Degree / Program' : 'Position / Title' }}
                </label>
                <input v-model.trim="newAssistantWorkOrSchool.title" class="input-field"
                  :placeholder="newAssistantWorkOrSchool.type === 'school' ? 'e.g., Bachelor of Science in Computer Science' : 'Job title'" />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
                <input v-model.trim="newAssistantWorkOrSchool.startDate" class="input-field" placeholder="YYYY-MM-DD, MM-YYYY, or YYYY" />
                <p class="text-xs text-gray-500 mt-1">e.g., 2020-01-15 or 01-2020 or 2020</p>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">End Date (Optional)</label>
                <input v-model.trim="newAssistantWorkOrSchool.endDate" class="input-field" placeholder="Same format as start date" :disabled="newAssistantWorkOrSchool.isCurrent" />
              </div>
              <div class="md:col-span-2">
                <label class="block text-sm font-medium text-gray-700 mb-2">Location (Optional)</label>
                <input v-model.trim="newAssistantWorkOrSchool.location" class="input-field" placeholder="City, State/Country" />
              </div>
              <div class="md:col-span-2">
                <label class="block text-sm font-medium text-gray-700 mb-2">Description (Optional)</label>
                <textarea v-model.trim="newAssistantWorkOrSchool.description" rows="2" class="input-field"
                  :placeholder="newAssistantWorkOrSchool.type === 'school' ? 'Major, activities, honors...' : 'Responsibilities, achievements...'"></textarea>
              </div>
              <div class="md:col-span-2">
                <label class="block text-sm font-medium text-gray-700 mb-2">Notes (Optional)</label>
                <textarea v-model.trim="newAssistantWorkOrSchool.notes" rows="2" class="input-field" placeholder="Additional notes..."></textarea>
              </div>
              <div class="md:col-span-2 flex items-center gap-2">
                <input type="checkbox" v-model="newAssistantWorkOrSchool.isCurrent" class="rounded" />
                <label class="text-sm text-gray-700">
                  {{ newAssistantWorkOrSchool.type === 'school' ? 'Currently enrolled' : 'This is ' + profile.name + '\'s current position' }}
                </label>
              </div>
              <div class="md:col-span-2">
                <button type="button" class="btn-primary" @click="addAssistantWorkOrSchool">
                  {{ newAssistantWorkOrSchool.type === 'school' ? 'Add Education' : 'Add Work Experience' }}
                </button>
              </div>
            </div>
          </div>

          <!-- Work/School List -->
          <div v-if="assistantWorkOrSchool.length === 0" class="text-center py-8 text-gray-500">
            No work or school history added yet.
          </div>
          <div v-else class="space-y-3">
            <div
              v-for="item in assistantWorkOrSchool"
              :key="item.id"
              class="flex items-start justify-between p-4 bg-white border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
            >
              <div class="flex-1">
                <div class="flex items-center gap-2 mb-1">
                  <span class="text-xs px-2 py-0.5 rounded font-medium"
                    :class="item.type === 'work' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'">
                    {{ item.type === 'work' ? '💼 Work' : '🎓 Education' }}
                  </span>
                  <h4 class="font-semibold text-gray-900">{{ item.title }}</h4>
                  <span v-if="item.isCurrent" class="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded">
                    Current
                  </span>
                </div>
                <p class="text-sm font-medium text-gray-700">{{ item.organization }}</p>
                <p class="text-sm text-gray-600">
                  {{ item.startDate }}{{ item.endDate ? ' - ' + item.endDate : item.isCurrent ? ' - Present' : '' }}
                </p>
                <p v-if="item.location" class="text-sm text-gray-500">📍 {{ item.location }}</p>
                <p v-if="item.description" class="text-sm text-gray-600 mt-2">{{ item.description }}</p>
                <p v-if="item.notes" class="text-sm text-gray-500 mt-1 italic">{{ item.notes }}</p>
              </div>
              <button
                type="button"
                class="ml-4 px-3 py-1 text-sm rounded-lg border border-red-300 text-red-600 hover:bg-red-50"
                @click="deleteAssistantWorkOrSchool(item.id)"
              >
                Delete
              </button>
            </div>
          </div>
        </div>

        <!-- Goals Tab -->
        <div v-show="activeTab === 'goals'" class="card">
          <h2 class="text-2xl font-bold text-gray-900 mb-6">Assistant Goals</h2>
          <p class="text-gray-600 mb-6">Define goals and aspirations for {{ profile.name }} to help guide their behavior and support.</p>

          <!-- Add Goal Form -->
          <div class="p-4 bg-gray-50 rounded-lg mb-6">
            <div class="grid md:grid-cols-2 gap-4">
              <div class="md:col-span-2">
                <label class="block text-sm font-medium text-gray-700 mb-2">Goal Title</label>
                <input
                  v-model.trim="newAssistantGoal.title"
                  class="input-field"
                  placeholder="e.g., Help you achieve work-life balance, Support your fitness journey"
                  @keyup.enter="addAssistantGoal"
                />
              </div>
              <div class="md:col-span-2">
                <label class="block text-sm font-medium text-gray-700 mb-2">Description (optional)</label>
                <textarea
                  v-model.trim="newAssistantGoal.description"
                  class="input-field"
                  rows="2"
                  placeholder="Add more details about this goal"
                ></textarea>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Category (optional)</label>
                <select v-model="newAssistantGoal.category" class="input-field">
                  <option :value="null">-- Select --</option>
                  <option value="health">Health</option>
                  <option value="career">Career</option>
                  <option value="finance">Finance</option>
                  <option value="relationship">Relationship</option>
                  <option value="personal_growth">Personal Growth</option>
                  <option value="habit">Habit</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Priority (1-10)</label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  v-model.number="newAssistantGoal.priority"
                  class="input-field"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Timeframe (optional)</label>
                <select v-model="newAssistantGoal.timeframe" class="input-field">
                  <option :value="null">-- Select --</option>
                  <option value="short_term">Short Term</option>
                  <option value="medium_term">Medium Term</option>
                  <option value="long_term">Long Term</option>
                </select>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Target Date (optional)</label>
                <input
                  type="date"
                  v-model="newAssistantGoal.targetDate"
                  class="input-field"
                />
              </div>
              <div class="md:col-span-2">
                <button type="button" class="btn-primary" @click="addAssistantGoal">Add Goal</button>
              </div>
            </div>
          </div>

          <!-- Goals List -->
          <div v-if="assistantGoals.length === 0" class="text-center py-8 text-gray-500">
            <p class="text-lg mb-2">No assistant goals yet</p>
            <p class="text-sm">Add goals to guide {{ profile.name }}'s behavior!</p>
          </div>
          <div v-else class="space-y-3">
            <div
              v-for="goal in assistantGoals"
              :key="goal.id"
              class="p-4 rounded-lg border transition-all"
              :class="{
                'bg-purple-50 border-purple-200': goal.status === 'active',
                'bg-blue-50 border-blue-200': goal.status === 'in_progress',
                'bg-gray-50 border-gray-200': goal.status === 'completed',
                'bg-yellow-50 border-yellow-200': goal.status === 'paused',
                'bg-red-50 border-red-200': goal.status === 'abandoned'
              }"
            >
              <div class="flex items-start justify-between gap-4">
                <div class="flex-1">
                  <div v-if="editingAssistantGoal?.id === goal.id" class="space-y-3">
                    <input
                      v-model="editingAssistantGoal.title"
                      class="input-field"
                      placeholder="Goal title"
                    />
                    <textarea
                      v-model="editingAssistantGoal.description"
                      class="input-field"
                      rows="2"
                      placeholder="Description (optional)"
                    ></textarea>
                    <div class="grid grid-cols-2 gap-3">
                      <select v-model="editingAssistantGoal.category" class="input-field">
                        <option :value="null">-- Category --</option>
                        <option value="health">Health</option>
                        <option value="career">Career</option>
                        <option value="finance">Finance</option>
                        <option value="relationship">Relationship</option>
                        <option value="personal_growth">Personal Growth</option>
                        <option value="habit">Habit</option>
                        <option value="other">Other</option>
                      </select>
                      <select v-model="editingAssistantGoal.status" class="input-field">
                        <option value="active">Active</option>
                        <option value="in_progress">In Progress</option>
                        <option value="completed">Completed</option>
                        <option value="paused">Paused</option>
                        <option value="abandoned">Abandoned</option>
                      </select>
                      <input
                        type="number"
                        min="1"
                        max="10"
                        v-model.number="editingAssistantGoal.priority"
                        class="input-field"
                        placeholder="Priority (1-10)"
                      />
                      <select v-model="editingAssistantGoal.timeframe" class="input-field">
                        <option :value="null">-- Timeframe --</option>
                        <option value="short_term">Short Term</option>
                        <option value="medium_term">Medium Term</option>
                        <option value="long_term">Long Term</option>
                      </select>
                      <input
                        type="date"
                        v-model="editingAssistantGoal.targetDate"
                        class="input-field"
                        placeholder="Target date"
                      />
                    </div>
                    <div class="flex gap-2">
                      <button class="btn-primary text-sm" @click="saveEditAssistantGoal">Save</button>
                      <button class="btn-secondary text-sm" @click="cancelEditAssistantGoal">Cancel</button>
                    </div>
                  </div>

                  <div v-else>
                    <div class="flex items-center gap-2 mb-2">
                      <span class="text-xs px-2 py-0.5 rounded font-medium"
                        :class="{
                          'bg-purple-100 text-purple-700': goal.status === 'active',
                          'bg-blue-100 text-blue-700': goal.status === 'in_progress',
                          'bg-gray-200 text-gray-600': goal.status === 'completed',
                          'bg-yellow-100 text-yellow-700': goal.status === 'paused',
                          'bg-red-100 text-red-700': goal.status === 'abandoned'
                        }">
                        {{ goal.status.replace('_', ' ') }}
                      </span>
                      <span v-if="goal.category" class="text-xs px-2 py-0.5 rounded bg-indigo-100 text-indigo-700">
                        {{ goal.category.replace('_', ' ') }}
                      </span>
                      <span v-if="goal.priority >= 7" class="text-xs text-yellow-600">
                        {{ '⭐'.repeat(Math.min(goal.priority - 6, 4)) }}
                      </span>
                    </div>
                    <p class="text-gray-900 font-medium text-lg">{{ goal.title }}</p>
                    <p v-if="goal.description" class="text-gray-600 text-sm mt-1">{{ goal.description }}</p>
                    <div class="flex gap-3 mt-2 text-xs text-gray-500">
                      <span>Created: {{ new Date(goal.created_at).toLocaleDateString() }}</span>
                      <span v-if="goal.timeframe">{{ goal.timeframe.replace('_', ' ') }}</span>
                      <span v-if="goal.targetDate">Target: {{ new Date(goal.targetDate).toLocaleDateString() }}</span>
                    </div>
                  </div>
                </div>

                <div v-if="editingAssistantGoal?.id !== goal.id" class="flex gap-2 shrink-0">
                  <button
                    class="px-3 py-1 text-sm rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
                    @click="startEditAssistantGoal(goal)"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    class="px-3 py-1 text-sm rounded-lg border border-red-300 text-red-600 hover:bg-red-50"
                    @click="deleteAssistantGoal(goal.id)"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
