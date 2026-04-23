<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import SidebarTree from '@/components/nav/SidebarTree.vue'

const route = useRoute()
const isSidebarOpen = ref(false)

const isMobileViewport = () => window.matchMedia('(max-width: 1024px)').matches
const sidebarStateClass = computed(() => ({ 'is-mobile-open': isSidebarOpen.value }))

const closeSidebar = () => {
  isSidebarOpen.value = false
}

const toggleSidebar = () => {
  isSidebarOpen.value = !isSidebarOpen.value
}

const handleSidebarClick = (event: MouseEvent) => {
  const target = event.target as HTMLElement | null
  if (!target?.closest('a') || !isMobileViewport()) return
  closeSidebar()
}

const handleEscape = (event: KeyboardEvent) => {
  if (event.key === 'Escape') closeSidebar()
}

watch(
  () => route.fullPath,
  () => closeSidebar(),
)

watch(isSidebarOpen, (isOpen) => {
  document.body.classList.toggle('mobile-nav-open', isOpen)
})

window.addEventListener('keydown', handleEscape)

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleEscape)
  document.body.classList.remove('mobile-nav-open')
})
</script>

<template>
  <div class="app-shell" :class="sidebarStateClass">
    <header class="mobile-topbar">
      <router-link class="brand mobile-brand" to="/">PIZDocs</router-link>
      <button
        class="mobile-menu-toggle"
        type="button"
        :aria-expanded="isSidebarOpen"
        aria-label="Открыть навигацию"
        @click="toggleSidebar"
      >
        <span />
        <span />
        <span />
      </button>
    </header>
    <aside class="app-sidebar" @click="handleSidebarClick">
      <router-link class="brand" to="/">PIZDocs</router-link>
      <SidebarTree />
      <router-link class="diagnostics-link" to="/_diagnostics">Diagnostics</router-link>
    </aside>
    <button
      class="mobile-sidebar-backdrop"
      type="button"
      tabindex="-1"
      aria-hidden="true"
      @click="closeSidebar"
    />
    <main class="app-content">
      <slot />
    </main>
  </div>
</template>
