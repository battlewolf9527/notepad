/**
 * contenteditable <-> 纯文本 双向转换工具
 *
 * 核心问题：contenteditable div 中 <br> 元素的 textContent 返回空字符串（而非 \n），
 * 导致保存时回车符丢失。同时，textContent 设置到 DOM 时，\n 在 contenteditable 中
 * 不会渲染为可见的换行。
 *
 * 解决方案：
 * - 读取时：将 <br> 转换为 \n，将块级元素边界转换为 \n
 * - 写入时：将 \n 转换为 <br> 元素
 */

/**
 * 从 contenteditable 元素中正确提取纯文本，保留所有换行符
 * 将 <br> 元素和块级元素边界转换为 \n
 */
export function getTextFromContentEditable(el: HTMLElement): string {
  const clone = el.cloneNode(true) as HTMLElement

  // 将所有 <br> 元素替换为换行文本节点
  clone.querySelectorAll('br').forEach((br) => {
    const textNode = document.createTextNode('\n')
    br.parentNode?.replaceChild(textNode, br)
  })

  // 将块级元素（如 Enter 创建的 <div>）内的文本提取出来，用换行分隔
  clone.querySelectorAll('div, p').forEach((block) => {
    const text = block.textContent || ''
    block.replaceWith(document.createTextNode('\n' + text))
  })

  let text = clone.textContent || ''
  // 清理：移除块级元素转换产生的多余前导换行
  if (text.startsWith('\n')) {
    text = text.slice(1)
  }
  // 清理：将连续 3 个及以上换行压缩为 2 个
  text = text.replace(/\n{3,}/g, '\n\n')

  return text
}

/**
 * 将纯文本正确写入 contenteditable 元素
 * 将 \n 转换为 <br> 元素，确保换行在 contenteditable 中可见
 */
export function setTextToContentEditable(el: HTMLElement, text: string): void {
  el.innerHTML = ''

  if (!text) return

  const lines = text.split('\n')
  lines.forEach((line, index) => {
    el.appendChild(document.createTextNode(line))
    if (index < lines.length - 1) {
      el.appendChild(document.createElement('br'))
    }
  })
}

/**
 * 计算 DOM 中指定节点/偏移位置对应的纯文本位置
 * 需要同时考虑文本节点和 <br> 元素
 */
export function getTextOffsetFromDOM(editor: HTMLElement, node: Node, offset: number): number {
  let position = 0
  const walker = document.createTreeWalker(editor, NodeFilter.SHOW_ALL)

  while (walker.nextNode()) {
    const currentNode = walker.currentNode

    if (currentNode === node) {
      if (currentNode.nodeType === Node.TEXT_NODE) {
        return position + offset
      }
      // <br> 元素节点：offset 为 0 或 1
      return position + (offset > 0 ? 1 : 0)
    }

    if (currentNode.nodeType === Node.TEXT_NODE) {
      position += currentNode.textContent?.length || 0
    } else if (currentNode.nodeType === Node.ELEMENT_NODE) {
      const element = currentNode as HTMLElement
      if (element.tagName === 'BR') {
        position += 1
      }
    }
  }

  return position
}

/**
 * 根据纯文本位置定位 DOM 中的节点和偏移
 * 纯文本位置基于 <br> 已转换为 \n 的虚拟文本
 *
 * 对于 <br> 元素的处理策略：
 * - targetOffset 等于 <br> 前的位置：定位到 <br> 前的文本节点末尾
 * - targetOffset 等于 <br> 后的位置（\n 之后）：跳过 <br> 定位到下一个文本节点开头
 *   或继续遍历下一个兄弟 <br>（处理空行）
 */
export function getDOMPositionFromTextOffset(
  editor: HTMLElement,
  targetOffset: number,
): { node: Node; offset: number } | null {
  const contentLength = getTextFromContentEditable(editor).length
  if (targetOffset > contentLength) return null

  if (targetOffset === 0) {
    const firstChild = editor.firstChild
    if (firstChild) {
      if (firstChild.nodeType === Node.TEXT_NODE) {
        return { node: firstChild, offset: 0 }
      }
      if (firstChild.nodeType === Node.ELEMENT_NODE) {
        return { node: firstChild, offset: 0 }
      }
    }
    return { node: editor, offset: 0 }
  }

  let currentPos = 0
  const walker = document.createTreeWalker(editor, NodeFilter.SHOW_ALL)

  while (walker.nextNode()) {
    const node = walker.currentNode

    if (node.nodeType === Node.TEXT_NODE) {
      const nodeLen = node.textContent?.length || 0
      if (currentPos + nodeLen >= targetOffset) {
        return { node, offset: targetOffset - currentPos }
      }
      currentPos += nodeLen
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      const element = node as HTMLElement
      if (element.tagName === 'BR') {
        if (targetOffset === currentPos + 1) {
          // targetOffset 在 <br> 之后
          const nextSibling = element.nextSibling
          if (nextSibling && nextSibling.nodeType === Node.TEXT_NODE) {
            return { node: nextSibling, offset: 0 }
          }
          if (
            nextSibling &&
            nextSibling.nodeType === Node.ELEMENT_NODE &&
            (nextSibling as HTMLElement).tagName === 'BR'
          ) {
            // 连续 <br>（空行），跳过当前 <br> 继续
            currentPos += 1
            continue
          }
          return { node: element, offset: 1 }
        }
        // targetOffset <= currentPos，定位到 <br> 之前
        return { node: element, offset: 0 }
      }
    }
  }

  // 回退：定位到最后
  const lastChild = editor.lastChild
  if (lastChild) {
    if (lastChild.nodeType === Node.TEXT_NODE) {
      const len = lastChild.textContent?.length || 0
      return { node: lastChild, offset: Math.min(targetOffset - currentPos, len) }
    }
    return { node: lastChild, offset: lastChild.childNodes.length }
  }

  return { node: editor, offset: 0 }
}
