'use client'

import { useMemo } from 'react'
import type { KudoCard as KudoRow, KudoFilters } from '@/lib/kudos/kudo-board-types'
import { useCopyKudoLink } from '../_behavior/use-copy-kudo-link'
import { useKudoFilterNavigation } from '../_behavior/use-kudo-filter-navigation'
import { useKudoLike } from '../_behavior/use-kudo-like'
import { CopyLinkButtonView, LikeButtonView } from '../_components/kudo-card-actions'
import { KudoCard } from '../_components/kudo-card'
import type { KudoCardTexts } from './build-kudos-labels'
import { toKudoCardView } from './to-kudo-card-view'

type KudoCardContainerProps = {
  card: KudoRow
  variant: 'highlight' | 'feed'
  texts: KudoCardTexts
  /** Sanitised current filters: a hashtag chip sets the hashtag and keeps the department (A4). */
  filters: KudoFilters
  /** Highlight carousel only: the centre card. */
  active?: boolean
}

/** One kudo card with its like, copy-link and hashtag behaviour attached. */
export function KudoCardContainer({ card, variant, texts, filters, active }: KudoCardContainerProps) {
  const like = useKudoLike(card)
  const copy = useCopyKudoLink({ copied: texts.copied, error: texts.copyError })
  const { selectHashtag } = useKudoFilterNavigation(filters)
  const view = useMemo(() => toKudoCardView(card), [card])

  return (
    <KudoCard
      kudo={view}
      variant={variant}
      labels={texts.labels}
      active={active}
      onHashtagClick={selectHashtag}
      likeSlot={
        <LikeButtonView
          liked={like.liked}
          count={like.count}
          disabled={like.disabled}
          pending={like.pending}
          onToggle={like.toggle}
          label={like.liked ? texts.likeRemove : texts.likeAdd}
        />
      }
      copyLinkSlot={<CopyLinkButtonView onCopy={() => void copy(card.id)} label={texts.copyLink} />}
    />
  )
}
