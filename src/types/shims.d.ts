declare module 'markdown-it-link-attributes' {
  import type MarkdownIt from 'markdown-it'

  type LinkAttrsOptions = {
    matcher?: (link: string) => boolean
    attrs?: Record<string, string>
  }

  const plugin: (md: MarkdownIt, options?: LinkAttrsOptions) => void
  export default plugin
}
