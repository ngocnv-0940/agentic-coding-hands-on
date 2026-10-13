import Image from 'next/image'
import type { ReactNode } from 'react'
import { EventInfo, type EventInfoProps } from './event-info'
import { HeroCtaLinks, type HeroCtaLinksProps } from './hero-cta-links'

export type HomeHeroProps = {
  /** Countdown element, rendered by Track B with live values. */
  countdown: ReactNode
  event: EventInfoProps
  ctas: HeroCtaLinksProps
}

export function HomeHero({ countdown, event, ctas }: HomeHeroProps) {
  return (
    // mm:2167:9031
    <section data-testid="homepage-hero" className="flex w-full flex-col gap-10">
      {/* mm:2167:9032 */}
      <h1 className="m-0 h-[110px] w-[248px] md:h-[200px] md:w-[451px]">
        {/* mm:2788:12911 */}
        <Image
          src="/images/homepage/root-further-logo.png"
          alt=""
          width={451}
          height={200}
          priority
          className="h-full w-full object-contain object-left"
        />
        {/* The logo artwork reads "ROOT FURTHER". */}
        <span className="sr-only">ROOT FURTHER</span>
      </h1>
      {/* mm:2167:9034 */}
      <div className="flex flex-col gap-4">
        {countdown}
        <EventInfo {...event} />
      </div>
      <HeroCtaLinks {...ctas} />
    </section>
  )
}
