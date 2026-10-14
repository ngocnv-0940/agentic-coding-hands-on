'use client'

import { CountdownDisplay } from '../../(main)/_components/countdown-display'
import { useCountdown } from '@/lib/event/use-countdown'
import type { CountdownValue } from '@/lib/event/event-start-config'
import { useNavigateHomeAtEventStart } from '../_behavior/use-navigate-home-at-event-start'

type PrelaunchCountdownContainerProps = {
  /** ISO string of the site launch, or null when SITE_LAUNCH_AT is missing/invalid. */
  targetIso: string | null
  /** Server snapshot: first client render must equal it (no hydration mismatch). */
  initial: CountdownValue
  /** Server-measured ms until the event starts (0 when already started or no target). */
  remainingMs: number
  labels: { days: string; hours: string; minutes: string }
}

export function PrelaunchCountdownContainer({
  targetIso,
  initial,
  remainingMs,
  labels,
}: PrelaunchCountdownContainerProps) {
  const value = useCountdown(targetIso, initial)
  useNavigateHomeAtEventStart(remainingMs)
  return (
    <CountdownDisplay
      size="prelaunch"
      days={value.days}
      hours={value.hours}
      minutes={value.minutes}
      labels={labels}
      comingSoonText={null}
    />
  )
}
