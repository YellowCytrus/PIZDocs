export type RawDocSource = {
  path: string
  content: string
}

export type LinkType = 'relative' | 'wiki'

export type LinkReference = {
  sourcePath: string
  raw: string
  normalizedTarget: string
  hash?: string
  label?: string
  type: LinkType
}

export type BrokenLink = LinkReference & {
  reason: 'missing_target'
}

export type DocPage = {
  id: string
  sourcePath: string
  routePath: string
  title: string
  content: string
}

export type NavNode = {
  id: string
  label: string
  routePath: string
  children: NavNode[]
  hasBrokenLink: boolean
}

export type DocsIndex = {
  pages: DocPage[]
  pagesByRoute: Record<string, DocPage>
  pagesBySource: Record<string, DocPage>
  navTree: NavNode[]
  rootPage: DocPage | null
  orphanPages: DocPage[]
  brokenLinks: BrokenLink[]
  brokenBySource: Record<string, BrokenLink[]>
}
