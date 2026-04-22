<script setup lang="ts">
import SidebarTree from '@/components/nav/SidebarTree.vue'
</script>

<template>
  <div class="app-shell">
    <aside class="app-sidebar">
      <router-link class="brand" to="/">PIZDocs</router-link>
      <SidebarTree />
      <router-link class="diagnostics-link" to="/_diagnostics">Diagnostics</router-link>
    </aside>
    <main class="app-content">
      <slot />
    </main>
  </div>
</template>
