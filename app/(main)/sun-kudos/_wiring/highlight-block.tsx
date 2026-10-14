import type { Dictionary } from '@/lib/i18n/dictionary-vi'
import { getHighlight } from '@/lib/kudos/kudo-board-queries'
import { filtersKey, type RawSearchParams } from '@/lib/kudos/kudo-filters'
import type { KudoCard } from '@/lib/kudos/kudo-board-types'
import { HighlightSection } from '../_components/highlight-section'
import { buildCarouselTexts, buildFilterTexts, buildKudoCardTexts } from './build-kudos-labels'
import { FilterBarContainer } from './filter-bar-container'
import { HighlightCarouselContainer } from './highlight-carousel-container'
import { resolveBoardFilters } from './resolve-board-filters'

/** HIGHLIGHT KUDOS: filters from the URL, top five kudos, filter bar and carousel. A failed read shows the empty text in place. */
export async function HighlightBlock({ searchParams, dict }: { searchParams: Promise<RawSearchParams>; dict: Dictionary }) {
  const { filters, options } = await resolveBoardFilters(searchParams)
  let cards: KudoCard[] = []
  try {
    cards = await getHighlight(filters)
  } catch (error) {
    console.error('[kudos] highlight failed', error instanceof Error ? error.name : 'unknown')
  }

  return (
    <HighlightSection
      eyebrow={dict['kudos.eyebrow']}
      title={dict['kudos.highlight.title']}
      filterBar={<FilterBarContainer filters={filters} options={options} texts={buildFilterTexts(dict)} />}
      carousel={
        <HighlightCarouselContainer
          key={filtersKey(filters)}
          cards={cards}
          filters={filters}
          cardTexts={buildKudoCardTexts(dict)}
          carouselTexts={buildCarouselTexts(dict)}
        />
      }
    />
  )
}
