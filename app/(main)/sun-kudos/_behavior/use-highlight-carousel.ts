'use client'

import { useCallback, useState } from 'react'

export type HighlightCarousel = {
  /** Zero-based index of the centre card; always inside `[0, count - 1]` (0 when there are no slides). */
  index: number
  count: number
  prev: () => void
  next: () => void
  canPrev: boolean
  canNext: boolean
  /** "n/N" for the pager; "0/0" when empty. */
  pagerLabel: string
}

/**
 * Highlight carousel position (A2, DEC-002). One step per call, no wrap-around; both ends disable their arrow.
 * It never resets itself: the parent remounts it with a `key` built from the active filters (FR-202), which is
 * what also works while Activity keeps client state across `router.replace`.
 */
export function useHighlightCarousel(count: number): HighlightCarousel {
  const [rawIndex, setRawIndex] = useState(0)
  const last = Math.max(count - 1, 0)
  // `count` can shrink under a mounted carousel; clamp on read instead of syncing state in an effect.
  const index = Math.min(rawIndex, last)

  const prev = useCallback(() => setRawIndex((current) => Math.max(Math.min(current, last) - 1, 0)), [last])
  const next = useCallback(() => setRawIndex((current) => Math.min(Math.min(current, last) + 1, last)), [last])

  return {
    index,
    count,
    prev,
    next,
    canPrev: index > 0,
    canNext: index < last,
    pagerLabel: `${count === 0 ? 0 : index + 1}/${count}`,
  }
}
