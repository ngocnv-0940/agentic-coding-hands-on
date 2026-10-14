// One formatter instance: built from parts with a fixed zone and locale, so Node (SSR) and the browser (CSR)
// print the same string and hydration never mismatches (BR-010). `hourCycle: 'h23'` keeps midnight as "00".
const VIETNAM_TIME = new Intl.DateTimeFormat('en-US', {
  timeZone: 'Asia/Ho_Chi_Minh',
  hourCycle: 'h23',
  hour: '2-digit',
  minute: '2-digit',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})

/** ISO timestamp -> `HH:mm - MM/DD/YYYY` in Asia/Ho_Chi_Minh. An unparseable input gives `''`. */
export function formatKudoTime(iso: string): string {
  const at = new Date(iso)
  if (Number.isNaN(at.getTime())) return ''
  const part: Record<string, string> = {}
  for (const { type, value } of VIETNAM_TIME.formatToParts(at)) part[type] = value
  return `${part.hour}:${part.minute} - ${part.month}/${part.day}/${part.year}`
}

/** Like count with a dot between thousands: 1000 -> "1.000". Locale-free on purpose (BR-010). */
export function formatLikeCount(count: number): string {
  return String(Math.trunc(count)).replace(/\B(?=(\d{3})+(?!\d))/g, '.')
}
