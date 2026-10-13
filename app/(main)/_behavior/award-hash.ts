import type { AwardSlug } from '@/lib/awards/award-categories'

/**
 * Maps a URL hash (`#mvp`, `%23`-free, possibly garbled) to a known award slug.
 * The hash is untrusted input: decoded defensively and only ever matched against the fixed slug list,
 * never used as a selector or markup. Returns null for empty, unknown or malformed hashes.
 */
export function parseAwardHash(hash: string, slugs: readonly AwardSlug[]): AwardSlug | null {
  const raw = hash.startsWith('#') ? hash.slice(1) : hash
  if (!raw) return null
  let decoded: string
  try {
    decoded = decodeURIComponent(raw)
  } catch {
    return null // malformed escape such as `%E0`
  }
  return slugs.find((slug) => slug === decoded) ?? null
}
