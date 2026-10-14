'use client'

import { useEffect } from 'react'

/** Largest delay a browser setTimeout honours (signed 32-bit). Anything above fires at once. */
const MAX_TIMEOUT_MS = 2_147_483_647
/** The redirect never fires sooner than this, so a skewed server clock cannot spin a tight loop. */
const MIN_DELAY_MS = 1_000

/**
 * Sends the tab to "/" once the server-measured `remainingMs` has elapsed (ALG-002).
 *
 * Navigation is driven by the server's remaining time on a monotonic clock, never by comparing
 * the browser's Date.now() with the event start (DEC-004): a fast client clock would otherwise
 * bounce "/" -> 307 /prelaunch in a loop. The proxy stays the gate; if it still says locked, the
 * fresh /prelaunch load brings a new remainingMs and the cycle restarts, at most once per second.
 *
 * - Waits longer than the setTimeout ceiling (~24.8 days) are split into bounded steps.
 * - On wake from a hidden tab (FR-403) a full reload lets the proxy decide; a wrong client
 *   clock costs at most one reload per user-initiated tab switch.
 * - A non-finite `remainingMs` means no trustworthy deadline: do nothing.
 */
export function useNavigateHomeAtEventStart(remainingMs: number): void {
  useEffect(() => {
    if (!Number.isFinite(remainingMs)) return

    const delay = Math.max(remainingMs, MIN_DELAY_MS)
    const deadline = performance.now() + delay
    const mountedAtWall = Date.now()
    let timeout: ReturnType<typeof setTimeout> | undefined
    let done = false

    const go = () => {
      if (done) return
      done = true
      window.location.replace('/')
    }

    const arm = () => {
      const left = deadline - performance.now()
      if (left <= 0) {
        go()
        return
      }
      timeout = setTimeout(arm, Math.min(left, MAX_TIMEOUT_MS))
    }

    const onVisibilityChange = () => {
      if (done || document.visibilityState !== 'visible') return
      if (Date.now() - mountedAtWall >= remainingMs) {
        done = true
        window.location.reload()
      }
    }

    arm()
    document.addEventListener('visibilitychange', onVisibilityChange)

    return () => {
      done = true
      clearTimeout(timeout)
      document.removeEventListener('visibilitychange', onVisibilityChange)
    }
  }, [remainingMs])
}
