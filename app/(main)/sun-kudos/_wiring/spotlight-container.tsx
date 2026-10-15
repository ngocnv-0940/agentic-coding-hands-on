'use client'

import type { ReactNode } from 'react'
import { useSpotlightPanZoom } from '../_behavior/use-spotlight-pan-zoom'
import { useSpotlightSearch } from '../_behavior/use-spotlight-search'
import { SpotlightBoardView } from '../_components/spotlight-board-view'
import { SpotlightSearchInput } from '../_components/spotlight-search-input'
import type { SpotlightNodeView } from '../_components/kudos-view-types'
import type { SpotlightTexts } from './build-kudos-labels'

export type SpotlightNodeData = Omit<SpotlightNodeView, 'match'>

type SpotlightContainerProps = {
  eyebrow: string
  title: string
  total: number
  nodes: SpotlightNodeData[]
  recent: string[]
  texts: SpotlightTexts
}

/** Spotlight board: pan/zoom (A9) and live name search (A10) over the nodes the server loaded. */
export function SpotlightContainer({ eyebrow, title, total, nodes, recent, texts }: SpotlightContainerProps): ReactNode {
  const panZoom = useSpotlightPanZoom()
  const search = useSpotlightSearch(nodes)

  return (
    <SpotlightBoardView
      eyebrow={eyebrow}
      title={title}
      total={total}
      nodes={nodes.map((node) => ({ ...node, match: search.matches?.has(node.id) ?? false }))}
      recent={recent}
      panZoomOn={panZoom.panZoomOn}
      canvasStyle={panZoom.canvasStyle}
      canvasHandlers={panZoom.canvasHandlers}
      searchSlot={
        <SpotlightSearchInput value={search.query} onChange={search.setQuery} placeholder={texts.searchPlaceholder} label={texts.searchLabel} />
      }
      emptyLabel={texts.empty}
      panZoomLabel={texts.panZoom}
      onTogglePanZoom={panZoom.toggle}
    />
  )
}
