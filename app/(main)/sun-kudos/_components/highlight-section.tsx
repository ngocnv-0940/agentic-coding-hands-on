import { KudosSectionHeader } from './kudos-section-header'
import { KUDOS_CONTAINER } from './kudos-layout'
import type { HighlightSectionProps } from './kudos-view-types'

/** HIGHLIGHT KUDOS block: header with the filter bar, then the carousel (mm:2940:13451). */
export function HighlightSection({ eyebrow, title, filterBar, carousel }: HighlightSectionProps) {
  return (
    <section data-testid="kudos-highlight" aria-labelledby="kudos-highlight-title" className="relative flex w-full flex-col gap-10">
      <div className={KUDOS_CONTAINER}>
        {/* mm:2940:13452 */}
        <KudosSectionHeader headingId="kudos-highlight-title" eyebrow={eyebrow} title={title} trailing={filterBar} />
      </div>
      {/* mm:2940:13461 + 2940:13471 */}
      {carousel}
    </section>
  )
}
