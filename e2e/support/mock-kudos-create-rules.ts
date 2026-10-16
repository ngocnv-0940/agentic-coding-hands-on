/**
 * create_kudo of the Kudos mock (phase-03 §Contract, INT-002): re-validates every write rule in the same
 * order as the SQL, then appends the kudo to the writer's dataset. Errors are KudosRpcError codes.
 * Mock-only controls (failNext, delayMs) live here too; they are never part of the app contract.
 */
import { randomUUID } from 'node:crypto'
import { KudosRpcError } from './mock-kudos-like-rules'
import type { MockSunner } from './mock-kudos-fixture-people'
import type { MockDataset, MockKudo } from './mock-kudos-state'
import { storedObjectOwner } from './mock-storage-routes'

/** Neutral object names: uuid v4 plus an allowed extension (no uid in the path, FR-604). */
export const UPLOAD_NAME = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\.(jpg|png|webp)$/
const NODE_TYPES = new Set(['doc', 'paragraph', 'text', 'orderedList', 'listItem', 'blockquote', 'hardBreak', 'mention', 'bold', 'italic', 'strike', 'link'])
const MAX_DOC_BYTES = 65536

/** Mock-only: failNext answers one create with a 500 before any rule runs; delayMs holds the answer (spinner). */
export const createControl = { failNext: false, delayMs: 0 }
export function resetCreateControl(): void {
  createControl.failNext = false
  createControl.delayMs = 0
}

const codePoints = (value: string) => [...value].length
const isObject = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value)

/** Tiptap JSON guard: known node/mark types only, http(s) links 5-2048 chars, mentions point at real sunners. */
function docIsValid(node: unknown, ds: MockDataset): boolean {
  if (!isObject(node) || typeof node.type !== 'string' || !NODE_TYPES.has(node.type)) return false
  if (node.type === 'mention') {
    const id = isObject(node.attrs) ? node.attrs.id : undefined
    if (typeof id !== 'string' || !ds.sunners.some((sunner) => sunner.id === id)) return false
  }
  for (const mark of (Array.isArray(node.marks) ? node.marks : []) as unknown[]) {
    if (!isObject(mark) || typeof mark.type !== 'string' || !NODE_TYPES.has(mark.type)) return false
    if (mark.type === 'link') {
      const href = isObject(mark.attrs) ? mark.attrs.href : undefined
      if (typeof href !== 'string' || !/^https?:\/\//.test(href) || href.length < 5 || href.length > 2048) return false
    }
  }
  const children = Array.isArray(node.content) ? node.content : []
  return children.every((child) => docIsValid(child, ds))
}

const isStringArray = (value: unknown): value is string[] => Array.isArray(value) && value.every((item) => typeof item === 'string')

/** Writes one kudo for `viewer` (the owner's sunner) into `ds`; throws KudosRpcError on the first failed rule. */
export function createKudo(ds: MockDataset, viewer: MockSunner | undefined, ownerId: string, args: Record<string, unknown>): { kudoId: string } {
  if (!viewer) throw new KudosRpcError('sunner_not_found')
  const receiver = ds.sunners.find((sunner) => sunner.id === args.p_receiver_id)
  if (!receiver) throw new KudosRpcError('receiver_not_found')
  if (receiver.id === viewer.id) throw new KudosRpcError('self_kudo')

  const title = typeof args.p_title === 'string' ? args.p_title.trim() : ''
  if (codePoints(title) < 1 || codePoints(title) > 100) throw new KudosRpcError('title_invalid')
  const content = typeof args.p_content === 'string' ? args.p_content.trim() : ''
  if (codePoints(content) < 1 || codePoints(content) > 2000) throw new KudosRpcError('content_invalid')
  const doc = args.p_content_doc
  if (!isObject(doc) || doc.type !== 'doc' || !docIsValid(doc, ds) || Buffer.byteLength(JSON.stringify(doc)) > MAX_DOC_BYTES) {
    throw new KudosRpcError('content_doc_invalid')
  }

  const slugs = args.p_hashtag_slugs
  const knownSlug = (slug: string) => ds.hashtags.some((tag) => tag.slug === slug)
  if (!isStringArray(slugs) || slugs.length < 1 || slugs.length > 5 || new Set(slugs).size !== slugs.length || !slugs.every(knownSlug)) {
    throw new KudosRpcError('hashtags_invalid')
  }

  const names = args.p_image_paths
  const referenced = (name: string) => ds.kudos.some((kudo) => kudo.imageUrls.includes(`kudo-images/${name}`))
  const imageOk = (name: string) => UPLOAD_NAME.test(name) && storedObjectOwner(name) === ownerId && !referenced(name)
  if (!isStringArray(names) || names.length > 5 || new Set(names).size !== names.length || !names.every(imageOk)) {
    throw new KudosRpcError('images_invalid')
  }

  const isAnonymous = args.p_is_anonymous === true
  const rawAlias = typeof args.p_anonymous_name === 'string' ? args.p_anonymous_name.trim() : null
  if (!isAnonymous && args.p_anonymous_name !== null && args.p_anonymous_name !== undefined) throw new KudosRpcError('anonymous_name_invalid')
  if (rawAlias !== null && codePoints(rawAlias) > 50) throw new KudosRpcError('anonymous_name_invalid')
  const anonymousName = isAnonymous && rawAlias ? rawAlias : null

  const kudo: MockKudo = {
    id: randomUUID(),
    senderId: viewer.id,
    receiverId: receiver.id,
    title,
    content,
    createdAt: new Date().toISOString(),
    baseLikes: 0,
    hashtagSlugs: [...slugs],
    imageUrls: names.map((name) => `kudo-images/${name}`),
    isAnonymous,
    anonymousName,
    contentDoc: doc,
  }
  ds.kudos.push(kudo)
  return { kudoId: kudo.id }
}
