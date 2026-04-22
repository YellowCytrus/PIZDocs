<script setup lang="ts">
import { computed } from 'vue'
import { useDocsStore } from '@/stores/docs'
import type { NavNode } from '@/types/docs'

const props = defineProps<{ node: NavNode }>()
const docsStore = useDocsStore()

const expanded = computed(() => docsStore.isExpanded(props.node))
const hasChildren = computed(() => props.node.children.length > 0)
</script>

<template>
  <li class="sidebar-node">
    <div class="node-line">
      <button v-if="hasChildren" class="toggle" @click="docsStore.toggleNode(node.id)">
        {{ expanded ? '▾' : '▸' }}
      </button>
      <span v-else class="toggle-placeholder" />
      <router-link :to="node.routePath" class="node-link">
        {{ node.label }}
      </router-link>
      <span v-if="node.hasBrokenLink" class="warning-dot" title="Contains broken links">!</span>
    </div>
    <ul v-if="hasChildren && expanded">
      <SidebarTreeNode v-for="child in node.children" :key="child.id" :node="child" />
    </ul>
  </li>
</template>
