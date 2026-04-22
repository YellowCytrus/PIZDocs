<script setup lang="ts">
import { useDocsStore } from '@/stores/docs'

const docsStore = useDocsStore()
</script>

<template>
  <section class="diagnostics">
    <h1>Diagnostics</h1>
    <p v-if="!docsStore.hasDiagnostics">Проблем с ссылками и сиротами не найдено.</p>

    <section v-if="docsStore.brokenLinks.length">
      <h2>Broken links (скорее всего тут пути к директориям)</h2>
      <ul>
        <li v-for="item in docsStore.brokenLinks" :key="`${item.sourcePath}-${item.raw}`">
          <code>{{ item.sourcePath }}</code> → <code>{{ item.raw }}</code>
        </li>
      </ul>
    </section>

    <section v-if="docsStore.orphanPages.length">
      <h2>Orphan pages</h2>
      <ul>
        <li v-for="page in docsStore.orphanPages" :key="page.id">
          <router-link :to="page.routePath">{{ page.title }}</router-link>
          <code>{{ page.sourcePath }}</code>
        </li>
      </ul>
    </section>
  </section>
</template>
