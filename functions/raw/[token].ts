import { markShareLinkUsed, validateShareLinkWithResponse } from '../utils/share'
import { notFound } from '../utils/response'
import { Logger } from '../utils/error'
import { basename } from '../../types/shared'
import type { Env } from '../types/env'

function parseRangeHeader(rangeHeader: string): { offset: number; length?: number } | null {
  const rangeMatch = rangeHeader.match(/bytes=(\d+)-(\d*)|bytes=-(\d+)/)
  if (!rangeMatch) return null

  if (rangeMatch[3]) {
    const suffix = parseInt(rangeMatch[3], 10)
    if (isNaN(suffix) || suffix <= 0) return null
    return { offset: -suffix }
  }

  const offset = parseInt(rangeMatch[1], 10)
  if (isNaN(offset)) return null

  const endStr = rangeMatch[2]
  if (!endStr) return { offset }

  const end = parseInt(endStr, 10)
  if (isNaN(end) || end < offset) return null

  return { offset, length: end - offset + 1 }
}

export async function onRequestGet({
  params,
  env,
  request,
}: {
  params: { token: string }
  env: Env
  request: Request
}) {
  const token = params.token
  const validationResult = await validateShareLinkWithResponse(env, token)

  if ('response' in validationResult) {
    return validationResult.response
  }

  const { linkData, headers: corsHeaders } = validationResult
  const rangeHeader = request.headers.get('Range')

  let rangeOptions: { offset: number; length?: number } | undefined

  if (rangeHeader) {
    const parsedRange = parseRangeHeader(rangeHeader)
    if (parsedRange) {
      const headObject = await env.NOTEPAD_R2.head(linkData.filename)
      if (!headObject) {
        return notFound('File not found')
      }

      if (parsedRange.offset < 0) {
        const suffixLength = -parsedRange.offset
        if (suffixLength > headObject.size) {
          return new Response('Range Not Satisfiable', {
            status: 416,
            headers: {
              'Content-Range': `bytes */${headObject.size}`,
            },
          })
        }
        rangeOptions = { offset: headObject.size - suffixLength }
      } else {
        if (parsedRange.offset >= headObject.size) {
          return new Response('Range Not Satisfiable', {
            status: 416,
            headers: {
              'Content-Range': `bytes */${headObject.size}`,
            },
          })
        }
        rangeOptions = parsedRange
      }
    }
  }

  const object = await env.NOTEPAD_R2.get(
    linkData.filename,
    rangeOptions ? { range: rangeOptions } : undefined,
  )

  if (!object) {
    return notFound('File not found')
  }

  const content = await object.text()

  try {
    await markShareLinkUsed(env, token, linkData)
  } catch (err) {
    Logger.error('Mark share link used error', err instanceof Error ? err : undefined)
  }

  const filename = basename(linkData.filename)
  const headers: Record<string, string> = {
    'Content-Type':
      object.httpMetadata?.contentType || linkData.contentType || 'text/plain; charset=utf-8',
    'Content-Disposition': `inline; filename="${filename}"; filename*=UTF-8''${encodeURIComponent(filename)}`,
    'X-Content-Type-Options': 'nosniff',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    ETag: object.httpEtag,
    'Last-Modified': object.uploaded.toUTCString(),
    'Content-Length': String(object.size),
    ...corsHeaders,
  }

  if (rangeHeader && object.range) {
    const range = object.range
    if ('offset' in range) {
      const offset = range.offset ?? 0
      if ('length' in range && range.length !== undefined) {
        headers['Content-Range'] = `bytes ${offset}-${offset + range.length - 1}/${object.size}`
        headers['Content-Length'] = String(range.length)
      } else {
        const end = object.size - 1
        headers['Content-Range'] = `bytes ${offset}-${end}/${object.size}`
        headers['Content-Length'] = String(object.size - offset)
      }
    } else if ('suffix' in range) {
      headers['Content-Range'] = `bytes -${range.suffix}/${object.size}`
      headers['Content-Length'] = String(range.suffix)
    }
    return new Response(content, { headers, status: 206 })
  }

  return new Response(content, { headers })
}

export async function onRequestOptions({ params, env }: { params: { token: string }; env: Env }) {
  const token = params.token
  const result = await validateShareLinkWithResponse(env, token)

  if ('response' in result) {
    return result.response
  }

  return new Response(null, { headers: result.headers })
}
