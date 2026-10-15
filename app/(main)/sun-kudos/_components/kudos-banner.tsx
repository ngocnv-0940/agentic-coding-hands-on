import Image from 'next/image'
import type { Ref } from 'react'
import { IconPen, IconSearch } from './kudos-icons'
import { FOCUS_RING, KUDOS_CONTAINER } from './kudos-layout'

export type KudosBannerProps = {
  /** "Hệ thống ghi nhận và cảm ơn" */
  title: string
  /** Text alternative of the KUDOS logo artwork ("SAA 2025 KUDOS"). */
  logoLabel: string
  /** Placeholder of the compose pill (A.1). */
  composeLabel: string
  /** Label of the profile search pill. */
  profileSearchLabel: string
  /** The viewer has no sunner row: the compose pill is disabled (write-kudo FR-103). */
  composeDisabled?: boolean
  onCompose: () => void
  onProfileSearch: () => void
  /** Lets the wiring return focus to the compose pill when the modal closes. */
  composeRef?: Ref<HTMLButtonElement>
  profileSearchRef?: Ref<HTMLButtonElement>
}

// mm:2940:13449/13450 — stroke #998C5F, fill rgba(255,234,158,.10); a navy base + blur keeps both legible over the key visual
const PILL = `border border-saa-gold-border bg-[linear-gradient(rgba(255,234,158,0.1),rgba(255,234,158,0.1)),linear-gradient(rgba(0,16,26,0.6),rgba(0,16,26,0.6))] font-[family-name:var(--font-montserrat)] font-bold text-white backdrop-blur-sm flex h-[72px] min-w-0 cursor-pointer items-center gap-4 rounded-[68px] px-4 text-left text-base leading-6 tracking-[0.15px] transition-colors duration-200 enabled:hover:bg-[rgba(255,234,158,0.2)] ${FOCUS_RING}`

/** Key visual, title, logo and the two pills of the Kudos board. The header comes from the (main) layout. */
export function KudosBanner({
  title,
  logoLabel,
  composeLabel,
  profileSearchLabel,
  composeDisabled,
  onCompose,
  onProfileSearch,
  composeRef,
  profileSearchRef,
}: KudosBannerProps) {
  return (
    // mm:2940:13434
    <section data-testid="kudos-banner" className="relative -mt-20 w-full overflow-x-clip">
      {/* mm:2940:13432 — key visual (512) and cover gradient, clipped where the Highlight block starts (y 544) */}
      <div aria-hidden="true" className="absolute inset-x-0 top-0 h-[544px] overflow-hidden">
        {/* mm:I2940:13432;2167:5141 */}
        <Image src="/images/kudos/keyvisual.webp" alt="" fill priority sizes="100vw" className="object-cover object-top" />
        {/* mm:I2940:13432;1210:12612 */}
        <div className="absolute inset-x-0 top-[445px] h-[957px] bg-[linear-gradient(25deg,#00101a_14.74%,rgba(0,19,32,0)_47.8%)]" />
        <div className="absolute inset-x-0 bottom-0 h-24 bg-[linear-gradient(0deg,#00101a,rgba(0,16,26,0))]" />
      </div>
      <div className={`${KUDOS_CONTAINER} relative flex flex-col gap-10 pt-32 pb-16 md:gap-16 md:pt-[184px]`}>
        {/* mm:2940:13437 */}
        <div className="flex flex-col gap-2.5">
          {/* mm:2940:13439 */}
          <p className="m-0 font-[family-name:var(--font-montserrat)] text-2xl leading-9 font-bold text-saa-gold md:text-4xl md:leading-[44px]">
            {title}
          </p>
          {/* mm:2940:13440 */}
          <Image
            src="/images/kudos/kudos-logo.svg"
            alt=""
            width={593}
            height={106}
            unoptimized
            className="h-auto w-full max-w-[593px]"
          />
          <span className="sr-only">{logoLabel}</span>
        </div>
        {/* mm:2940:13448 */}
        <div className="flex flex-col gap-4 md:flex-row md:gap-8">
          {/* mm:2940:13449 */}
          <button
            ref={composeRef}
            type="button"
            data-testid="kudos-compose-pill"
            disabled={composeDisabled}
            onClick={onCompose}
            className={`${PILL} md:flex-[738_1_738px] disabled:cursor-not-allowed disabled:opacity-50`}
          >
            <IconPen className="shrink-0" />
            <span className="truncate">{composeLabel}</span>
          </button>
          {/* mm:2940:13450 */}
          <button
            ref={profileSearchRef}
            type="button"
            data-testid="kudos-profile-search-pill"
            onClick={onProfileSearch}
            className={`${PILL} md:flex-[381_1_381px]`}
          >
            <IconSearch className="shrink-0" />
            <span className="truncate">{profileSearchLabel}</span>
          </button>
        </div>
      </div>
    </section>
  )
}
