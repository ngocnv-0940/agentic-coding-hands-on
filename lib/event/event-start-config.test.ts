import { describe, expect, test } from 'bun:test'
import { ZERO_COUNTDOWN, formatEventDate, getCountdown, parseEventStart } from './event-start-config'

const MINUTE = 60_000
const DAY = 1440 * MINUTE

describe('parseEventStart (F003 FR-001 / BR-002)', () => {
  test('accepts ISO-8601 with an offset and with Z', () => {
    expect(parseEventStart('2025-12-26T18:30:00+07:00')?.toISOString()).toBe('2025-12-26T11:30:00.000Z')
    expect(parseEventStart('2025-12-26T11:30:00Z')?.toISOString()).toBe('2025-12-26T11:30:00.000Z')
    expect(parseEventStart('2025-12-26T06:00-05:30')?.toISOString()).toBe('2025-12-26T11:30:00.000Z')
  })

  test('accepts optional seconds and 1-3 fractional digits', () => {
    expect(parseEventStart('2025-12-26T11:30Z')?.toISOString()).toBe('2025-12-26T11:30:00.000Z')
    expect(parseEventStart('2025-12-26T11:30:05.5Z')?.toISOString()).toBe('2025-12-26T11:30:05.500Z')
    expect(parseEventStart('2025-12-26T11:30:05.123Z')?.toISOString()).toBe('2025-12-26T11:30:05.123Z')
  })

  test('tolerates surrounding whitespace from env files', () => {
    expect(parseEventStart('  2025-12-26T11:30:00Z\n')?.toISOString()).toBe('2025-12-26T11:30:00.000Z')
  })

  test('missing or empty values are invalid', () => {
    expect(parseEventStart(undefined)).toBeNull()
    expect(parseEventStart(null)).toBeNull()
    expect(parseEventStart('')).toBeNull()
    expect(parseEventStart('   ')).toBeNull()
  })

  test('an offset-less value is invalid (no server time zone guess)', () => {
    expect(parseEventStart('2025-12-26T18:30:00')).toBeNull()
    expect(parseEventStart('2025-12-26')).toBeNull()
  })

  test('malformed shapes are invalid', () => {
    for (const raw of [
      '2025-12-26 18:30:00Z',
      '2025-12-26T18:30:00+0700',
      '2025-12-26T18:30:00.1234Z',
      '26/12/2025 18:30',
      '1766748600000',
      'tomorrow',
    ]) {
      expect(parseEventStart(raw)).toBeNull()
    }
  })

  test('impossible calendar dates are invalid, never rolled over', () => {
    expect(parseEventStart('2025-02-30T00:00:00Z')).toBeNull()
    expect(parseEventStart('2025-02-29T00:00:00Z')).toBeNull()
    expect(parseEventStart('2025-04-31T00:00:00Z')).toBeNull()
    expect(parseEventStart('2025-13-01T00:00:00Z')).toBeNull()
    expect(parseEventStart('2025-00-10T00:00:00Z')).toBeNull()
    expect(parseEventStart('2025-01-00T00:00:00Z')).toBeNull()
  })

  test('leap years follow the Gregorian rule', () => {
    expect(parseEventStart('2024-02-29T00:00:00Z')).not.toBeNull()
    expect(parseEventStart('2000-02-29T00:00:00Z')).not.toBeNull()
    expect(parseEventStart('1900-02-29T00:00:00Z')).toBeNull()
  })

  test('impossible clock and offset values are invalid', () => {
    expect(parseEventStart('2025-12-26T24:00:00Z')).toBeNull()
    expect(parseEventStart('2025-12-26T23:60:00Z')).toBeNull()
    expect(parseEventStart('2025-12-26T23:59:60Z')).toBeNull()
    expect(parseEventStart('2025-12-26T18:30:00+25:00')).toBeNull()
    expect(parseEventStart('2025-12-26T18:30:00+07:60')).toBeNull()
  })

  test('end-of-day boundaries are valid', () => {
    expect(parseEventStart('2025-12-31T23:59:59.999Z')?.toISOString()).toBe('2025-12-31T23:59:59.999Z')
  })
})

describe('formatEventDate (F003 FR-205: dd/MM/yyyy in Asia/Ho_Chi_Minh)', () => {
  test('formats in Vietnam time', () => {
    expect(formatEventDate(new Date('2025-12-26T11:30:00Z'))).toBe('26/12/2025')
  })

  test('uses the Vietnam calendar day, not UTC', () => {
    expect(formatEventDate(new Date('2025-12-25T17:00:00Z'))).toBe('26/12/2025')
    expect(formatEventDate(new Date('2025-12-25T16:59:59Z'))).toBe('25/12/2025')
  })

  test('null (missing or invalid env) shows an em dash (D008)', () => {
    expect(formatEventDate(null)).toBe('—')
  })
})

describe('getCountdown (F003 BR-001)', () => {
  const target = new Date('2025-12-26T11:30:00Z')
  const at = (msBefore: number) => target.getTime() - msBefore

  test('no target means zero and no "Coming soon"', () => {
    expect(getCountdown(null, 0)).toEqual(ZERO_COUNTDOWN)
  })

  test('at or after the target it is zero and never negative', () => {
    expect(getCountdown(target, at(0))).toEqual(ZERO_COUNTDOWN)
    expect(getCountdown(target, at(-DAY))).toEqual(ZERO_COUNTDOWN)
  })

  test('splits the remaining time into days, hours and minutes', () => {
    expect(getCountdown(target, at(2 * DAY + 3 * 60 * MINUTE + 4 * MINUTE))).toEqual({
      days: '02',
      hours: '03',
      minutes: '04',
      comingSoon: true,
    })
  })

  test('floors partial minutes', () => {
    expect(getCountdown(target, at(5 * MINUTE + 59_999)).minutes).toBe('05')
  })

  test('under one minute left shows 00 00 00 but still "Coming soon"', () => {
    expect(getCountdown(target, at(1))).toEqual({ days: '00', hours: '00', minutes: '00', comingSoon: true })
  })

  test('100 days or more keeps all digits', () => {
    expect(getCountdown(target, at(123 * DAY)).days).toBe('123')
  })

  test('just under a day rolls hours and minutes to 23:59', () => {
    expect(getCountdown(target, at(DAY - 1))).toMatchObject({ days: '00', hours: '23', minutes: '59' })
  })
})
