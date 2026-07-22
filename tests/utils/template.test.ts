import { describe, it, expect } from 'vitest'
import { renderTemplate } from '../../functions/utils/template'

describe('template utils', () => {
  describe('renderTemplate', () => {
    it('should replace single placeholder', () => {
      const template = 'Hello {{name}}!'
      const result = renderTemplate(template, { name: 'World' })
      expect(result).toBe('Hello World!')
    })

    it('should replace multiple placeholders', () => {
      const template = '{{greeting}} {{name}}! How are you {{time}}?'
      const result = renderTemplate(template, { greeting: 'Hi', name: 'Alice', time: 'today' })
      expect(result).toBe('Hi Alice! How are you today?')
    })

    it('should replace repeated placeholders', () => {
      const template = '{{item}} and {{item}}'
      const result = renderTemplate(template, { item: 'apple' })
      expect(result).toBe('apple and apple')
    })

    it('should handle missing data gracefully', () => {
      const template = 'Hello {{name}}!'
      const result = renderTemplate(template, {})
      expect(result).toBe('Hello {{name}}!')
    })

    it('should handle empty template', () => {
      const result = renderTemplate('', { name: 'World' })
      expect(result).toBe('')
    })

    it('should handle template without placeholders', () => {
      const template = 'Hello World!'
      const result = renderTemplate(template, { name: 'Test' })
      expect(result).toBe('Hello World!')
    })
  })
})
