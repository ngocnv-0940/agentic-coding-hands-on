/**
 * Supabase Storage HTTP routes of the E2E mock for the `kudo-images` bucket (public, 5 MiB, jpeg/png/webp).
 * The browser uploads straight here (app :3100 -> mock :54399), so every /storage/v1 answer carries CORS and
 * OPTIONS preflights are answered before any auth check. Objects live in memory with their owner id.
 * Mock-only: GET /__e2e/storage/objects lists the stored names; POST /__e2e/kudos/reset clears them.
 */
import { randomUUID } from 'node:crypto'
import type { IncomingMessage, ServerResponse } from 'node:http'

const BUCKET = 'kudo-images'
const MAX_BYTES = 5 * 1024 * 1024
const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/webp'])
const DEFAULT_ALLOW_HEADERS = 'authorization, apikey, content-type, x-upsert, x-client-info'
const NAME = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\.(jpg|png|webp)$/

interface StoredObject {
  owner: string
  mime: string
  bytes: Buffer
}

const objects = new Map<string, StoredObject>()

/** Owner auth id of a stored object, or undefined; create_kudo uses it to prove the upload belongs to the caller. */
export const storedObjectOwner = (name: string): string | undefined => objects.get(name)?.owner

/** Mock-only: empties the bucket. Called by POST /__e2e/kudos/reset. */
export function resetStorage(): void {
  objects.clear()
}

/** Magic-byte sniff for the three allowed types; null when the bytes are none of them. */
export function sniffImageMime(bytes: Buffer): string | null {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return 'image/jpeg'
  if (bytes.length >= 8 && bytes.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return 'image/png'
  if (bytes.length >= 12 && bytes.subarray(0, 4).toString('latin1') === 'RIFF' && bytes.subarray(8, 12).toString('latin1') === 'WEBP') return 'image/webp'
  return null
}

async function readRaw(req: IncomingMessage): Promise<Buffer> {
  const chunks: Buffer[] = []
  for await (const chunk of req) chunks.push(chunk as Buffer)
  return Buffer.concat(chunks)
}

/**
 * First file part of a multipart body. supabase-js appends the File under an empty field name, which the standard
 * FormData parser drops, so the boundary is walked by hand: a part counts when its headers carry a filename.
 */
function multipartFilePart(raw: Buffer, contentType: string): { bytes: Buffer; mime: string } | null {
  const boundary = /boundary=(?:"([^"]+)"|([^;]+))/i.exec(contentType)
  if (!boundary) return null
  const delimiter = Buffer.from(`--${boundary[1] ?? boundary[2]}`)
  let start = raw.indexOf(delimiter)
  while (start !== -1) {
    const next = raw.indexOf(delimiter, start + delimiter.length)
    if (next === -1) break
    const part = raw.subarray(start + delimiter.length, next)
    const headerEnd = part.indexOf('\r\n\r\n')
    if (headerEnd !== -1) {
      const headers = part.subarray(0, headerEnd).toString('latin1')
      if (/filename=/i.test(headers)) {
        const mime = /content-type:\s*([^\r\n]+)/i.exec(headers)?.[1].trim() ?? 'application/octet-stream'
        return { bytes: part.subarray(headerEnd + 4, part.length - 2), mime }
      }
    }
    start = next
  }
  return null
}

/** A raw body arrives with its own content-type; supabase-js sends a File as multipart/form-data. */
function uploadedPart(raw: Buffer, contentType: string): { bytes: Buffer; mime: string } | null {
  if (!contentType.startsWith('multipart/form-data')) return { bytes: raw, mime: contentType.split(';')[0].trim() }
  return multipartFilePart(raw, contentType)
}

function send(res: ServerResponse, status: number, body?: unknown) {
  res.writeHead(status, { 'content-type': 'application/json' })
  res.end(body === undefined ? undefined : JSON.stringify(body))
}

function cors(req: IncomingMessage, res: ServerResponse) {
  res.setHeader('access-control-allow-origin', '*')
  res.setHeader('access-control-allow-methods', 'GET, POST, DELETE, OPTIONS')
  res.setHeader('access-control-allow-headers', String(req.headers['access-control-request-headers'] ?? DEFAULT_ALLOW_HEADERS))
  res.setHeader('access-control-max-age', '600')
}

async function upload(req: IncomingMessage, res: ServerResponse, name: string, owner: { id: string } | undefined) {
  if (!owner) return send(res, 401, { statusCode: '401', error: 'Unauthorized', message: 'missing or invalid bearer token' })
  if (!NAME.test(name)) return send(res, 403, { statusCode: '403', error: 'Unauthorized', message: 'new row violates row-level security policy' })
  const part = uploadedPart(await readRaw(req), String(req.headers['content-type'] ?? ''))
  if (!part) return send(res, 400, { statusCode: '400', error: 'InvalidBody', message: 'no file part in body' })
  if (!ALLOWED_MIME.has(part.mime) || sniffImageMime(part.bytes) !== part.mime) {
    return send(res, 400, { statusCode: '415', error: 'invalid_mime_type', message: `mime type ${part.mime} is not supported` })
  }
  if (part.bytes.length > MAX_BYTES) return send(res, 400, { statusCode: '413', error: 'Payload too large', message: 'object exceeds 5 MiB' })
  if (objects.has(name)) return send(res, 409, { statusCode: '409', error: 'Duplicate', message: 'The resource already exists' })
  objects.set(name, { owner: owner.id, mime: part.mime, bytes: part.bytes })
  return send(res, 200, { Key: `${BUCKET}/${name}`, Id: randomUUID() })
}

function publicRead(res: ServerResponse, name: string) {
  const stored = objects.get(name)
  if (!stored) return send(res, 404, { statusCode: '404', error: 'not_found', message: 'Object not found' })
  res.writeHead(200, { 'content-type': stored.mime, 'cache-control': 'max-age=3600' })
  res.end(stored.bytes)
}

/** Removes only the caller's own objects, like the owner-only DELETE policy; answers the removed rows. */
async function remove(req: IncomingMessage, res: ServerResponse, owner: { id: string } | undefined) {
  if (!owner) return send(res, 401, { statusCode: '401', error: 'Unauthorized', message: 'missing or invalid bearer token' })
  const body = JSON.parse((await readRaw(req)).toString('utf8') || '{}') as { prefixes?: unknown }
  const names = Array.isArray(body.prefixes) ? body.prefixes.filter((item): item is string => typeof item === 'string') : []
  const removed: Array<{ name: string; bucket_id: string }> = []
  for (const name of names) {
    if (objects.get(name)?.owner !== owner.id) continue
    objects.delete(name)
    removed.push({ name, bucket_id: BUCKET })
  }
  return send(res, 200, removed)
}

/** Handles /storage/v1/* and /__e2e/storage/*; the caller passes the bearer owner (undefined when signed out). */
export async function handleStorage(req: IncomingMessage, res: ServerResponse, pathname: string, owner: { id: string } | undefined) {
  cors(req, res)
  if (req.method === 'OPTIONS') return res.writeHead(204).end()
  if (req.method === 'GET' && pathname === '/__e2e/storage/objects') return send(res, 200, { names: [...objects.keys()].sort() })
  const publicPath = new RegExp(`^/storage/v1/object/public/${BUCKET}/([^/]+)$`).exec(pathname)
  if (req.method === 'GET' && publicPath) return publicRead(res, decodeURIComponent(publicPath[1]))
  const objectPath = new RegExp(`^/storage/v1/object/${BUCKET}/([^/]+)$`).exec(pathname)
  if (req.method === 'POST' && objectPath) return upload(req, res, decodeURIComponent(objectPath[1]), owner)
  if (req.method === 'DELETE' && pathname === `/storage/v1/object/${BUCKET}`) return remove(req, res, owner)
  console.error(`[e2e-mock-supabase] unhandled storage ${req.method} ${pathname}`)
  return send(res, 404, { statusCode: '404', error: 'not_found', message: `e2e mock has no storage route for ${req.method} ${pathname}` })
}
