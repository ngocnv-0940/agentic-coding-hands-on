'use client'

import { useRef } from 'react'
import type { WriteKudoModalViewProps } from './write-kudo-view-types'

/** Id the dialog points `aria-labelledby` at. */
export const WRITE_KUDO_HEADING_ID = 'write-kudo-heading'

/**
 * Viết Kudo modal shell (mm:520:11647): 752px cream card, 24px radius, 40px padding, 32px between rows, over a dark mask.
 * Width is `min(752px, 100vw - 32px)` (the backdrop keeps 16px on each side) and the card never outgrows the viewport:
 * the heading stays at the top and the footer (Hủy / Gửi) at the bottom, and only the field area between them scrolls
 * (`overscroll-behavior: contain`, so a scroll that reaches its end does not chain to the page).
 * A click on the mask calls `onBackdropClick` (close and discard, like Hủy; FR-224 as changed on 2026-10-15), but only when
 * the press also started on the mask, so a drag that begins in the card and ends on the mask keeps the modal open.
 * Focus trap, Escape and focus return belong to the wiring, which owns `dialogRef`.
 */
export function WriteKudoModalView({ open, labels, onBackdropClick, dialogRef, footer, children }: WriteKudoModalViewProps) {
  const pressStartedOnMask = useRef(false)
  if (!open) return null
  return (
    // mm:520:11646 — mask
    <div
      data-testid="write-kudo-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onPointerDown={(event) => {
        pressStartedOnMask.current = event.target === event.currentTarget
      }}
      onClick={(event) => {
        const onMask = event.target === event.currentTarget && pressStartedOnMask.current
        pressStartedOnMask.current = false
        if (onMask) onBackdropClick?.()
      }}
    >
      {/* mm:520:11647 */}
      <div
        ref={dialogRef}
        data-testid="write-kudo-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby={WRITE_KUDO_HEADING_ID}
        tabIndex={-1}
        className="flex max-h-full w-full max-w-[752px] flex-col overflow-hidden rounded-3xl bg-[#fff8e1] font-[family-name:var(--font-montserrat)] text-saa-navy outline-none"
      >
        {/* mm:I520:11647;520:9870 */}
        <h2
          id={WRITE_KUDO_HEADING_ID}
          data-testid="write-kudo-heading"
          className="m-0 shrink-0 px-5 pt-5 pb-5 text-center text-2xl leading-8 font-bold sm:px-10 sm:pt-10 sm:pb-6 sm:text-[32px] sm:leading-10"
        >
          {/* Figma's 672px text box (32/40) wraps this title onto two lines ("... đồng / đội"); Chrome's metrics fit it in
              exactly 672px, so the inner measure is held just under that to keep the design's wrap. */}
          <span className="mx-auto block max-w-[660px]">{labels.title}</span>
        </h2>
        <div
          data-testid="write-kudo-scroll-area"
          className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto overscroll-y-contain px-5 pt-1 pb-6 [-webkit-overflow-scrolling:touch] sm:gap-8 sm:px-10"
        >
          {children}
        </div>
        <div className="shrink-0 px-5 pt-4 pb-5 sm:px-10 sm:pt-6 sm:pb-10">{footer}</div>
      </div>
    </div>
  )
}
