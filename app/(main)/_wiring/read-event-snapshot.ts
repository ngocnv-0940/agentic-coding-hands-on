import {
  formatEventDate,
  getCountdown,
  readEventStartFromEnv,
  type CountdownValue,
} from '@/lib/event/event-start-config'

export type EventSnapshot = {
  targetIso: string | null
  date: string
  countdown: CountdownValue
}

/** Request-time snapshot of EVENT_START_AT + the clock. Call only after `await connection()`. */
export function readEventSnapshot(): EventSnapshot {
  const target = readEventStartFromEnv()
  return {
    targetIso: target?.toISOString() ?? null,
    date: formatEventDate(target),
    countdown: getCountdown(target, Date.now()),
  }
}
