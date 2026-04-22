<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import { renderMarkdown } from '@/lib/markdown'
import { renderMermaidBlocks } from '@/lib/mermaid'
import type { DocPage } from '@/types/docs'

const props = defineProps<{ page: DocPage }>()
const container = ref<HTMLElement | null>(null)
let revealObserver: IntersectionObserver | null = null

const html = computed(() => renderMarkdown(props.page))

const nextFrame = () =>
  new Promise<void>((resolve) => {
    window.requestAnimationFrame(() => resolve())
  })

const setupReveal = (root: HTMLElement) => {
  revealObserver?.disconnect()

  const candidates = Array.from(root.querySelectorAll<HTMLElement>('h1, h2, h3, p, ul, ol, pre, blockquote, table'))
  if (!candidates.length) return

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  candidates.forEach((node, index) => {
    node.dataset.reveal = ''
    node.style.transitionDelay = `${Math.min(index * 24, 220)}ms`
    if (prefersReducedMotion) node.classList.add('is-visible')
  })

  if (prefersReducedMotion || typeof IntersectionObserver === 'undefined') {
    candidates.forEach((node) => node.classList.add('is-visible'))
    return
  }

  revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible')
          revealObserver?.unobserve(entry.target)
        }
      })
    },
    {
      root: null,
      rootMargin: '0px 0px -8% 0px',
      threshold: 0.08,
    },
  )

  candidates.forEach((node) => revealObserver?.observe(node))
}

watch(
  html,
  async () => {
    await nextTick()
    await nextFrame()
    await nextFrame()
    if (container.value) {
      await renderMermaidBlocks(container.value)
      setupReveal(container.value)
    }
  },
  { immediate: true },
)

onBeforeUnmount(() => {
  revealObserver?.disconnect()
})
</script>

<template>
  <article ref="container" class="doc-content" v-html="html" />
</template>
