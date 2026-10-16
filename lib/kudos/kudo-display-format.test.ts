import { describe, expect, test } from 'bun:test'
import { formatKudoTime, formatLikeCount } from './kudo-display-format'

describe('formatKudoTime (FR-003 / BR-010: HH:mm - MM/DD/YYYY, Asia/Ho_Chi_Minh)', () => {
  test('converts UTC to Vietnam time (UTC+7)', () => {
    expect(formatKudoTime('2026-10-14T02:05:00.000Z')).toBe('09:05 - 10/14/2026')
  })

  test('crosses the date line into the next Vietnam day', () => {
    expect(formatKudoTime('2025-12-31T17:30:00.000Z')).toBe('00:30 - 01/01/2026')
  })

  test('midnight renders as 00, not 24', () => {
    expect(formatKudoTime('2026-10-13T17:00:00.000Z')).toBe('00:00 - 10/14/2026')
  })

  test('honours an explicit offset in the input', () => {
    expect(formatKudoTime('2026-10-14T23:59:00+07:00')).toBe('23:59 - 10/14/2026')
  })

  test('unparseable input gives an empty string', () => {
    expect(formatKudoTime('')).toBe('')
    expect(formatKudoTime('not a date')).toBe('')
  })
})

describe('formatLikeCount (BR-010: dot thousands separator)', () => {
  test('below one thousand is unchanged', () => {
    expect(formatLikeCount(0)).toBe('0')
    expect(formatLikeCount(999)).toBe('999')
  })

  test('groups thousands with a dot', () => {
    expect(formatLikeCount(1000)).toBe('1.000')
    expect(formatLikeCount(12345)).toBe('12.345')
    expect(formatLikeCount(1234567)).toBe('1.234.567')
  })

  test('drops any fractional part', () => {
    expect(formatLikeCount(1000.9)).toBe('1.000')
  })
})
