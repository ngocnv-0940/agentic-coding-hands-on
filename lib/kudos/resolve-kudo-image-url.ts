import { supabaseUrl } from '@/lib/supabase/config'
import type { KudoCard } from './kudo-board-types'
import { KUDO_IMAGE_NAME } from './kudo-write-rules'

const BUCKET = 'kudo-images'
const STORED_PREFIX = `${BUCKET}/`
const PUBLIC_BASE = `${supabaseUrl.replace(/\/+$/, '')}/storage/v1/object/public/${BUCKET}/`

/**
 * One place that turns a stored `kudo_images.url` into something an `<img>` may load, or `null` to drop it:
 * - `kudo-images/<uuid>.<ext>` (uploaded) -> the public Storage URL;
 * - `/images/...` (local artwork, never `//host`) and `https://...` are returned unchanged;
 * - anything else (`javascript:`, `data:`, `http:`, a foreign path) is dropped. Closes F006 follow-up L7 on read.
 */
export function resolveKudoImageUrl(stored: unknown): string | null {
  if (typeof stored !== 'string') return null
  if (stored.startsWith(STORED_PREFIX)) {
    const name = stored.slice(STORED_PREFIX.length)
    return KUDO_IMAGE_NAME.test(name) ? `${PUBLIC_BASE}${name}` : null
  }
  if (stored.startsWith('/images/')) return stored
  if (stored.startsWith('https://')) {
    try {
      return new URL(stored).protocol === 'https:' ? stored : null
    } catch {
      return null
    }
  }
  return null
}

/** Card with every image resolved and the unusable ones removed (order kept). */
export function withResolvedImages(card: KudoCard): KudoCard {
  const images = Array.isArray(card.images) ? card.images : []
  return { ...card, images: images.flatMap((image) => {
    const url = resolveKudoImageUrl(image?.url)
    return url ? [{ url }] : []
  }) }
}
