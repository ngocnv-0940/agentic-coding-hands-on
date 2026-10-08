import Link from 'next/link'
import { IconArrowUpRight } from './icons'

export type LinkProps = { href: string; label: string }
export type HeroCtaLinksProps = { awards: LinkProps; kudos: LinkProps }

const BASE =
  'flex h-[60px] items-center gap-2 rounded-lg px-6 py-4 font-[family-name:var(--font-montserrat)] text-[22px] leading-7 font-bold whitespace-nowrap transition-[background-color,box-shadow] duration-200 focus-visible:outline-2 focus-visible:outline-white'

export function HeroCtaLinks({ awards, kudos }: HeroCtaLinksProps) {
  return (
    // mm:2167:9062
    <div className="flex flex-wrap items-start gap-4 md:gap-10">
      {/* mm:2167:9063 */}
      <Link href={awards.href} className={`${BASE} bg-saa-gold text-saa-navy hover:shadow-[0_0_12px_#fae287]`}>
        {awards.label}
        {/* mm:I2167:9063;186:1766 */}
        <IconArrowUpRight />
      </Link>
      {/* mm:2167:9064 */}
      <Link href={kudos.href} className={`${BASE} border border-saa-gold-border bg-saa-gold/10 text-white hover:bg-saa-gold/20`}>
        {kudos.label}
        {/* mm:I2167:9064;186:2761 */}
        <IconArrowUpRight />
      </Link>
    </div>
  )
}
