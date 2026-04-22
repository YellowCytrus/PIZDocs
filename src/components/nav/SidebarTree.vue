<script setup lang="ts">
import { useDocsStore } from '@/stores/docs'
import SidebarTreeNode from '@/components/nav/SidebarTreeNode.vue'

const docsStore = useDocsStore()
</script>

<template>
  <nav class="sidebar-tree">
    <ul>
      <SidebarTreeNode v-for="node in docsStore.navTree" :key="node.id" :node="node" />
    </ul>
  </nav>
</template>
