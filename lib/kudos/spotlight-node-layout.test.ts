import { describe, expect, test } from 'bun:test'
import { normalizeSearchText, positionFor } from './spotlight-node-layout'

describe('positionFor (ALG-005)', () => {
  test('is deterministic for the same id', () => {
    const id = '3f2a6c1e-8b4d-4e7a-9c21-0d5f6b7a8e90'
    expect(positionFor(id)).toEqual(positionFor(id))
  })

  test('stays within 6..94 percent on both axes, with at most 2 decimals', () => {
    const ids = ['', 'a', 'Đặng', ...Array.from({ length: 500 }, (_, i) => `sunner-${i}`)]
    for (const id of ids) {
      const { x, y } = positionFor(id)
      for (const v of [x, y]) {
        expect(v).toBeGreaterThanOrEqual(6)
        expect(v).toBeLessThanOrEqual(94)
        expect(Math.round(v * 100) / 100).toBe(v)
      }
    }
  })

  test('different ids spread out rather than collapsing onto one point', () => {
    const points = new Set(Array.from({ length: 100 }, (_, i) => JSON.stringify(positionFor(`id-${i}`))))
    expect(points.size).toBeGreaterThan(90)
  })
})

describe('normalizeSearchText (BR-011)', () => {
  test('is case-insensitive', () => {
    expect(normalizeSearchText('NGUYEN')).toBe('nguyen')
  })

  test('strips Vietnamese diacritics, including Đ/đ', () => {
    expect(normalizeSearchText('Đặng Thị Ánh')).toBe('dang thi anh')
    expect(normalizeSearchText('Nguyễn Văn Đức')).toBe('nguyen van duc')
  })

  test('precomposed and decomposed input normalize identically', () => {
    expect(normalizeSearchText('Ánh'.normalize('NFC'))).toBe(normalizeSearchText('Ánh'.normalize('NFD')))
  })
})
