'use client'

import type { KudoCard, KudoFilters } from '@/lib/kudos/kudo-board-types'
import { useHighlightCarousel } from '../_behavior/use-highlight-carousel'
import { CarouselView } from '../_components/carousel-view'
import type { CarouselTexts, KudoCardTexts } from './build-kudos-labels'
import { KudoCardContainer } from './kudo-card-container'

type HighlightCarouselContainerProps = {
  cards: KudoCard[]
  filters: KudoFilters
  cardTexts: KudoCardTexts
  carouselTexts: CarouselTexts
}

/** Highlight carousel. The server block keys it by the filters, so a filter change remounts it at 1/N (FR-202). */
export function HighlightCarouselContainer({ cards, filters, cardTexts, carouselTexts }: HighlightCarouselContainerProps) {
  const { index, prev, next } = useHighlightCarousel(cards.length)

  return (
    <CarouselView
      slides={cards.map((card, position) => (
        <KudoCardContainer key={card.id} card={card} variant="highlight" texts={cardTexts} filters={filters} active={position === index} />
      ))}
      index={index}
      onPrev={prev}
      onNext={next}
      {...carouselTexts}
    />
  )
}
