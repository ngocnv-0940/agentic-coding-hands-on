import type { AwardSlug } from '@/lib/awards/award-categories'

/** Fixed site header height (80px) used when a section carries no scroll-margin-top. */
const HEADER_FALLBACK_PX = 80
/** A section counts as "reached" this many px before its top touches the line (sub-pixel scroll rounding). */
export const LINE_TOLERANCE_PX = 8
/** At the page bottom the last card may never reach the line; within this many px of the end it wins. */
const BOTTOM_EPSILON_PX = 2
/** First check after a programmatic scroll starts: covers "no scroll event ever arrives" (target already in place). */
const LOCK_FIRST_CHECK_MS = 1000
/** Once scroll events flow, check again after this long without one. */
const LOCK_IDLE_MS = 150
/** Hard bound on a lock: a programmatic scroll that has not arrived by now was interrupted or cannot arrive. */
const LOCK_MAX_MS = 1500

/** Keys that scroll the page wherever focus is. */
const SCROLL_KEYS: ReadonlySet<string> = new Set(['PageUp', 'PageDown', 'Home', 'End', ' ', 'ArrowUp', 'ArrowDown'])

// --- Geometry shared with the scroll-spy ---------------------------------------------------------------------------

export const sectionOf = (slug: AwardSlug) => document.getElementById(slug)

/** Where a section's top sits (px from the viewport top) once scrolled to: its scroll-margin-top, else the header. */
export function scrollLinePx(section: HTMLElement): number {
  const margin = Number.parseFloat(getComputedStyle(section).scrollMarginTop)
  return margin > 0 ? margin : HEADER_FALLBACK_PX
}

export const isAtPageBottom = () =>
  window.scrollY > 0 && window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - BOTTOM_EPSILON_PX

/**
 * Has the programmatic scroll arrived at `slug`? A `scrollend` that fires for an earlier scroll (e.g. the browser
 * scrolling the clicked item into view just before our smooth scroll starts) must not release the lock.
 */
function hasReachedSection(slug: AwardSlug): boolean {
  const section = sectionOf(slug)
  if (!section) return true
  const gap = Math.abs(section.getBoundingClientRect().top - scrollLinePx(section))
  return gap <= LINE_TOLERANCE_PX || isAtPageBottom()
}

// --- Scroll lock ---------------------------------------------------------------------------------------------------

export type ScrollLock = {
  isLocked: () => boolean
  /** A programmatic scroll to `slug` is starting (click or hash): hold the scroll-spy until it arrives. */
  begin: (slug: AwardSlug) => void
  /** A scroll event arrived while locked: look again once the scroll has been quiet for a moment. */
  touch: () => void
  /** `scrollend`: release now if the scroll has arrived. */
  arrived: () => void
  /** The user took over the scroll: release and follow their position again. */
  cancel: () => void
  /** Should a scroll event recompute the active slug? False while locked and for leftovers at the settled offset. */
  followsScroll: () => boolean
  dispose: () => void
}

/**
 * While a click or hash scroll runs, the spy must not report the sections it passes (BR-002). The lock ends when the
 * target has arrived, never merely because scroll events paused (jank, no `scrollend`); a hard deadline bounds it.
 * `onUnsettled` runs whenever a lock ends WITHOUT the target having been reached (user takeover, deadline): the caller
 * must re-read the scroll position then, because no scroll event is guaranteed to follow and the active item would go stale.
 */
export function createScrollLock(onUnsettled: () => void): ScrollLock {
  let run: { slug: AwardSlug; deadline: number } | null = null
  /** Offset the last lock settled at: scroll events there are leftovers of that scroll and must not recompute. */
  let anchorY: number | null = null
  let timer: number | null = null

  function clearTimer() {
    if (timer !== null) window.clearTimeout(timer)
    timer = null
  }

  function arm(ms: number) {
    clearTimer()
    const remaining = run ? run.deadline - Date.now() : 0
    timer = window.setTimeout(check, Math.max(0, Math.min(ms, remaining)))
  }

  /** `settled`: the target arrived, so pin the resting offset. Otherwise nothing is pinned and the spy follows the scroll from here. */
  function release(settled: boolean) {
    clearTimer()
    run = null
    anchorY = settled ? window.scrollY : null
    if (!settled) onUnsettled()
  }

  /** Release once the target arrived; at the deadline release regardless (unpinned); otherwise look again after another quiet spell. */
  function check() {
    if (!run) return
    if (hasReachedSection(run.slug)) release(true)
    else if (Date.now() >= run.deadline) release(false)
    else arm(LOCK_IDLE_MS)
  }

  return {
    isLocked: () => run !== null,
    begin(slug) {
      run = { slug, deadline: Date.now() + LOCK_MAX_MS }
      anchorY = null
      arm(LOCK_FIRST_CHECK_MS)
    },
    touch() {
      if (run) arm(LOCK_IDLE_MS)
    },
    arrived() {
      if (run && hasReachedSection(run.slug)) release(true)
    },
    cancel() {
      if (run) release(false)
    },
    followsScroll() {
      if (run) return false
      if (anchorY !== null) {
        if (Math.abs(window.scrollY - anchorY) < 1) return false
        anchorY = null
      }
      return true
    },
    dispose() {
      clearTimer()
      run = null
    },
  }
}

// --- Click and user-takeover predicates ----------------------------------------------------------------------------

type ClickLike = Pick<MouseEvent, 'button' | 'metaKey' | 'ctrlKey' | 'shiftKey' | 'altKey'>

/** Anything but a plain primary click (new tab, new window, download...): the browser must follow the href itself. */
export const isModifiedClick = (event: ClickLike) =>
  event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey

/** A scroll key scrolls the page even while focus sits on a menu link, so the menu is not excluded here. */
export const isScrollKey = (event: KeyboardEvent) => !event.defaultPrevented && SCROLL_KEYS.has(event.key)

/** A press in the gutter right of `clientWidth` is a press on the page's own scrollbar. */
export const isOnPageScrollbar = (event: PointerEvent) => event.clientX >= document.documentElement.clientWidth

/**
 * A wheel or touch gesture that starts on the tab row MAY scroll the row sideways instead of the page; whether it does
 * depends on its direction (`isSidewaysMove`). Only while the row overflows: from 1024px the menu is a vertical list
 * that never does, and a gesture there scrolls the page.
 */
export function startsOnScrollingTabRow(target: EventTarget | null, nav: HTMLElement | null): boolean {
  return nav !== null && target instanceof Node && nav.scrollWidth > nav.clientWidth && nav.contains(target)
}

/** A gesture moving more sideways than vertically scrolls the tab row; a vertical or tied one scrolls the page. */
export const isSidewaysMove = (dx: number, dy: number) => Math.abs(dx) > Math.abs(dy)
