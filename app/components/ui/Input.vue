<template>
  <div class="w-full">
    <label v-if="label" :for="inputId" class="label-field">
      {{ label }}
      <span v-if="required" class="text-coral-500">*</span>
    </label>
    <input
      :id="inputId"
      :type="type"
      :name="name"
      :value="modelValue"
      :placeholder="placeholder"
      :required="required"
      :disabled="disabled"
      :autocomplete="autocomplete"
      :class="inputClasses"
      @input="handleInput"
      @blur="$emit('blur', $event)"
      @focus="$emit('focus', $event)"
    />
    <p v-if="error" class="mt-1 text-sm text-coral-500">{{ error }}</p>
    <p v-if="hint && !error" class="mt-1 text-sm text-gray-300">{{ hint }}</p>
  </div>
</template>

<script setup lang="ts">
const props = withDefaults(defineProps<{
  modelValue?: string | number
  type?: string
  name?: string
  label?: string
  placeholder?: string
  error?: string
  hint?: string
  required?: boolean
  disabled?: boolean
  autocomplete?: string
  fullWidth?: boolean
}>(), {
  type: 'text',
  required: false,
  disabled: false,
  fullWidth: true
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
  blur: [event: FocusEvent]
  focus: [event: FocusEvent]
}>()

// Generate unique ID for input
const inputId = computed(() => {
  return props.name || `input-${Math.random().toString(36).substr(2, 9)}`
})

const inputClasses = computed(() => {
  const classes = ['input-field']
  
  if (props.error) {
    classes.push('!border-coral-500 !ring-coral-500/20')
  }
  
  if (props.fullWidth) {
    classes.push('w-full')
  }
  
  return classes.join(' ')
})

const handleInput = (event: Event) => {
  const target = event.target as HTMLInputElement
  emit('update:modelValue', target.value)
}
</script>
