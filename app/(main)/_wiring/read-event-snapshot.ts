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

/**
 * Request-time snapshot of a target instant + the clock (default: EVENT_START_AT; /prelaunch passes
 * SITE_LAUNCH_AT). Call only after `await connection()`.
 */
export function readEventSnapshot(target: Date | null = readEventStartFromEnv()): EventSnapshot {
  return {
    targetIso: target?.toISOString() ?? null,
    date: formatEventDate(target),
    countdown: getCountdown(target, Date.now()),
  }
}
