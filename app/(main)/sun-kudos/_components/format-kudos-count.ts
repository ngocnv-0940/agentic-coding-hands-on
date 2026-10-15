/** Thousands separated by a dot, as the Figma like count: 1000 -> "1.000". Locale-free so SSR and CSR agree. */
export function formatKudosCount(value: number): string {
  return String(Math.trunc(value)).replace(/\B(?=(\d{3})+(?!\d))/g, '.')
}
