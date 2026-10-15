import Image from 'next/image'
import type { HeroTitle } from './kudos-view-types'

const ARTWORK: Partial<Record<HeroTitle, string>> = {
  legend_hero: '/images/kudos/badges/legend-hero.png',
  rising_hero: '/images/kudos/badges/rising-hero.png',
  super_hero: '/images/kudos/badges/super-hero.png',
}

/** Hero title pill (mm:I2940:13464;335:9443;3106:17694). "New Hero" has no artwork in the frame, so it is drawn as text. */
export function HeroBadge({ title, label }: { title: HeroTitle; label: string }) {
  const src = ARTWORK[title]
  return (
    <span className="relative inline-flex h-[19px] w-[109px] shrink-0 items-center justify-center overflow-hidden rounded-full border-[0.5px] border-saa-gold bg-[#092432]">
      {src ? (
        <>
          <Image src={src} alt="" width={109} height={19} unoptimized className="absolute inset-0 size-full object-cover" />
          <span className="sr-only">{label}</span>
        </>
      ) : (
        <span className="font-[family-name:var(--font-montserrat)] text-[11px] leading-4 font-bold text-white [text-shadow:0_0.4px_1.5px_#000]">
          {label}
        </span>
      )}
    </span>
  )
}
