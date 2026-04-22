declare module 'virtual:docs-source' {
  import type { RawDocSource } from '@/types/docs'

  export const docsRoot: string
  export const docsSource: RawDocSource[]
}
