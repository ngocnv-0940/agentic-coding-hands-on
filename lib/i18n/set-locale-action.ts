'use server'

import { refresh } from 'next/cache'
import { cookies } from 'next/headers'
import {
  isLocale,
  LOCALE_COOKIE,
  LOCALE_COOKIE_MAX_AGE,
  resolveLocale,
} from './locale-config'

/**
 * Persists the chosen locale and re-renders the current route.
 * Invalid input and re-selecting the current locale are silent no-ops (no cookie written).
 */
export async function setLocale(raw: string): Promise<void> {
  if (!isLocale(raw)) return

  const store = await cookies()
  if (resolveLocale(store.get(LOCALE_COOKIE)?.value) === raw) return

  store.set(LOCALE_COOKIE, raw, {
    path: '/',
    maxAge: LOCALE_COOKIE_MAX_AGE,
    sameSite: 'lax',
  })
  refresh()
}
