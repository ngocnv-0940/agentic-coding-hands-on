import type { MouseEvent, Ref } from 'react'
import { IconTarget } from './award-icons'

/** `S` is the slug type of the caller (e.g. AwardSlug), so `onSelect` hands back exactly that type. */
export type AwardsCategoryMenuItem<S extends string = string> = { slug: S; label: string }

export type AwardsCategoryMenuProps<S extends string = string> = {
  /** Points at the scrolling <nav> (the row of tabs below 1024px), so behaviour code can scroll the active tab into view. */
  ref?: Ref<HTMLElement>
  ariaLabel: string
  items: AwardsCategoryMenuItem<S>[]
  activeSlug: S
  onSelect: (slug: S, event: MouseEvent<HTMLAnchorElement>) => void
}

const ITEM_BASE =
  'flex w-fit items-center gap-1 border-b p-4 text-sm leading-5 font-bold tracking-[0.25px] whitespace-nowrap transition-[color,background-color,text-shadow] duration-200 focus-visible:outline-2 focus-visible:outline-saa-gold lg:whitespace-normal'
const ITEM_IDLE = 'rounded border-transparent text-white hover:bg-white/10 hover:text-saa-gold'
const ITEM_ACTIVE = 'rounded-none border-saa-gold text-saa-gold [text-shadow:0_4px_4px_rgba(0,0,0,0.25),0_0_6px_#fae287]'

export function AwardsCategoryMenu<S extends string>({ ref, ariaLabel, items, activeSlug, onSelect }: AwardsCategoryMenuProps<S>) {
  return (
    // mm:313:8459 — one <nav>: vertical sticky list from 1024px, single row of horizontal tabs below
    <nav
      ref={ref}
      aria-label={ariaLabel}
      data-testid="awards-category-menu"
      className="sticky top-20 z-10 -mx-4 overflow-x-auto border-b border-saa-divider bg-saa-navy px-4 [scrollbar-width:none] md:-mx-12 md:px-12 lg:top-24 lg:mx-0 lg:w-[178px] lg:shrink-0 lg:self-start lg:overflow-visible lg:border-b-0 lg:bg-transparent lg:px-0"
    >
      <ul className="m-0 flex w-max list-none gap-2 p-0 lg:w-auto lg:flex-col lg:gap-4">
        {items.map(({ slug, label }) => {
          const active = slug === activeSlug
          return (
            <li key={slug}>
              {/* mm:313:8460 (active) / 313:8461..8465 (idle) */}
              <a
                href={`#${slug}`}
                data-testid={`awards-menu-item-${slug}`}
                aria-current={active ? 'location' : undefined}
                onClick={(event) => onSelect(slug, event)}
                className={`${ITEM_BASE} ${active ? ITEM_ACTIVE : ITEM_IDLE}`}
              >
                {/* mm:I313:8460;186:1745 */}
                <IconTarget className="shrink-0" />
                {label}
              </a>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
