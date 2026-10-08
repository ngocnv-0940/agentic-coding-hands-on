'use client'

import { useCountdown } from '@/lib/event/use-countdown'
import type { CountdownValue } from '@/lib/event/event-start-config'
import { CountdownDisplay } from '../_components/countdown-display'

type CountdownContainerProps = {
  /** ISO string of the event start, or null when EVENT_START_AT is missing/invalid. */
  targetIso: string | null
  /** Server snapshot: first client render must equal it (no hydration mismatch). */
  initial: CountdownValue
  labels: { days: string; hours: string; minutes: string }
  comingSoonText: string
}

export function CountdownContainer({ targetIso, initial, labels, comingSoonText }: CountdownContainerProps) {
  const value = useCountdown(targetIso, initial)
  return (
    <CountdownDisplay
      days={value.days}
      hours={value.hours}
      minutes={value.minutes}
      labels={labels}
      comingSoonText={value.comingSoon ? comingSoonText : null}
    />
  )
}
