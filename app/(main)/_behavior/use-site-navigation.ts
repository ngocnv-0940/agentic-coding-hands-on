'use client'

import { usePathname } from 'next/navigation'
import type { MouseEvent } from 'react'

export type NavKey = 'about' | 'awards' | 'kudos'

const startsWithSegment = (pathname: string, base: string) => pathname === base || pathname.startsWith(`${base}/`)

export function activeNavKey(pathname: string): NavKey | null {
  if (pathname === '/') return 'about'
  if (startsWithSegment(pathname, '/awards-information')) return 'awards'
  if (startsWithSegment(pathname, '/sun-kudos')) return 'kudos'
  return null
}

/** Active nav item from the URL; a click on the link of the page you are already on scrolls to top instead. */
export function useSiteNavigation() {
  const pathname = usePathname()

  const onNavClick = (href: string, event: MouseEvent<HTMLAnchorElement>) => {
    // Hash/query links (e.g. `/awards-information#top-talent`) are real navigations; only exact current path scrolls.
    if (href !== pathname) return
    event.preventDefault()
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' })
  }

  return { activeKey: activeNavKey(pathname), onNavClick }
}
