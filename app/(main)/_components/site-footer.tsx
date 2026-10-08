import Image from 'next/image'
import Link from 'next/link'
import type { NavClickHandler } from './header-nav'

export type FooterLink = { href: string; label: string }
export type SiteFooterProps = {
  logoAlt: string
  links: FooterLink[]
  copyright: string
  onNavClick?: NavClickHandler
}

export function SiteFooter({ logoAlt, links, copyright, onNavClick }: SiteFooterProps) {
  const handle = (href: string) => (onNavClick ? (e: React.MouseEvent<HTMLAnchorElement>) => onNavClick(href, e) : undefined)
  return (
    // mm:5001:14800
    <footer className="flex w-full flex-col items-center gap-6 border-t border-saa-divider px-4 py-10 md:px-12 xl:flex-row xl:justify-between xl:px-[90px]">
      {/* mm:I5001:14800;342:1407 */}
      <div className="flex flex-col items-center gap-6 xl:flex-row xl:gap-20">
        {/* mm:I5001:14800;342:1408 */}
        <Link href="/" onClick={handle('/')} className="block h-16 w-[69px] shrink-0">
          {/* mm:I5001:14800;342:1408;178:1030 */}
          <Image src="/images/homepage/footer-logo.png" alt={logoAlt} width={69} height={64} className="h-16 w-[69px]" />
        </Link>
        {/* mm:I5001:14800;342:1409 */}
        <nav className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 md:gap-x-12">
          {links.map(({ href, label }) => (
            // mm:I5001:14800;342:1410 / 342:1411 / 342:1412 / 1161:9487
            <Link
              key={href + label}
              href={href}
              onClick={handle(href)}
              className="rounded p-4 font-[family-name:var(--font-montserrat)] text-base leading-6 font-bold tracking-[0.15px] whitespace-nowrap text-white transition-colors duration-200 hover:bg-saa-gold/10 focus-visible:outline-2 focus-visible:outline-white"
            >
              {label}
            </Link>
          ))}
        </nav>
      </div>
      {/* mm:I5001:14800;342:1413 */}
      <p className="font-[family-name:var(--font-montserrat-alternates)] text-base leading-6 font-bold text-white">{copyright}</p>
    </footer>
  )
}
