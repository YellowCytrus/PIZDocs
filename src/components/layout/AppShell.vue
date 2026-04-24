<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import SidebarTree from '@/components/nav/SidebarTree.vue'
import DocsSearchBox from '@/components/search/DocsSearchBox.vue'

const route = useRoute()
const isSidebarOpen = ref(false)
const theme = ref<'light' | 'dark'>('light')
const themeStorageKey = 'dr-theme'

const isMobileViewport = () => window.matchMedia('(max-width: 1024px)').matches
const sidebarStateClass = computed(() => ({ 'is-mobile-open': isSidebarOpen.value }))
const themeButtonLabel = computed(() => (theme.value === 'dark' ? 'Светлая тема' : 'Тёмная тема'))

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

const applyTheme = (nextTheme: 'light' | 'dark') => {
  document.documentElement.dataset.theme = nextTheme
}

const setTheme = (nextTheme: 'light' | 'dark') => {
  theme.value = nextTheme
  applyTheme(nextTheme)
  window.localStorage.setItem(themeStorageKey, nextTheme)
}

const toggleTheme = () => {
  setTheme(theme.value === 'dark' ? 'light' : 'dark')
}

watch(
  () => route.fullPath,
  () => closeSidebar(),
)

watch(isSidebarOpen, (isOpen) => {
  document.body.classList.toggle('mobile-nav-open', isOpen)
})

window.addEventListener('keydown', handleEscape)

onMounted(() => {
  const savedTheme = window.localStorage.getItem(themeStorageKey)
  if (savedTheme === 'light' || savedTheme === 'dark') {
    theme.value = savedTheme
    applyTheme(savedTheme)
    return
  }

  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
  theme.value = prefersDark ? 'dark' : 'light'
  applyTheme(theme.value)
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleEscape)
  document.body.classList.remove('mobile-nav-open')
})
</script>

<template>
  <div class="app-shell" :class="sidebarStateClass">
    <header class="mobile-topbar">
      <router-link class="brand mobile-brand" to="/">PizDOCs</router-link>
      <DocsSearchBox compact placeholder="Поиск..." />
      <div class="mobile-topbar-actions">
        <button class="theme-toggle" type="button" :aria-label="themeButtonLabel" @click="toggleTheme">
          {{ theme === 'dark' ? '☀️' : '🌙' }}
        </button>
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
      </div>
    </header>
    <aside class="app-sidebar" @click="handleSidebarClick">
      <div class="sidebar-header">
        <router-link class="brand" to="/">PizDOCs</router-link>
        <button class="theme-toggle" type="button" :aria-label="themeButtonLabel" @click="toggleTheme">
          {{ theme === 'dark' ? '☀️' : '🌙' }}
        </button>
      </div>
      <DocsSearchBox />
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
