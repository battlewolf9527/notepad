import { renderTemplate } from './template'
import { generateThemeStyles, generateCustomThemeStyles, getHtmlClass } from './theme'

const PASSWORD_FORM_TEMPLATE = `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <title>Password Required</title>
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        background: #1a1a2e;
        min-height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .container {
        background: #16213e;
        padding: 40px;
        border-radius: 12px;
        box-shadow: 0 10px 40px rgba(0,0,0,0.3);
        text-align: center;
        min-width: 320px;
      }
      h2 {
        color: #fff;
        margin-bottom: 20px;
        font-size: 20px;
      }
      form {
        margin-top: 20px;
      }
      input[type="password"] {
        padding: 12px 16px;
        font-size: 16px;
        width: 100%;
        border: 1px solid #4a5568;
        border-radius: 8px;
        background: #2d3748;
        color: #fff;
        outline: none;
        transition: border-color 0.2s;
      }
      input[type="password"]:focus {
        border-color: #6ba3e0;
      }
      input[type="password"]::placeholder {
        color: #718096;
      }
      button[type="submit"] {
        margin-top: 16px;
        padding: 12px 32px;
        font-size: 16px;
        font-weight: 500;
        border: none;
        border-radius: 8px;
        background: #6ba3e0;
        color: white;
        cursor: pointer;
        width: 100%;
        transition: background 0.2s;
      }
      button[type="submit"]:hover {
        background: #5a93d0;
      }
      .error {
        color: #fca5a5;
        margin-top: 12px;
        font-size: 14px;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <h2>This file is password protected</h2>
      <form action="/view/{{token}}/auth" method="post">
        <input type="password" name="password" placeholder="Enter password" required>
        <button type="submit">Submit</button>
        <div class="error" id="error" style="display:none;">Incorrect password</div>
      </form>
    </div>
    <script>
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('error')) {
        document.getElementById('error').style.display = 'block';
      }
    </script>
  </body>
</html>`

const VIEW_PAGE_TEMPLATE = `<!DOCTYPE html>
<html class="{{htmlClass}}">
  <head>
    <meta charset="utf-8">
    <title>{{filename}}</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.17.0/dist/katex.min.css">
    <style>
      {{themeStyles}}
      * { margin: 0; padding: 0; box-sizing: border-box; }
      :root { --base-font-size: {{fontSize}}px; }
      body {
        font-family: '{{fontFamily}}', 'Courier New', 'Lucida Console', monospace;
        font-size: var(--base-font-size);
        background: var(--bg-primary);
        color: var(--text-primary);
        min-height: 100vh;
        margin: 0;
        padding: 0;
      }
      .header {
        background: var(--bg-secondary);
        padding: 8px 16px;
        border-bottom: 1px solid var(--border-light);
        display: flex;
        align-items: center;
        justify-content: space-between;
        position: sticky;
        top: 0;
        z-index: 100;
        font-size: calc(var(--base-font-size) * 0.9);
      }
      .filename {
        font-weight: 500;
        color: var(--text-primary);
      }
      .view-toggle {
        font-size: calc(var(--base-font-size) * 0.8);
        padding: 2px 8px;
        border-radius: 3px;
        background: rgba(100, 149, 237, 0.15);
        color: var(--accent-primary);
        border: 1px solid rgba(100, 149, 237, 0.25);
        cursor: pointer;
        transition: all 0.2s;
        font-family: inherit;
      }
      .view-toggle:hover {
        background: rgba(100, 149, 237, 0.25);
        border-color: rgba(100, 149, 237, 0.4);
      }
      .theme-dropdown {
        position: relative;
        display: inline-block;
      }
      .theme-toggle {
        font-size: calc(var(--base-font-size) * 0.8);
        padding: 2px 8px;
        border-radius: 3px;
        background: rgba(100, 149, 237, 0.15);
        color: var(--accent-primary);
        border: 1px solid rgba(100, 149, 237, 0.25);
        cursor: pointer;
        transition: all 0.2s;
        font-family: inherit;
      }
      .theme-toggle:hover {
        background: rgba(100, 149, 237, 0.25);
        border-color: rgba(100, 149, 237, 0.4);
      }
      .theme-menu {
        position: absolute;
        top: 100%;
        right: 0;
        margin-top: 4px;
        background: var(--bg-secondary);
        border: 1px solid var(--border-light);
        border-radius: 4px;
        box-shadow: var(--shadow-lg);
        min-width: 120px;
        padding: 2px;
        display: none;
        z-index: 1000;
      }
      .theme-menu.show {
        display: block;
      }
      .theme-option {
        width: 100%;
        padding: 6px 12px;
        text-align: left;
        border: none;
        background: transparent;
        color: var(--text-primary);
        cursor: pointer;
        border-radius: 3px;
        font-size: calc(var(--base-font-size) * 0.85);
        font-family: inherit;
        transition: background 0.15s;
        display: flex;
        align-items: center;
        gap: 8px;
      }
      .theme-option:hover {
        background: var(--bg-tertiary);
      }
      .theme-option .check {
        visibility: hidden;
        color: var(--accent-primary);
        font-weight: bold;
        min-width: 16px;
        display: inline-block;
      }
      .theme-option.active .check {
        visibility: visible;
      }
      .theme-divider {
        height: 1px;
        background: var(--border-light);
        margin: 4px 8px;
      }
      .zoom-control-container {
        display: flex;
        align-items: center;
        gap: 4px;
        padding: 2px 4px;
        background: rgba(0,0,0,0.1);
        border-radius: 4px;
      }
      .zoom-btn {
        width: 22px;
        height: 22px;
        border: none;
        background: transparent;
        color: var(--text-secondary);
        cursor: pointer;
        border-radius: 3px;
        transition: all 0.15s;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: calc(var(--base-font-size) * 0.7);
      }
      .zoom-btn:hover:not(:disabled) {
        background: var(--bg-tertiary);
        color: var(--text-primary);
      }
      .zoom-btn:disabled {
        opacity: 0.4;
        cursor: not-allowed;
      }
      .zoom-display {
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 0 4px;
      }
      .zoom-slider {
        width: 50px;
        height: 3px;
        -webkit-appearance: none;
        appearance: none;
        background: var(--border-light);
        border-radius: 2px;
        cursor: pointer;
      }
      .zoom-slider::-webkit-slider-thumb {
        -webkit-appearance: none;
        appearance: none;
        width: 10px;
        height: 10px;
        background: var(--accent-primary);
        border-radius: 50%;
        cursor: pointer;
      }
      .zoom-slider::-moz-range-thumb {
        width: 10px;
        height: 10px;
        background: var(--accent-primary);
        border-radius: 50%;
        cursor: pointer;
        border: none;
      }
      .zoom-percentage {
        font-size: calc(var(--base-font-size) * 0.8);
        font-weight: 500;
        color: var(--text-primary);
        min-width: 32px;
        text-align: right;
      }
      .content {
        padding: 8px 16px;
        width: 100%;
        line-height: 1.6;
      }
      .content p {
        margin-bottom: 16px;
      }
      .content h1, .content h2, .content h3 {
        margin: 24px 0 12px;
        color: var(--text-primary);
        font-weight: 600;
      }
      .content h1 { font-size: calc(var(--base-font-size) * 1.7); border-bottom: 1px solid var(--border-light); padding-bottom: 8px; }
      .content h2 { font-size: calc(var(--base-font-size) * 1.4); }
      .content h3 { font-size: calc(var(--base-font-size) * 1.3); }
      .content ul, .content ol {
        padding-left: 24px;
        margin-bottom: 16px;
      }
      .content li {
        margin-bottom: 8px;
      }
      .content blockquote {
        border-left: 4px solid var(--border-light);
        margin: 16px 0;
        padding: 0 16px;
        color: var(--text-secondary);
        font-style: italic;
        background: var(--bg-secondary);
      }
      .content code {
        font-family: '{{fontFamily}}', 'Courier New', monospace;
        background: var(--bg-tertiary);
        padding: 1px 4px;
        border-radius: 2px;
        font-size: calc(var(--base-font-size) * 0.9);
      }
      .content pre {
        background: var(--bg-secondary);
        padding: 8px;
        border-radius: 0;
        overflow-x: auto;
        margin: 8px 0;
        border: 1px solid var(--border-light);
      }
      .content pre code {
        background: none;
        padding: 0;
        font-size: calc(var(--base-font-size) * 0.9);
        line-height: 1.6;
      }
      .content table {
        width: 100%;
        border-collapse: collapse;
        margin: 16px 0;
        font-size: var(--base-font-size);
      }
      .content th, .content td {
        border: 1px solid var(--border-light);
        padding: 10px 14px;
        text-align: left;
      }
      .content th {
        background: var(--bg-secondary);
        font-weight: 600;
      }
      .content tr:hover td {
        background: rgba(107, 163, 224, 0.05);
      }
      .content a {
        color: var(--accent-primary);
        text-decoration: none;
      }
      .content a:hover {
        text-decoration: underline;
      }
      .content img {
        max-width: 100%;
        border-radius: 8px;
        margin: 16px 0;
      }
      .content hr {
        border: none;
        border-top: 1px solid var(--border-light);
        margin: 24px 0;
      }
      .mermaid-container {
        margin: 16px 0;
      }
      .mermaid-container svg {
        max-width: 100%;
        height: auto;
        color: inherit;
      }
      .mermaid-container svg text {
        fill: currentColor !important;
      }
      .content input[type="checkbox"] {
        margin-right: 8px;
        cursor: default;
      }
      .content li.task-list-item {
        list-style: none;
      }
      .content li.task-list-item label {
        display: flex;
        align-items: center;
        cursor: default;
      }
      .content li.task-list-item.task-list-item-done label {
        text-decoration: line-through;
        color: var(--text-muted);
      }
      .text-view {
        background: var(--bg-primary);
      }
      .text-view .code-container {
        display: flex;
        background: var(--bg-primary);
        border: none;
        overflow: hidden;
      }
      .text-view .line-numbers {
        padding: 8px 6px;
        background: var(--bg-secondary);
        color: var(--text-muted);
        font-family: '{{fontFamily}}', 'Courier New', monospace;
        font-size: var(--base-font-size);
        line-height: 1.6;
        text-align: right;
        user-select: none;
        min-width: 40px;
        border-right: 1px solid var(--border-light);
      }
      .text-view .line-numbers span {
        display: block;
        counter-increment: line;
      }
      .text-view .line-numbers span::before {
        content: counter(line);
      }
      .text-view pre {
        flex: 1;
        white-space: pre-wrap;
        word-break: break-all;
        font-family: '{{fontFamily}}', 'Courier New', monospace;
        font-size: var(--base-font-size);
        line-height: 1.6;
        background: var(--bg-primary);
        padding: 8px;
        margin: 0;
        border: none;
        border-radius: 0;
      }
      .loading {
        display: flex;
        align-items: center;
        justify-content: center;
        height: 200px;
        color: var(--text-muted);
      }
      .loading::after {
        content: '';
        width: 20px;
        height: 20px;
        border: 2px solid var(--border-light);
        border-top-color: var(--accent-primary);
        border-radius: 50%;
        animation: spin 1s linear infinite;
        margin-left: 8px;
      }
      @keyframes spin {
        to { transform: rotate(360deg); }
      }
    </style>
    {{customThemeStyles}}
  </head>
  <body>
    <div class="header">
      <span class="filename">{{filename}}</span>
      <div style="display: flex; align-items: center; gap: 8px;">
        <div class="theme-dropdown">
          <button class="theme-toggle" id="themeToggle" onclick="toggleThemeDropdown()">配色</button>
          <div class="theme-menu" id="themeMenu">
            <button class="theme-option" data-theme="light" onclick="setTheme('light')"><span class="check">✓</span>浅色</button>
            <button class="theme-option" data-theme="dark" onclick="setTheme('dark')"><span class="check">✓</span>深色</button>
            <button class="theme-option" data-theme="deep-blue" onclick="setTheme('deep-blue')"><span class="check">✓</span>深海蓝</button>
            <button class="theme-option" data-theme="eye-green" onclick="setTheme('eye-green')"><span class="check">✓</span>护眼绿</button>
            <button class="theme-option" data-theme="rose" onclick="setTheme('rose')"><span class="check">✓</span>玫瑰红</button>
            <button class="theme-option" data-theme="amber" onclick="setTheme('amber')"><span class="check">✓</span>琥珀橙</button>
            <button class="theme-option" data-theme="purple" onclick="setTheme('purple')"><span class="check">✓</span>紫罗兰</button>
            <div class="theme-divider"></div>
            <button class="theme-option" data-theme="custom" onclick="setTheme('custom')"><span class="check">✓</span>自定义</button>
          </div>
        </div>
        <button class="view-toggle" id="viewToggle" onclick="toggleView()">Markdown</button>
        <div class="zoom-control-container">
          <button class="zoom-btn" id="zoomOut" onclick="zoomOut()" title="缩小">−</button>
          <div class="zoom-display">
            <input type="range" min="50" max="200" step="10" value="100" id="zoomSlider" oninput="handleZoomInput(this.value)">
            <span class="zoom-percentage" id="zoomPercentage">100%</span>
          </div>
          <button class="zoom-btn" id="zoomIn" onclick="zoomIn()" title="放大">+</button>
          <button class="zoom-btn" id="zoomReset" onclick="resetZoom()" title="重置">⟲</button>
        </div>
      </div>
    </div>
    <div id="appData" style="display:none;" data-font-size="{{fontSize}}" data-theme="{{theme}}" data-custom-theme="{{customThemeBase64}}"></div>
    <div class="content markdown-view" id="markdownView">
      <div class="loading">Loading...</div>
    </div>
    <div class="content text-view" id="textView" style="display: none;">
      {{textContent}}
    </div>
    <script type="application/base64" id="markdownContent">{{markdownContentBase64}}</script>
    <script type="module">
      async function init() {
        const contentEl = document.getElementById('markdownContent')
        if (!contentEl) return

        const content = decodeURIComponent(atob(contentEl.textContent || ''))

        try {
          const { renderMarkdown, renderMermaidContainers } = await import('/assets/markdown-renderer.js')
          const { html, mermaidContainers } = await renderMarkdown(content)

          const markdownView = document.getElementById('markdownView')
          if (markdownView) {
            markdownView.innerHTML = html
          }

          await renderMermaidContainers(mermaidContainers)
        } catch (e) {
          console.error('Failed to load markdown renderer:', e)
          const markdownView = document.getElementById('markdownView')
          if (markdownView) {
            const escaped = content.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;')
            markdownView.innerHTML = '<pre>' + escaped + '</pre>'
          }
        }
      }

      init()
    </script>
    <script>
      function toggleView() {
        const toggle = document.getElementById('viewToggle')
        const markdownView = document.getElementById('markdownView')
        const textView = document.getElementById('textView')
        if (!toggle || !markdownView || !textView) return

        const isMarkdown = toggle.textContent === 'Markdown'
        if (isMarkdown) {
          toggle.textContent = 'Plain Text'
          markdownView.style.display = 'none'
          textView.style.display = 'block'
        } else {
          toggle.textContent = 'Markdown'
          markdownView.style.display = 'block'
          textView.style.display = 'none'
        }
      }

      let currentTheme = ''
      let customThemeData = null

      function toggleThemeDropdown() {
        const menu = document.getElementById('themeMenu')
        if (menu) {
          menu.classList.toggle('show')
          updateThemeMenuSelection()
        }
      }

      function updateThemeMenuSelection() {
        const options = document.querySelectorAll('.theme-option')
        options.forEach(opt => {
          opt.classList.remove('active')
          if (opt.getAttribute('data-theme') === currentTheme) {
            opt.classList.add('active')
          }
        })
      }

      function applyCustomThemeStyles() {
        const html = document.documentElement
        if (customThemeData) {
          html.style.setProperty('--bg-primary', customThemeData.bgPrimary || '')
          html.style.setProperty('--bg-secondary', customThemeData.bgSecondary || '')
          html.style.setProperty('--bg-tertiary', customThemeData.bgTertiary || '')
          html.style.setProperty('--bg-error', customThemeData.bgError || '')
          html.style.setProperty('--text-primary', customThemeData.textPrimary || '')
          html.style.setProperty('--text-secondary', customThemeData.textSecondary || '')
          html.style.setProperty('--text-muted', customThemeData.textMuted || '')
          html.style.setProperty('--text-error', customThemeData.textError || '')
          html.style.setProperty('--border-light', customThemeData.borderLight || '')
          html.style.setProperty('--border-medium', customThemeData.borderMedium || '')
          html.style.setProperty('--border-error', customThemeData.borderError || '')
          html.style.setProperty('--accent-primary', customThemeData.accentPrimary || '')
          html.style.setProperty('--accent-secondary', customThemeData.accentSecondary || '')
          html.style.setProperty('--accent-hover', customThemeData.accentHover || '')
          html.style.setProperty('--shadow-sm', customThemeData.shadowSm || '')
          html.style.setProperty('--shadow-md', customThemeData.shadowMd || '')
          html.style.setProperty('--shadow-lg', customThemeData.shadowLg || '')
        }
      }

      function clearCustomThemeStyles() {
        const html = document.documentElement
        html.style.removeProperty('--bg-primary')
        html.style.removeProperty('--bg-secondary')
        html.style.removeProperty('--bg-tertiary')
        html.style.removeProperty('--bg-error')
        html.style.removeProperty('--text-primary')
        html.style.removeProperty('--text-secondary')
        html.style.removeProperty('--text-muted')
        html.style.removeProperty('--text-error')
        html.style.removeProperty('--border-light')
        html.style.removeProperty('--border-medium')
        html.style.removeProperty('--border-error')
        html.style.removeProperty('--accent-primary')
        html.style.removeProperty('--accent-secondary')
        html.style.removeProperty('--accent-hover')
        html.style.removeProperty('--shadow-sm')
        html.style.removeProperty('--shadow-md')
        html.style.removeProperty('--shadow-lg')
      }

      async function setTheme(theme) {
        const html = document.documentElement
        const menu = document.getElementById('themeMenu')

        html.classList.remove('light', 'dark', 'deep-blue', 'eye-green', 'rose', 'amber', 'purple', 'custom')
        html.classList.add(theme)
        currentTheme = theme

        if (theme === 'custom') {
          applyCustomThemeStyles()
        } else {
          clearCustomThemeStyles()
        }

        updateThemeMenuSelection()

        if (menu) {
          menu.classList.remove('show')
        }

        try {
          const { renderMermaidContainers } = await import('/assets/markdown-renderer.js')
          const containers = []
          document.querySelectorAll('.mermaid-container').forEach((container) => {
            const code = container.getAttribute('data-mermaid-code')
            if (code) {
              containers.push({ id: container.id, code })
            }
          })
          await renderMermaidContainers(containers)
        } catch {
        }
      }

      function initTheme() {
        const appData = document.getElementById('appData')
        if (appData) {
          currentTheme = appData.getAttribute('data-theme') || 'light'
          const customThemeBase64 = appData.getAttribute('data-custom-theme')
          if (customThemeBase64) {
            try {
              customThemeData = JSON.parse(decodeURIComponent(atob(customThemeBase64)))
            } catch (e) {
              console.error('Failed to parse custom theme:', e)
            }
          }
          updateThemeMenuSelection()
        }
      }

      initTheme()

      document.addEventListener('click', function(event) {
        const dropdown = document.querySelector('.theme-dropdown')
        const menu = document.getElementById('themeMenu')
        if (menu && !dropdown.contains(event.target)) {
          menu.classList.remove('show')
        }
      })

      let currentZoom = 100
      const appData = document.getElementById('appData')
      const baseFontSize = appData ? parseInt(appData.getAttribute('data-font-size') || '14') : 14

      function updateZoomDisplay() {
        const slider = document.getElementById('zoomSlider')
        const percentage = document.getElementById('zoomPercentage')
        const zoomOut = document.getElementById('zoomOut')
        const zoomIn = document.getElementById('zoomIn')
        const zoomReset = document.getElementById('zoomReset')

        if (slider) slider.value = currentZoom.toString()
        if (percentage) percentage.textContent = currentZoom + '%'
        if (zoomOut) zoomOut.disabled = currentZoom <= 50
        if (zoomIn) zoomIn.disabled = currentZoom >= 200
        if (zoomReset) zoomReset.disabled = currentZoom === 100

        document.documentElement.style.setProperty('--base-font-size', (baseFontSize * currentZoom / 100) + 'px')
      }

      function zoomIn() {
        if (currentZoom < 200) {
          currentZoom += 10
          updateZoomDisplay()
        }
      }

      function zoomOut() {
        if (currentZoom > 50) {
          currentZoom -= 10
          updateZoomDisplay()
        }
      }

      function resetZoom() {
        currentZoom = 100
        updateZoomDisplay()
      }

      function handleZoomInput(value) {
        currentZoom = parseInt(value)
        updateZoomDisplay()
      }
    </script>
  </body>
</html>`

export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

export function generatePasswordForm(token: string): string {
  return renderTemplate(PASSWORD_FORM_TEMPLATE, { token })
}

export function generateViewPage(
  filename: string,
  content: string,
  fontFamily: string = 'Consolas',
  fontSize: number = 14,
  theme: string = 'light',
  customTheme: Record<string, string> | null = null,
): string {
  const markdownContentBase64 = btoa(encodeURIComponent(content))
  const escaped = escapeHtml(content)
  const lines = content.split('\n')
  const lineNumbers = lines.map(() => '<span></span>').join('')
  const textContent =
    '<div class="code-container"><div class="line-numbers">' +
    lineNumbers +
    '</div><pre>' +
    escaped +
    '</pre></div>'

  const htmlClass = getHtmlClass(theme)
  const themeStyles = generateThemeStyles()
  const customThemeStyles =
    theme === 'custom' && customTheme
      ? `<style>${generateCustomThemeStyles(customTheme)}</style>`
      : ''

  const customThemeBase64 = customTheme ? btoa(encodeURIComponent(JSON.stringify(customTheme))) : ''

  const templateData: Record<string, string> = {
    filename: escapeHtml(filename),
    markdownContentBase64,
    textContent,
    fontFamily: escapeHtml(fontFamily),
    fontSize: fontSize.toString(),
    theme,
    customThemeBase64,
    htmlClass,
    themeStyles,
    customThemeStyles,
  }

  return renderTemplate(VIEW_PAGE_TEMPLATE, templateData)
}
