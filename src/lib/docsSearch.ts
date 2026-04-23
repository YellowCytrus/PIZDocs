import MiniSearch from 'minisearch'
import type { DocPage, DocSearchResult } from '@/types/docs'

type SearchDoc = {
  id: string
  title: string
  sourcePath: string
  routePath: string
  content: string
}

const RESULT_LIMIT = 12

function normalizeText(value: string): string {
  return value.toLowerCase().trim()
}

function stripMarkdown(content: string): string {
  return content
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`[^`]*`/g, ' ')
    .replace(/!\[[^\]]*]\([^)]+\)/g, ' ')
    .replace(/\[[^\]]+]\([^)]+\)/g, ' ')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/[*_~>-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

function highlightSlice(text: string, start: number, length: number): string {
  if (length <= 0 || start < 0 || start >= text.length) return escapeHtml(text)
  const safeLength = Math.min(length, text.length - start)
  const before = escapeHtml(text.slice(0, start))
  const highlighted = escapeHtml(text.slice(start, start + safeLength))
  const after = escapeHtml(text.slice(start + safeLength))
  return `${before}<mark>${highlighted}</mark>${after}`
}

function buildSnippet(content: string, query: string): { text: string; highlightStart: number; highlightLength: number } {
  const clean = stripMarkdown(content)
  if (!clean) return { text: '', highlightStart: -1, highlightLength: 0 }

  const normalizedQuery = normalizeText(query)
  const normalizedContent = normalizeText(clean)
  const hitIndex = normalizedContent.indexOf(normalizedQuery)

  if (hitIndex < 0) {
    return {
      text: clean.slice(0, 160),
      highlightStart: -1,
      highlightLength: 0,
    }
  }

  const start = Math.max(0, hitIndex - 60)
  const end = Math.min(clean.length, hitIndex + normalizedQuery.length + 100)
  const prefix = start > 0 ? '...' : ''
  const suffix = end < clean.length ? '...' : ''
  const core = clean.slice(start, end).trim()
  const coreStartOffset = clean.slice(start, end).indexOf(core)
  const prefixLength = prefix.length
  const highlightStart = prefixLength + Math.max(0, hitIndex - start - coreStartOffset)

  return {
    text: `${prefix}${core}${suffix}`,
    highlightStart,
    highlightLength: normalizedQuery.length,
  }
}

function toSearchDoc(page: DocPage): SearchDoc {
  return {
    id: page.id,
    title: page.title,
    sourcePath: page.sourcePath,
    routePath: page.routePath,
    content: stripMarkdown(page.content),
  }
}

function scoreExact(query: string, doc: SearchDoc): number {
  const q = normalizeText(query)
  if (!q) return 0

  const title = normalizeText(doc.title)
  const source = normalizeText(doc.sourcePath)
  const content = normalizeText(doc.content)

  let score = 0
  if (title === q) score += 1000
  if (title.startsWith(q)) score += 450
  if (title.includes(q)) score += 300
  if (source.includes(q)) score += 180
  if (content.includes(q)) score += 120
  return score
}

export function createDocsSearch(pages: DocPage[]) {
  const docs = pages.map(toSearchDoc)
  const docsById = new Map(docs.map((doc) => [doc.id, doc]))

  const miniSearch = new MiniSearch<SearchDoc>({
    idField: 'id',
    fields: ['title', 'sourcePath', 'content'],
    storeFields: ['id', 'title', 'sourcePath', 'routePath', 'content'],
    searchOptions: {
      prefix: true,
      fuzzy: 0.2,
      boost: {
        title: 5,
        sourcePath: 2,
        content: 1,
      },
    },
  })

  miniSearch.addAll(docs)

  const search = (query: string): DocSearchResult[] => {
    const normalized = query.trim()
    if (!normalized) return []

    const exactMatches = docs
      .map((doc) => ({ doc, score: scoreExact(normalized, doc) }))
      .filter((entry) => entry.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, RESULT_LIMIT)
      .map((entry) => {
        const snippet = buildSnippet(entry.doc.content, normalized)
        return {
          id: entry.doc.id,
          title: entry.doc.title,
          routePath: entry.doc.routePath,
          sourcePath: entry.doc.sourcePath,
          snippet: snippet.text,
          snippetHighlighted: highlightSlice(snippet.text, snippet.highlightStart, snippet.highlightLength),
          score: entry.score,
          matchType: 'exact' as const,
        }
      })

    const exactIds = new Set(exactMatches.map((item) => item.id))

    const fuzzyMatches: DocSearchResult[] = miniSearch
      .search(normalized, { combineWith: 'OR' })
      .filter((entry) => !exactIds.has(entry.id))
      .slice(0, RESULT_LIMIT)
      .flatMap((entry) => {
        const doc = docsById.get(entry.id)
        if (!doc) return []
        const snippet = buildSnippet(doc.content, normalized)
        return [
          {
            id: doc.id,
            title: doc.title,
            routePath: doc.routePath,
            sourcePath: doc.sourcePath,
            snippet: snippet.text,
            snippetHighlighted: highlightSlice(snippet.text, snippet.highlightStart, snippet.highlightLength),
            score: entry.score,
            matchType: 'fuzzy',
          },
        ]
      })

    return [...exactMatches, ...fuzzyMatches].slice(0, RESULT_LIMIT)
  }

  return { search }
}
