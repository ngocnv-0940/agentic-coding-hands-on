import Image from 'next/image'
import Link from 'next/link'
import { IconArrowUpRight } from './icons'

export type AwardCardData = { slug: string; title: string; description: string; imageSrc: string; href: string }

export function AwardCard({ award, detailLabel }: { award: AwardCardData; detailLabel: string }) {
  return (
    // mm:2167:9075 (one link for the whole card)
    <Link
      href={award.href}
      data-testid={`award-card-${award.slug}`}
      className="flex w-full flex-col gap-4 rounded-3xl transition-[transform,box-shadow] duration-200 hover:-translate-y-1 hover:shadow-[0_12px_28px_rgba(250,226,135,0.2)] focus-visible:outline-2 focus-visible:outline-saa-gold md:gap-6"
    >
      {/* mm:I2167:9075;214:1019 — award BG (mm:I2167:9075;214:1019;81:2442) and name artwork are pre-composited into the slug PNG */}
      <Image
        src={award.imageSrc}
        alt=""
        width={336}
        height={336}
        className="aspect-square w-full rounded-3xl border border-saa-gold shadow-[0_4px_4px_rgba(0,0,0,0.25),0_0_6px_#fae287]"
      />
      {/* mm:I2167:9075;214:1020 */}
      <div className="flex flex-col gap-1">
        {/* mm:I2167:9075;214:1021 */}
        <h3 className="m-0 font-[family-name:var(--font-montserrat)] text-xl leading-7 font-normal text-saa-gold md:text-2xl md:leading-8">
          {award.title}
        </h3>
        {/* mm:I2167:9075;214:1022 */}
        <p
          data-testid="award-card-description"
          className="m-0 line-clamp-2 font-[family-name:var(--font-montserrat)] text-sm leading-6 font-normal tracking-[0.5px] text-white md:text-base"
        >
          {award.description}
        </p>
        {/* mm:I2167:9075;214:1023 */}
        <span className="flex items-center gap-1 py-4 font-[family-name:var(--font-montserrat)] text-base leading-6 font-medium tracking-[0.15px] text-white">
          {detailLabel}
          <IconArrowUpRight />
        </span>
      </div>
    </Link>
  )
}
