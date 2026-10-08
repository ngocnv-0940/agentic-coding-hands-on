import { cookies } from 'next/headers'
import { LOCALE_COOKIE, resolveLocale, type Locale } from './locale-config'

/** Reads NEXT_LOCALE; makes the caller dynamic (cookies() is a request-time API). */
export async function getLocale(): Promise<Locale> {
  const store = await cookies()
  return resolveLocale(store.get(LOCALE_COOKIE)?.value)
}
