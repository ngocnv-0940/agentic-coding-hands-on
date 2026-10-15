import Image from 'next/image'
import { IconChevronDown, IconUserCircle } from './kudos-icons'
import { SUNNER_LIST_ID } from './sunner-option-list-view'
import { FIELD_BOX, FIELD_TEXT, MODAL_FOCUS_RING } from './write-kudo-field-row'
import { IconClose } from './write-kudo-icons'
import type { RecipientPickerViewProps } from './write-kudo-view-types'

/**
 * Người nhận field (mm:I520:11647;520:9873): the 56px search box with a "Tìm kiếm" placeholder and a chevron. A picked sunner
 * replaces the input with their avatar and name plus a clear button; the suggestion list (`listSlot`) drops under the box.
 */
export function RecipientPickerView({
  query,
  onQueryChange,
  onFocus,
  onBlur,
  onKeyDown,
  open,
  selected,
  onClear,
  listSlot,
  disabled,
  placeholder,
  inputRef,
  invalid,
  clearLabel,
  activeOptionId,
}: RecipientPickerViewProps) {
  return (
    <div className="relative">
      {/* mm:I520:11647;520:9873 */}
      <div className={`${FIELD_BOX} gap-3 ${disabled ? 'opacity-60' : ''}`}>
        {selected ? (
          <div data-testid="write-kudo-recipient-selected" className="flex min-w-0 flex-1 items-center gap-3">
            <span className="relative size-8 shrink-0 overflow-hidden rounded-full bg-[#eee]">
              {selected.avatarUrl ? (
                <Image src={selected.avatarUrl} alt="" fill unoptimized sizes="32px" className="object-cover" />
              ) : (
                <IconUserCircle className="size-full p-1 text-[#999]" />
              )}
            </span>
            <span className={`min-w-0 truncate ${FIELD_TEXT}`}>{selected.name}</span>
          </div>
        ) : null}
        <input
          ref={inputRef}
          type="text"
          role="combobox"
          data-testid="write-kudo-recipient-input"
          hidden={Boolean(selected)}
          value={query}
          disabled={disabled}
          placeholder={placeholder}
          aria-expanded={open}
          aria-haspopup="listbox"
          aria-controls={SUNNER_LIST_ID}
          aria-autocomplete="list"
          aria-activedescendant={open ? activeOptionId : undefined}
          aria-invalid={invalid || undefined}
          autoComplete="off"
          onChange={(event) => onQueryChange(event.target.value)}
          onFocus={onFocus}
          onBlur={onBlur}
          onKeyDown={onKeyDown}
          className={`w-full min-w-0 flex-1 border-0 bg-transparent p-0 outline-none ${FIELD_TEXT} ${MODAL_FOCUS_RING}`}
        />
        {selected ? (
          <button
            type="button"
            data-testid="write-kudo-recipient-clear"
            aria-label={clearLabel}
            disabled={disabled}
            onClick={onClear}
            className={`inline-flex size-6 shrink-0 cursor-pointer items-center justify-center rounded-full text-saa-navy transition-colors duration-200 hover:bg-black/10 disabled:cursor-not-allowed ${MODAL_FOCUS_RING}`}
          >
            <IconClose />
          </button>
        ) : (
          // mm:I520:11647;520:9873;186:2761
          <IconChevronDown className="shrink-0 text-saa-navy" />
        )}
      </div>
      {open ? listSlot : null}
    </div>
  )
}
