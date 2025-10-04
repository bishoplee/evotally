<script setup lang="ts">
definePageMeta({ ssr: false })
import ClickToTalk from './components/ClickToTalk';
</script>
<template>
  <div class="space-y-4">
    <h2 class="text-xl font-semibold">Voice</h2>
    <ClickToTalk />
    <p class="text-xs text-gray-500">WebRTC to gateway: {{ useRuntimeConfig().public.gatewayUrl }}</p>
  </div>
</template>

