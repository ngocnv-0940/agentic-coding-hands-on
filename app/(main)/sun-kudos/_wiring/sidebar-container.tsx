'use client'

import { useRef } from 'react'
import type { SidebarData } from '@/lib/kudos/kudo-board-types'
import { useKudoFeedback } from '../_behavior/kudo-feedback-provider'
import { SidebarView } from '../_components/sidebar-view'
import type { SidebarLabels } from '../_components/kudos-view-types'

type SidebarContainerProps = { data: SidebarData; labels: SidebarLabels }

/** Personal statistics and latest gifts. "Open Secret Box" is a Coming soon entry point (A12), enabled only with a box to open. */
export function SidebarContainer({ data, labels }: SidebarContainerProps) {
  const { openModal } = useKudoFeedback()
  const rootRef = useRef<HTMLDivElement>(null)
  const { stats } = data

  return (
    <div ref={rootRef} className="contents">
      <SidebarView
        stats={{ received: stats.received, sent: stats.sent, hearts: stats.hearts, opened: stats.boxesOpened, unopened: stats.boxesUnopened }}
        gifts={data.latestGifts.map((gift) => ({ sunnerId: gift.sunnerId, name: gift.name, avatarUrl: gift.avatarUrl, prize: gift.prize ?? '' }))}
        canOpenBox={stats.boxesUnopened > 0}
        onOpenBox={() => openModal(rootRef.current?.querySelector<HTMLElement>('[data-testid="sidebar-open-box"]') ?? null)}
        labels={labels}
      />
    </div>
  )
}
