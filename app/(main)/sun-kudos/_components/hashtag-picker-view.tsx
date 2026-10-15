import { MODAL_FOCUS_RING } from './write-kudo-field-row'
import { IconCheckCircle, IconClose, IconPlus } from './write-kudo-icons'
import type { HashtagPickerViewProps } from './write-kudo-view-types'

const PANEL_ID = 'write-kudo-hashtag-panel'

/**
 * Hashtag row body (mm:I520:11647;662:8595): the chips of the picked tags, then the "+ Hashtag / Tối đa 5" button that opens the
 * multi-select list (Dropdown list hashtag, mm:1002:13102: #00070C panel, 1px #998C5F, 6px padding, 40px rows, a picked row
 * gets the gold 20% wash and a tick). The panel stays open across picks; at the cap the unpicked rows turn `aria-disabled`.
 * The frame draws no chip, so chips reuse the field chrome (white, #998C5F border, 8px radius, 48px tall).
 */
export function HashtagPickerView({ options, open, onToggleOpen, onToggle, onRemove, atLimit, labels, disabled }: HashtagPickerViewProps) {
  const picked = options.filter((option) => option.selected)
  return (
    <div className="relative flex flex-wrap items-center gap-2">
      {picked.map((option) => (
        <span
          key={option.slug}
          data-testid="write-kudo-hashtag-chip"
          data-slug={option.slug}
          className="inline-flex h-12 max-w-full items-center gap-2 rounded-lg border border-saa-gold-border bg-white pr-2 pl-4 text-base leading-6 font-bold tracking-[0.15px] text-saa-navy"
        >
          <span className="truncate">{option.label}</span>
          <button
            type="button"
            data-testid="write-kudo-hashtag-chip-remove"
            aria-label={`${labels.remove} ${option.label}`}
            disabled={disabled}
            onClick={() => onRemove(option.slug)}
            className={`inline-flex size-6 shrink-0 cursor-pointer items-center justify-center rounded-full transition-colors duration-200 hover:bg-black/10 disabled:cursor-not-allowed ${MODAL_FOCUS_RING}`}
          >
            <IconClose width={16} height={16} />
          </button>
        </span>
      ))}
      {/* mm:I520:11647;662:8911 */}
      <button
        type="button"
        data-testid="write-kudo-hashtag-add"
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-controls={PANEL_ID}
        disabled={disabled}
        onClick={onToggleOpen}
        className={`flex h-12 cursor-pointer items-center gap-2 rounded-lg border border-saa-gold-border bg-white px-2 py-1 text-left transition-colors duration-200 hover:bg-[rgba(255,234,158,0.3)] disabled:cursor-not-allowed disabled:opacity-60 ${MODAL_FOCUS_RING}`}
      >
        {/* mm:I520:11647;662:8911;186:2759 */}
        <IconPlus className="shrink-0 text-saa-gold-border" />
        {/* mm:I520:11647;662:8911;186:2760 */}
        <span className="flex flex-col">
          <span className="text-base leading-5 font-bold tracking-[0.15px] text-saa-navy">{labels.add}</span>
          <span className="text-[11px] leading-4 font-bold tracking-[0.5px] text-[#999]">{labels.hint}</span>
        </span>
      </button>
      {open ? (
        <div
          id={PANEL_ID}
          role="listbox"
          aria-multiselectable="true"
          data-testid="write-kudo-hashtag-panel"
          className="absolute top-full left-0 z-20 mt-1 flex max-h-[336px] w-[318px] max-w-full flex-col overflow-y-auto rounded-lg border border-saa-gold-border bg-[#00070c] p-1.5"
        >
          {options.map((option) => (
            <div
              key={option.slug}
              role="option"
              tabIndex={option.disabled ? -1 : 0}
              data-testid="write-kudo-hashtag-option"
              data-slug={option.slug}
              aria-selected={option.selected}
              aria-disabled={option.disabled}
              onClick={() => {
                if (!option.disabled) onToggle(option.slug)
              }}
              onKeyDown={(event) => {
                if (option.disabled || (event.key !== 'Enter' && event.key !== ' ')) return
                event.preventDefault()
                onToggle(option.slug)
              }}
              className={`flex h-10 shrink-0 cursor-pointer items-center justify-between gap-2 rounded-sm px-4 text-base leading-6 font-bold tracking-[0.15px] text-white outline-none transition-colors duration-150 hover:bg-[rgba(255,234,158,0.1)] focus-visible:bg-[rgba(255,234,158,0.2)] aria-disabled:cursor-not-allowed aria-disabled:opacity-40 aria-disabled:hover:bg-transparent aria-selected:bg-[rgba(255,234,158,0.2)]`}
            >
              <span className="truncate">{option.label}</span>
              {option.selected ? <IconCheckCircle className="shrink-0" /> : null}
            </div>
          ))}
          {atLimit ? (
            <p data-testid="write-kudo-hashtag-limit" className="m-0 px-4 pt-2 pb-1 text-xs leading-4 font-bold text-saa-gold">
              {labels.limit}
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
