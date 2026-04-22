<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import DocContent from '@/components/docs/DocContent.vue'
import { useDocsStore } from '@/stores/docs'

const props = defineProps<{ routePath?: string }>()
const router = useRouter()
const docsStore = useDocsStore()

const currentPath = computed(() => {
  const raw = props.routePath ?? router.currentRoute.value.path
  if (raw === '/') return raw
  return raw.replace(/\/+$/, '')
})
const page = computed(() => docsStore.index.pagesByRoute[currentPath.value])
const directoryPages = computed(() => {
  if (page.value) return []
  const prefix = currentPath.value === '/' ? '/' : `${currentPath.value}/`
  return docsStore.index.pages
    .filter((entry) => entry.routePath !== '/' && entry.routePath.startsWith(prefix))
    .sort((a, b) => a.routePath.localeCompare(b.routePath))
})
</script>

<template>
  <DocContent v-if="page" :page="page" />
  <section v-else-if="directoryPages.length" class="directory-view">
    <h1>Раздел: {{ currentPath }}</h1>
    <p>Документы в этой директории:</p>
    <ul>
      <li v-for="item in directoryPages" :key="item.id">
        <router-link :to="item.routePath">{{ item.title }}</router-link>
      </li>
    </ul>
  </section>
  <router-link v-else :to="`/_fallback/${encodeURIComponent(currentPath)}`">Open fallback</router-link>
</template>
