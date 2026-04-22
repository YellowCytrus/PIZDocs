import { createRouter, createWebHistory } from 'vue-router'
import { docsSource } from 'virtual:docs-source'
import { createDocsIndex } from '@/lib/docsIndexer'
import DocView from '@/views/DocView.vue'
import HomeView from '@/views/HomeView.vue'
import DiagnosticsView from '@/views/DiagnosticsView.vue'
import FallbackView from '@/views/FallbackView.vue'

const index = createDocsIndex(docsSource)
const docRoutes = index.pages
  .filter((page) => page.routePath !== '/')
  .map((page) => ({
    path: page.routePath,
    name: `doc:${page.id}`,
    component: DocView,
    props: { routePath: page.routePath },
  }))

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'home', component: HomeView },
    ...docRoutes,
    { path: '/_diagnostics', name: 'diagnostics', component: DiagnosticsView },
    { path: '/_fallback/:encodedPath(.*)', name: 'fallback', component: FallbackView, props: true },
    { path: '/:pathMatch(.*)*', name: 'doc:directory', component: DocView },
  ],
})
