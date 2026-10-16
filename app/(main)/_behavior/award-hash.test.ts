import { describe, expect, test } from 'bun:test'
import { AWARD_SLUGS, awardHref } from '@/lib/awards/award-categories'
import { parseAwardHash } from './award-hash'

describe('parseAwardHash', () => {
  test('maps each known slug, with or without the leading #', () => {
    for (const slug of AWARD_SLUGS) {
      expect(parseAwardHash(`#${slug}`, AWARD_SLUGS)).toBe(slug)
      expect(parseAwardHash(slug, AWARD_SLUGS)).toBe(slug)
    }
  })

  test('round-trips the hash that awardHref produces (F003 FR-209)', () => {
    for (const slug of AWARD_SLUGS) {
      expect(parseAwardHash(new URL(awardHref(slug), 'https://x').hash, AWARD_SLUGS)).toBe(slug)
    }
  })

  test('decodes percent-escapes before matching', () => {
    expect(parseAwardHash('#%6Dvp', AWARD_SLUGS)).toBe('mvp')
  })

  test('empty, unknown or differently-cased hashes give null', () => {
    for (const hash of ['', '#', '#unknown', '#MVP', '#mvp ', '#top', '##mvp']) {
      expect(parseAwardHash(hash, AWARD_SLUGS)).toBeNull()
    }
  })

  test('a malformed escape gives null instead of throwing', () => {
    expect(parseAwardHash('#%E0', AWARD_SLUGS)).toBeNull()
    expect(parseAwardHash('#%', AWARD_SLUGS)).toBeNull()
  })

  test('markup or selector-like input never matches', () => {
    expect(parseAwardHash('#<img src=x onerror=alert(1)>', AWARD_SLUGS)).toBeNull()
    expect(parseAwardHash('#mvp,#top-talent', AWARD_SLUGS)).toBeNull()
  })
})
