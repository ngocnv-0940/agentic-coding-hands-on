'use client'

import Link from 'next/link'
import { useState } from 'react'
import { IconExpand } from './kudos-icons'
import { FOCUS_RING, KUDOS_CONTAINER } from './kudos-layout'
import { KudosSectionHeader } from './kudos-section-header'
import type { SpotlightBoardViewProps } from './kudos-view-types'

/**
 * SPOTLIGHT BOARD (mm:2940:14170 / 2940:14174). Receiver names float on a dark canvas; the wiring owns pan,
 * zoom, search and the tooltip texts. The only state here is which node is hovered, so one tooltip exists at a time.
 * Everything interactive sits inside the drag surface so pointer and wheel events reach `canvasHandlers`.
 */
export function SpotlightBoardView({
  eyebrow,
  title,
  total,
  nodes,
  recent,
  panZoomOn,
  canvasStyle,
  canvasHandlers,
  searchSlot,
  emptyLabel,
  panZoomLabel,
  onTogglePanZoom,
}: SpotlightBoardViewProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const hovered = nodes.find((node) => node.id === hoveredId)
  // newest first in, newest last on screen and brightest
  const ticker = [...recent].reverse()
  return (
    <section data-testid="kudos-spotlight" aria-labelledby="kudos-spotlight-title" className="w-full pt-16 pb-10 md:pt-[136px] md:pb-[35px]">
      <div className={`${KUDOS_CONTAINER} flex flex-col gap-10 md:gap-[63px]`}>
        <KudosSectionHeader headingId="kudos-spotlight-title" eyebrow={eyebrow} title={title} />
        {/* mm:2940:14174 — flat navy canvas; the artwork layers (14178/14181) are not exported by MoMorph */}
        <div className="relative h-[460px] w-full overflow-hidden rounded-[47px] border border-saa-gold-border bg-[#00101a] md:h-[548px]">
          <div
            data-testid="spotlight-canvas"
            {...canvasHandlers}
            className={`absolute inset-0 select-none ${panZoomOn ? 'cursor-grab touch-none active:cursor-grabbing' : ''}`}
          >
            {/* the pan/zoom layer: nodes live in a region that keeps clear of the header, ticker and Pan/Zoom button */}
            <div data-testid="spotlight-panzoom" className="absolute inset-0" style={{ transformOrigin: '0 0', ...canvasStyle }}>
              <div className="absolute inset-x-6 top-[88px] bottom-24">
                {nodes.map((node) => (
                  <Link
                    key={node.id}
                    href={node.href}
                    data-testid="spotlight-node"
                    draggable={false}
                    onPointerEnter={() => setHoveredId(node.id)}
                    onPointerLeave={() => setHoveredId(null)}
                    onFocus={() => setHoveredId(node.id)}
                    onBlur={() => setHoveredId(null)}
                    style={{ left: `${node.x}%`, top: `${node.y}%` }}
                    className={`absolute -translate-x-1/2 -translate-y-1/2 rounded px-1 text-center font-[family-name:var(--font-montserrat)] text-[10px] leading-4 font-bold tracking-[0.2px] whitespace-nowrap transition-colors duration-200 hover:text-saa-gold ${FOCUS_RING} ${node.match ? 'z-10 text-[#f26b66] text-xs' : 'text-white'}`}
                  >
                    {/* the E2E contract reads the match flag on a descendant of the node */}
                    <span data-match={node.match ? 'true' : 'false'}>{node.name}</span>
                  </Link>
                ))}
                {hovered ? (
                  <div
                    data-testid="spotlight-tooltip"
                    role="tooltip"
                    style={{ left: `${hovered.x}%`, top: `${hovered.y}%` }}
                    className="pointer-events-none absolute z-20 -translate-x-1/2 -translate-y-[160%] rounded bg-white px-3 py-1 font-[family-name:var(--font-montserrat)] text-xs leading-4 font-bold whitespace-nowrap text-saa-navy shadow-lg"
                  >
                    {hovered.tooltip}
                  </div>
                ) : null}
              </div>
            </div>
            {/* mm:3007:17482 + 2940:14833 */}
            <div className="pointer-events-none absolute inset-x-6 top-6 flex flex-col items-start gap-2 md:inset-x-[25px] md:block">
              <div className="pointer-events-auto">{searchSlot}</div>
              <p
                data-testid="spotlight-total"
                className="m-0 font-[family-name:var(--font-montserrat)] text-3xl leading-[44px] font-bold text-white md:absolute md:top-[-10px] md:left-1/2 md:-translate-x-1/2 md:text-4xl"
              >
                {total} KUDOS
              </p>
            </div>
            {nodes.length === 0 ? (
              <p data-testid="spotlight-empty" className="pointer-events-none absolute inset-0 m-0 flex items-center justify-center font-[family-name:var(--font-montserrat)] text-xl leading-8 font-bold text-white">
                {emptyLabel}
              </p>
            ) : null}
            {/* mm:2940:14230 (and its four siblings) — recent activity ticker, display only */}
            {ticker.length > 0 ? (
              <ul className="pointer-events-none absolute bottom-6 left-6 m-0 flex list-none flex-col p-0 md:left-12" aria-label={title}>
                {ticker.map((line, position) => (
                  <li
                    key={`${position}-${line}`}
                    style={{ opacity: 0.35 + (0.65 * (position + 1)) / ticker.length }}
                    className="font-[family-name:var(--font-montserrat)] text-sm leading-5 font-bold text-white md:text-base"
                  >
                    {line}
                  </li>
                ))}
              </ul>
            ) : null}
            {/* mm:3007:17479 */}
            <button
              type="button"
              data-testid="spotlight-panzoom-toggle"
              aria-pressed={panZoomOn}
              aria-label={panZoomLabel}
              title={panZoomLabel}
              onClick={onTogglePanZoom}
              className={`absolute right-6 bottom-6 flex size-[30px] cursor-pointer items-center justify-center rounded text-white transition-colors duration-200 hover:text-saa-gold md:right-[38px] ${panZoomOn ? 'bg-white/20' : ''} ${FOCUS_RING}`}
            >
              <IconExpand className="size-[22px]" />
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}
