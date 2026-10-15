import type { FeedCursor } from './kudo-board-types'

const UUID_SHAPE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
// The RPCs always emit this exact shape (UTC, milliseconds); anything else is not a cursor we issued.
const ISO_UTC_MS = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/

export function isUuid(value: unknown): value is string {
  return typeof value === 'string' && UUID_SHAPE.test(value)
}

/**
 * Validates an untrusted value (Server Action argument) as a feed cursor. `null` and `undefined` mean
 * "first page" and are valid. Returns `undefined` for a malformed cursor so callers can reject it.
 * Only known keys are copied out, so extra client-supplied fields never reach the RPC.
 */
export function parseFeedCursor(value: unknown): FeedCursor | null | undefined {
  if (value === null || value === undefined) return null
  if (typeof value !== 'object') return undefined
  const { createdAt, id } = value as Record<string, unknown>
  if (typeof createdAt !== 'string' || !ISO_UTC_MS.test(createdAt)) return undefined
  if (Number.isNaN(Date.parse(createdAt))) return undefined
  if (!isUuid(id)) return undefined
  return { createdAt, id }
}
