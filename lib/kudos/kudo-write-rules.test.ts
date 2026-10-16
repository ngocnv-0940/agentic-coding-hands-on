import { describe, expect, test } from 'bun:test'
import {
  KUDO_IMAGE_NAME,
  isAnonymousNameValid,
  isContentValid,
  isHashtagSelectionValid,
  isLinkTextValid,
  isLinkUrlValid,
  isTitleValid,
  requiredFieldErrors,
  sniffImageMime,
  textLength,
} from './kudo-write-rules'

describe('textLength', () => {
  test('counts code points, so an emoji counts once (like Postgres char_length)', () => {
    expect(textLength('👍')).toBe(1)
    expect(textLength('Đặng')).toBe(4)
  })
})

describe('isTitleValid (BR-009: 1..100 after trim)', () => {
  test('boundaries', () => {
    expect(isTitleValid('a')).toBe(true)
    expect(isTitleValid('a'.repeat(100))).toBe(true)
    expect(isTitleValid('a'.repeat(101))).toBe(false)
  })

  test('empty or whitespace-only is invalid', () => {
    expect(isTitleValid('')).toBe(false)
    expect(isTitleValid(' \t\n ')).toBe(false)
  })

  test('surrounding whitespace does not count toward the limit', () => {
    expect(isTitleValid(`  ${'a'.repeat(100)}  `)).toBe(true)
  })

  test('100 emoji is valid, 101 is not (code points, not UTF-16 units)', () => {
    expect(isTitleValid('😀'.repeat(100))).toBe(true)
    expect(isTitleValid('😀'.repeat(101))).toBe(false)
  })
})

describe('isContentValid (BR-003: 1..2000 after trim)', () => {
  test('boundaries', () => {
    expect(isContentValid('x')).toBe(true)
    expect(isContentValid('x'.repeat(2000))).toBe(true)
    expect(isContentValid('x'.repeat(2001))).toBe(false)
    expect(isContentValid('   ')).toBe(false)
  })
})

describe('isAnonymousNameValid (BR-006: optional, max 50)', () => {
  test('blank is allowed', () => {
    expect(isAnonymousNameValid('')).toBe(true)
    expect(isAnonymousNameValid('   ')).toBe(true)
  })

  test('50 is the upper bound after trim', () => {
    expect(isAnonymousNameValid('n'.repeat(50))).toBe(true)
    expect(isAnonymousNameValid(` ${'n'.repeat(50)} `)).toBe(true)
    expect(isAnonymousNameValid('n'.repeat(51))).toBe(false)
  })
})

describe('isHashtagSelectionValid (BR-004: 1..5, unique)', () => {
  test('size boundaries', () => {
    expect(isHashtagSelectionValid([])).toBe(false)
    expect(isHashtagSelectionValid(['a'])).toBe(true)
    expect(isHashtagSelectionValid(['a', 'b', 'c', 'd', 'e'])).toBe(true)
    expect(isHashtagSelectionValid(['a', 'b', 'c', 'd', 'e', 'f'])).toBe(false)
  })

  test('duplicates are rejected', () => {
    expect(isHashtagSelectionValid(['a', 'a'])).toBe(false)
  })
})

describe('isLinkTextValid (BR-007: 1..100, not whitespace-only)', () => {
  test('boundaries', () => {
    expect(isLinkTextValid(' ')).toBe(false)
    expect(isLinkTextValid('t')).toBe(true)
    expect(isLinkTextValid('t'.repeat(100))).toBe(true)
    expect(isLinkTextValid('t'.repeat(101))).toBe(false)
  })
})

describe('isLinkUrlValid (BR-007: http/https, 5..2048)', () => {
  test('accepts http and https URLs', () => {
    expect(isLinkUrlValid('https://example.com')).toBe(true)
    expect(isLinkUrlValid('http://example.com/a?b=c#d')).toBe(true)
  })

  test('rejects other schemes', () => {
    for (const url of ['javascript:alert(1)', 'ftp://example.com', 'mailto:a@b.co', 'data:text/html,x', '//example.com']) {
      expect(isLinkUrlValid(url)).toBe(false)
    }
  })

  test('rejects whitespace anywhere (callers must trim first)', () => {
    expect(isLinkUrlValid(' https://example.com')).toBe(false)
    expect(isLinkUrlValid('https://example.com ')).toBe(false)
    expect(isLinkUrlValid('https://exa mple.com')).toBe(false)
  })

  test('length boundaries 5..2048', () => {
    const base = 'https://example.com/'
    expect(isLinkUrlValid(base + 'a'.repeat(2048 - base.length))).toBe(true)
    expect(isLinkUrlValid(base + 'a'.repeat(2049 - base.length))).toBe(false)
    expect(isLinkUrlValid('http')).toBe(false)
  })

  test('rejects a scheme with no host', () => {
    expect(isLinkUrlValid('https://')).toBe(false)
  })
})

describe('sniffImageMime (BR-005: JPEG, PNG, WebP by magic bytes)', () => {
  const bytes = (...values: number[]) => new Uint8Array(values)

  test('detects each accepted type', () => {
    expect(sniffImageMime(bytes(0xff, 0xd8, 0xff, 0xe0))).toBe('image/jpeg')
    expect(sniffImageMime(bytes(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0))).toBe('image/png')
    expect(sniffImageMime(bytes(0x52, 0x49, 0x46, 0x46, 1, 2, 3, 4, 0x57, 0x45, 0x42, 0x50))).toBe('image/webp')
  })

  test('rejects GIF, a RIFF that is not WebP, truncated and empty input', () => {
    expect(sniffImageMime(bytes(0x47, 0x49, 0x46, 0x38, 0x39, 0x61))).toBeNull()
    expect(sniffImageMime(bytes(0x52, 0x49, 0x46, 0x46, 1, 2, 3, 4, 0x41, 0x56, 0x49, 0x20))).toBeNull()
    expect(sniffImageMime(bytes(0x52, 0x49, 0x46, 0x46, 1, 2, 3, 4, 0x57, 0x45))).toBeNull()
    expect(sniffImageMime(bytes(0x89, 0x50, 0x4e, 0x47))).toBeNull()
    expect(sniffImageMime(bytes())).toBeNull()
  })
})

describe('KUDO_IMAGE_NAME (neutral <uuid-v4>.<ext>)', () => {
  test('accepts a v4 uuid with an allowed extension', () => {
    expect(KUDO_IMAGE_NAME.test('3f2a6c1e-8b4d-4e7a-9c21-0d5f6b7a8e90.webp')).toBe(true)
  })

  test('rejects other versions, extensions, uppercase and paths', () => {
    for (const name of [
      '3f2a6c1e-8b4d-1e7a-9c21-0d5f6b7a8e90.png',
      '3f2a6c1e-8b4d-4e7a-9c21-0d5f6b7a8e90.gif',
      '3F2A6C1E-8B4D-4E7A-9C21-0D5F6B7A8E90.png',
      'uid/3f2a6c1e-8b4d-4e7a-9c21-0d5f6b7a8e90.png',
      '3f2a6c1e-8b4d-4e7a-7c21-0d5f6b7a8e90.jpg',
    ]) {
      expect(KUDO_IMAGE_NAME.test(name)).toBe(false)
    }
  })
})

describe('requiredFieldErrors (BR-001)', () => {
  const filled = { recipientId: 'id', title: 'Thanks', content: 'Great work', hashtagSlugs: ['teamwork'] }

  test('a complete form has no errors', () => {
    expect(requiredFieldErrors(filled)).toEqual([])
  })

  test('lists every missing field in form order, treating whitespace as empty', () => {
    expect(requiredFieldErrors({ recipientId: null, title: '  ', content: '\n', hashtagSlugs: [] })).toEqual([
      'recipient',
      'title',
      'content',
      'hashtags',
    ])
  })

  test('an empty-string recipient counts as missing', () => {
    expect(requiredFieldErrors({ ...filled, recipientId: '' })).toEqual(['recipient'])
  })
})
