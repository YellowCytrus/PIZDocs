<script setup lang="ts">
import { computed } from 'vue'
import { useDocsStore } from '@/stores/docs'
import type { NavNode } from '@/types/docs'

const props = withDefaults(
  defineProps<{
    node: NavNode
    depth?: number
    index?: number
    siblingCount?: number
  }>(),
  {
    depth: 0,
    index: 0,
    siblingCount: 1,
  },
)
const docsStore = useDocsStore()

const expanded = computed(() => docsStore.isExpanded(props.node))
const hasChildren = computed(() => props.node.children.length > 0)
</script>

<template>
  <li
    class="sidebar-node"
    :style="{
      '--tree-depth': String(depth),
      '--dr-depth': String(depth),
      '--dr-node-index': String(index),
      '--dr-node-index-reverse': String(Math.max(0, siblingCount - index - 1)),
      '--dr-sibling-count': String(siblingCount),
    }"
  >
    <div class="node-line">
      <button
        v-if="hasChildren"
        class="toggle"
        :class="{ 'is-expanded': expanded }"
        type="button"
        :aria-label="expanded ? `Свернуть ${node.label}` : `Развернуть ${node.label}`"
        @click="docsStore.toggleNode(node.id)"
      >
        <span class="toggle-chevron" aria-hidden="true" />
      </button>
      <span v-else class="toggle-placeholder" />
      <router-link :to="node.routePath" class="node-link">
        <span class="node-link-text">{{ node.label }}</span>
      </router-link>
    </div>
    <transition name="tree-expand">
      <ul
        v-if="hasChildren && expanded"
        :style="{ '--dr-sibling-count': String(node.children.length) }"
      >
        <SidebarTreeNode
          v-for="(child, childIndex) in node.children"
          :key="child.id"
          :node="child"
          :depth="depth + 1"
          :index="childIndex"
          :sibling-count="node.children.length"
        />
      </ul>
    </transition>
  </li>
</template>
