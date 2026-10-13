'use client'

import { useEffect, type RefObject } from 'react'

/**
 * Below the desktop breakpoint the category menu is a horizontally scrolling tab row. Keep the active tab
 * visible by scrolling the row itself: `scrollIntoView` on the tab would also scroll the page and could cancel
 * the page's smooth scroll. No-op when the row does not overflow (desktop vertical menu) or the tab is in view.
 */
export function useKeepActiveTabInView(listRef: RefObject<HTMLElement | null>, activeSlug: string): void {
  useEffect(() => {
    const list = listRef.current
    if (!list || list.scrollWidth <= list.clientWidth) return
    const tab = list.querySelector<HTMLElement>('[aria-current="location"]')
    if (!tab) return
    const listBox = list.getBoundingClientRect()
    const tabBox = tab.getBoundingClientRect()
    if (tabBox.left >= listBox.left && tabBox.right <= listBox.right) return
    const centerOffset = tabBox.left - listBox.left - (list.clientWidth - tabBox.width) / 2
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    list.scrollTo({ left: list.scrollLeft + centerOffset, behavior: reduce ? 'instant' : 'smooth' })
  }, [listRef, activeSlug])
}
