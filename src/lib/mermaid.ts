import mermaid from 'mermaid'

let initialized = false
let viewerInitialized = false

type MermaidViewerState = {
  overlay: HTMLDivElement
  canvas: HTMLDivElement
  scale: number
  translateX: number
  translateY: number
  dragging: boolean
  dragStartX: number
  dragStartY: number
}

let viewerState: MermaidViewerState | null = null

export function initMermaid() {
  if (initialized) return
  mermaid.initialize({
    startOnLoad: false,
    securityLevel: 'loose',
    theme: 'default',
  })
  initialized = true
}

function applyViewerTransform(state: MermaidViewerState) {
  const svg = state.canvas.querySelector('svg')
  if (!svg) return
  ;(svg as SVGSVGElement).style.transform = `translate(${state.translateX}px, ${state.translateY}px) scale(${state.scale})`
}

function closeViewer() {
  if (!viewerState) return
  viewerState.overlay.classList.remove('open')
  viewerState.canvas.innerHTML = ''
}

function openViewer(svgMarkup: string) {
  if (!viewerState) return
  viewerState.scale = 1
  viewerState.translateX = 0
  viewerState.translateY = 0
  viewerState.dragging = false
  viewerState.canvas.innerHTML = svgMarkup
  const svg = viewerState.canvas.querySelector('svg')
  if (svg) {
    ;(svg as SVGSVGElement).style.transformOrigin = 'center center'
    ;(svg as SVGSVGElement).style.transformBox = 'fill-box'
  }
  applyViewerTransform(viewerState)
  viewerState.overlay.classList.add('open')
}

function initViewer() {
  if (viewerInitialized) return
  const overlay = document.createElement('div')
  overlay.className = 'mermaid-lightbox'
  overlay.innerHTML = `
    <div class="mermaid-lightbox__backdrop" data-role="close"></div>
    <div class="mermaid-lightbox__frame">
      <button class="mermaid-lightbox__close" type="button" aria-label="Close Mermaid viewer" data-role="close">&times;</button>
      <div class="mermaid-lightbox__hint">Wheel: zoom, drag with left mouse button: pan</div>
      <div class="mermaid-lightbox__canvas"></div>
    </div>
  `
  document.body.append(overlay)

  const canvas = overlay.querySelector('.mermaid-lightbox__canvas')
  if (!(canvas instanceof HTMLDivElement)) return

  viewerState = {
    overlay,
    canvas,
    scale: 1,
    translateX: 0,
    translateY: 0,
    dragging: false,
    dragStartX: 0,
    dragStartY: 0,
  }

  overlay.addEventListener('click', (event) => {
    const target = event.target as HTMLElement
    if (target.closest('[data-role="close"]')) closeViewer()
  })

  overlay.addEventListener('wheel', (event) => {
    if (!viewerState || !viewerState.overlay.classList.contains('open')) return
    event.preventDefault()
    const delta = event.deltaY < 0 ? 1.1 : 0.9
    viewerState.scale = Math.min(6, Math.max(0.2, viewerState.scale * delta))
    applyViewerTransform(viewerState)
  })

  canvas.addEventListener('mousedown', (event) => {
    if (!viewerState || event.button !== 0) return
    viewerState.dragging = true
    viewerState.dragStartX = event.clientX - viewerState.translateX
    viewerState.dragStartY = event.clientY - viewerState.translateY
    canvas.classList.add('is-dragging')
  })

  window.addEventListener('mousemove', (event) => {
    if (!viewerState || !viewerState.dragging) return
    viewerState.translateX = event.clientX - viewerState.dragStartX
    viewerState.translateY = event.clientY - viewerState.dragStartY
    applyViewerTransform(viewerState)
  })

  window.addEventListener('mouseup', () => {
    if (!viewerState || !viewerState.dragging) return
    viewerState.dragging = false
    canvas.classList.remove('is-dragging')
  })

  window.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') closeViewer()
  })

  viewerInitialized = true
}

export async function renderMermaidBlocks(root: HTMLElement) {
  initMermaid()
  initViewer()
  const blocks = root.querySelectorAll('pre code.language-mermaid')
  await Promise.all(
    Array.from(blocks).map(async (block, index) => {
      const source = block.textContent ?? ''
      const container = block.closest('pre')
      if (!container) return
      try {
        const { svg } = await mermaid.render(`mmd-${index}-${Date.now()}`, source)
        const wrapper = document.createElement('div')
        wrapper.className = 'mermaid-diagram'
        wrapper.innerHTML = svg
        wrapper.tabIndex = 0
        wrapper.setAttribute('role', 'button')
        wrapper.setAttribute('aria-label', 'Open Mermaid diagram viewer')
        wrapper.addEventListener('click', () => openViewer(svg))
        wrapper.addEventListener('keydown', (event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault()
            openViewer(svg)
          }
        })
        container.replaceWith(wrapper)
      } catch (error) {
        const fallback = document.createElement('div')
        fallback.className = 'mermaid-error'
        fallback.textContent = `Mermaid render error: ${(error as Error).message}`
        container.replaceWith(fallback)
      }
    }),
  )
}
