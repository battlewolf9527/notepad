export interface MermaidContainer {
  id: string
  code: string
}

export interface RenderResult {
  html: string
  mermaidContainers: MermaidContainer[]
}

let mermaidInitialized = false
const renderedContainers = new Map<string, string>()

function getMermaidThemeVariables(): Record<string, string> {
  const html = document.documentElement
  const computedStyle = getComputedStyle(html)

  const bgPrimary = computedStyle.getPropertyValue('--bg-primary').trim() || '#ffffff'
  const bgSecondary = computedStyle.getPropertyValue('--bg-secondary').trim() || '#f8f9fa'
  const bgTertiary = computedStyle.getPropertyValue('--bg-tertiary').trim() || '#e9ecef'
  const textPrimary = computedStyle.getPropertyValue('--text-primary').trim() || '#212529'
  const textSecondary = computedStyle.getPropertyValue('--text-secondary').trim() || '#6c757d'
  const accentPrimary = computedStyle.getPropertyValue('--accent-primary').trim() || '#4a90d9'
  const borderMedium = computedStyle.getPropertyValue('--border-medium').trim() || '#ced4da'

  return {
    primaryColor: accentPrimary,
    primaryTextColor: textPrimary,
    primaryBorderColor: borderMedium,
    lineColor: textSecondary,
    secondaryColor: bgSecondary,
    tertiaryColor: bgTertiary,
    backgroundColor: bgPrimary,
    textColor: textPrimary,
    mainBkg: bgPrimary,
    nodeBorder: borderMedium,
    clusterBkg: bgSecondary,
    clusterBorder: borderMedium,
    defaultLinkColor: accentPrimary,
    noteBkg: bgSecondary,
    noteBorder: borderMedium,
    noteTextColor: textPrimary,
  }
}

async function ensureMermaidInitialized(): Promise<void> {
  if (mermaidInitialized) return
  const { default: mermaid } = await import('mermaid')
  mermaid.initialize({
    startOnLoad: false,
    theme: 'base',
    themeVariables: getMermaidThemeVariables(),
  })
  mermaidInitialized = true
}

export async function renderMarkdown(content: string): Promise<RenderResult> {
  const MarkdownIt = await import('markdown-it')
  const { default: katex } = await import('katex')
  const DOMPurify = await import('dompurify')
  await ensureMermaidInitialized()

  const mermaidContainers: MermaidContainer[] = []

  const { default: taskLists } = await import('markdown-it-task-lists')

  const md = new MarkdownIt.default({
    html: true,
    linkify: true,
    typographer: false,
  }).use(taskLists)

  const originalFenceRule = md.renderer.rules.fence

  md.renderer.rules.fence = (tokens, idx, options, env, self) => {
    const token = tokens[idx]
    if (!token) {
      return originalFenceRule
        ? originalFenceRule(tokens, idx, options, env, self)
        : self.renderToken(tokens, idx, options)
    }
    const info = token.info ? md.utils.unescapeAll(token.info).trim() : ''
    const lang = info.split(/\s+/)[0]

    if (lang === 'mermaid') {
      const id = `mermaid-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`
      mermaidContainers.push({ id, code: token.content.trim() })
      return `<div id="${id}" class="mermaid-container"></div>`
    }

    if (originalFenceRule) {
      return originalFenceRule(tokens, idx, options, env, self)
    }

    const content = md.utils.escapeHtml(token.content)
    const langClass = lang ? ` class="language-${lang}"` : ''
    return `<pre><code${langClass}>${content}</code></pre>\n`
  }

  const formulas: { placeholder: string; formula: string; displayMode: boolean }[] = []
  let placeholderIndex = 0

  let processedContent = content

  const blockFormulaRegex = new RegExp('\\$\\$([\\s\\S]*?)\\$\\$', 'g')
  const inlineFormulaRegex = new RegExp('\\$([^$\\n]+)\\$', 'g')

  processedContent = processedContent.replace(blockFormulaRegex, (_match, formula) => {
    const placeholder = `[[KATEX_BLOCK_${placeholderIndex++}]]`
    formulas.push({ placeholder, formula: formula.trim(), displayMode: true })
    return placeholder
  })

  processedContent = processedContent.replace(inlineFormulaRegex, (_match, formula) => {
    const placeholder = `[[KATEX_INLINE_${placeholderIndex++}]]`
    formulas.push({ placeholder, formula: formula.trim(), displayMode: false })
    return placeholder
  })

  let html = md.render(processedContent)

  const purify = DOMPurify.default || DOMPurify
  html = purify.sanitize(html, {
    ADD_TAGS: [
      'svg',
      'path',
      'line',
      'circle',
      'rect',
      'g',
      'polygon',
      'polyline',
      'text',
      'defs',
      'marker',
      'foreignObject',
      'input',
      'label',
    ],
    ADD_ATTR: [
      'class',
      'style',
      'id',
      'viewBox',
      'd',
      'stroke',
      'stroke-width',
      'fill',
      'fill-opacity',
      'stroke-opacity',
      'transform',
      'marker-end',
      'marker-start',
      'marker-mid',
      'xmlns',
      'width',
      'height',
      'x',
      'y',
      'text-anchor',
      'font-size',
      'font-family',
      'clip-path',
      'preserveAspectRatio',
      'aria-hidden',
      'type',
      'checked',
      'disabled',
    ],
  })

  for (const { placeholder, formula, displayMode } of formulas) {
    try {
      const rendered = katex.renderToString(formula, {
        displayMode,
        throwOnError: false,
        output: 'html',
      })
      html = html.split(placeholder).join(rendered)
    } catch {
      html = html.split(placeholder).join(formula)
    }
  }

  return { html, mermaidContainers }
}

export async function renderMermaidContainers(containers: MermaidContainer[]): Promise<void> {
  const { default: mermaid } = await import('mermaid')

  mermaid.initialize({
    startOnLoad: false,
    theme: 'base',
    themeVariables: getMermaidThemeVariables(),
  })

  for (const { id, code } of containers) {
    renderedContainers.set(id, code)
    const container = document.getElementById(id)
    if (container) {
      container.setAttribute('data-mermaid-code', code)
      try {
        const renderId = `m-render-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`
        const { svg } = await mermaid.render(renderId, code)
        container.innerHTML = svg
      } catch {
        const escapedCode = code
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&#39;')
        container.innerHTML = `<pre style="color: var(--text-error)">${escapedCode}</pre>`
      }
    }
  }
}

export async function rerenderMermaidContainers(): Promise<void> {
  const containers: MermaidContainer[] = []
  renderedContainers.forEach((code, id) => {
    containers.push({ id, code })
  })
  await renderMermaidContainers(containers)
}
