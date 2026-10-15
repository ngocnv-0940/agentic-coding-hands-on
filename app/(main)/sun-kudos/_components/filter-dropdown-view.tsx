import { IconChevronDown } from './kudos-icons'
import { FOCUS_RING, GOLD_OUTLINE_CLASS } from './kudos-layout'
import type { FilterDropdownViewProps } from './kudos-view-types'

// Panel and rows from the MoMorph frames "Dropdown Hashtag filter" (721:5580) and "Dropdown Phòng ban":
// 1px #998C5F border, #00070C fill, 8px radius, 6px padding; rows 56px high with a 10% gold fill when selected.
const PANEL_CLASS =
  'absolute top-full left-0 z-40 mt-1 flex max-h-80 min-w-full flex-col overflow-y-auto rounded-lg border border-saa-gold-border bg-[#00070c] p-1.5 md:right-0 md:left-auto'
const ROW_CLASS = `flex min-h-14 w-full cursor-pointer items-center rounded px-4 py-4 text-left font-[family-name:var(--font-montserrat)] text-base leading-6 font-bold tracking-[0.15px] whitespace-nowrap text-white transition-colors duration-200 hover:bg-[rgba(255,234,158,0.2)] ${FOCUS_RING}`

/** One filter button with its listbox (B.1.1 Hashtag, B.1.2 Phòng ban). Open state and selection live in the wiring. */
export function FilterDropdownView({ testId, label, options, selected, open, onToggle, onSelect, clearLabel }: FilterDropdownViewProps) {
  const selectedLabel = options.find((option) => option.value === selected)?.label
  return (
    // mm:2940:13459 / mm:2940:13460
    <div className="relative">
      <button
        type="button"
        data-testid={testId}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={onToggle}
        className={`${GOLD_OUTLINE_CLASS} flex h-14 cursor-pointer items-center gap-2 rounded p-4 text-base leading-6 tracking-[0.15px] transition-colors duration-200 hover:bg-[rgba(255,234,158,0.2)] ${FOCUS_RING}`}
      >
        <span className="max-w-[160px] truncate">{selectedLabel ?? label}</span>
        <IconChevronDown className={`shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>
      {open ? (
        <div role="listbox" aria-label={label} className={PANEL_CLASS}>
          <button
            type="button"
            role="option"
            aria-selected={selected === null}
            onClick={() => onSelect(null)}
            className={`${ROW_CLASS} ${selected === null ? 'bg-[rgba(255,234,158,0.1)]' : ''}`}
          >
            {clearLabel}
          </button>
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              role="option"
              aria-selected={option.value === selected}
              onClick={() => onSelect(option.value)}
              className={`${ROW_CLASS} ${option.value === selected ? 'bg-[rgba(255,234,158,0.1)]' : ''}`}
            >
              {option.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )
}
