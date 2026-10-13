import Image from 'next/image'
import Link from 'next/link'
import { IconArrowUpRight } from './icons'

export type KudosPromoProps = {
  eyebrow: string
  title: string
  /** First line is the highlight ("ĐIỂM MỚI CỦA SAA 2025"), then the description, separated by "\n". */
  body: string
  detailLabel: string
  href: string
  /** Alt text of the KUDOS logo artwork. */
  imageAlt: string
  /** "wide" matches the 1152px Kudos block of the Awards Information frame (mm:335:12023); default is the homepage 1120px block. */
  variant?: 'default' | 'wide'
}

const VARIANT = {
  default: { card: 'max-w-[1120px]', content: 'max-w-[521px]', logo: 'xl:right-[84px]' },
  wide: { card: 'max-w-[1152px]', content: 'max-w-[553px]', logo: 'xl:right-[79px]' },
} as const

export function KudosPromo({ eyebrow, title, body, detailLabel, href, imageAlt, variant = 'default' }: KudosPromoProps) {
  const v = VARIANT[variant]
  return (
    // mm:3390:10349
    <section
      data-testid="kudos-promo"
      className={`relative mx-auto flex min-h-[500px] w-full ${v.card} items-center overflow-hidden rounded-2xl bg-[#0f0f0f]`}
    >
      {/* mm:I3390:10349;313:8416 */}
      <Image src="/images/homepage/kudos-background.png" alt="" fill sizes="(min-width: 1120px) 1120px, 100vw" className="object-cover object-right" />
      {/* mm:I3390:10349;313:8419 */}
      <div className={`relative flex w-full ${v.content} flex-col gap-8 p-6 md:py-[46px] md:pr-8 md:pl-16`}>
        {/* mm:I3390:10349;313:8420 */}
        <div className="flex flex-col gap-4">
          {/* mm:I3390:10349;313:8421 */}
          <p className="m-0 font-[family-name:var(--font-montserrat)] text-xl leading-8 font-bold text-white md:text-2xl">{eyebrow}</p>
          {/* mm:I3390:10349;313:8422 */}
          <h2 className="m-0 font-[family-name:var(--font-montserrat)] text-4xl leading-tight font-bold tracking-[-0.25px] text-saa-gold md:text-[57px] md:leading-16">
            {title}
          </h2>
          {/* mm:I3390:10349;313:8423 */}
          <p className="m-0 font-[family-name:var(--font-montserrat)] text-base leading-6 font-bold tracking-[0.5px] whitespace-pre-line text-white text-justify">
            {body}
          </p>
        </div>
        {/* mm:I3390:10349;313:8426 */}
        <Link
          href={href}
          className="flex h-14 w-fit items-center gap-2 rounded p-4 font-[family-name:var(--font-montserrat)] text-base leading-6 font-bold tracking-[0.15px] text-saa-navy bg-saa-gold transition-[box-shadow] duration-200 hover:shadow-[0_0_12px_#fae287] focus-visible:outline-2 focus-visible:outline-white"
        >
          {detailLabel}
          <IconArrowUpRight />
        </Link>
      </div>
      {/* mm:I3390:10349;329:2948 */}
      <Image
        src="/images/homepage/kudos-logo.svg"
        alt={imageAlt}
        width={364}
        height={74}
        unoptimized
        className={`absolute top-[215px] right-4 hidden lg:block ${v.logo}`}
      />
    </section>
  )
}
