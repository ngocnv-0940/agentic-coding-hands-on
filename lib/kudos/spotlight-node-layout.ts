const MARGIN_PERCENT = 6
const SPAN_PERCENT = 100 - 2 * MARGIN_PERCENT

/** FNV-1a, 32 bit, over UTF-16 code units. Pure and platform independent (no Math.random, no Intl). */
function hash32(text: string): number {
  let hash = 0x811c9dc5
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i)
    hash = Math.imul(hash, 0x01000193) >>> 0
  }
  return hash
}

const round2 = (value: number) => Math.round(value * 100) / 100

/**
 * ALG-005: node position in percent of the canvas (6 to 94 on both axes), derived from the id alone so the
 * server and the browser agree and nodes do not jump on reload. Two nodes may overlap (accepted in v1).
 */
export function positionFor(id: string): { x: number; y: number } {
  const hash = hash32(id)
  return {
    x: round2(MARGIN_PERCENT + ((hash % 1000) / 1000) * SPAN_PERCENT),
    y: round2(MARGIN_PERCENT + (((hash >>> 10) % 1000) / 1000) * SPAN_PERCENT),
  }
}

/**
 * BR-011 matching key: case-insensitive and Vietnamese-diacritic-insensitive ("Đặng" -> "dang").
 * Lowercase first so "Đ" reaches the explicit đ -> d step (đ has no Unicode decomposition).
 */
export function normalizeSearchText(text: string): string {
  return text.toLowerCase().normalize('NFD').replace(/\p{M}/gu, '').replace(/đ/g, 'd')
}
