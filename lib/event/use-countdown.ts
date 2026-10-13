'use client'

import { useEffect, useState } from 'react'
import { getCountdown, parseEventStart, type CountdownValue } from './event-start-config'

const MINUTE_MS = 60_000

/**
 * Countdown whose displayed (floored) minutes update the instant they change: each tick is
 * scheduled for the moment the remaining time next crosses a whole-minute boundary, then the
 * value is recomputed from Date.now() (no drift accumulation). First render returns the server
 * snapshot verbatim (no Date.now() in render → no hydration mismatch); the effect recomputes
 * immediately, then re-arms until the target is reached.
 */
export function useCountdown(targetIso: string | null, initial: CountdownValue): CountdownValue {
  const [value, setValue] = useState<CountdownValue>(initial)

  useEffect(() => {
    const target = parseEventStart(targetIso)
    let timeout: ReturnType<typeof setTimeout> | undefined
    let cancelled = false

    const tick = () => {
      if (cancelled) return
      const now = Date.now()
      const next = getCountdown(target, now)
      setValue((prev) =>
        prev.days === next.days &&
        prev.hours === next.hours &&
        prev.minutes === next.minutes &&
        prev.comingSoon === next.comingSoon
          ? prev
          : next,
      )
      if (!target || !next.comingSoon) return
      // floor(diff / 60s) drops once diff falls below the next whole-minute multiple: that is
      // (diff % 60s) + 1 ms from now (1 ms when diff is exactly on a boundary).
      const delay = ((target.getTime() - now) % MINUTE_MS) + 1
      timeout = setTimeout(tick, delay)
    }

    tick()

    return () => {
      cancelled = true
      if (timeout) clearTimeout(timeout)
    }
  }, [targetIso])

  return value
}
