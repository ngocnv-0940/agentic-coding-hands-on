import { IconLink } from './kudos-icons'
import { FIELD_BOX, FIELD_TEXT, MODAL_FOCUS_RING } from './write-kudo-field-row'
import { IconClose } from './write-kudo-icons'
import type { AddLinkDialogViewProps } from './write-kudo-view-types'

const TITLE_ID = 'write-kudo-link-title'
const LABEL = 'shrink-0 text-lg leading-7 font-bold text-saa-navy sm:text-[22px]'

type LinkRowProps = {
  which: 'text' | 'url'
  label: string
  testId: string
  value: string
  error?: string
  onChange: (value: string) => void
  autoFocus?: boolean
}

function LinkRow({ which, label, testId, value, error, onChange, autoFocus }: LinkRowProps) {
  const errorId = `write-kudo-link-error-${which}`
  return (
    <div data-invalid={error ? 'true' : undefined} className="group flex flex-col gap-2">
      <label className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
        <span className={LABEL}>{label}</span>
        <span className={`${FIELD_BOX} flex-1`}>
          <input
            type="text"
            data-testid={testId}
            value={value}
            autoFocus={autoFocus}
            autoComplete="off"
            inputMode={which === 'url' ? 'url' : undefined}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? errorId : undefined}
            onChange={(event) => onChange(event.target.value)}
            className={`w-full min-w-0 border-0 bg-transparent p-0 outline-none ${FIELD_TEXT} ${MODAL_FOCUS_RING}`}
          />
        </span>
      </label>
      {error ? (
        <p id={errorId} data-testid="write-kudo-link-error" data-for={which} role="alert" className="m-0 text-sm leading-5 font-bold text-[#cf1322]">
          {error}
        </p>
      ) : null}
    </div>
  )
}

/**
 * "Thêm đường dẫn" dialog (Addlink Box, mm:1002:12682): the same 752px cream card as the modal, with a Nội dung field, a URL field
 * and Hủy / Lưu. It sits on its own mask above the modal. Validation, insertion and Escape belong to the wiring.
 */
export function AddLinkDialogView({ open, text, url, errors, onText, onUrl, onCancel, onSave, labels }: AddLinkDialogViewProps) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4">
      {/* mm:1002:12682 */}
      <div
        data-testid="write-kudo-link-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby={TITLE_ID}
        className="flex max-h-full w-full max-w-[752px] flex-col gap-6 overflow-y-auto rounded-3xl bg-[#fff8e1] p-5 font-[family-name:var(--font-montserrat)] text-saa-navy sm:gap-8 sm:p-10"
      >
        {/* mm:I1002:12682;1002:12500 */}
        <h3 id={TITLE_ID} className="m-0 text-2xl leading-8 font-bold sm:text-[32px] sm:leading-10">
          {labels.title}
        </h3>
        {/* mm:I1002:12682;1002:12501 */}
        <LinkRow which="text" label={labels.textLabel} testId="write-kudo-link-text" value={text} error={errors.text} onChange={onText} autoFocus />
        {/* mm:I1002:12682;1002:12652 */}
        <LinkRow which="url" label={labels.urlLabel} testId="write-kudo-link-url" value={url} error={errors.url} onChange={onUrl} />
        {/* mm:I1002:12682;1002:12543 */}
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:gap-6">
          {/* mm:I1002:12682;1002:12544 */}
          <button
            type="button"
            data-testid="write-kudo-link-cancel"
            onClick={onCancel}
            className={`flex h-[60px] shrink-0 cursor-pointer items-center justify-center gap-2 rounded border border-saa-gold-border bg-[rgba(255,234,158,0.1)] px-10 text-base leading-6 font-bold tracking-[0.15px] text-saa-navy transition-colors duration-200 hover:bg-[rgba(255,234,158,0.4)] ${MODAL_FOCUS_RING}`}
          >
            {labels.cancel}
            <IconClose />
          </button>
          {/* mm:I1002:12682;1002:12545 */}
          <button
            type="button"
            data-testid="write-kudo-link-save"
            onClick={onSave}
            className={`flex h-[60px] min-w-0 flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg bg-saa-gold p-4 text-[22px] leading-7 font-bold text-saa-navy transition-shadow duration-200 hover:shadow-[0_0_12px_#998c5f] ${MODAL_FOCUS_RING}`}
          >
            {labels.save}
            <IconLink />
          </button>
        </div>
      </div>
    </div>
  )
}
