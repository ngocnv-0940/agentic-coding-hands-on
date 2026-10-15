import type { WriteKudoFieldRowProps, WriteKudoTitleInputViewProps } from './write-kudo-view-types'

/** Navy ring: the modal is cream, where the board's gold focus ring would vanish. */
export const MODAL_FOCUS_RING = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-saa-navy'

/**
 * Text field chrome (mm:I520:11647;520:9873 and mm:I520:11647;1688:10437): 56px tall, white, 1px #998C5F border, 8px radius,
 * 24px inline padding. The border turns red while the surrounding `write-kudo-field` row is `data-invalid`.
 */
export const FIELD_BOX =
  'flex h-14 w-full min-w-0 items-center rounded-lg border border-saa-gold-border bg-white px-6 group-data-[invalid=true]:border-[#cf1322]'

/** Text inside a field: 16/24 bold, #999 placeholder (mm:I520:11647;520:9873;186:2760). */
export const FIELD_TEXT =
  'font-[family-name:var(--font-montserrat)] text-base leading-6 font-bold tracking-[0.15px] text-saa-navy placeholder:text-[#999]'

/**
 * One labelled row of the modal; the six rows carry `data-field` and, while in error, `data-invalid`. The error line is out of
 * flow, under the row in the modal's 24/32px row gap: showing it (e.g. on blur, which fires on the mousedown of the next
 * click) must not push the rows below, or that click's mouseup lands beside its target and the click is lost.
 */
export function WriteKudoFieldRow({ field, label, required, error, align = 'center', children }: WriteKudoFieldRowProps) {
  return (
    // mm:I520:11647;520:9871 (recipient), mm:I520:11647;1688:10448 (title), mm:I520:11647;520:9890 (hashtag), mm:I520:11647;520:9896 (image)
    <div data-testid="write-kudo-field" data-field={field} data-invalid={error ? 'true' : undefined} className="group relative">
      <div className={`flex flex-col gap-2 sm:flex-row sm:gap-4 ${align === 'start' ? 'sm:items-start' : 'sm:items-center'}`}>
        {label ? (
          // mm:I520:11647;520:9872 — 22/28 bold label, 2px gap to the red asterisk
          <div className={`flex shrink-0 items-center gap-0.5 ${align === 'start' ? 'sm:h-14' : ''}`}>
            <span className="font-[family-name:var(--font-montserrat)] text-[22px] leading-7 font-bold text-saa-navy">{label}</span>
            {required ? (
              // mm:I520:11647;520:9872;416:5547
              <span aria-hidden="true" className="self-start pt-1 text-base leading-5 font-bold text-[#cf1322]">
                *
              </span>
            ) : null}
          </div>
        ) : null}
        <div className="min-w-0 flex-1">{children}</div>
      </div>
      {error ? (
        <p data-testid="write-kudo-field-error" role="alert" className="absolute top-full left-0 m-0 mt-1 font-[family-name:var(--font-montserrat)] text-sm leading-5 font-bold text-[#cf1322]">
          {error}
        </p>
      ) : null}
    </div>
  )
}

/** Danh hiệu input and its two helper lines (mm:I520:11647;1688:10437, mm:I520:11647;1688:10447). */
export function WriteKudoTitleInputView({
  value,
  onChange,
  onBlur,
  placeholder,
  hint,
  maxLength,
  disabled,
  invalid,
  inputRef,
}: WriteKudoTitleInputViewProps) {
  return (
    <div className="flex flex-col gap-2">
      {/* mm:I520:11647;1688:10437 */}
      <div className={FIELD_BOX}>
        <input
          ref={inputRef}
          type="text"
          data-testid="write-kudo-title-input"
          value={value}
          maxLength={maxLength}
          disabled={disabled}
          placeholder={placeholder}
          aria-invalid={invalid || undefined}
          aria-describedby="write-kudo-title-hint"
          autoComplete="off"
          onChange={(event) => onChange(event.target.value)}
          onBlur={onBlur}
          className={`w-full min-w-0 border-0 bg-transparent p-0 outline-none ${FIELD_TEXT} ${MODAL_FOCUS_RING}`}
        />
      </div>
      {/* mm:I520:11647;1688:10447 */}
      <p
        id="write-kudo-title-hint"
        data-testid="write-kudo-title-hint"
        className="m-0 font-[family-name:var(--font-montserrat)] text-base leading-6 font-bold tracking-[0.15px] whitespace-pre-line text-[#999]"
      >
        {hint}
      </p>
    </div>
  )
}
