import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { useStorage } from '@vueuse/core'
import { createDocsIndex } from '@/lib/docsIndexer'
import type { NavNode } from '@/types/docs'
import { docsSource } from 'virtual:docs-source'

export const useDocsStore = defineStore('docs', () => {
  const index = ref(createDocsIndex(docsSource))
  const expanded = useStorage<Record<string, boolean>>('docs-nav-expanded', {})

  const rootPage = computed(() => index.value.rootPage)
  const brokenLinks = computed(() => index.value.brokenLinks)
  const orphanPages = computed(() => index.value.orphanPages)
  const navTree = computed(() => index.value.navTree)

  const hasDiagnostics = computed(() => brokenLinks.value.length > 0 || orphanPages.value.length > 0)

  const toggleNode = (id: string) => {
    expanded.value[id] = !expanded.value[id]
  }

  const isExpanded = (node: NavNode) => expanded.value[node.id] ?? true

  return {
    index,
    rootPage,
    navTree,
    brokenLinks,
    orphanPages,
    hasDiagnostics,
    toggleNode,
    isExpanded,
  }
})
