'use client'

import { useSiteNavigation } from '../_behavior/use-site-navigation'
import { SiteFooter, type SiteFooterProps } from '../_components/site-footer'

/** Client wiring: gives footer links the same "click the current page → scroll to top" behaviour as the header. */
export function SiteFooterContainer(props: Omit<SiteFooterProps, 'onNavClick'>) {
  const { onNavClick } = useSiteNavigation()
  return <SiteFooter {...props} onNavClick={onNavClick} />
}
