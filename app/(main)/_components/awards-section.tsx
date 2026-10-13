import { AwardCard, type AwardCardData } from './award-card'

export type AwardsSectionProps = {
  caption: string
  title: string
  subtitle?: string
  detailLabel: string
  items: AwardCardData[]
}

export function AwardsSection({ caption, title, subtitle, detailLabel, items }: AwardsSectionProps) {
  return (
    // mm:2167:9068
    <section className="flex w-full flex-col gap-10 md:gap-20">
      {/* mm:2167:9069 */}
      <header className="flex flex-col gap-4">
        {/* mm:2167:9070 */}
        <p className="m-0 font-[family-name:var(--font-montserrat)] text-xl leading-8 font-bold text-white md:text-2xl">{caption}</p>
        {/* mm:2167:9071 */}
        <hr className="m-0 h-px border-0 bg-saa-divider" />
        {/* mm:2167:9073 */}
        <h2 className="m-0 font-[family-name:var(--font-montserrat)] text-4xl leading-tight font-bold tracking-[-0.25px] text-saa-gold md:text-[57px] md:leading-16">
          {title}
        </h2>
        {subtitle ? (
          <p className="m-0 font-[family-name:var(--font-montserrat)] text-base leading-6 font-bold text-white">{subtitle}</p>
        ) : null}
      </header>
      {/* mm:5005:14974 */}
      <div
        data-testid="awards-grid"
        className="grid grid-cols-2 gap-x-4 gap-y-10 md:gap-x-10 md:gap-y-20 lg:grid-cols-3 xl:grid-cols-[repeat(3,minmax(0,336px))] xl:justify-between"
      >
        {items.map((award) => (
          <AwardCard key={award.slug} award={award} detailLabel={detailLabel} />
        ))}
      </div>
    </section>
  )
}
