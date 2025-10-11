<template>
  <div class="prose">
    <h1>Welcome to this nice page</h1>
    <p>Use the nav to go to <NuxtLink to="/facts">Facts</NuxtLink> or <NuxtLink to="/voice">Voice</NuxtLink>.</p>
  </div>
</template>

<script setup lang="ts">
  definePageMeta({ public: true })
</script>