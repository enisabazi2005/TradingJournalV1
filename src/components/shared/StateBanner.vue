<script setup>
defineProps({
  message: { type: String, required: true },
  variant: { type: String, default: 'default' },
})
</script>

<template>
  <div :class="['state-banner', variant]">
    {{ message }}
  </div>
</template>
