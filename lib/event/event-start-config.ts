const EVENT_TIME_ZONE = 'Asia/Ho_Chi_Minh'
const EMPTY_DATE = '—'
const MINUTE_MS = 60_000

/** ISO-8601 date-time that MUST carry an offset or `Z`; offset-less values are invalid (no server-TZ guess). */
const STRICT_ISO =
  /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{1,3}))?)?(?:Z|([+-])(\d{2}):(\d{2}))$/

export type CountdownValue = {
  days: string
  hours: string
  minutes: string
  comingSoon: boolean
}

export const ZERO_COUNTDOWN: CountdownValue = {
  days: '00',
  hours: '00',
  minutes: '00',
  comingSoon: false,
}

const dateFormatter = new Intl.DateTimeFormat('en-GB', {
  timeZone: EVENT_TIME_ZONE,
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
})

const isLeapYear = (year: number) => (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0

function daysInMonth(year: number, month: number): number {
  if (month === 2) return isLeapYear(year) ? 29 : 28
  return [4, 6, 9, 11].includes(month) ? 30 : 31
}

/**
 * Strict parse of an ISO-8601 env value (`EVENT_START_AT` and `SITE_LAUNCH_AT` share it); missing, empty, offset-less, malformed or impossible
 * calendar/clock/offset values (e.g. `2025-02-30`, `24:00`, `+25:00`) → null, never rolled over.
 */
export function parseEventStart(raw: string | undefined | null): Date | null {
  const match = STRICT_ISO.exec(raw?.trim() ?? '')
  if (!match) return null
  const [year, month, day, hour, minute] = match.slice(1, 6).map(Number)
  const second = Number(match[6] ?? 0)
  const millis = Number((match[7] ?? '').padEnd(3, '0') || 0)
  const offsetHour = Number(match[9] ?? 0)
  const offsetMinute = Number(match[10] ?? 0)
  if (month < 1 || month > 12 || day < 1 || day > daysInMonth(year, month)) return null
  if (hour > 23 || minute > 59 || second > 59 || offsetHour > 23 || offsetMinute > 59) return null

  const utc = new Date(0)
  utc.setUTCFullYear(year, month - 1, day)
  utc.setUTCHours(hour, minute, second, millis)
  const offsetMs = (offsetHour * 60 + offsetMinute) * MINUTE_MS * (match[8] === '-' ? -1 : 1)
  return new Date(utc.getTime() - offsetMs)
}

/** Server-only env read (non-`NEXT_PUBLIC_`); the caller passes the result to the client as a prop. */
export function readEventStartFromEnv(): Date | null {
  return parseEventStart(process.env.EVENT_START_AT)
}

/** Server-only env read of the pre-launch lock time; independent of {@link readEventStartFromEnv}. */
export function readSiteLaunchFromEnv(): Date | null {
  return parseEventStart(process.env.SITE_LAUNCH_AT)
}

/** `dd/MM/yyyy` in Asia/Ho_Chi_Minh, no time of day; null → "—". */
export function formatEventDate(date: Date | null): string {
  return date ? dateFormatter.format(date) : EMPTY_DATE
}

const pad = (n: number) => String(n).padStart(2, '0')

/** Whole minutes remaining (floored); days >= 100 render 3 digits (no truncation). */
export function getCountdown(target: Date | null, nowMs: number): CountdownValue {
  if (!target) return ZERO_COUNTDOWN
  const diff = target.getTime() - nowMs
  if (diff <= 0) return ZERO_COUNTDOWN
  const remaining = Math.floor(diff / MINUTE_MS) // < 1 min left: 00/00/00 but still "Coming soon"
  return {
    days: pad(Math.floor(remaining / 1440)),
    hours: pad(Math.floor((remaining % 1440) / 60)),
    minutes: pad(remaining % 60),
    comingSoon: true,
  }
}
