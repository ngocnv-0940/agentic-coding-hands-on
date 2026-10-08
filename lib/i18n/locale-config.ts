export const LOCALES = ['vi', 'en'] as const
export type Locale = (typeof LOCALES)[number]

export const DEFAULT_LOCALE: Locale = 'vi'
export const LOCALE_COOKIE = 'NEXT_LOCALE'
export const LOCALE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365

/** Exact, case-sensitive match against the supported locales. */
export function isLocale(value: unknown): value is Locale {
  return typeof value === 'string' && (LOCALES as readonly string[]).includes(value)
}

/** Unknown, missing or malformed values fall back to the default locale. */
export function resolveLocale(raw: string | undefined | null): Locale {
  return isLocale(raw) ? raw : DEFAULT_LOCALE
}
