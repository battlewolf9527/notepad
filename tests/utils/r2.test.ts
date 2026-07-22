import { describe, it, expect, beforeEach } from 'vitest'
import { createMockR2, createMockEnv } from '../setup'

import { renameOrMoveFolder, deleteFolder, renameOrMoveFile } from '../../functions/utils/r2'

describe('R2 Utils', () => {
  let mockR2: ReturnType<typeof createMockR2>
  let env: ReturnType<typeof createMockEnv>

  beforeEach(() => {
    mockR2 = createMockR2()
    env = createMockEnv(undefined, mockR2.r2)
  })

  describe('renameOrMoveFolder', () => {
    it('should return error for invalid paths', async () => {
      const result = await renameOrMoveFolder(env, '<invalid', 'new')
      expect(result.success).toBe(false)
      expect(result.error).toBe('无效的路径')
    })

    it('should return error if target exists', async () => {
      await mockR2.r2.put('target/', new Uint8Array())
      await mockR2.r2.put('source/', new Uint8Array())

      const result = await renameOrMoveFolder(env, 'source', 'target')
      expect(result.success).toBe(false)
      expect(result.error).toBe('目标路径已存在')
    })

    it('should return success for empty folder', async () => {
      await mockR2.r2.put('empty/', new Uint8Array())

      const result = await renameOrMoveFolder(env, 'empty', 'new-empty')
      expect(result.success).toBe(true)
    })

    it('should move folder with files', async () => {
      await mockR2.r2.put('folder/', new Uint8Array())
      await mockR2.r2.put('folder/file1.txt', 'content1')
      await mockR2.r2.put('folder/subdir/', new Uint8Array())
      await mockR2.r2.put('folder/subdir/file2.txt', 'content2')

      const result = await renameOrMoveFolder(env, 'folder', 'new-folder')
      expect(result.success).toBe(true)

      const oldFile = await mockR2.r2.get('folder/file1.txt')
      const newFile = await mockR2.r2.get('new-folder/file1.txt')
      expect(oldFile).toBeNull()
      expect(newFile).not.toBeNull()
    })

    it('should rollback copied files when delete phase fails', async () => {
      await mockR2.r2.put('folder/', new Uint8Array())
      await mockR2.r2.put('folder/file1.txt', 'content1')

      const originalDelete = mockR2.r2.delete.bind(mockR2.r2)
      let deleteCallCount = 0
      mockR2.r2.delete = vi.fn(async (keys: string | string[]) => {
        deleteCallCount++
        if (deleteCallCount === 1) {
          throw new Error('delete failed')
        }
        return originalDelete(keys)
      })

      const result = await renameOrMoveFolder(env, 'folder', 'new-folder')
      expect(result.success).toBe(false)
      expect(result.error).toContain('已回滚新文件')

      const oldFile = await mockR2.r2.get('folder/file1.txt')
      const newFile = await mockR2.r2.get('new-folder/file1.txt')
      expect(oldFile).not.toBeNull()
      expect(newFile).toBeNull()
    })
  })

  describe('deleteFolder', () => {
    it('should return error for invalid path', async () => {
      const result = await deleteFolder(env, '<invalid')
      expect(result.success).toBe(false)
      expect(result.error).toBe('无效的路径')
    })

    it('should return success for empty folder', async () => {
      const result = await deleteFolder(env, 'nonexistent')
      expect(result.success).toBe(true)
    })

    it('should delete folder with files', async () => {
      await mockR2.r2.put('folder/', new Uint8Array())
      await mockR2.r2.put('folder/file1.txt', 'content1')
      await mockR2.r2.put('folder/subdir/', new Uint8Array())
      await mockR2.r2.put('folder/subdir/file2.txt', 'content2')

      const result = await deleteFolder(env, 'folder')
      expect(result.success).toBe(true)

      const folder = await mockR2.r2.get('folder/')
      const file = await mockR2.r2.get('folder/file1.txt')
      expect(folder).toBeNull()
      expect(file).toBeNull()
    })
  })

  describe('renameOrMoveFile', () => {
    it('should return error for invalid paths', async () => {
      const result = await renameOrMoveFile(env, '<invalid', 'new')
      expect(result.success).toBe(false)
      expect(result.error).toBe('无效的路径')
    })

    it('should return success for same path', async () => {
      const result = await renameOrMoveFile(env, 'file.txt', 'file.txt')
      expect(result.success).toBe(true)
    })

    it('should return error if source does not exist', async () => {
      const result = await renameOrMoveFile(env, 'nonexistent.txt', 'new.txt')
      expect(result.success).toBe(false)
      expect(result.error).toBe('文件不存在')
    })

    it('should return error if target exists', async () => {
      await mockR2.r2.put('source.txt', 'content')
      await mockR2.r2.put('target.txt', 'existing')

      const result = await renameOrMoveFile(env, 'source.txt', 'target.txt')
      expect(result.success).toBe(false)
      expect(result.error).toBe('目标路径已存在')
    })

    it('should rename file successfully', async () => {
      await mockR2.r2.put('old.txt', 'content')

      const result = await renameOrMoveFile(env, 'old.txt', 'new.txt')
      expect(result.success).toBe(true)

      const oldFile = await mockR2.r2.get('old.txt')
      const newFile = await mockR2.r2.get('new.txt')
      expect(oldFile).toBeNull()
      expect(newFile).not.toBeNull()
    })
  })
})
