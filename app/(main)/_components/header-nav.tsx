import Link from 'next/link'
import type { MouseEvent } from 'react'

export type NavItem = { key: 'about' | 'awards' | 'kudos'; href: string; label: string; active: boolean }
export type NavClickHandler = (href: string, event: MouseEvent<HTMLAnchorElement>) => void

type HeaderNavProps = { items: NavItem[]; onNavClick?: NavClickHandler }

// Figma A1.2 selected: gold text + glow + 1px gold underline; A1.3/A1.5 normal: white, hover tint.
const ACTIVE = 'border-b border-saa-gold text-saa-gold [text-shadow:0_4px_4px_rgba(0,0,0,0.25),0_0_6px_#fae287]'
const NORMAL = 'border-b border-transparent text-white hover:bg-saa-gold/10'

export function HeaderNav({ items, onNavClick }: HeaderNavProps) {
  return (
    // mm:I2167:9091;178:653
    <nav className="hidden items-center gap-6 lg:flex">
      {items.map(({ key, href, label, active }) => (
        // mm:I2167:9091;186:1579 / 186:1587 / 186:1593
        <Link
          key={key}
          href={href}
          aria-current={active ? 'page' : undefined}
          onClick={onNavClick ? (e) => onNavClick(href, e) : undefined}
          className={`flex items-center rounded p-4 font-[family-name:var(--font-montserrat)] text-sm leading-5 font-bold tracking-[0.1px] whitespace-nowrap transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-white ${active ? ACTIVE : NORMAL}`}
        >
          {label}
        </Link>
      ))}
    </nav>
  )
}
