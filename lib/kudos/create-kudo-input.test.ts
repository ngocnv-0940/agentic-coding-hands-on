import { describe, expect, test } from 'bun:test'
import { parseCreateKudoInput, toCreateKudoErrorCode, toSunnerOptions } from './create-kudo-input'

const RECEIVER = '3f2a6c1e-8b4d-4e7a-9c21-0d5f6b7a8e90'
const IMAGE = (n: number) => `3f2a6c1e-8b4d-4e7a-9c21-0d5f6b7a8e9${n}.png`

const valid = () => ({
  receiverId: RECEIVER,
  title: 'Người truyền cảm hứng',
  content: 'Cảm ơn @Nguyễn Văn A',
  contentDoc: { type: 'doc', content: [] },
  hashtagSlugs: ['teamwork'],
  imagePaths: [IMAGE(1)],
  isAnonymous: false,
  anonymousName: '',
})

describe('toCreateKudoErrorCode', () => {
  test('passes the fixed create_kudo codes through', () => {
    for (const code of ['self_kudo', 'receiver_not_found', 'hashtags_invalid', 'anonymous_name_invalid'] as const) {
      expect(toCreateKudoErrorCode(code)).toBe(code)
    }
  })

  test('maps raw database text and non-strings to unknown', () => {
    expect(toCreateKudoErrorCode('duplicate key value violates unique constraint')).toBe('unknown')
    expect(toCreateKudoErrorCode('unauthenticated')).toBe('unknown')
    expect(toCreateKudoErrorCode(undefined)).toBe('unknown')
    expect(toCreateKudoErrorCode({ message: 'self_kudo' })).toBe('unknown')
  })
})

describe('parseCreateKudoInput', () => {
  test('accepts a valid payload and copies only known keys', () => {
    const parsed = parseCreateKudoInput({ ...valid(), senderId: RECEIVER, extra: 1 })
    expect(parsed).toEqual(valid())
    expect(parsed).not.toHaveProperty('senderId')
  })

  test('returns fresh arrays, not the caller-owned ones', () => {
    const input = valid()
    const parsed = parseCreateKudoInput(input)
    expect(parsed?.hashtagSlugs).not.toBe(input.hashtagSlugs)
    expect(parsed?.imagePaths).not.toBe(input.imagePaths)
  })

  test('rejects non-objects', () => {
    for (const value of [null, undefined, 'x', 1, [valid()]]) expect(parseCreateKudoInput(value)).toBeNull()
  })

  test('rejects a malformed receiver id', () => {
    expect(parseCreateKudoInput({ ...valid(), receiverId: 'abc' })).toBeNull()
  })

  test('applies title and content length rules', () => {
    expect(parseCreateKudoInput({ ...valid(), title: '   ' })).toBeNull()
    expect(parseCreateKudoInput({ ...valid(), title: 't'.repeat(101) })).toBeNull()
    expect(parseCreateKudoInput({ ...valid(), title: 't'.repeat(100) })).not.toBeNull()
    expect(parseCreateKudoInput({ ...valid(), content: '' })).toBeNull()
    expect(parseCreateKudoInput({ ...valid(), content: 'c'.repeat(2001) })).toBeNull()
    expect(parseCreateKudoInput({ ...valid(), content: 'c'.repeat(2000) })).not.toBeNull()
  })

  test('contentDoc must be a plain object within the 64 KiB budget', () => {
    expect(parseCreateKudoInput({ ...valid(), contentDoc: [] })).toBeNull()
    expect(parseCreateKudoInput({ ...valid(), contentDoc: '{}' })).toBeNull()
    expect(parseCreateKudoInput({ ...valid(), contentDoc: { text: 'x'.repeat(64 * 1024) } })).toBeNull()
  })

  test('contentDoc that cannot be serialized is rejected, not thrown', () => {
    const cyclic: Record<string, unknown> = { type: 'doc' }
    cyclic.self = cyclic
    expect(parseCreateKudoInput({ ...valid(), contentDoc: cyclic })).toBeNull()
    expect(parseCreateKudoInput({ ...valid(), contentDoc: { n: BigInt(1) } })).toBeNull()
  })

  test('hashtags: 1..5, strings, unique', () => {
    expect(parseCreateKudoInput({ ...valid(), hashtagSlugs: [] })).toBeNull()
    expect(parseCreateKudoInput({ ...valid(), hashtagSlugs: ['a', 'b', 'c', 'd', 'e', 'f'] })).toBeNull()
    expect(parseCreateKudoInput({ ...valid(), hashtagSlugs: ['a', 'a'] })).toBeNull()
    expect(parseCreateKudoInput({ ...valid(), hashtagSlugs: ['a', 1] })).toBeNull()
  })

  test('images: optional, at most 5, unique neutral names', () => {
    expect(parseCreateKudoInput({ ...valid(), imagePaths: [] })).not.toBeNull()
    expect(parseCreateKudoInput({ ...valid(), imagePaths: [1, 2, 3, 4, 5].map(IMAGE) })).not.toBeNull()
    expect(parseCreateKudoInput({ ...valid(), imagePaths: [1, 2, 3, 4, 5, 6].map(IMAGE) })).toBeNull()
    expect(parseCreateKudoInput({ ...valid(), imagePaths: [IMAGE(1), IMAGE(1)] })).toBeNull()
    expect(parseCreateKudoInput({ ...valid(), imagePaths: [`user/${IMAGE(1)}`] })).toBeNull()
    expect(parseCreateKudoInput({ ...valid(), imagePaths: 'a.png' })).toBeNull()
  })

  test('anonymous flag must be boolean and alias at most 50 characters', () => {
    expect(parseCreateKudoInput({ ...valid(), isAnonymous: 'true' })).toBeNull()
    expect(parseCreateKudoInput({ ...valid(), isAnonymous: true, anonymousName: 'n'.repeat(50) })).not.toBeNull()
    expect(parseCreateKudoInput({ ...valid(), isAnonymous: true, anonymousName: 'n'.repeat(51) })).toBeNull()
    expect(parseCreateKudoInput({ ...valid(), anonymousName: undefined })).toBeNull()
  })
})

describe('toSunnerOptions', () => {
  test('maps well-formed rows and nulls out non-string optional fields', () => {
    expect(
      toSunnerOptions([
        { id: RECEIVER, name: 'An', avatarUrl: 'https://a/b.png', department: 'CEVC1' },
        { id: RECEIVER, name: 'Bình', avatarUrl: 3, department: null },
      ]),
    ).toEqual([
      { id: RECEIVER, name: 'An', avatarUrl: 'https://a/b.png', department: 'CEVC1' },
      { id: RECEIVER, name: 'Bình', avatarUrl: null, department: null },
    ])
  })

  test('skips rows of the wrong shape', () => {
    expect(toSunnerOptions([null, [], { id: 'x', name: 'A' }, { id: RECEIVER }, { id: RECEIVER, name: 1 }])).toEqual([])
  })

  test('non-array data gives no options', () => {
    expect(toSunnerOptions(null)).toEqual([])
    expect(toSunnerOptions({ id: RECEIVER, name: 'A' })).toEqual([])
  })
})
