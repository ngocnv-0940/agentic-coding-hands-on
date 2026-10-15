'use client'

import { useRef } from 'react'
import { useKudoFeedback } from '../_behavior/kudo-feedback-provider'
import { KudosBanner } from '../_components/kudos-banner'

type ActionPillsContainerProps = {
  title: string
  logoLabel: string
  composeLabel: string
  profileSearchLabel: string
}

/** Banner whose two pills open the Coming soon modal (A12); focus returns to the pill that opened it. */
export function ActionPillsContainer({ title, logoLabel, composeLabel, profileSearchLabel }: ActionPillsContainerProps) {
  const { openModal } = useKudoFeedback()
  const composeRef = useRef<HTMLButtonElement>(null)
  const profileSearchRef = useRef<HTMLButtonElement>(null)

  return (
    <KudosBanner
      title={title}
      logoLabel={logoLabel}
      composeLabel={composeLabel}
      profileSearchLabel={profileSearchLabel}
      composeRef={composeRef}
      profileSearchRef={profileSearchRef}
      onCompose={() => openModal(composeRef.current)}
      onProfileSearch={() => openModal(profileSearchRef.current)}
    />
  )
}
