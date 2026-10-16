'use client'

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import type { Hashtag } from '@/lib/kudos/kudo-board-types'
import { armCompose, registerComposeHandler, takeArmedCompose } from '../../_behavior/compose-bridge'
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
 * focus returns to the pill that opened either one. The floating action button opens the same modal: directly through the
 * compose bridge while this board is on screen, or through `?compose=1` after a hop from another page (the param is
 * dropped (history.replaceState) as soon as it is read, so a refresh or Back does not reopen it). A viewer without a sunner never gets the modal.
 */
export function ActionPillsContainer({ title, logoLabel, composeLabel, profileSearchLabel, hasSunner, hashtags, writeKudoLabels }: ActionPillsContainerProps) {
  const { openModal } = useKudoFeedback()
  const composeRef = useRef<HTMLButtonElement>(null)
  const profileSearchRef = useRef<HTMLButtonElement>(null)
  // The pill that opened the modal doubles as the open flag: null = closed.
  const [composeOpener, setComposeOpener] = useState<HTMLElement | null>(null)

  // Same rule as the Coming soon modal: hidden by Activity (page navigated away) means closed on return.
  useLayoutEffect(() => () => setComposeOpener(null), [])

  const pathname = usePathname()
  const searchParams = useSearchParams()
  const openFrom = useCallback(
    (opener: HTMLElement | null) => {
      if (hasSunner) setComposeOpener(opener ?? composeRef.current)
    },
    [hasSunner],
  )
  useEffect(() => registerComposeHandler(openFrom), [openFrom])
  const composeRequested = searchParams.get('compose') !== null
  useEffect(() => {
    if (!composeRequested) {
      // The param is gone, possibly on a new board instance (the URL sync re-keys the page): open now.
      const request = takeArmedCompose()
      if (request) openFrom(request.opener)
      return
    }
    // `null` state, not `history.state`: Next marks its own entries (`__NA`) and ignores a replaceState that carries the marker,
    // leaving `?compose=1` in its canonical URL (router.refresh() would write it back). With null it syncs the URL without a
    // server render, unlike router.replace. Deferred a tick: on a hard load this effect runs before the router installs its
    // replaceState patch, and an unpatched call would leave Next's own URL (and so this effect's input) unchanged.
    const timer = setTimeout(() => {
      // Armed only when the URL sync really happens: a board unmounted or hidden within the tick must leave nothing behind.
      armCompose()
      const rest = new URLSearchParams(window.location.search)
      rest.delete('compose')
      const query = rest.toString()
      window.history.replaceState(null, '', query ? `${pathname}?${query}` : pathname)
    }, 0)
    return () => clearTimeout(timer)
  }, [composeRequested, pathname, openFrom])

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
