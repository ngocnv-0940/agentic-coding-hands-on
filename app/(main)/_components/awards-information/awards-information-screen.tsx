import type { ReactNode } from 'react'
import { KudosPromo, type KudosPromoProps } from '../kudos-promo'
import { AwardDetailCard, type AwardDetailCardData, type AwardDetailLabels } from './award-detail-card'
import { AWARDS_CONTAINER, AwardsInformationHero, type AwardsInformationHeroProps } from './awards-information-hero'

export type AwardsInformationScreenProps = {
  hero: AwardsInformationHeroProps
  /** The category menu (<AwardsCategoryMenu />), supplied by the behaviour layer. */
  menu: ReactNode
  awards: AwardDetailCardData[]
  labels: AwardDetailLabels
  kudos: KudosPromoProps
}

/** Main content of the Hệ thống giải page. Header, footer and widget are rendered by the (main) layout. */
export function AwardsInformationScreen({ hero, menu, awards, labels, kudos }: AwardsInformationScreenProps) {
  return (
    // mm:313:8436 — overflow-x-clip (not hidden/auto) so the sticky menu keeps sticking to the window scroll
    <div data-testid="awards-information" className="w-full overflow-x-clip bg-saa-navy font-[family-name:var(--font-montserrat)]">
      <AwardsInformationHero {...hero} />
      <div className={`${AWARDS_CONTAINER} relative flex flex-col gap-12 pt-12 pb-16 md:gap-[120px] md:pt-[120px] md:pb-24`}>
        {/* mm:313:8458 */}
        <div className="flex flex-col gap-6 lg:flex-row lg:justify-between lg:gap-20">
          {menu}
          {/* mm:313:8466 */}
          <div className="flex w-full flex-col gap-10 md:gap-20 lg:w-[856px] lg:shrink-0">
            {awards.map((award, index) => (
              <AwardDetailCard key={award.slug} award={award} index={index} labels={labels} />
            ))}
          </div>
        </div>
        {/* mm:335:12023 */}
        <KudosPromo {...kudos} variant="wide" />
      </div>
    </div>
  )
}
