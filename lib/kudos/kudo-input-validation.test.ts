import { describe, expect, test } from 'bun:test'
import { isUuid, parseFeedCursor } from './kudo-input-validation'

const ID = '3f2a6c1e-8b4d-4e7a-9c21-0d5f6b7a8e90'
const CREATED_AT = '2026-10-14T09:54:41.123Z'

describe('isUuid', () => {
  test('accepts a canonical uuid in either case', () => {
    expect(isUuid(ID)).toBe(true)
    expect(isUuid(ID.toUpperCase())).toBe(true)
  })

  test('rejects non-strings, wrong lengths and missing dashes', () => {
    for (const value of [undefined, null, 42, {}, '', `${ID}0`, ID.slice(1), ID.replace(/-/g, ''), `{${ID}}`]) {
      expect(isUuid(value)).toBe(false)
    }
  })

  test('rejects non-hex characters', () => {
    expect(isUuid('3f2a6c1e-8b4d-4e7a-9c21-0d5f6b7a8e9g')).toBe(false)
  })
})

describe('parseFeedCursor', () => {
  test('null and undefined mean "first page"', () => {
    expect(parseFeedCursor(null)).toBeNull()
    expect(parseFeedCursor(undefined)).toBeNull()
  })

  test('returns a cursor for the exact shape the RPC emits', () => {
    expect(parseFeedCursor({ createdAt: CREATED_AT, id: ID })).toEqual({ createdAt: CREATED_AT, id: ID })
  })

  test('copies only known keys, dropping extra client fields', () => {
    const parsed = parseFeedCursor({ createdAt: CREATED_AT, id: ID, limit: 9999, filter: 'x' })
    expect(parsed).toEqual({ createdAt: CREATED_AT, id: ID })
    expect(Object.keys(parsed ?? {})).toEqual(['createdAt', 'id'])
  })

  test('rejects primitives', () => {
    for (const value of ['cursor', 1, true]) expect(parseFeedCursor(value)).toBeUndefined()
  })

  test('rejects timestamps that are not UTC with milliseconds', () => {
    for (const createdAt of [
      '2026-10-14T09:54:41Z',
      '2026-10-14T09:54:41.12Z',
      '2026-10-14T09:54:41.123+07:00',
      '2026-10-14 09:54:41.123Z',
      '2026-10-14',
      123,
    ]) {
      expect(parseFeedCursor({ createdAt, id: ID })).toBeUndefined()
    }
  })

  test('rejects a well-shaped but unparseable timestamp', () => {
    expect(parseFeedCursor({ createdAt: '2026-13-40T99:99:99.999Z', id: ID })).toBeUndefined()
  })

  test('rejects a missing or malformed id', () => {
    expect(parseFeedCursor({ createdAt: CREATED_AT })).toBeUndefined()
    expect(parseFeedCursor({ createdAt: CREATED_AT, id: 'not-a-uuid' })).toBeUndefined()
  })
})
