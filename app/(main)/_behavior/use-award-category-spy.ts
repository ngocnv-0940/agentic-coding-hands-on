'use client'

import { useCallback, useEffect, useRef, useState, type MouseEvent, type RefObject } from 'react'
import type { AwardSlug } from '@/lib/awards/award-categories'
import { parseAwardHash } from './award-hash'
import {
  LINE_TOLERANCE_PX,
  createScrollLock,
  isAtPageBottom,
  isModifiedClick,
  isOnPageScrollbar,
  isScrollKey,
  isSidewaysMove,
  scrollLinePx,
  sectionOf,
  startsOnScrollingTabRow,
  type ScrollLock,
} from './award-scroll-lock'

const prefersReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

function scrollToSection(slug: AwardSlug, smooth: boolean) {
  // `instant` overrides any CSS scroll-behavior; the section's scroll-margin-top keeps it under the header.
  sectionOf(slug)?.scrollIntoView({ behavior: smooth && !prefersReducedMotion() ? 'smooth' : 'instant', block: 'start' })
}

/** ALG-001: the last section whose top has reached the line below the sticky header(s); first slug before any. */
function pickSlugInView(slugs: readonly AwardSlug[]): AwardSlug {
  const first = sectionOf(slugs[0])
  if (!first) return slugs[0]
  const line = scrollLinePx(first) + LINE_TOLERANCE_PX
  let current = slugs[0]
  for (const slug of slugs) {
    const top = sectionOf(slug)?.getBoundingClientRect().top
    if (top !== undefined && top <= line) current = slug
  }
  return isAtPageBottom() ? slugs[slugs.length - 1] : current
}

export type AwardCategorySpy = {
  activeSlug: AwardSlug
  /** Menu item click: activate, smooth-scroll to the section, write `#slug` (no history entry). Modified clicks are left to the browser. */
  select: (slug: AwardSlug, event?: MouseEvent) => void
}

/**
 * One active award slug from three sources: click, scroll position (scroll-spy) and the URL hash.
 * While a programmatic scroll runs the spy is locked, so intermediate sections never flash active.
 * `slugs` is the non-empty menu order (= section order); `navRef` is the menu <nav>, whose own sideways swipes are not a page takeover.
 */
export function useAwardCategorySpy(slugs: readonly AwardSlug[], navRef: RefObject<HTMLElement | null>): AwardCategorySpy {
  // Server and first client render agree on slugs[0]; hash and scroll position are read after mount.
  const [activeSlug, setActiveSlug] = useState<AwardSlug>(slugs[0])
  const lockRef = useRef<ScrollLock | null>(null)
  // The latest slugs, so a fresh-but-equal array from the caller never re-runs the effect (which re-applies the hash).
  const slugsRef = useRef(slugs)
  useEffect(() => {
    slugsRef.current = slugs
  }, [slugs])

  const select = useCallback((slug: AwardSlug, event?: MouseEvent) => {
    if (event && isModifiedClick(event)) return // new tab / window / download: the browser follows the href itself
    event?.preventDefault()
    setActiveSlug(slug)
    lockRef.current?.begin(slug)
    scrollToSection(slug, true)
    // null state per Next.js: replaceState integrates with the router; it fires no hashchange.
    window.history.replaceState(null, '', `#${slug}`)
  }, [])

  useEffect(() => {
    let frame = 0
    const recompute = () => {
      frame = 0
      if (lock.followsScroll()) setActiveSlug(pickSlugInView(slugsRef.current))
    }
    const scheduleRecompute = () => {
      if (frame === 0) frame = window.requestAnimationFrame(recompute)
    }
    // A lock that ends short of its target (takeover, deadline) may be followed by no scroll event: look at the position now.
    const lock = createScrollLock(scheduleRecompute)
    lockRef.current = lock

    const applyHash = (): boolean => {
      const slug = parseAwardHash(window.location.hash, slugsRef.current)
      if (!slug) return false // unknown or garbled hash: no scroll, active unchanged
      setActiveSlug(slug)
      lock.begin(slug)
      scrollToSection(slug, false)
      return true
    }

    const onScroll = () => {
      if (lock.isLocked()) lock.touch()
      else scheduleRecompute()
    }

    // The user took over the scroll: follow their position again. Only a SIDEWAYS gesture on the overflowing tab row
    // scrolls the row instead of the page; a vertical wheel or swipe there scrolls the page and is a takeover.
    const onWheel = (event: WheelEvent) => {
      if (!startsOnScrollingTabRow(event.target, navRef.current) || !isSidewaysMove(event.deltaX, event.deltaY)) lock.cancel()
    }
    // A touch on that row has no direction at touchstart: remember where it began and decide at its first touchmove.
    let rowTouchStart: { x: number; y: number } | null = null
    const onTouchStart = (event: TouchEvent) => {
      const point = event.changedTouches.item(0)
      rowTouchStart = point && startsOnScrollingTabRow(event.target, navRef.current) ? { x: point.clientX, y: point.clientY } : null
      if (!rowTouchStart) lock.cancel()
    }
    const onTouchMove = (event: TouchEvent) => {
      const point = event.changedTouches.item(0)
      if (!rowTouchStart || !point) return
      const sideways = isSidewaysMove(point.clientX - rowTouchStart.x, point.clientY - rowTouchStart.y)
      rowTouchStart = null // decided once per touch
      if (!sideways) lock.cancel()
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (isScrollKey(event)) lock.cancel()
    }
    const onPointerDown = (event: PointerEvent) => {
      if (isOnPageScrollbar(event)) lock.cancel()
    }
    const onScrollEnd = () => lock.arrived()

    if (!applyHash()) recompute() // e.g. a reload restored the scroll offset mid-page

    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('scrollend', onScrollEnd)
    window.addEventListener('wheel', onWheel, { passive: true })
    window.addEventListener('touchstart', onTouchStart, { passive: true })
    window.addEventListener('touchmove', onTouchMove, { passive: true })
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('pointerdown', onPointerDown)
    window.addEventListener('hashchange', applyHash)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('scrollend', onScrollEnd)
      window.removeEventListener('wheel', onWheel)
      window.removeEventListener('touchstart', onTouchStart)
      window.removeEventListener('touchmove', onTouchMove)
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('pointerdown', onPointerDown)
      window.removeEventListener('hashchange', applyHash)
      window.cancelAnimationFrame(frame)
      lock.dispose()
      lockRef.current = null
    }
  }, [navRef])

  return { activeSlug, select }
}
