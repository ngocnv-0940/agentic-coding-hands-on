import Image from 'next/image'
import Link from 'next/link'
import type { ReactNode } from 'react'
import { CARD_BUTTON_CLASS } from './kudo-card-actions'
import { KudoPerson } from './kudo-person'
import { IconArrowUpRight, IconPen, IconSend } from './kudos-icons'
import { FOCUS_RING } from './kudos-layout'
import type { KudoCardLabels, KudoCardView } from './kudos-view-types'

export type KudoCardProps = {
  kudo: KudoCardView
  variant: 'highlight' | 'feed'
  labels: KudoCardLabels
  /** `LikeButtonView` built by the wiring. */
  likeSlot: ReactNode
  /** `CopyLinkButtonView` built by the wiring. */
  copyLinkSlot: ReactNode
  onHashtagClick?: (slug: string) => void
  /** Highlight carousel only: marks the centre card (`data-active`). */
  active?: boolean
}

const MAX_HASHTAGS = 5
const MAX_IMAGES = 5

const VARIANT = {
  // mm:2940:13464 — 528 wide, 4px gold border, 16px radius
  highlight: 'w-full rounded-2xl border-4 border-saa-gold px-5 pt-5 pb-3',
  // mm:3127:21871 — 680 wide, 24px radius
  feed: 'w-full rounded-3xl px-4 pt-6 pb-4 md:px-10 md:pt-10',
} as const

const TEXT = 'font-[family-name:var(--font-montserrat)] text-base leading-6 font-bold tracking-[0.5px]'

/** One kudo (Highlight or ALL KUDOS). Pure view: the text is rendered as text (FR-604), links go to `/sun-kudos/<id>` and `/profile`. */
export function KudoCard({ kudo, variant, labels, likeSlot, copyLinkSlot, onHashtagClick, active }: KudoCardProps) {
  const isHighlight = variant === 'highlight'
  const detailHref = `/sun-kudos/${kudo.id}`
  const hashtags = kudo.hashtags.slice(0, MAX_HASHTAGS)
  return (
    <article
      data-testid="kudo-card"
      data-kudo-id={kudo.id}
      data-variant={variant}
      data-active={active ? '' : undefined}
      className={`flex flex-col gap-4 bg-[#fff8e1] text-saa-navy ${VARIANT[variant]}`}
    >
      {/* mm:I2940:13464;335:9442 */}
      <div className="flex items-start justify-between gap-2 md:gap-6">
        <KudoPerson person={kudo.sender} role="sender" labels={labels} />
        {/* mm:I2940:13464;335:9444 */}
        <div className="flex h-[123px] shrink-0 items-start py-4 text-saa-navy">
          <IconSend aria-hidden="true" />
        </div>
        <KudoPerson person={kudo.receiver} role="receiver" labels={labels} />
      </div>
      {/* mm:I2940:13464;335:9447 */}
      <div aria-hidden="true" className="h-px w-full bg-saa-gold" />
      {/* mm:I2940:13464;335:9448 */}
      <div className={`flex flex-col gap-4 ${isHighlight ? 'min-h-[240px] justify-center' : ''}`}>
        {/* mm:I2940:13464;335:9449 */}
        <time data-testid="kudo-time" dateTime={kudo.createdAt} className={`${TEXT} text-[#999]`}>
          {kudo.timeLabel}
        </time>
        {kudo.title ? (
          // mm:I3127:21871;2234:33038
          <div className="flex items-center justify-center">
            <p className={`${TEXT} m-0 flex-1 text-center`}>{kudo.title}</p>
            {!isHighlight ? <IconPen aria-hidden="true" className="size-8 shrink-0 text-saa-navy" /> : null}
          </div>
        ) : null}
        {/* mm:I2940:13464;662:12221 */}
        <div className={`rounded-xl border border-saa-gold bg-[rgba(255,234,158,0.4)] px-6 ${isHighlight ? 'h-[120px] overflow-hidden py-[11px]' : 'py-4'}`}>
          <Link
            href={detailHref}
            data-testid="kudo-content"
            className={`${isHighlight ? 'line-clamp-3' : 'line-clamp-5'} font-[family-name:var(--font-montserrat)] text-xl leading-8 font-bold text-justify break-words text-saa-navy ${FOCUS_RING}`}
          >
            {kudo.content}
          </Link>
        </div>
        {!isHighlight && kudo.images.length > 0 ? (
          // mm:I3127:21871;256:5176
          <ul className="m-0 flex list-none flex-wrap gap-4 p-0">
            {kudo.images.slice(0, MAX_IMAGES).map((image) => (
              <li key={image.url}>
                <a
                  href={image.url}
                  target="_blank"
                  rel="noreferrer"
                  data-testid="kudo-image"
                  className={`relative block size-[88px] overflow-hidden rounded-[18px] border border-saa-gold-border bg-white ${FOCUS_RING}`}
                >
                  <Image src={image.url} alt={labels.imageAlt} fill unoptimized sizes="88px" className="object-cover" />
                </a>
              </li>
            ))}
          </ul>
        ) : null}
        {/* mm:I2940:13464;335:9458 */}
        <div className={`flex gap-x-3 text-[#d4271d] ${TEXT} ${isHighlight ? 'h-6 flex-nowrap overflow-hidden' : 'max-h-12 flex-wrap overflow-hidden'}`}>
          {hashtags.map((tag) => (
            <button
              key={tag.slug}
              type="button"
              data-testid="kudo-hashtag"
              onClick={() => onHashtagClick?.(tag.slug)}
              className={`shrink-0 cursor-pointer whitespace-nowrap rounded text-left font-bold hover:underline ${FOCUS_RING}`}
            >
              {tag.label}
            </button>
          ))}
          {kudo.hashtags.length > MAX_HASHTAGS ? <span aria-hidden="true">…</span> : null}
        </div>
      </div>
      {/* mm:I2940:13464;335:9460 */}
      <div aria-hidden="true" className="h-px w-full bg-saa-gold" />
      {/* mm:I2940:13464;335:9461 */}
      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2">
        {likeSlot}
        {/* mm:I2940:13464;335:9672 */}
        <div className="flex items-center gap-2">
          {copyLinkSlot}
          {isHighlight ? (
            // mm:I2940:13464;335:9663
            <Link href={detailHref} data-testid="kudo-detail-link" className={CARD_BUTTON_CLASS}>
              {labels.detail}
              <IconArrowUpRight aria-hidden="true" />
            </Link>
          ) : null}
        </div>
      </div>
    </article>
  )
}
