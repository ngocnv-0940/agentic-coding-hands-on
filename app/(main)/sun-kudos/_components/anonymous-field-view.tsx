import { FIELD_BOX, FIELD_TEXT, MODAL_FOCUS_RING } from './write-kudo-field-row'
import type { AnonymousFieldViewProps } from './write-kudo-view-types'

/**
 * Ẩn danh row (mm:I520:11647;520:14099): a 24px checkbox with a grey 22/28 label, plus the alias input only while checked
 * (the alias input is not drawn in the frame; it reuses the field chrome and is capped at 50 characters).
 */
export function AnonymousFieldView({ checked, onToggle, name, onName, labels, disabled }: AnonymousFieldViewProps) {
  return (
    <div className="flex flex-col gap-4">
      {/* mm:I520:11647;520:14099 */}
      <label className="flex w-fit max-w-full cursor-pointer items-center gap-4 has-disabled:cursor-not-allowed">
        {/* mm:I520:11647;520:14099;520:14097 */}
        <input
          type="checkbox"
          data-testid="write-kudo-anonymous-checkbox"
          checked={checked}
          disabled={disabled}
          onChange={onToggle}
          className={`size-6 shrink-0 cursor-[inherit] rounded-[4px] border border-[#999] bg-white accent-saa-navy ${MODAL_FOCUS_RING}`}
        />
        {/* mm:I520:11647;520:14099;520:14095 */}
        <span className="text-lg leading-7 font-bold text-[#999] sm:text-[22px]">{labels.checkbox}</span>
      </label>
      {checked ? (
        <div className={FIELD_BOX}>
          <input
            type="text"
            data-testid="write-kudo-anonymous-name"
            value={name}
            maxLength={50}
            disabled={disabled}
            placeholder={labels.name}
            aria-label={labels.name}
            autoComplete="off"
            onChange={(event) => onName(event.target.value)}
            className={`w-full min-w-0 border-0 bg-transparent p-0 outline-none ${FIELD_TEXT} ${MODAL_FOCUS_RING}`}
          />
        </div>
      ) : null}
    </div>
  )
}
