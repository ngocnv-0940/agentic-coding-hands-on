import { describe, expect, test } from 'bun:test'
import { DEFAULT_LOCALE, isLocale, resolveLocale } from './locale-config'

describe('isLocale', () => {
  test('accepts the supported locales exactly', () => {
    expect(isLocale('vi')).toBe(true)
    expect(isLocale('en')).toBe(true)
  })

  test('rejects other values, casing variants and non-strings', () => {
    for (const value of ['EN', 'Vi', 'en-US', 'ja', '', ' en', null, undefined, 1, ['en']]) {
      expect(isLocale(value)).toBe(false)
    }
  })
})

describe('resolveLocale', () => {
  test('keeps a supported locale', () => {
    expect(resolveLocale('en')).toBe('en')
  })

  test('falls back to Vietnamese for missing, unknown or malformed cookies', () => {
    expect(DEFAULT_LOCALE).toBe('vi')
    for (const raw of [undefined, null, '', 'fr', 'EN', 'en;path=/']) expect(resolveLocale(raw)).toBe('vi')
  })
})
