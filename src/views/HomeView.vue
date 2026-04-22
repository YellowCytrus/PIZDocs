<script setup lang="ts">
import { computed } from 'vue'
import TocIndex from '@/components/nav/TocIndex.vue'
import { useDocsStore } from '@/stores/docs'
import { renderMarkdown } from '@/lib/markdown'

const docsStore = useDocsStore()
const rootPage = computed(() => docsStore.rootPage)
const rootHtml = computed(() => (rootPage.value ? renderMarkdown(rootPage.value) : '<p>Root document not found.</p>'))
</script>

<template>
  <section class="home-view" data-reveal>
    <TocIndex :html="rootHtml" />
  </section>
</template>
