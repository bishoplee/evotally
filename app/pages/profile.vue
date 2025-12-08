<template>
  <div class="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50">
    <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
      <!-- Header -->
      <div class="flex items-center justify-between mb-8">
        <div>
          <h1 class="text-3xl font-bold text-gray-900">Your Profile</h1>
          <p class="text-gray-600 mt-1">Complete your profile for more personalized responses</p>
        </div>
        <EvoProfileProgress :pct="store.progressPct" :score="store.score" />
      </div>

      <!-- Progress Banner -->
      <div v-if="!showWizard && store.progressPct < 70" class="mb-8 card bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200">
        <div class="flex items-center justify-between gap-4">
          <div>
            <p class="font-semibold text-gray-900">Complete your profile</p>
            <p class="text-sm text-gray-600 mt-1">
              You're <span class="font-semibold text-primary-600">{{ store.progressPct }}%</span> done. Finish to get better personalized responses.
            </p>
          </div>
          <button class="btn-primary whitespace-nowrap" @click="showWizard = true">
            Quick Wizard
          </button>
        </div>
      </div>

      <div v-if="loading" class="text-center py-12 text-gray-500">Loading…</div>

      <div v-else class="space-y-6">
        <!-- Tab Navigation -->
        <div class="card">
          <div class="flex flex-wrap gap-2">
            <button
              class="px-4 py-2 rounded-lg font-medium transition-colors"
              :class="activeTab === 'basic' ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'"
              @click="activeTab = 'basic'"
            >
              Basic Info
            </button>
            <button
              class="px-4 py-2 rounded-lg font-medium transition-colors"
              :class="activeTab === 'goals' ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'"
              @click="activeTab = 'goals'"
            >
              Goals ({{ userGoals.length }})
            </button>
            <button
              v-for="(section, key) in (store.registry || {})"
              :key="key"
              class="px-4 py-2 rounded-lg font-medium transition-colors relative"
              :class="activeTab === key ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'"
              @click="activeTab = key"
            >
              {{ title(key) }}
              <span
                v-if="section.weight"
                class="ml-2 text-xs px-1.5 py-0.5 rounded"
                :class="activeTab === key ? 'bg-primary-700' : 'bg-gray-200 text-gray-600'"
              >
                {{ section.weight }}pts
              </span>
            </button>
          </div>
        </div>

        <!-- Basic Info Tab -->
        <div v-show="activeTab === 'basic'" class="card">
          <h2 class="text-2xl font-bold text-gray-900 mb-6">Basic Information</h2>

          <div class="space-y-8">
            <!-- Personal Information -->
            <div>
              <h3 class="text-lg font-semibold text-gray-900 mb-4">Personal Information</h3>
              <div class="grid md:grid-cols-2 gap-6">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">First Name</label>
                  <input v-model.trim="basicInfo.first_name" class="input-field" placeholder="Your first name" />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
                  <input v-model.trim="basicInfo.last_name" class="input-field" placeholder="Your last name" />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">Email</label>
                  <input v-model.trim="basicInfo.email" type="email" class="input-field" placeholder="you@example.com" />
                  <p class="text-xs text-gray-500 mt-1">Used only for context; not sent to third parties.</p>
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">Birthday</label>
                  <input v-model="basicInfo.birthday" type="date" class="input-field" />
                  <p class="text-xs text-gray-500 mt-1">Your birthday (YYYY-MM-DD)</p>
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">Timezone</label>
                  <input v-model.trim="basicInfo.timezone" class="input-field" placeholder="America/New_York" />
                  <p class="text-xs text-gray-500 mt-1">Detected: {{ detectedTz }}</p>
                </div>
              </div>
            </div>

            <!-- Residence -->
            <div>
              <h3 class="text-lg font-semibold text-gray-900 mb-4">Place of Residence</h3>
              <div class="grid md:grid-cols-3 gap-6">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">City</label>
                  <input v-model.trim="basicInfo.city" class="input-field" placeholder="Seattle" />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">State/Province</label>
                  <input v-model.trim="basicInfo.region" class="input-field" placeholder="Washington" />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">Country</label>
                  <input v-model.trim="basicInfo.country" class="input-field" placeholder="United States" />
                </div>
              </div>
              <p class="text-xs text-gray-500 mt-2">Where you permanently live (different from your current location)</p>
            </div>

            <!-- Current Location (Auto-Detected) -->
            <div v-if="currentLocation.city || currentLocation.region || currentLocation.country">
              <h3 class="text-lg font-semibold text-gray-900 mb-4">Current Location (Auto-Detected)</h3>
              <div class="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div class="flex items-start gap-3">
                  <span class="text-2xl">📍</span>
                  <div class="flex-1">
                    <p class="font-medium text-gray-900">
                      {{ currentLocation.city }}{{ currentLocation.region ? ', ' + currentLocation.region : '' }}{{ currentLocation.country ? ', ' + currentLocation.country : '' }}
                    </p>
                    <p class="text-xs text-gray-600 mt-1">
                      Automatically detected from your browser's location. This updates when you refresh the page.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <!-- Events -->
            <div>
              <h3 class="text-lg font-semibold text-gray-900 mb-4">Important Events & Dates</h3>

              <!-- Add Event Form -->
              <div class="p-4 bg-gray-50 rounded-lg mb-4">
                <div class="grid md:grid-cols-2 gap-4">
                  <div class="md:col-span-2">
                    <label class="block text-sm font-medium text-gray-700 mb-2">Event Title</label>
                    <input v-model.trim="newEvent.title" class="input-field" placeholder="Anniversary, Birthday, etc." />
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
                    <input v-model.trim="newEvent.startDate" class="input-field" placeholder="YYYY-MM-DD, MM-DD, MM, or DD" />
                    <p class="text-xs text-gray-500 mt-1">Flexible format: full date, month-day, month only, or day only</p>
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">End Date (Optional)</label>
                    <input v-model.trim="newEvent.endDate" class="input-field" placeholder="Same format as start date" />
                  </div>
                  <div class="md:col-span-2">
                    <label class="block text-sm font-medium text-gray-700 mb-2">Description (Optional)</label>
                    <textarea v-model.trim="newEvent.description" rows="2" class="input-field" placeholder="Additional details..."></textarea>
                  </div>
                  <div class="md:col-span-2 flex items-center gap-2">
                    <input type="checkbox" v-model="newEvent.isRecurring" class="rounded" />
                    <label class="text-sm text-gray-700">Recurring event (happens every year)</label>
                  </div>
                  <div class="md:col-span-2">
                    <button type="button" class="btn-primary" @click="addEvent">Add Event</button>
                  </div>
                </div>
              </div>

              <!-- Events List -->
              <div v-if="events.length === 0" class="text-center py-8 text-gray-500">
                No events added yet.
              </div>
              <div v-else class="space-y-3">
                <div
                  v-for="event in events"
                  :key="event.id"
                  class="flex items-start justify-between p-4 bg-white border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
                >
                  <div class="flex-1">
                    <div class="flex items-center gap-2 mb-1">
                      <h4 class="font-semibold text-gray-900">{{ event.title }}</h4>
                      <span v-if="event.isRecurring" class="text-xs px-2 py-0.5 bg-purple-100 text-purple-700 rounded">
                        Recurring
                      </span>
                    </div>
                    <p class="text-sm text-gray-600">
                      {{ event.startDate }}{{ event.endDate ? ' - ' + event.endDate : '' }}
                    </p>
                    <p v-if="event.description" class="text-sm text-gray-500 mt-1">{{ event.description }}</p>
                  </div>
                  <button
                    type="button"
                    class="ml-4 px-3 py-1 text-sm rounded-lg border border-red-300 text-red-600 hover:bg-red-50"
                    @click="deleteEvent(event.id)"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>

            <!-- Work & School History -->
            <div>
              <h3 class="text-lg font-semibold text-gray-900 mb-4">Work & School History</h3>

              <!-- Add Work/School Form -->
              <div class="p-4 bg-gray-50 rounded-lg mb-4">
                <div class="grid md:grid-cols-2 gap-4">
                  <div class="md:col-span-2">
                    <label class="block text-sm font-medium text-gray-700 mb-2">Type</label>
                    <div class="flex gap-4">
                      <label class="flex items-center gap-2">
                        <input type="radio" v-model="newWorkOrSchool.type" value="work" class="rounded" />
                        <span class="text-sm text-gray-700">Work Experience</span>
                      </label>
                      <label class="flex items-center gap-2">
                        <input type="radio" v-model="newWorkOrSchool.type" value="school" class="rounded" />
                        <span class="text-sm text-gray-700">Education</span>
                      </label>
                    </div>
                  </div>
                  <div class="md:col-span-2">
                    <label class="block text-sm font-medium text-gray-700 mb-2">
                      {{ newWorkOrSchool.type === 'school' ? 'School / University' : 'Company / Organization' }}
                    </label>
                    <input v-model.trim="newWorkOrSchool.organization" class="input-field"
                      :placeholder="newWorkOrSchool.type === 'school' ? 'School name' : 'Company name'" />
                  </div>
                  <div class="md:col-span-2">
                    <label class="block text-sm font-medium text-gray-700 mb-2">
                      {{ newWorkOrSchool.type === 'school' ? 'Degree / Program' : 'Position / Title' }}
                    </label>
                    <input v-model.trim="newWorkOrSchool.title" class="input-field"
                      :placeholder="newWorkOrSchool.type === 'school' ? 'e.g., Bachelor of Science in Computer Science' : 'Job title'" />
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
                    <input v-model.trim="newWorkOrSchool.startDate" class="input-field" placeholder="YYYY-MM-DD, MM-YYYY, or YYYY" />
                    <p class="text-xs text-gray-500 mt-1">e.g., 2020-01-15 or 01-2020 or 2020</p>
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">End Date (Optional)</label>
                    <input v-model.trim="newWorkOrSchool.endDate" class="input-field" placeholder="Same format as start date" :disabled="newWorkOrSchool.isCurrent" />
                  </div>
                  <div class="md:col-span-2">
                    <label class="block text-sm font-medium text-gray-700 mb-2">Location (Optional)</label>
                    <input v-model.trim="newWorkOrSchool.location" class="input-field" placeholder="City, State/Country" />
                  </div>
                  <div class="md:col-span-2">
                    <label class="block text-sm font-medium text-gray-700 mb-2">Description (Optional)</label>
                    <textarea v-model.trim="newWorkOrSchool.description" rows="2" class="input-field"
                      :placeholder="newWorkOrSchool.type === 'school' ? 'Major, activities, honors...' : 'Responsibilities, achievements...'"></textarea>
                  </div>
                  <div class="md:col-span-2">
                    <label class="block text-sm font-medium text-gray-700 mb-2">Notes (Optional)</label>
                    <textarea v-model.trim="newWorkOrSchool.notes" rows="2" class="input-field" placeholder="Additional notes..."></textarea>
                  </div>
                  <div class="md:col-span-2 flex items-center gap-2">
                    <input type="checkbox" v-model="newWorkOrSchool.isCurrent" class="rounded" />
                    <label class="text-sm text-gray-700">
                      {{ newWorkOrSchool.type === 'school' ? 'Currently enrolled' : 'This is my current position' }}
                    </label>
                  </div>
                  <div class="md:col-span-2">
                    <button type="button" class="btn-primary" @click="addWorkOrSchool">
                      {{ newWorkOrSchool.type === 'school' ? 'Add Education' : 'Add Work Experience' }}
                    </button>
                  </div>
                </div>
              </div>

              <!-- Work/School List -->
              <div v-if="workOrSchool.length === 0" class="text-center py-8 text-gray-500">
                No work or school history added yet.
              </div>
              <div v-else class="space-y-3">
                <div
                  v-for="item in workOrSchool"
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
                    @click="deleteWorkOrSchool(item.id)"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>

            <!-- Goals -->
            <div>
              <h3 class="text-lg font-semibold text-gray-900 mb-4">Goals</h3>

              <!-- Add Goal Form -->
              <div class="p-4 bg-gray-50 rounded-lg mb-4">
                <div class="grid md:grid-cols-2 gap-4">
                  <div class="md:col-span-2">
                    <label class="block text-sm font-medium text-gray-700 mb-2">Goal Title</label>
                    <input v-model.trim="newGoal.title" class="input-field" placeholder="e.g., Learn Spanish" />
                  </div>
                  <div class="md:col-span-2">
                    <label class="block text-sm font-medium text-gray-700 mb-2">Description (Optional)</label>
                    <textarea v-model.trim="newGoal.description" rows="2" class="input-field" placeholder="What does this goal entail?"></textarea>
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Category (Optional)</label>
                    <select v-model="newGoal.category" class="input-field">
                      <option value="">Select category</option>
                      <option value="personal">Personal</option>
                      <option value="career">Career</option>
                      <option value="health">Health & Fitness</option>
                      <option value="financial">Financial</option>
                      <option value="relationship">Relationship</option>
                      <option value="education">Education</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Priority (Optional)</label>
                    <select v-model="newGoal.priority" class="input-field">
                      <option value="">Select priority</option>
                      <option value="high">High</option>
                      <option value="medium">Medium</option>
                      <option value="low">Low</option>
                    </select>
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Target Date (Optional)</label>
                    <input v-model.trim="newGoal.targetDate" class="input-field" placeholder="YYYY-MM-DD or MM-YYYY" />
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Progress (%)</label>
                    <input type="number" min="0" max="100" v-model.number="newGoal.progress" class="input-field" placeholder="0-100" />
                  </div>
                  <div class="md:col-span-2">
                    <label class="block text-sm font-medium text-gray-700 mb-2">Notes (Optional)</label>
                    <textarea v-model.trim="newGoal.notes" rows="2" class="input-field" placeholder="Additional notes..."></textarea>
                  </div>
                  <div class="md:col-span-2">
                    <button type="button" class="btn-primary" @click="addGoal">Add Goal</button>
                  </div>
                </div>
              </div>

              <!-- Goals List -->
              <div v-if="goals.length === 0" class="text-center py-8 text-gray-500">
                No goals added yet.
              </div>
              <div v-else class="space-y-3">
                <div
                  v-for="goal in goals"
                  :key="goal.id"
                  class="p-4 bg-white border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
                >
                  <div class="flex items-start justify-between mb-2">
                    <div class="flex-1">
                      <div class="flex items-center gap-2 mb-1">
                        <h4 class="font-semibold text-gray-900">{{ goal.title }}</h4>
                        <span v-if="goal.priority" class="text-xs px-2 py-0.5 rounded font-medium"
                          :class="{
                            'bg-red-100 text-red-700': goal.priority === 'high',
                            'bg-yellow-100 text-yellow-700': goal.priority === 'medium',
                            'bg-green-100 text-green-700': goal.priority === 'low'
                          }">
                          {{ goal.priority }}
                        </span>
                        <span v-if="goal.category" class="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded">
                          {{ goal.category }}
                        </span>
                        <span class="text-xs px-2 py-0.5 rounded font-medium"
                          :class="{
                            'bg-green-100 text-green-700': goal.status === 'active',
                            'bg-gray-100 text-gray-700': goal.status === 'completed',
                            'bg-red-100 text-red-700': goal.status === 'abandoned',
                            'bg-yellow-100 text-yellow-700': goal.status === 'on_hold'
                          }">
                          {{ goal.status }}
                        </span>
                      </div>
                      <p v-if="goal.description" class="text-sm text-gray-600 mb-2">{{ goal.description }}</p>
                      <p v-if="goal.targetDate" class="text-sm text-gray-500">🎯 Target: {{ goal.targetDate }}</p>
                      <p v-if="goal.notes" class="text-sm text-gray-500 mt-1 italic">{{ goal.notes }}</p>

                      <!-- Progress Bar -->
                      <div class="mt-3">
                        <div class="flex items-center justify-between text-sm mb-1">
                          <span class="text-gray-700">Progress</span>
                          <span class="font-medium text-gray-900">{{ goal.progress }}%</span>
                        </div>
                        <div class="w-full bg-gray-200 rounded-full h-2">
                          <div class="bg-primary-600 h-2 rounded-full transition-all" :style="{ width: goal.progress + '%' }"></div>
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      class="ml-4 px-3 py-1 text-sm rounded-lg border border-red-300 text-red-600 hover:bg-red-50"
                      @click="deleteGoal(goal.id)"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="mt-6 pt-6 border-t">
            <button
              class="btn-primary"
              @click="saveBasicInfo"
              :disabled="savingBasic"
            >
              {{ savingBasic ? 'Saving…' : 'Save Basic Info' }}
            </button>
            <span v-if="basicMsg" class="ml-4 text-sm" :class="basicMsg.includes('fail') ? 'text-red-600' : 'text-green-600'">
              {{ basicMsg }}
            </span>
          </div>

          <!-- Danger Zone: Delete Memory -->
          <div class="mt-8 pt-8 border-t border-red-200">
            <h3 class="text-lg font-semibold text-red-900 mb-4">⚠️ Danger Zone</h3>
            <div class="p-4 bg-red-50 border border-red-200 rounded-lg">
              <h4 class="font-semibold text-red-900 mb-2">Delete All Memory</h4>
              <p class="text-sm text-red-700 mb-4">
                This will permanently delete all your conversations, facts, summaries, and stored memory.
                This action cannot be undone.
              </p>
              <button
                type="button"
                class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                @click="showDeleteConfirmation = true"
                :disabled="deletingMemory"
              >
                {{ deletingMemory ? 'Deleting...' : 'Delete All Memory' }}
              </button>
              <p v-if="memoryStatus" class="mt-3 text-sm" :class="memoryStatus.type === 'error' ? 'text-red-700' : 'text-green-700'">
                {{ memoryStatus.message }}
              </p>
            </div>
          </div>
        </div>

        <!-- Delete Confirmation Modal -->
        <div
          v-if="showDeleteConfirmation"
          class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          @click.self="showDeleteConfirmation = false"
        >
          <div class="bg-white rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl">
            <h3 class="text-xl font-bold text-red-900 mb-4">⚠️ Confirm Memory Deletion</h3>
            <p class="text-gray-700 mb-2">
              This will permanently delete:
            </p>
            <ul class="list-disc list-inside text-gray-700 mb-4 space-y-1">
              <li>All conversations and chat history</li>
              <li>All stored facts about you and your assistant</li>
              <li>All summaries and memory data</li>
              <li>All session history</li>
            </ul>
            <p class="text-red-700 font-semibold mb-6">
              ⚠️ This action cannot be undone. All deleted information cannot be retrieved.
            </p>
            <div class="flex gap-3">
              <button
                type="button"
                class="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                @click="showDeleteConfirmation = false"
              >
                Cancel
              </button>
              <button
                type="button"
                class="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                @click="confirmDeleteMemory"
              >
                Yes, Delete Everything
              </button>
            </div>
          </div>
        </div>

        <!-- Goals Tab -->
        <div v-show="activeTab === 'goals'" class="space-y-6">
          <!-- Add New Goal -->
          <div class="card">
            <h2 class="text-2xl font-bold text-gray-900 mb-6">Add New Goal</h2>
            <div class="grid md:grid-cols-2 gap-4">
              <div class="md:col-span-2">
                <label class="block text-sm font-medium text-gray-700 mb-2">Goal Title</label>
                <input
                  v-model.trim="newGoal.title"
                  class="input-field"
                  placeholder="e.g., Learn to play guitar, Run a marathon, Start a business"
                  @keyup.enter="addGoal"
                />
              </div>
              <div class="md:col-span-2">
                <label class="block text-sm font-medium text-gray-700 mb-2">Description (optional)</label>
                <textarea
                  v-model.trim="newGoal.description"
                  class="input-field"
                  rows="2"
                  placeholder="Add more details about your goal"
                ></textarea>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Category (optional)</label>
                <select v-model="newGoal.category" class="input-field">
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
                  v-model.number="newGoal.priority"
                  class="input-field"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Timeframe (optional)</label>
                <select v-model="newGoal.timeframe" class="input-field">
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
                  v-model="newGoal.targetDate"
                  class="input-field"
                />
              </div>
              <div class="md:col-span-2">
                <button class="btn-primary" @click="addGoal" :disabled="savingGoal">
                  {{ savingGoal ? 'Adding…' : 'Add Goal' }}
                </button>
              </div>
            </div>
          </div>

          <!-- Goals List -->
          <div class="card">
            <h2 class="text-2xl font-bold text-gray-900 mb-6">Your Goals</h2>

            <div v-if="userGoals.length === 0" class="text-center py-12 text-gray-500">
              <p class="text-lg mb-2">No goals yet</p>
              <p class="text-sm">Add your first goal above to get started!</p>
            </div>

            <div v-else class="space-y-3">
              <div
                v-for="goal in sortedUserGoals"
                :key="goal.id"
                class="p-4 rounded-lg border transition-all"
                :class="{
                  'bg-green-50 border-green-200': goal.status === 'active',
                  'bg-blue-50 border-blue-200': goal.status === 'in_progress',
                  'bg-gray-50 border-gray-200': goal.status === 'completed',
                  'bg-yellow-50 border-yellow-200': goal.status === 'paused',
                  'bg-red-50 border-red-200': goal.status === 'abandoned'
                }"
              >
                <div class="flex items-start justify-between gap-4">
                  <div class="flex-1">
                    <div v-if="editingGoal?.id === goal.id" class="space-y-3">
                      <input
                        v-model="editingGoal.title"
                        class="input-field"
                        placeholder="Goal title"
                      />
                      <textarea
                        v-model="editingGoal.description"
                        class="input-field"
                        rows="2"
                        placeholder="Description (optional)"
                      ></textarea>
                      <div class="grid grid-cols-2 gap-3">
                        <select v-model="editingGoal.category" class="input-field">
                          <option :value="null">-- Category --</option>
                          <option value="health">Health</option>
                          <option value="career">Career</option>
                          <option value="finance">Finance</option>
                          <option value="relationship">Relationship</option>
                          <option value="personal_growth">Personal Growth</option>
                          <option value="habit">Habit</option>
                          <option value="other">Other</option>
                        </select>
                        <select v-model="editingGoal.status" class="input-field">
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
                          v-model.number="editingGoal.priority"
                          class="input-field"
                          placeholder="Priority (1-10)"
                        />
                        <select v-model="editingGoal.timeframe" class="input-field">
                          <option :value="null">-- Timeframe --</option>
                          <option value="short_term">Short Term</option>
                          <option value="medium_term">Medium Term</option>
                          <option value="long_term">Long Term</option>
                        </select>
                        <input
                          type="date"
                          v-model="editingGoal.targetDate"
                          class="input-field"
                          placeholder="Target date"
                        />
                      </div>
                      <div class="flex gap-2">
                        <button class="btn-primary text-sm" @click="saveEditGoal">Save</button>
                        <button class="btn-secondary text-sm" @click="cancelEditGoal">Cancel</button>
                      </div>
                    </div>

                    <div v-else>
                      <div class="flex items-center gap-2 mb-2">
                        <span class="text-xs px-2 py-0.5 rounded font-medium"
                          :class="{
                            'bg-green-100 text-green-700': goal.status === 'active',
                            'bg-blue-100 text-blue-700': goal.status === 'in_progress',
                            'bg-gray-200 text-gray-600': goal.status === 'completed',
                            'bg-yellow-100 text-yellow-700': goal.status === 'paused',
                            'bg-red-100 text-red-700': goal.status === 'abandoned'
                          }">
                          {{ goal.status.replace('_', ' ') }}
                        </span>
                        <span v-if="goal.category" class="text-xs px-2 py-0.5 rounded bg-purple-100 text-purple-700">
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

                  <div v-if="editingGoal?.id !== goal.id" class="flex gap-2 shrink-0">
                    <button
                      class="px-3 py-1 text-sm rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
                      @click="startEditGoal(goal)"
                    >
                      Edit
                    </button>
                    <button
                      class="px-3 py-1 text-sm rounded-lg border border-red-300 text-red-600 hover:bg-red-50"
                      @click="deleteGoal(goal.id)"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Section Content -->
        <div
          v-for="(section, key) in (store.registry || {})"
          :key="key"
          v-show="activeTab === key"
          class="card"
        >
          <h2 class="text-2xl font-bold text-gray-900 mb-6">{{ title(key) }}</h2>

          <div class="space-y-6">
            <div v-for="q in (section?.questions || [])" :key="q.id" class="space-y-2">
              <label class="block text-sm font-medium text-gray-700">{{ q.prompt }}</label>

              <div class="flex gap-3 items-start">
                <textarea
                  v-model="sectionLocal(key)[q.id]"
                  class="input-field flex-1 min-h-24 resize-y"
                  :placeholder="q.placeholder || 'Your answer…'"
                  @input="onEdit(key, q.id)"
                  @blur="onBlur(key, q.id)"
                />
                <button
                  class="btn-secondary shrink-0 mt-0"
                  @click="saveOne(key, q.id)"
                  :disabled="savingKey === key + ':' + q.id"
                >
                  <span v-if="savedKey === key + ':' + q.id">✓ Saved</span>
                  <span v-else-if="savingKey === key + ':' + q.id">Saving…</span>
                  <span v-else>Save</span>
                </button>
              </div>

              <p class="text-xs text-gray-500 min-h-4">
                <span v-if="savingKey === key + ':' + q.id" class="text-primary-600">● Autosaving…</span>
                <span v-else-if="savedKey === key + ':' + q.id" class="text-green-600">● Saved</span>
              </p>
            </div>

            <div class="pt-4 border-t">
              <button
                class="btn-primary"
                @click="save(key)"
                :disabled="savingKey.startsWith(key + ':')"
              >
                Save All in {{ title(key) }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <EvoProfileWizard v-if="showWizard" @close="closeWizard" />
</template>

<script setup lang="ts">
import { useEvoProfile } from '@/stores/evoProfile'
import { useAuth } from '~/stores/auth'
import EvoProfileProgress from "~/pages/components/EvoProfileProgress.vue"
import EvoProfileWizard from "~/pages/components/EvoProfileWizard.vue"

const auth = useAuth()
const store = useEvoProfile()
const showWizard = ref(false)
const activeTab = ref<string>('basic')
const loading = ref(false)

// Basic info state
const detectedTz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/New_York'
const basicInfo = ref({
  first_name: '',
  last_name: '',
  email: '',
  birthday: '',
  timezone: detectedTz,
  city: '',
  region: '',
  country: ''
})
const currentLocation = ref({
  city: '',
  region: '',
  country: ''
})
const savingBasic = ref(false)
const basicMsg = ref('')

// Events state
const events = ref<Array<{
  id: string
  title: string
  description?: string | null
  startDate: string
  endDate?: string | null
  isRecurring: boolean
  created_at: string
  updated_at: string
}>>([])
const newEvent = ref({
  title: '',
  startDate: '',
  endDate: '',
  description: '',
  isRecurring: false
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
  priority: number // 1-10
  timeframe?: string | null
  targetDate?: string | null
  created_at: string
  updated_at: string
}

const userGoals = ref<Goal[]>([])
const editingGoal = ref<Goal | null>(null)
const savingGoal = ref(false)

const sortedUserGoals = computed(() => {
  return [...userGoals.value].sort((a, b) => {
    if (a.status === 'active' && b.status !== 'active') return -1
    if (a.status !== 'active' && b.status === 'active') return 1
    if (a.priority !== b.priority) return b.priority - a.priority
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  })
})

// Work & School History state
const workOrSchool = ref<Array<{
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
const newWorkOrSchool = ref({
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
const goals = ref<Array<{
  id: string
  title: string
  description?: string | null
  category?: string | null
  status: string
  priority?: string | null
  targetDate?: string | null
  progress: number
  notes?: string | null
}>>([])
const newGoal = ref({
  title: '',
  description: '',
  category: '',
  priority: 5,
  timeframe: '',
  targetDate: ''
})

// Delete memory state
const showDeleteConfirmation = ref(false)
const deletingMemory = ref(false)
const memoryStatus = ref<{ type: 'success' | 'error'; message: string } | null>(null)

// local shadow state for edits
const local = reactive<Record<string, Record<string, string>>>({})
const savingKey = ref<string>('')   // "section:questionId" when saving
const savedKey  = ref<string>('')   // last saved key for ✔ flash

const timers = reactive<Record<string, ReturnType<typeof setTimeout> | undefined>>({})

function sectionLocal(sectionKey: string) {
  if (!local[sectionKey]) local[sectionKey] = reactive<Record<string, string>>({})
  return local[sectionKey]
}

const title = (k: string) => ({
  everyday: 'Everyday Talk',
  humor: 'Humor & Tone',
  personality: 'Personality Reflection',
  connection: 'Connection Preferences',
  emotional: 'Emotional Learning',
  memory: 'Memory Anchors',
  storytelling: 'Storytelling Style',
  life: 'Life Context',
  future: 'Future Orientation',
  calibration: 'Conversation Calibration',
}[k] || k)

async function saveOne(sectionKey: string, qid: string) {
  const k = `${sectionKey}:${qid}`
  try {
    savingKey.value = k
    const merged = { ...(store.sections[sectionKey] || {}), ...sectionLocal(sectionKey) }
    await store.saveSection(sectionKey, merged)
    store.sections[sectionKey] = { ...merged }
    savedKey.value = k
    setTimeout(() => { if (savedKey.value === k) savedKey.value = '' }, 1500)
  } finally {
    savingKey.value = ''
  }
}

async function onBlur(sectionKey: string, qid: string) {
  // Save immediately on blur (cancel pending debounce first)
  const id = `${sectionKey}:${qid}`
  if (timers[id]) { clearTimeout(timers[id]); timers[id] = undefined }
  // Only save if the value actually changed vs store snapshot
  const current = (local[sectionKey] || {})[qid] ?? ''
  const prev = (store.sections?.[sectionKey] || {})[qid] ?? ''
  if (current !== prev) await saveOne(sectionKey, qid)
}

function scheduleAutosave(sectionKey: string, qid: string, delay = 600) {
  const id = `${sectionKey}:${qid}`
  if (timers[id]) clearTimeout(timers[id])
  timers[id] = setTimeout(async () => {
    await saveOne(sectionKey, qid)
    timers[id] = undefined
  }, delay)
}

function onEdit(sectionKey: string, qid: string) {
  // Debounced autosave when typing stops
  scheduleAutosave(sectionKey, qid, 600)
}

// Load basic user info
async function loadBasicInfo() {
  try {
    loading.value = true
    await auth.ensure()
    const response = await $fetch<{ user: any }>('/api/auth/me', {
      credentials: 'include',
      headers: {
        Authorization: `Bearer ${auth.accessToken}`
      }
    })

    if (response?.user) {
      basicInfo.value.first_name = response.user.first_name || ''
      basicInfo.value.last_name = response.user.last_name || ''
      basicInfo.value.email = response.user.email || ''
      basicInfo.value.birthday = response.user.birthday || ''
      basicInfo.value.timezone = response.user.timezone || detectedTz
      basicInfo.value.city = response.user.city || ''
      basicInfo.value.region = response.user.region || ''
      basicInfo.value.country = response.user.country || ''

      // Load current location (auto-detected)
      currentLocation.value.city = response.user.currentCity || ''
      currentLocation.value.region = response.user.currentRegion || ''
      currentLocation.value.country = response.user.currentCountry || ''
    }
  } catch (e) {
    console.error('Failed to load basic info:', e)
  } finally {
    loading.value = false
  }
}

// Save basic user info
async function saveBasicInfo() {
  try {
    savingBasic.value = true
    basicMsg.value = ''

    await $fetch('/api/user/profile', {
      method: 'POST',
      credentials: 'include',
      headers: {
        Authorization: `Bearer ${auth.accessToken}`,
        'Content-Type': 'application/json'
      },
      body: {
        first_name: basicInfo.value.first_name?.trim() || null,
        last_name: basicInfo.value.last_name?.trim() || null,
        email: basicInfo.value.email?.trim() || null,
        birthday: basicInfo.value.birthday || null,
        timezone: basicInfo.value.timezone?.trim() || detectedTz,
        city: basicInfo.value.city?.trim() || null,
        region: basicInfo.value.region?.trim() || null,
        country: basicInfo.value.country?.trim() || null
      }
    })

    basicMsg.value = 'Saved!'
    setTimeout(() => { basicMsg.value = '' }, 2000)
  } catch (e: any) {
    basicMsg.value = e?.data?.message || e?.message || 'Save failed'
  } finally {
    savingBasic.value = false
  }
}

// Load events
async function loadEvents() {
  try {
    const response = await $fetch<{ events: any[] }>('/api/events', {
      credentials: 'include',
      headers: {
        Authorization: `Bearer ${auth.accessToken}`
      }
    })
    events.value = response.events || []
  } catch (e) {
    console.error('Failed to load events:', e)
  }
}

// Add event
async function addEvent() {
  try {
    if (!newEvent.value.title?.trim()) {
      basicMsg.value = 'Event title is required'
      return
    }

    if (!newEvent.value.startDate?.trim()) {
      basicMsg.value = 'Start date is required'
      return
    }

    await $fetch('/api/events', {
      method: 'POST',
      credentials: 'include',
      headers: {
        Authorization: `Bearer ${auth.accessToken}`,
        'Content-Type': 'application/json'
      },
      body: {
        title: newEvent.value.title.trim(),
        description: newEvent.value.description?.trim() || null,
        startDate: newEvent.value.startDate.trim(),
        endDate: newEvent.value.endDate?.trim() || null,
        isRecurring: newEvent.value.isRecurring
      }
    })

    // Reset form
    newEvent.value = {
      title: '',
      startDate: '',
      endDate: '',
      description: '',
      isRecurring: false
    }

    basicMsg.value = 'Event added!'
    setTimeout(() => { basicMsg.value = '' }, 2000)

    await loadEvents()
  } catch (e: any) {
    basicMsg.value = e?.data?.message || e?.message || 'Failed to add event'
  }
}

// Delete event
async function deleteEvent(id: string) {
  try {
    await $fetch(`/api/events/${id}`, {
      method: 'DELETE',
      credentials: 'include',
      headers: {
        Authorization: `Bearer ${auth.accessToken}`
      }
    })

    basicMsg.value = 'Event deleted!'
    setTimeout(() => { basicMsg.value = '' }, 2000)

    await loadEvents()
  } catch (e: any) {
    basicMsg.value = e?.data?.message || e?.message || 'Failed to delete event'
  }
}

// Load work or school history
async function loadWorkOrSchool() {
  try {
    const response = await $fetch<{ workOrSchool: any[] }>('/api/work-or-school?owner=user', {
      credentials: 'include',
      headers: {
        Authorization: `Bearer ${auth.accessToken}`
      }
    })
    workOrSchool.value = response.workOrSchool || []
  } catch (e) {
    console.error('Failed to load work/school history:', e)
  }
}

// Add work or school
async function addWorkOrSchool() {
  try {
    const isSchool = newWorkOrSchool.value.type === 'school'

    if (!newWorkOrSchool.value.organization?.trim()) {
      basicMsg.value = isSchool ? 'School name is required' : 'Company name is required'
      return
    }

    if (!newWorkOrSchool.value.title?.trim()) {
      basicMsg.value = isSchool ? 'Degree/program is required' : 'Position is required'
      return
    }

    if (!newWorkOrSchool.value.startDate?.trim()) {
      basicMsg.value = 'Start date is required'
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
        owner: 'user',
        type: newWorkOrSchool.value.type,
        organization: newWorkOrSchool.value.organization.trim(),
        title: newWorkOrSchool.value.title.trim(),
        startDate: newWorkOrSchool.value.startDate.trim(),
        endDate: newWorkOrSchool.value.endDate?.trim() || null,
        isCurrent: newWorkOrSchool.value.isCurrent,
        description: newWorkOrSchool.value.description?.trim() || null,
        location: newWorkOrSchool.value.location?.trim() || null,
        notes: newWorkOrSchool.value.notes?.trim() || null
      }
    })

    // Reset form
    newWorkOrSchool.value = {
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

    basicMsg.value = isSchool ? 'Education added!' : 'Work experience added!'
    setTimeout(() => { basicMsg.value = '' }, 2000)

    await loadWorkOrSchool()
  } catch (e: any) {
    basicMsg.value = e?.data?.message || e?.message || 'Failed to add entry'
  }
}

// Delete work or school
async function deleteWorkOrSchool(id: string) {
  try {
    await $fetch(`/api/work-or-school/${id}`, {
      method: 'DELETE',
      credentials: 'include',
      headers: {
        Authorization: `Bearer ${auth.accessToken}`
      }
    })

    basicMsg.value = 'Entry deleted!'
    setTimeout(() => { basicMsg.value = '' }, 2000)

    await loadWorkOrSchool()
  } catch (e: any) {
    basicMsg.value = e?.data?.message || e?.message || 'Failed to delete entry'
  }
}

// Load goals
async function loadGoals() {
  try {
    const response = await $fetch<{ goals: Goal[] }>('/api/goals?owner=user', {
      credentials: 'include',
      headers: {
        Authorization: `Bearer ${auth.accessToken}`
      }
    })
    userGoals.value = response.goals || []
  } catch (e) {
    console.error('Failed to load goals:', e)
  }
}

// Add goal
async function addGoal() {
  try {
    if (!newGoal.value.title?.trim()) {
      basicMsg.value = 'Goal title is required'
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
        owner: 'user',
        title: newGoal.value.title.trim(),
        description: newGoal.value.description?.trim() || null,
        category: newGoal.value.category || null,
        priority: newGoal.value.priority || 5,
        timeframe: newGoal.value.timeframe?.trim() || null,
        targetDate: newGoal.value.targetDate?.trim() || null
      }
    })

    // Reset form
    newGoal.value = {
      title: '',
      description: '',
      category: '',
      priority: 5,
      timeframe: '',
      targetDate: ''
    }

    basicMsg.value = 'Goal added!'
    setTimeout(() => { basicMsg.value = '' }, 2000)

    await loadGoals()
  } catch (e: any) {
    basicMsg.value = e?.data?.message || e?.message || 'Failed to add goal'
  }
}

// Delete all memory
async function confirmDeleteMemory() {
  try {
    deletingMemory.value = true
    memoryStatus.value = null
    showDeleteConfirmation.value = false

    const response = await $fetch<{
      ok: boolean
      deleted?: {
        turns: number
        facts: number
        userSummaries: number
      }
      qdrant?: Record<string, any>
      error?: string
    }>('https://gw.cimb.us/memory/reset', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${auth.accessToken}`,
        'Content-Type': 'application/json'
      }
    })

    if (response.ok) {
      memoryStatus.value = {
        type: 'success',
        message: 'All conversations and stored memory have been deleted.'
      }
    } else {
      throw new Error(response.error || 'Failed to delete memory')
    }
  } catch (e: any) {
    memoryStatus.value = {
      type: 'error',
      message: e?.data?.error || e?.data?.message || e?.message || 'Failed to delete memory.'
    }
  } finally {
    deletingMemory.value = false
  }
}

function startEditGoal(goal: Goal) {
  editingGoal.value = { ...goal }
}

function cancelEditGoal() {
  editingGoal.value = null
}

async function saveEditGoal() {
  if (!editingGoal.value) return

  try {
    savingGoal.value = true
    await $fetch(`/api/goals/${editingGoal.value.id}`, {
      method: 'PATCH',
      credentials: 'include',
      headers: {
        Authorization: `Bearer ${auth.accessToken}`,
        'Content-Type': 'application/json'
      },
      body: {
        title: editingGoal.value.title,
        description: editingGoal.value.description,
        category: editingGoal.value.category,
        status: editingGoal.value.status,
        priority: editingGoal.value.priority,
        timeframe: editingGoal.value.timeframe,
        targetDate: editingGoal.value.targetDate
      }
    })

    basicMsg.value = 'Goal updated successfully!'
    setTimeout(() => { basicMsg.value = '' }, 2000)
    editingGoal.value = null
    await loadGoals()
  } catch (e: any) {
    basicMsg.value = e?.data?.message || e?.message || 'Failed to update goal'
    setTimeout(() => { basicMsg.value = '' }, 3000)
  } finally {
    savingGoal.value = false
  }
}

async function deleteGoal(id: string) {
  if (!confirm('Are you sure you want to delete this goal?')) return

  try {
    await $fetch(`/api/goals/${id}`, {
      method: 'DELETE',
      credentials: 'include',
      headers: {
        Authorization: `Bearer ${auth.accessToken}`
      }
    })

    basicMsg.value = 'Goal deleted successfully!'
    setTimeout(() => { basicMsg.value = '' }, 2000)
    await loadGoals()
  } catch (e: any) {
    basicMsg.value = e?.data?.message || e?.message || 'Failed to delete goal'
    setTimeout(() => { basicMsg.value = '' }, 3000)
  }
}

onMounted(async () => {
  //await loadBasicInfo()
  await loadEvents()
  await loadWorkOrSchool()
  await loadGoals()
  await store.fetchProfile()

  // Ensure each section exists BEFORE template binds
  const keys = Object.keys(store.registry || {})
  basicInfo.value.first_name = store.user.first_name || ''
  basicInfo.value.last_name = store.user.last_name || ''
  basicInfo.value.email = store.user.email || ''
  basicInfo.value.birthday = store.user.birthday || ''
  basicInfo.value.timezone = store.user.timezone || detectedTz
  basicInfo.value.city = store.user.city || ''
  basicInfo.value.region = store.user.region || ''
  basicInfo.value.country = store.user.country || ''

      // Load current location (auto-detected)
  currentLocation.value.city = store.user.currentCity || ''
  currentLocation.value.region = store.user.currentRegion || ''
  currentLocation.value.country = store.user.currentCountry || ''

  console.log('keys', keys);
  for (const k of keys) {
    const target = sectionLocal(k)
    const existing = (store.sections?.[k] || {}) as Record<string, string>
    // copy existing answers in
    for (const qid in existing) target[qid] = existing[qid]
  }
})

async function save(key: string) {
  await store.saveSection(key, local[key])
  savedKey.value = '' // clear any single-field "Saved" badge
}

function closeWizard() {
  showWizard.value = false
}
</script>
