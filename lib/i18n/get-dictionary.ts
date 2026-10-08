import { en } from './dictionary-en'
import { vi, type Dictionary } from './dictionary-vi'
import type { Locale } from './locale-config'

const dictionaries: Record<Locale, Dictionary> = { vi, en }

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale]
}
