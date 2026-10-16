import Image from 'next/image'
import { IconUserCircle } from './kudos-icons'
import type { SunnerOptionListViewProps } from './write-kudo-view-types'

/** Id of the listbox, referenced by the recipient combobox (`aria-controls`) and by the option ids. */
export const SUNNER_LIST_ID = 'write-kudo-sunner-list'

export const sunnerOptionId = (index: number) => `${SUNNER_LIST_ID}-option-${index}`

const PANEL =
  'z-20 flex max-h-[336px] w-full min-w-[260px] flex-col overflow-y-auto rounded-lg border border-saa-gold-border bg-[#00070c] p-1.5 font-[family-name:var(--font-montserrat)]'
const ROW = 'flex min-h-10 items-center gap-3 rounded-sm px-4 py-1 text-base leading-6 font-bold tracking-[0.15px] text-white'

/**
 * Suggestion list shared by the recipient field and the "@" mention (dark panel as in mm 1002:13102: #00070C, 1px #998C5F,
 * 8px radius, 6px padding). Rows are avatar, name and department; the highlighted row uses the gold 20% wash of a picked
 * hashtag. Options keep focus where it is (`mousedown` default prevented) so the field's blur handler cannot close the list first.
 */
export function SunnerOptionListView({ options, activeIndex, status, onPick, emptyLabel, position }: SunnerOptionListViewProps) {
  if (status === 'idle') return null
  const placement = position ? 'absolute w-[318px]' : 'absolute inset-x-0 top-full mt-1'
  return (
    <div
      id={SUNNER_LIST_ID}
      role="listbox"
      data-testid="sunner-option-list"
      aria-busy={status === 'loading'}
      style={position ? { top: position.top, left: position.left } : undefined}
      className={`${PANEL} ${placement}`}
      onMouseDown={(event) => event.preventDefault()}
    >
      {status === 'loading' ? (
        <div aria-hidden="true" className="flex flex-col gap-2 px-4 py-2">
          {[0, 1, 2].map((row) => (
            <span key={row} className="h-6 animate-pulse rounded bg-white/10 motion-reduce:animate-none" />
          ))}
        </div>
      ) : null}
      {status === 'empty' ? (
        <p data-testid="sunner-option-empty" className={`${ROW} m-0 text-[#999]`}>
          {emptyLabel}
        </p>
      ) : null}
      {status === 'ready'
        ? options.map((option, index) => (
            <div
              key={option.id}
              id={sunnerOptionId(index)}
              role="option"
              data-testid="sunner-option"
              data-sunner-id={option.id}
              aria-selected={index === activeIndex}
              onClick={() => onPick(option.id)}
              className={`${ROW} cursor-pointer transition-colors duration-150 hover:bg-[rgba(255,234,158,0.2)] aria-selected:bg-[rgba(255,234,158,0.2)]`}
            >
              <span className="relative size-8 shrink-0 overflow-hidden rounded-full bg-[#eee]">
                {option.avatarUrl ? (
                  <Image src={option.avatarUrl} alt="" fill unoptimized sizes="32px" className="object-cover" />
                ) : (
                  <IconUserCircle className="size-full p-1 text-[#999]" />
                )}
              </span>
              <span className="min-w-0 flex-1 truncate">{option.name}</span>
              {option.department ? <span className="max-w-[40%] shrink-0 truncate text-xs leading-4 text-[#999]">{option.department}</span> : null}
            </div>
          ))
        : null}
    </div>
  )
}
