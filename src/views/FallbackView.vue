<script setup lang="ts">
const props = defineProps<{ encodedPath: string }>()
</script>

<template>
  <section class="fallback-view" data-reveal>
    <h1>Страница не найдена</h1>
    <p>Для этой ссылки не найден документ.</p>
    <p>Запрошенный путь: <code>{{ decodeURIComponent(props.encodedPath) }}</code></p>
    <router-link to="/_diagnostics">Перейти в диагностику</router-link>
  </section>
</template>
