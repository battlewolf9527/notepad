import { sanitizePath } from './path'
import { MAX_BATCH_SIZE, LIST_LIMIT } from './constants'
import { Logger } from './error'
import { getErrorMessage } from './response'
import type { Env } from '../types/env'

/**
 * R2 操作结果类型
 */
export interface R2Result {
  success: boolean
  error?: string
}

/**
 * 重命名文件夹
 * @returns R2Result 操作结果
 */
export async function renameOrMoveFolder(
  env: Env,
  oldPath: string,
  newPath: string,
): Promise<R2Result> {
  const sanitizedOld = sanitizePath(oldPath)
  const sanitizedNew = sanitizePath(newPath)

  if (sanitizedOld === null || sanitizedNew === null) {
    return { success: false, error: '无效的路径' }
  }

  const oldPrefix = sanitizedOld + '/'
  const newPrefix = sanitizedNew + '/'

  const targetList = await env.NOTEPAD_R2.list({ prefix: newPrefix, limit: 1 })
  if (
    (targetList.objects && targetList.objects.length > 0) ||
    (targetList.delimitedPrefixes && targetList.delimitedPrefixes.length > 0)
  ) {
    return { success: false, error: '目标路径已存在' }
  }

  const allObjects: R2Object[] = []
  let cursor: string | undefined
  let listResult: R2Objects

  do {
    listResult = await env.NOTEPAD_R2.list({
      prefix: oldPrefix,
      cursor,
      limit: LIST_LIMIT,
    })
    allObjects.push(...(listResult.objects || []))
    // cursor 只在 truncated 为 true 时存在
    cursor = listResult.truncated ? listResult.cursor : undefined
  } while (listResult.truncated)

  if (allObjects.length === 0) {
    return { success: true }
  }

  const copiedKeys: string[] = []

  for (const obj of allObjects) {
    const newKey = obj.key.replace(oldPrefix, newPrefix)

    try {
      await env.NOTEPAD_R2.put(newKey, null, {
        copyFrom: obj.key,
        httpMetadata: obj.httpMetadata,
        customMetadata: obj.customMetadata,
      } as R2PutOptions)
      copiedKeys.push(newKey)
    } catch (err) {
      // 回滚已复制的文件
      for (const copiedKey of copiedKeys) {
        try {
          await env.NOTEPAD_R2.delete(copiedKey)
        } catch (deleteErr) {
          Logger.error(
            `回滚删除失败: ${copiedKey}`,
            deleteErr instanceof Error ? deleteErr : undefined,
          )
        }
      }

      return { success: false, error: `重命名文件夹失败: ${getErrorMessage(err, '复制文件失败')}` }
    }
  }

  const oldKeys = allObjects.map((obj) => obj.key)
  const deleteBatches: string[][] = []
  for (let i = 0; i < oldKeys.length; i += MAX_BATCH_SIZE) {
    deleteBatches.push(oldKeys.slice(i, i + MAX_BATCH_SIZE))
  }

  const failedDeletes: string[] = []
  for (const batch of deleteBatches) {
    try {
      await env.NOTEPAD_R2.delete(batch)
    } catch (err) {
      Logger.error(`批量删除失败: ${batch.join(', ')}`, err instanceof Error ? err : undefined)
      failedDeletes.push(...batch)
    }
  }

  if (failedDeletes.length > 0) {
    for (const copiedKey of copiedKeys) {
      try {
        await env.NOTEPAD_R2.delete(copiedKey)
      } catch (deleteErr) {
        Logger.error(
          `回滚删除新文件失败: ${copiedKey}`,
          deleteErr instanceof Error ? deleteErr : undefined,
        )
      }
    }
    return {
      success: false,
      error: `重命名文件夹失败：${failedDeletes.length} 个旧文件删除失败，已回滚新文件`,
    }
  }

  return { success: true }
}

/**
 * 删除文件夹
 * @returns R2Result 操作结果
 */
export async function deleteFolder(env: Env, path: string): Promise<R2Result> {
  const sanitized = sanitizePath(path)
  if (sanitized === null) {
    return { success: false, error: '无效的路径' }
  }

  const prefix = `${sanitized}/`
  const allKeys: string[] = []
  let cursor: string | undefined
  let listResult: R2Objects

  do {
    listResult = await env.NOTEPAD_R2.list({ prefix, cursor, limit: LIST_LIMIT })
    allKeys.push(...(listResult.objects || []).map((obj: R2Object) => obj.key))
    // cursor 只在 truncated 为 true 时存在
    cursor = listResult.truncated ? listResult.cursor : undefined
  } while (listResult.truncated)

  if (allKeys.length === 0) {
    return { success: true }
  }

  const deleteBatches: string[][] = []
  for (let i = 0; i < allKeys.length; i += MAX_BATCH_SIZE) {
    deleteBatches.push(allKeys.slice(i, i + MAX_BATCH_SIZE))
  }

  try {
    // 并发删除，但限制并发数避免 R2 速率限制
    const CONCURRENCY = 3
    const failedBatches: string[][] = []
    for (let i = 0; i < deleteBatches.length; i += CONCURRENCY) {
      const chunk = deleteBatches.slice(i, i + CONCURRENCY)
      const results = await Promise.allSettled(chunk.map((batch) => env.NOTEPAD_R2.delete(batch)))
      for (let j = 0; j < results.length; j++) {
        if (results[j].status === 'rejected') {
          failedBatches.push(chunk[j])
          const rejectedResult = results[j] as PromiseRejectedResult
          Logger.error(
            `批量删除失败: ${chunk[j].join(', ')}`,
            rejectedResult.reason instanceof Error ? rejectedResult.reason : undefined,
          )
        }
      }
    }

    if (failedBatches.length > 0) {
      return {
        success: false,
        error: `删除文件夹失败：${failedBatches.reduce((s, b) => s + b.length, 0)} 个文件删除失败`,
      }
    }
    return { success: true }
  } catch (err) {
    return { success: false, error: getErrorMessage(err, '删除文件夹失败') }
  }
}

/**
 * 重命名或移动文件
 * @returns R2Result 操作结果
 */
export async function renameOrMoveFile(
  env: Env,
  oldPath: string,
  newPath: string,
): Promise<R2Result> {
  const sanitizedOld = sanitizePath(oldPath)
  const sanitizedNew = sanitizePath(newPath)

  if (sanitizedOld === null || sanitizedNew === null) {
    return { success: false, error: '无效的路径' }
  }

  if (sanitizedOld === sanitizedNew) {
    return { success: true }
  }

  const exists = await env.NOTEPAD_R2.head(sanitizedOld)
  if (!exists) {
    return { success: false, error: '文件不存在' }
  }

  const targetExists = await env.NOTEPAD_R2.head(sanitizedNew)
  if (targetExists) {
    return { success: false, error: '目标路径已存在' }
  }

  try {
    await env.NOTEPAD_R2.put(sanitizedNew, null, {
      copyFrom: sanitizedOld,
      httpMetadata: exists.httpMetadata,
      customMetadata: exists.customMetadata,
    } as R2PutOptions)
    await env.NOTEPAD_R2.delete(sanitizedOld)
    return { success: true }
  } catch (err) {
    // 回滚：删除已创建的新文件
    try {
      await env.NOTEPAD_R2.delete(sanitizedNew)
    } catch (deleteErr) {
      Logger.error('回滚删除新文件失败:', deleteErr instanceof Error ? deleteErr : undefined)
    }

    return { success: false, error: `移动文件失败: ${getErrorMessage(err, '操作失败')}` }
  }
}
