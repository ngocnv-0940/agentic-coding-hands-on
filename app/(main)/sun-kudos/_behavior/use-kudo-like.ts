'use client'

import { useCallback } from 'react'
import { useKudoLikeContext, type LikeSource } from './kudo-like-state-provider'

export type KudoLike = {
  liked: boolean
  count: number
  pending: boolean
  /** The viewer cannot like this kudo (own kudo, or no Sunner profile). */
  disabled: boolean
  /** `LikeButtonViewProps.onToggle`; ignored while pending or disabled. */
  toggle: () => void
}

/**
 * Like state of one card. Server values come from the card; a confirmed toggle in the shared provider overrides them
 * until the filters change (the provider then drops its entries).
 */
export function useKudoLike(card: LikeSource): KudoLike {
  const { entries, pendingIds, toggle: toggleById } = useKudoLikeContext()
  const pending = pendingIds.has(card.id)
  const { id, canLike, likedByViewer, likeCount } = card
  const entry = entries[id]

  const toggle = useCallback(() => {
    if (!canLike || pending) return
    void toggleById(id)
  }, [canLike, pending, id, toggleById])

  return {
    liked: entry?.liked ?? likedByViewer,
    count: entry?.count ?? likeCount,
    pending,
    disabled: !canLike,
    toggle,
  }
}
