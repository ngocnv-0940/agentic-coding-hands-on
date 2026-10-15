import type { WriteKudoModalViewProps } from './write-kudo-view-types'

/** Id the dialog points `aria-labelledby` at. */
export const WRITE_KUDO_HEADING_ID = 'write-kudo-heading'

/**
 * Viết Kudo modal shell (mm:520:11647): 752px cream card, 24px radius, 40px padding, 32px between rows, over a dark mask.
 * Width is `min(752px, 100vw - 32px)` (the backdrop keeps 16px on each side) and the card scrolls inside the viewport.
 * A backdrop click does nothing unless the optional handler is given; the wiring never gives one (FR-224).
 * Focus trap, Escape and focus return belong to the wiring, which owns `dialogRef`.
 */
export function WriteKudoModalView({ open, labels, onBackdropClick, dialogRef, children }: WriteKudoModalViewProps) {
  if (!open) return null
  return (
    // mm:520:11646 — mask
    <div
      data-testid="write-kudo-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={(event) => {
        if (event.target === event.currentTarget) onBackdropClick?.()
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
        className="flex max-h-full w-full max-w-[752px] flex-col gap-6 overflow-y-auto rounded-3xl bg-[#fff8e1] p-5 font-[family-name:var(--font-montserrat)] text-saa-navy outline-none sm:gap-8 sm:p-10"
      >
        {/* mm:I520:11647;520:9870 */}
        <h2
          id={WRITE_KUDO_HEADING_ID}
          data-testid="write-kudo-heading"
          className="m-0 text-center text-2xl leading-8 font-bold sm:text-[32px] sm:leading-10"
        >
          {labels.title}
        </h2>
        {children}
      </div>
    </div>
  )
}
