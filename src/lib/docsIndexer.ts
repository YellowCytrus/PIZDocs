import type { BrokenLink, DocPage, DocsIndex, LinkReference, NavNode, RawDocSource } from '@/types/docs'

const mdLinkRegex = /\[([^\]]+)\]\(([^)]+)\)/g
const wikiLinkRegex = /\[\[([^\]]+)\]\]/g

function normalizeSourcePath(filePath: string): string {
  return filePath.replaceAll('\\', '/')
}

function stripMdExtension(filePath: string): string {
  return filePath.replace(/\.md$/i, '')
}

function toRoutePath(filePath: string): string {
  const clean = stripMdExtension(normalizeSourcePath(filePath))
  if (clean === 'README' || clean === 'index') return '/'
  if (clean.endsWith('/index')) return `/${clean.slice(0, -'/index'.length)}`
  return `/${clean}`
}

function inferTitle(path: string, content: string): string {
  const h1 = content.match(/^#\s+(.+)$/m)?.[1]?.trim()
  if (h1) return h1
  return stripMdExtension(path.split('/').at(-1) ?? path)
}

function normalizeTargetFromRelative(sourcePath: string, href: string): { normalizedTarget: string; hash?: string } {
  const [rawTarget, hash] = href.split('#')
  const targetPath = rawTarget.trim()
  if (!targetPath) return { normalizedTarget: sourcePath, hash }
  if (!targetPath.endsWith('.md')) return { normalizedTarget: targetPath, hash }

  const sourceParts = sourcePath.split('/')
  sourceParts.pop()
  const targetParts = `${sourceParts.join('/')}/${targetPath}`.split('/')
  const resolved: string[] = []
  for (const part of targetParts) {
    if (!part || part === '.') continue
    if (part === '..') {
      resolved.pop()
      continue
    }
    resolved.push(part)
  }
  return { normalizedTarget: resolved.join('/'), hash }
}

function normalizeTargetFromWiki(rawWiki: string): { normalizedTarget: string; label?: string } {
  const [targetRaw, labelRaw] = rawWiki.split('|')
  let normalizedTarget = targetRaw.trim().replaceAll('\\', '/')
  if (!normalizedTarget.endsWith('.md')) normalizedTarget = `${normalizedTarget}.md`
  return {
    normalizedTarget,
    label: labelRaw?.trim(),
  }
}

function collectReferences(sourcePath: string, content: string): LinkReference[] {
  const refs: LinkReference[] = []
  for (const match of content.matchAll(mdLinkRegex)) {
    const href = match[2]?.trim()
    if (!href || href.startsWith('http://') || href.startsWith('https://') || href.startsWith('mailto:')) continue
    if (href.startsWith('#')) continue
    const resolved = normalizeTargetFromRelative(sourcePath, href)
    refs.push({
      sourcePath,
      raw: href,
      normalizedTarget: normalizeSourcePath(resolved.normalizedTarget),
      hash: resolved.hash,
      label: match[1]?.trim(),
      type: 'relative',
    })
  }

  for (const match of content.matchAll(wikiLinkRegex)) {
    const inner = match[1]?.trim()
    if (!inner) continue
    const resolved = normalizeTargetFromWiki(inner)
    refs.push({
      sourcePath,
      raw: `[[${inner}]]`,
      normalizedTarget: normalizeSourcePath(resolved.normalizedTarget),
      label: resolved.label,
      type: 'wiki',
    })
  }

  return refs
}

function buildNavTree(pages: DocPage[], brokenBySource: Record<string, BrokenLink[]>): NavNode[] {
  const root: NavNode[] = []
  const map = new Map<string, NavNode>()

  for (const page of pages) {
    const parts = stripMdExtension(page.sourcePath).split('/')
    let currentPath = ''
    let children = root
    parts.forEach((part, index) => {
      currentPath = currentPath ? `${currentPath}/${part}` : part
      const nodeId = currentPath
      let node = map.get(nodeId)
      if (!node) {
        const sourcePath = `${currentPath}.md`
        const existing = pages.find((p) => p.sourcePath === sourcePath)
        node = {
          id: nodeId,
          label: existing?.title ?? part,
          routePath: existing?.routePath ?? `/${currentPath}`,
          children: [],
          hasBrokenLink: Boolean(brokenBySource[sourcePath]?.length),
        }
        map.set(nodeId, node)
        children.push(node)
      }
      if (index === parts.length - 1) {
        node.label = page.title
        node.routePath = page.routePath
        node.hasBrokenLink = Boolean(brokenBySource[page.sourcePath]?.length)
      }
      children = node.children
    })
  }
  return root
}

function getReachable(rootPage: DocPage | null, pagesBySource: Record<string, DocPage>, refs: LinkReference[]): Set<string> {
  if (!rootPage) return new Set()
  const edges = new Map<string, string[]>()
  refs.forEach((ref) => {
    const current = edges.get(ref.sourcePath) ?? []
    current.push(ref.normalizedTarget)
    edges.set(ref.sourcePath, current)
  })

  const visited = new Set<string>()
  const queue = [rootPage.sourcePath]
  while (queue.length) {
    const source = queue.shift()
    if (!source || visited.has(source)) continue
    visited.add(source)
    for (const target of edges.get(source) ?? []) {
      if (!pagesBySource[target] || visited.has(target)) continue
      queue.push(target)
    }
  }
  return visited
}

export function createDocsIndex(source: RawDocSource[]): DocsIndex {
  const pages = source
    .map((item) => {
      const sourcePath = normalizeSourcePath(item.path)
      return {
        id: sourcePath,
        sourcePath,
        routePath: toRoutePath(sourcePath),
        title: inferTitle(sourcePath, item.content),
        content: item.content,
      } satisfies DocPage
    })
    .sort((a, b) => a.sourcePath.localeCompare(b.sourcePath))

  const pagesByRoute = Object.fromEntries(pages.map((page) => [page.routePath, page]))
  const pagesBySource = Object.fromEntries(pages.map((page) => [page.sourcePath, page]))
  const references = pages.flatMap((page) => collectReferences(page.sourcePath, page.content))

  const brokenLinks = references
    .filter((ref) => !pagesBySource[ref.normalizedTarget])
    .map((ref) => ({ ...ref, reason: 'missing_target' } satisfies BrokenLink))

  const brokenBySource = brokenLinks.reduce<Record<string, BrokenLink[]>>((acc, broken) => {
    const list = acc[broken.sourcePath] ?? []
    list.push(broken)
    acc[broken.sourcePath] = list
    return acc
  }, {})

  const rootPage =
    pagesBySource['README.md'] ??
    pagesBySource['index.md'] ??
    pages.find((page) => page.routePath === '/') ??
    pages[0] ??
    null

  const reachable = getReachable(rootPage, pagesBySource, references)
  const orphanPages = pages.filter((page) => rootPage && page.sourcePath !== rootPage.sourcePath && !reachable.has(page.sourcePath))
  const navTree = buildNavTree(pages, brokenBySource)

  return {
    pages,
    pagesByRoute,
    pagesBySource,
    navTree,
    rootPage,
    orphanPages,
    brokenLinks,
    brokenBySource,
  }
}
