import type { ReactNode } from 'react'

export const KUDOS_EYEBROW = 'Sun* Annual Awards 2025'

type KudosSectionHeaderProps = {
  /** id of the heading, referenced by the section's aria-labelledby. */
  headingId: string
  eyebrow?: string
  title: string
  /** Right side of the title row (the filter buttons of HIGHLIGHT KUDOS). */
  trailing?: ReactNode
}

/** Eyebrow + divider + big gold title (mm:2940:13453, 2940:13476, 2940:14221). */
export function KudosSectionHeader({ headingId, eyebrow = KUDOS_EYEBROW, title, trailing }: KudosSectionHeaderProps) {
  return (
    <header className="flex w-full flex-col gap-4">
      <p className="m-0 font-[family-name:var(--font-montserrat)] text-lg leading-8 font-bold text-white md:text-2xl">{eyebrow}</p>
      <div aria-hidden="true" className="h-px w-full bg-saa-divider" />
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between md:gap-8">
        <h2
          id={headingId}
          className="m-0 font-[family-name:var(--font-montserrat)] text-4xl leading-tight font-bold tracking-[-0.25px] text-saa-gold md:text-[57px] md:leading-16"
        >
          {title}
        </h2>
        {trailing}
      </div>
    </header>
  )
}
