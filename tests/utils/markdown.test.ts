import { describe, it, expect } from 'vitest'
import { escapeHtml } from '../../functions/utils/share-page'

describe('Markdown Utils', () => {
  describe('escapeHtml', () => {
    it('should escape HTML special characters', () => {
      const input = '<script>alert("xss")</script>'
      const result = escapeHtml(input)
      expect(result).not.toContain('<')
      expect(result).not.toContain('>')
      expect(result).not.toContain('"')
    })

    it('should return plain text unchanged', () => {
      const input = 'Hello World!'
      const result = escapeHtml(input)
      expect(result).toBe(input)
    })

    it('should escape quotes', () => {
      const input = 'He said "hello"'
      const result = escapeHtml(input)
      expect(result).toContain('&quot;')
    })
  })
})