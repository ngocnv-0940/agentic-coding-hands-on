import Image from 'next/image'
import { IconDiamond, IconLicense, IconTarget } from './award-icons'

export type AwardPrize = { value: string; note: string }

export type AwardDetailCardData = {
  slug: string
  title: string
  /** Full Figma description; "\n" starts a new line (rendered with whitespace-pre-line). */
  description: string
  imageSrc: string
  quantity: { value: string; unit: string }
  prizes: AwardPrize[]
}

export type AwardDetailLabels = {
  quantity: string
  prize: string
  /** Separator between alternative prizes (Signature 2025). Omitted: a plain line is drawn. */
  or?: string
}

const LABEL = 'text-2xl leading-8 font-bold text-saa-gold'
const VALUE = 'm-0 text-4xl leading-11 font-bold text-white'
const NOTE = 'm-0 text-sm leading-5 font-bold tracking-[0.1px] text-white'

function Divider() {
  return <div aria-hidden="true" className="h-px w-full bg-saa-divider" />
}

function PrizeBlock({ prize, label }: { prize: AwardPrize; label: string }) {
  return (
    // mm:I313:8467;214:2540
    <div data-testid="award-detail-prize" className="flex flex-col gap-4">
      <div className="flex items-center gap-4">
        <IconLicense className="shrink-0 text-saa-gold" />
        <span className={LABEL}>{label}</span>
      </div>
      <p className={VALUE}>{prize.value}</p>
      {prize.note ? <p className={NOTE}>{prize.note}</p> : null}
    </div>
  )
}

function OrSeparator({ label }: { label?: string }) {
  if (!label) return <Divider />
  return (
    // mm:313:8498
    <div className="flex items-center gap-4">
      <span className="text-sm leading-5 font-bold tracking-[0.1px] text-saa-divider">{label}</span>
      <Divider />
    </div>
  )
}

/** Odd cards (index 1, 3, 5) put the image on the right from 768px up, as in Figma (D.2, D.4, D.6). */
export function AwardDetailCard({ award, index, labels }: { award: AwardDetailCardData; index: number; labels: AwardDetailLabels }) {
  const titleId = `${award.slug}-title`
  const flipped = index % 2 === 1
  return (
    // mm:313:8467 (D.1) .. 313:8510 (D.6): section anchored by slug, bottom line = mm:I313:8467;214:2771
    <section
      id={award.slug}
      data-testid={`award-detail-${award.slug}`}
      aria-labelledby={titleId}
      className="scroll-mt-[152px] border-b border-saa-divider pb-10 md:pb-20 lg:scroll-mt-28"
    >
      <div className={`flex flex-col gap-10 md:items-start ${flipped ? 'md:flex-row-reverse' : 'md:flex-row'}`}>
        {/* mm:I313:8467;214:2525 — background (mm:I313:8467;214:2525;81:2442) and name artwork (mm:I313:8467;214:2525;214:666) are pre-composited into the slug PNG */}
        <Image
          src={award.imageSrc}
          alt={award.title}
          width={336}
          height={336}
          data-testid="award-detail-image"
          className="aspect-square w-full max-w-[336px] shrink-0 rounded-3xl border border-saa-gold shadow-[0_4px_4px_rgba(0,0,0,0.25),0_0_6px_#fae287] md:w-[336px]"
        />
        {/* mm:I313:8467;214:2526 */}
        <div className="flex w-full min-w-0 flex-col gap-8 md:max-w-[480px] md:flex-1">
          <div className="flex flex-col gap-6">
            <div className="flex items-center gap-4">
              <IconTarget className="shrink-0 text-saa-gold" />
              <h2 id={titleId} className={`m-0 ${LABEL}`}>
                {award.title}
              </h2>
            </div>
            <p
              data-testid="award-detail-description"
              className="m-0 text-base leading-6 font-bold tracking-[0.5px] whitespace-pre-line text-white text-justify"
            >
              {award.description}
            </p>
          </div>
          <Divider />
          {/* mm:I313:8467;214:2533 */}
          <div data-testid="award-detail-quantity" className="flex items-center gap-4">
            <IconDiamond className="shrink-0 text-saa-gold" />
            <span className={LABEL}>{labels.quantity}</span>{' '}
            <span className="flex items-center gap-2">
              <span className="text-4xl leading-11 font-bold text-white">{award.quantity.value}</span>{' '}
              <span className="w-[60px] text-sm leading-5 font-bold tracking-[0.1px] text-white">{award.quantity.unit}</span>
            </span>
          </div>
          <Divider />
          {award.prizes.map((prize, i) => (
            <div key={`${prize.value}-${i}`} className="flex flex-col gap-8">
              {i > 0 ? <OrSeparator label={labels.or} /> : null}
              <PrizeBlock prize={prize} label={labels.prize} />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
