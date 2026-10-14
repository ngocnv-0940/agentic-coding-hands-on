import { FOCUS_RING } from './kudos-layout'
import type { ComingSoonModalViewProps } from './kudos-view-types'

/**
 * Small modal for the entry points whose screens do not exist yet (compose pill, profile search, Secret Box).
 * Closes on its button, the backdrop and Escape; the close button takes focus on open. The wiring returns
 * focus to the opener when `open` turns false.
 */
export function ComingSoonModalView({ open, title, closeLabel, onClose }: ComingSoonModalViewProps) {
  if (!open) return null
  return (
    <div
      data-testid="coming-soon-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
      onKeyDown={(event) => {
        if (event.key === 'Escape') onClose()
      }}
    >
      <div
        data-testid="coming-soon-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="kudos-coming-soon-title"
        className="flex w-full max-w-[420px] flex-col items-center gap-6 rounded-2xl border border-saa-gold-border bg-[#00070c] p-8"
      >
        <p id="kudos-coming-soon-title" className="m-0 text-center font-[family-name:var(--font-montserrat)] text-2xl leading-8 font-bold text-white">
          {title}
        </p>
        <button
          type="button"
          data-testid="coming-soon-modal-close"
          autoFocus
          onClick={onClose}
          className={`h-14 cursor-pointer rounded bg-saa-gold px-6 font-[family-name:var(--font-montserrat)] text-base leading-6 font-bold text-saa-navy transition-[box-shadow] duration-200 hover:shadow-[0_0_12px_#fae287] ${FOCUS_RING}`}
        >
          {closeLabel}
        </button>
      </div>
    </div>
  )
}
