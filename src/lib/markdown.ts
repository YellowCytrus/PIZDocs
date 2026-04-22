import MarkdownIt from 'markdown-it'
import anchor from 'markdown-it-anchor'
import mila from 'markdown-it-link-attributes'
import hljs from 'highlight.js'
import { createDocsIndex } from '@/lib/docsIndexer'
import type { DocPage } from '@/types/docs'
import { docsSource } from 'virtual:docs-source'

const docsIndex = createDocsIndex(docsSource)
const md = new MarkdownIt()

function resolveRoute(currentPage: DocPage, href: string): string {
  if (!href || href.startsWith('http')) return href
  if (href.startsWith('/')) return href
  const [rawPath, hash] = href.split('#')
  if (!rawPath) return currentPage.routePath
  if (!rawPath.endsWith('.md')) return href

  const current = currentPage.sourcePath.split('/')
  current.pop()
  const combined = `${current.join('/')}/${rawPath}`.split('/')
  const normalized: string[] = []
  for (const part of combined) {
    if (!part || part === '.') continue
    if (part === '..') {
      normalized.pop()
      continue
    }
    normalized.push(part)
  }
  let route = `/${normalized.join('/').replace(/\.md$/i, '')}`
  if (route === '/README' || route === '/index') route = '/'
  if (route.endsWith('/index')) route = route.slice(0, -'/index'.length) || '/'
  return hash ? `${route}#${hash}` : route
}

export const markdown: MarkdownIt = new MarkdownIt({
  html: true,
  linkify: true,
  highlight: (str: string, lang: string): string => {
    if (lang === 'mermaid') {
      return `<pre><code class="language-mermaid">${md.utils.escapeHtml(str)}</code></pre>`
    }
    if (lang && hljs.getLanguage(lang)) {
      return `<pre class="hljs"><code>${hljs.highlight(str, { language: lang }).value}</code></pre>`
    }
    return `<pre class="hljs"><code>${md.utils.escapeHtml(str)}</code></pre>`
  },
})
  .use(anchor, { permalink: anchor.permalink.headerLink() })
  .use(mila, {
    matcher: (href: string) => href.startsWith('http'),
    attrs: {
      target: '_blank',
      rel: 'noopener',
    },
  })

export function renderMarkdown(page: DocPage): string {
  const wikiExpanded = page.content.replaceAll(/\[\[([^\]]+)\]\]/g, (_, inner: string) => {
    const [targetRaw, labelRaw] = inner.split('|')
    const target = targetRaw.trim()
    const label = labelRaw?.trim() || target
    const href = target.endsWith('.md') ? target : `${target}.md`
    return `[${label}](${href})`
  })
  const rendered = markdown.render(wikiExpanded)
  return rendered.replaceAll(/href="([^"]+\.md(?:#[^"]*)?)"/g, (_: string, href: string) => {
    const resolved = resolveRoute(page, href)
    const [pathOnly] = resolved.split('#')
    if (!docsIndex.pagesByRoute[pathOnly]) {
      return `href="/_fallback/${encodeURIComponent(pathOnly)}"`
    }
    return `href="${resolved}"`
  })
}
