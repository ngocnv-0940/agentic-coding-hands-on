import { IconSearch } from './kudos-icons'
import { GOLD_OUTLINE_CLASS } from './kudos-layout'

export const SPOTLIGHT_SEARCH_MAX_LENGTH = 100

export type SpotlightSearchInputProps = {
  value: string
  onChange: (value: string) => void
  /** "Tìm kiếm" */
  placeholder: string
  label: string
}

/** Search pill of the Spotlight board (mm:2940:14833). Controlled by the wiring; passed to the board as `searchSlot`. */
export function SpotlightSearchInput({ value, onChange, placeholder, label }: SpotlightSearchInputProps) {
  return (
    <label
      className={`${GOLD_OUTLINE_CLASS} flex h-[39px] w-[219px] max-w-full items-center gap-[5px] rounded-full px-[11px] text-sm focus-within:outline-2 focus-within:outline-saa-gold`}
    >
      <IconSearch aria-hidden="true" className="size-4 shrink-0" />
      <input
        type="search"
        data-testid="spotlight-search"
        aria-label={label}
        maxLength={SPOTLIGHT_SEARCH_MAX_LENGTH}
        placeholder={placeholder}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={`min-w-0 flex-1 bg-transparent font-[family-name:var(--font-montserrat)] text-sm leading-5 font-bold text-white outline-none placeholder:text-white/70`}
      />
    </label>
  )
}
