<template>
  <AppShell>
    <router-view v-slot="{ Component, route }">
      <transition name="route-fade" mode="out-in">
        <component :is="Component" :key="route.fullPath" />
      </transition>
    </router-view>
  </AppShell>
</template>

<script setup lang="ts">
import { nextTick, onBeforeUnmount, watch } from 'vue'
import { useRoute } from 'vue-router'
import AppShell from '@/components/layout/AppShell.vue'

const route = useRoute()
let revealObserver: IntersectionObserver | null = null
let revealTimer: number | null = null

const setupRouteReveal = async () => {
  await nextTick()
  revealObserver?.disconnect()

  const candidates = Array.from(document.querySelectorAll<HTMLElement>('[data-reveal]'))
  if (!candidates.length) return

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
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

  candidates.forEach((node) => {
    node.classList.remove('is-visible')
    revealObserver?.observe(node)
  })
}

watch(
  () => route.fullPath,
  () => {
    if (revealTimer !== null) window.clearTimeout(revealTimer)
    // With out-in transitions the next page mounts later, so start reveal after enter.
    revealTimer = window.setTimeout(() => {
      setupRouteReveal()
    }, 260)
  },
  { immediate: true },
)

onBeforeUnmount(() => {
  if (revealTimer !== null) window.clearTimeout(revealTimer)
  revealObserver?.disconnect()
})
</script>
