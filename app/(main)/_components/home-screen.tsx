import Image from 'next/image'
import { AwardsSection, type AwardsSectionProps } from './awards-section'
import { HomeHero, type HomeHeroProps } from './home-hero'
import { homeFontClassName } from './home-fonts'
import { KudosPromo, type KudosPromoProps } from './kudos-promo'
import { RootFurtherContent, type RootFurtherContentProps } from './root-further-content'

export type HomeScreenProps = {
  hero: HomeHeroProps
  rootFurther: RootFurtherContentProps
  awards: AwardsSectionProps
  kudos: KudosPromoProps
}

const CONTAINER = 'mx-auto w-full max-w-[1512px] px-4 md:px-12 xl:px-36'

/** Main content of the Homepage SAA. Header, footer and widget are rendered by the (main) layout. */
export function HomeScreen({ hero, rootFurther, awards, kudos }: HomeScreenProps) {
  return (
    // mm:2167:9026 — pulled up under the sticky 80px header so the key visual runs behind it
    <div className={`${homeFontClassName} relative -mt-20 w-full overflow-x-clip bg-saa-navy`}>
      {/* mm:2167:9027 */}
      <div className="absolute inset-x-0 top-0 h-[1392px]" aria-hidden="true">
        {/* mm:2167:9028 */}
        <Image src="/images/homepage/keyvisual.png" alt="" fill priority sizes="100vw" className="object-cover object-top" />
      </div>
      {/* mm:2167:9029 */}
      <div
        aria-hidden="true"
        className="absolute inset-x-0 top-0 h-[1480px] bg-[linear-gradient(12deg,#00101a_23.7%,rgba(0,18,29,0.46)_38.34%,rgba(0,19,32,0)_48.92%)]"
      />
      {/* mm:2167:9030 */}
      <div className={`${CONTAINER} relative flex flex-col gap-[102px] pt-32 pb-[125px] md:pt-[184px]`}>
        <HomeHero {...hero} />
        <RootFurtherContent {...rootFurther} />
        <AwardsSection {...awards} />
        <KudosPromo {...kudos} />
      </div>
    </div>
  )
}
