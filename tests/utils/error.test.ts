import { describe, it, expect, vi, beforeEach, type MockInstance } from 'vitest'
import { Logger } from '../../functions/utils/error'

describe('error utils', () => {
  describe('Logger', () => {
    let consoleLogSpy: MockInstance
    let consoleErrorSpy: MockInstance
    let consoleWarnSpy: MockInstance
    let consoleDebugSpy: MockInstance

    beforeEach(() => {
      consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
      consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      consoleDebugSpy = vi.spyOn(console, 'debug').mockImplementation(() => {})
    })

    afterEach(() => {
      vi.restoreAllMocks()
    })

    it('should log info messages', () => {
      Logger.info('test message')
      expect(consoleLogSpy).toHaveBeenCalledWith('[INFO] test message', undefined)
    })

    it('should log info messages with metadata', () => {
      const meta = { key: 'value' }
      Logger.info('test message', meta)
      expect(consoleLogSpy).toHaveBeenCalledWith('[INFO] test message', meta)
    })

    it('should log error messages', () => {
      Logger.error('error message')
      expect(consoleErrorSpy).toHaveBeenCalledWith('[ERROR] error message', { error: undefined })
    })

    it('should log error messages with Error object', () => {
      const err = new Error('test error')
      Logger.error('error message', err)
      expect(consoleErrorSpy).toHaveBeenCalledWith('[ERROR] error message', { error: err })
    })

    it('should log error messages with Error and metadata', () => {
      const err = new Error('test error')
      const meta = { context: 'test' }
      Logger.error('error message', err, meta)
      expect(consoleErrorSpy).toHaveBeenCalledWith('[ERROR] error message', { error: err, ...meta })
    })

    it('should log warn messages', () => {
      Logger.warn('warn message')
      expect(consoleWarnSpy).toHaveBeenCalledWith('[WARN] warn message', undefined)
    })

    it('should log warn messages with metadata', () => {
      const meta = { key: 'value' }
      Logger.warn('warn message', meta)
      expect(consoleWarnSpy).toHaveBeenCalledWith('[WARN] warn message', meta)
    })

    it('should log debug messages', () => {
      Logger.debug('debug message')
      expect(consoleDebugSpy).toHaveBeenCalledWith('[DEBUG] debug message', undefined)
    })

    it('should log debug messages with metadata', () => {
      const meta = { key: 'value' }
      Logger.debug('debug message', meta)
      expect(consoleDebugSpy).toHaveBeenCalledWith('[DEBUG] debug message', meta)
    })
  })
})
