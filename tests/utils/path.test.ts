import { describe, it, expect } from 'vitest'
import { sanitizePath } from '../../functions/utils/path'

describe('path utils', () => {
  describe('sanitizePath', () => {
    it('should return empty string for root path', () => {
      expect(sanitizePath('')).toBe('')
      expect(sanitizePath('   ')).toBe('')
    })

    it('should return null for non-string input', () => {
      expect(sanitizePath(null as unknown as string)).toBe(null)
      expect(sanitizePath(undefined as unknown as string)).toBe(null)
      expect(sanitizePath(123 as unknown as string)).toBe(null)
    })

    it('should remove trailing slashes', () => {
      expect(sanitizePath('path/')).toBe('path')
      expect(sanitizePath('/path/')).toBe('path')
    })

    it('should normalize multiple slashes', () => {
      expect(sanitizePath('path//to//file')).toBe('path/to/file')
      expect(sanitizePath('path///to')).toBe('path/to')
    })

    it('should normalize backslashes to forward slashes', () => {
      expect(sanitizePath('path\\to\\file')).toBe('path/to/file')
      expect(sanitizePath('path\\\\to')).toBe('path/to')
    })

    it('should filter out current directory references', () => {
      expect(sanitizePath('path/./to')).toBe('path/to')
      expect(sanitizePath('./path')).toBe('path')
      expect(sanitizePath('path/.')).toBe('path')
    })

    it('should filter out parent directory references', () => {
      expect(sanitizePath('path/../to')).toBe('path/to')
      expect(sanitizePath('../path')).toBe('path')
      expect(sanitizePath('path/..')).toBe('path')
    })

    it('should return null for paths with illegal characters', () => {
      expect(sanitizePath('path<test>')).toBe(null)
      expect(sanitizePath('path:test')).toBe(null)
      expect(sanitizePath('path"test"')).toBe(null)
      expect(sanitizePath('path|test')).toBe(null)
      expect(sanitizePath('path?test')).toBe(null)
      expect(sanitizePath('path*test')).toBe(null)
    })

    it('should handle complex path traversal attempts', () => {
      expect(sanitizePath('../../etc/passwd')).toBe('etc/passwd')
      expect(sanitizePath('path/../../etc')).toBe('path/etc')
      expect(sanitizePath('/../../../etc')).toBe('etc')
    })

    it('should return cleaned path for valid inputs', () => {
      expect(sanitizePath('documents/file.txt')).toBe('documents/file.txt')
      expect(sanitizePath('/documents/file.txt')).toBe('documents/file.txt')
      expect(sanitizePath('documents  /  file.txt')).toBe('documents  /  file.txt')
    })

    it('should return empty string for path that becomes root after cleaning', () => {
      expect(sanitizePath('.')).toBe('')
      expect(sanitizePath('..')).toBe('')
      expect(sanitizePath('./..')).toBe('')
      expect(sanitizePath('../.')).toBe('')
    })
  })
})
