<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useDocsStore } from '@/stores/docs'

const props = withDefaults(
  defineProps<{
    compact?: boolean
    placeholder?: string
  }>(),
  {
    compact: false,
    placeholder: 'Поиск по документации...',
  },
)

const router = useRouter()
const docsStore = useDocsStore()

const containerRef = ref<HTMLElement | null>(null)
const inputRef = ref<HTMLInputElement | null>(null)
const isOpen = ref(false)
const activeIndex = ref(0)

const query = computed({
  get: () => docsStore.searchQuery,
  set: (value: string) => docsStore.runSearch(value),
})

const results = computed(() => docsStore.searchResults)
const showEmptyState = computed(() => query.value.trim().length > 1 && results.value.length === 0)

watch(results, () => {
  activeIndex.value = 0
})

const selectResult = async (routePath: string) => {
  await router.push(routePath)
  docsStore.clearSearch()
  isOpen.value = false
}

const onFocus = () => {
  isOpen.value = true
}

const onKeyDown = async (event: KeyboardEvent) => {
  if (!isOpen.value && event.key !== 'Escape') isOpen.value = true

  if (event.key === 'ArrowDown') {
    if (!results.value.length) return
    event.preventDefault()
    activeIndex.value = (activeIndex.value + 1) % results.value.length
    return
  }

  if (event.key === 'ArrowUp') {
    if (!results.value.length) return
    event.preventDefault()
    activeIndex.value = (activeIndex.value - 1 + results.value.length) % results.value.length
    return
  }

  if (event.key === 'Enter') {
    if (!results.value.length) return
    event.preventDefault()
    const current = results.value[activeIndex.value]
    if (!current) return
    await selectResult(current.routePath)
    return
  }

  if (event.key === 'Escape') {
    isOpen.value = false
    inputRef.value?.blur()
  }
}

const clearQuery = () => {
  docsStore.clearSearch()
  inputRef.value?.focus()
}

const handleDocumentClick = (event: MouseEvent) => {
  const target = event.target as Node | null
  if (!target || !containerRef.value) return
  if (!containerRef.value.contains(target)) isOpen.value = false
}

onMounted(() => {
  document.addEventListener('click', handleDocumentClick)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', handleDocumentClick)
})
</script>

<template>
  <div ref="containerRef" class="docs-search" :class="{ 'is-compact': compact, 'is-open': isOpen }">
    <label class="docs-search__label">
      <span class="docs-search__icon" aria-hidden="true">⌕</span>
      <input
        ref="inputRef"
        v-model="query"
        class="docs-search__input"
        type="search"
        :placeholder="placeholder"
        autocomplete="off"
        spellcheck="false"
        @focus="onFocus"
        @keydown="onKeyDown"
      />
      <button
        v-if="query"
        class="docs-search__clear"
        type="button"
        aria-label="Очистить поиск"
        @click="clearQuery"
      >
        ×
      </button>
    </label>

    <div v-if="isOpen && (results.length > 0 || showEmptyState)" class="docs-search__results" role="listbox">
      <button
        v-for="(item, index) in results"
        :key="item.id"
        class="docs-search__result"
        :class="{ 'is-active': index === activeIndex }"
        type="button"
        @mouseenter="activeIndex = index"
        @click="selectResult(item.routePath)"
      >
        <span class="docs-search__result-title">{{ item.title }}</span>
        <span class="docs-search__result-path">{{ item.sourcePath }}</span>
        <span class="docs-search__result-snippet" v-html="item.snippetHighlighted" />
        <span class="docs-search__result-type">{{ item.matchType }}</span>
      </button>
      <p v-if="showEmptyState" class="docs-search__empty">Ничего не найдено</p>
    </div>
  </div>
</template>
