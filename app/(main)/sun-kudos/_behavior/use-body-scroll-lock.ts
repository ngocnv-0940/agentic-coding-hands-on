'use client'

import { useEffect } from 'react'

/**
 * Locks the page scroll while `active` (a modal is open). The scroll position stays as it was and is not reset on unlock.
 * When the page has a classic scrollbar its gutter stays reserved (`scrollbar-gutter: stable`), so removing the bar
 * does not widen the layout and shift the page or the fixed elements behind the modal.
 */
export function useBodyScrollLock(active: boolean): void {
  useEffect(() => {
    if (!active) return
    const root = document.documentElement
    const previous = { overflow: root.style.overflow, gutter: root.style.scrollbarGutter }
    const hasScrollbar = window.innerWidth > root.clientWidth
    if (hasScrollbar) root.style.scrollbarGutter = 'stable'
    root.style.overflow = 'hidden'
    return () => {
      root.style.overflow = previous.overflow
      root.style.scrollbarGutter = previous.gutter
    }
  }, [active])
}
