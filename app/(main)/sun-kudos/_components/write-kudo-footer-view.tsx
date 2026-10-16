import { IconSend } from './kudos-icons'
import { MODAL_FOCUS_RING } from './write-kudo-field-row'
import { IconClose, IconSpinner } from './write-kudo-icons'
import type { WriteKudoFooterViewProps } from './write-kudo-view-types'

/**
 * Hủy and Gửi (mm:I520:11647;520:9905). Gửi keeps `aria-disabled` while a required field is empty yet stays clickable, so the click
 * can reveal every error; while `submitting` it is `aria-busy` with a spinner and Hủy is disabled.
 */
export function WriteKudoFooterView({ submitting, incomplete, onCancel, onSubmit, labels }: WriteKudoFooterViewProps) {
  return (
    <div className="flex flex-col-reverse gap-3 sm:flex-row sm:gap-6">
      {/* mm:I520:11647;520:9906 */}
      <button
        type="button"
        data-testid="write-kudo-cancel"
        disabled={submitting}
        onClick={onCancel}
        className={`flex h-[60px] shrink-0 cursor-pointer items-center justify-center gap-2 rounded border border-saa-gold-border bg-[rgba(255,234,158,0.1)] px-10 text-base leading-6 font-bold tracking-[0.15px] text-saa-navy transition-colors duration-200 hover:bg-[rgba(255,234,158,0.4)] disabled:cursor-not-allowed disabled:opacity-50 ${MODAL_FOCUS_RING}`}
      >
        {labels.cancel}
        <IconClose />
      </button>
      {/* mm:I520:11647;520:9907 */}
      <button
        type="button"
        data-testid="write-kudo-submit"
        aria-disabled={incomplete}
        aria-busy={submitting}
        onClick={() => {
          if (!submitting) onSubmit()
        }}
        className={`flex h-[60px] min-w-0 flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg bg-saa-gold p-4 text-[22px] leading-7 font-bold text-saa-navy transition-[box-shadow,opacity] duration-200 hover:shadow-[0_0_12px_#998c5f] aria-busy:cursor-progress aria-disabled:opacity-60 ${MODAL_FOCUS_RING}`}
      >
        {labels.submit}
        {submitting ? (
          <IconSpinner data-testid="write-kudo-submit-spinner" className="animate-spin motion-reduce:animate-none" />
        ) : (
          // mm:I520:11647;520:9907;186:1766 (the F006 IconSend carries the same artwork)
          <IconSend width={24} height={24} />
        )}
      </button>
    </div>
  )
}
