'use client'

import { useRef } from 'react'
import type { AwardSlug } from '@/lib/awards/award-categories'
import { useAwardCategorySpy } from '../_behavior/use-award-category-spy'
import { useKeepActiveTabInView } from '../_behavior/use-keep-active-tab-in-view'
import { AwardsCategoryMenu } from '../_components/awards-information/awards-category-menu'

type AwardsCategoryMenuContainerProps = {
  ariaLabel: string
  /** One entry per award, in section order; labels are already localized. The slug order is the spy's single source. */
  items: { slug: AwardSlug; label: string }[]
}

/** Connects the presentational menu to the scroll-spy / hash / click behaviour. */
export function AwardsCategoryMenuContainer({ ariaLabel, items }: AwardsCategoryMenuContainerProps) {
  const navRef = useRef<HTMLElement>(null)
  const { activeSlug, select } = useAwardCategorySpy(
    items.map(({ slug }) => slug),
    navRef,
  )
  useKeepActiveTabInView(navRef, activeSlug)

  return <AwardsCategoryMenu ref={navRef} ariaLabel={ariaLabel} items={items} activeSlug={activeSlug} onSelect={select} />
}
