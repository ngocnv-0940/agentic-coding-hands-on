import Image from 'next/image'
import Link from 'next/link'
import type { ReactNode } from 'react'
import { HeaderNav, type NavClickHandler, type NavItem } from './header-nav'

export type SiteHeaderProps = {
  logoAlt: string
  nav: NavItem[]
  onNavClick?: NavClickHandler
  notifications: ReactNode
  languageSelector: ReactNode
  account: ReactNode
}

export function SiteHeader({ logoAlt, nav, onNavClick, notifications, languageSelector, account }: SiteHeaderProps) {
  return (
    // mm:2167:9091
    <header className="sticky top-0 z-30 flex h-20 w-full items-center justify-between bg-[rgba(16,20,23,0.8)] px-4 py-3 md:px-12 xl:px-36">
      {/* mm:I2167:9091;186:2166 */}
      <div className="flex h-14 items-center gap-6 lg:gap-16">
        {/* mm:I2167:9091;178:1033 */}
        <Link href="/" onClick={onNavClick ? (e) => onNavClick('/', e) : undefined} className="block h-12 w-[52px] shrink-0">
          {/* mm:I2167:9091;178:1033;178:1030 */}
          <Image src="/images/homepage/logo.png" alt={logoAlt} width={52} height={48} priority className="h-12 w-[52px]" />
        </Link>
        <HeaderNav items={nav} onNavClick={onNavClick} />
      </div>
      {/* mm:I2167:9091;186:1601 */}
      <div className="flex items-center gap-1 sm:gap-4">
        {/* mm:I2167:9091;186:1696 — flag mm:I2167:9091;186:1696;186:1821;186:1709;178:1010 and chevron mm:I2167:9091;186:1696;186:1821;186:1441 live in the language selector slot */}
        {notifications}
        {languageSelector}
        {account}
      </div>
    </header>
  )
}
