'use client'

import { useLayoutEffect, useRef, useState } from 'react'
import type { Hashtag } from '@/lib/kudos/kudo-board-types'
import { useKudoFeedback } from '../_behavior/kudo-feedback-provider'
import { KudosBanner } from '../_components/kudos-banner'
import type { WriteKudoLabels } from './build-write-kudo-labels'
import { WriteKudoModalContainer } from './write-kudo-modal-container'

type ActionPillsContainerProps = {
  title: string
  logoLabel: string
  composeLabel: string
  profileSearchLabel: string
  /** The viewer has a sunners row; without one the compose pill is disabled (write-kudo FR-103). */
  hasSunner: boolean
  hashtags: Hashtag[]
  writeKudoLabels: WriteKudoLabels
}

/**
 * Banner whose compose pill opens the Viết Kudo modal and whose profile search pill opens the Coming soon modal (A12);
 * focus returns to the pill that opened either one.
 */
export function ActionPillsContainer({ title, logoLabel, composeLabel, profileSearchLabel, hasSunner, hashtags, writeKudoLabels }: ActionPillsContainerProps) {
  const { openModal } = useKudoFeedback()
  const composeRef = useRef<HTMLButtonElement>(null)
  const profileSearchRef = useRef<HTMLButtonElement>(null)
  // The pill that opened the modal doubles as the open flag: null = closed.
  const [composeOpener, setComposeOpener] = useState<HTMLButtonElement | null>(null)

  // Same rule as the Coming soon modal: hidden by Activity (page navigated away) means closed on return.
  useLayoutEffect(() => () => setComposeOpener(null), [])

  return (
    <>
      <KudosBanner
        title={title}
        logoLabel={logoLabel}
        composeLabel={composeLabel}
        profileSearchLabel={profileSearchLabel}
        composeDisabled={!hasSunner}
        composeRef={composeRef}
        profileSearchRef={profileSearchRef}
        onCompose={() => setComposeOpener(composeRef.current)}
        onProfileSearch={() => openModal(profileSearchRef.current)}
      />
      <WriteKudoModalContainer
        open={composeOpener !== null}
        opener={composeOpener}
        onClose={() => setComposeOpener(null)}
        labels={writeKudoLabels}
        hashtags={hashtags}
      />
    </>
  )
}
