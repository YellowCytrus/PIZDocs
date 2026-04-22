<script setup lang="ts">
defineProps<{
  html: string
}>()
</script>

<template>
  <section class="toc-index">
    <h2>Оглавление</h2>
    <div v-html="html" />
  </section>
</template>
