'use client'

import type { ReactNode } from 'react'
import type { LikeErrorCode } from '@/lib/kudos/kudo-board-types'
import { KudoFeedbackProvider } from '../_behavior/kudo-feedback-provider'
import { KudoLikeStateProvider } from '../_behavior/kudo-like-state-provider'

type KudosBoardProvidersProps = {
  modalTitle: string
  modalCloseLabel: string
  likeErrorMessages: Record<LikeErrorCode, string>
  /** `filtersKey(filters)`; resets confirmed likes when the filters change. */
  filtersKey: string
  children: ReactNode
}

/** Client context of the board: the toast and Coming soon modal, and the like state shared by Highlight and All Kudos. */
export function KudosBoardProviders({ modalTitle, modalCloseLabel, likeErrorMessages, filtersKey, children }: KudosBoardProvidersProps) {
  return (
    <KudoFeedbackProvider modalTitle={modalTitle} modalCloseLabel={modalCloseLabel}>
      <KudoLikeStateProvider errorMessages={likeErrorMessages} resetKey={filtersKey}>{children}</KudoLikeStateProvider>
    </KudoFeedbackProvider>
  )
}
