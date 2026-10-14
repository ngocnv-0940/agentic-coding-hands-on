import type { ReactNode } from 'react'
import { KUDOS_CONTAINER } from './kudos-layout'
import { KudosSectionHeader } from './kudos-section-header'

export type AllKudosSectionProps = {
  eyebrow?: string
  title: string
  /** `FeedView` */
  feed: ReactNode
  /** `SidebarView` */
  sidebar: ReactNode
}

/** ALL KUDOS block: header, then the feed (left) and the sidebar (right; below the feed under 1024px). mm:2940:13475 */
export function AllKudosSection({ eyebrow, title, feed, sidebar }: AllKudosSectionProps) {
  return (
    <section aria-labelledby="kudos-all-title" className={`${KUDOS_CONTAINER} flex flex-col gap-10 pt-16 pb-24 md:pt-[120px]`}>
      {/* mm:2940:14221 */}
      <KudosSectionHeader headingId="kudos-all-title" eyebrow={eyebrow} title={title} />
      {/* mm:2940:13481 */}
      <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:gap-[50px]">
        <div className="min-w-0 lg:max-w-[680px] lg:flex-1">{feed}</div>
        <div className="w-full lg:w-[422px] lg:shrink-0">{sidebar}</div>
      </div>
    </section>
  )
}
