import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { glob } from 'tinyglobby'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

const virtualModuleId = 'virtual:docs-source'
const resolvedVirtualModuleId = '\0virtual:docs-source'
const projectRoot = process.cwd()
const docsRoot = path.resolve(process.cwd(), process.env.DOCS_ROOT ?? '../docs')

type RawDocSource = {
  path: string
  content: string
}

function docsSourcePlugin() {
  return {
    name: 'docs-source-plugin',
    resolveId(id: string) {
      if (id === virtualModuleId) return resolvedVirtualModuleId
      return null
    },
    async load(id: string) {
      if (id !== resolvedVirtualModuleId) return null
      const files = await glob('**/*.md', { cwd: docsRoot, onlyFiles: true })
      const docs: RawDocSource[] = await Promise.all(
        files.map(async (relativePath) => {
          const absolutePath = path.resolve(docsRoot, relativePath)
          const content = await readFile(absolutePath, 'utf8')
          return {
            path: relativePath.replaceAll('\\', '/'),
            content,
          }
        }),
      )

      return `export const docsRoot = ${JSON.stringify(docsRoot)};
export const docsSource = ${JSON.stringify(docs)};`
    },
  }
}

export default defineConfig({
  plugins: [vue(), docsSourcePlugin()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    port: 5180,
    strictPort: true,
    fs: {
      allow: [projectRoot, docsRoot],
    },
  },
})
