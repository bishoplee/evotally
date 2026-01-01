<template>
  <component
    :is="tag"
    :to="tag === 'NuxtLink' ? to : undefined"
    :href="tag === 'a' ? href : undefined"
    :class="cardClasses"
  >
    <slot />
  </component>
</template>

<script setup lang="ts">
const props = withDefaults(defineProps<{
  hover?: boolean
  tag?: 'div' | 'article' | 'section' | 'NuxtLink' | 'a'
  to?: string | object
  href?: string
  padding?: 'default' | 'sm' | 'lg' | 'none'
}>(), {
  hover: false,
  tag: 'div',
  padding: 'default'
})

const cardClasses = computed(() => {
  const classes = []
  
  // Base card class or hover variant
  if (props.hover) {
    classes.push('card-hover')
  } else {
    classes.push('card')
  }
  
  // Padding variations
  if (props.padding === 'none') {
    classes.push('!p-0')
  } else if (props.padding === 'sm') {
    classes.push('!p-4')
  } else if (props.padding === 'lg') {
    classes.push('!p-8')
  }
  
  // Make it clickable if it's a link
  if (props.tag === 'NuxtLink' || props.tag === 'a') {
    classes.push('cursor-pointer')
  }
  
  return classes.join(' ')
})
</script>
