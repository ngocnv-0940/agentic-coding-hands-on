import Image from 'next/image'

export type AwardsInformationHeroProps = {
  /** Alt text of the key visual artwork. */
  keyvisualAlt: string
  caption: string
  title: string
}

export const AWARDS_CONTAINER = 'mx-auto w-full max-w-[1440px] px-4 md:px-12 xl:px-36'

export function AwardsInformationHero({ keyvisualAlt, caption, title }: AwardsInformationHeroProps) {
  return (
    // mm:313:8437 (key visual) + 313:8439 (cover gradient) + 313:8449 (Bìa: logo and title)
    <section data-testid="awards-hero" className="relative w-full">
      {/* mm:2167:5138 — same artwork as the homepage key visual, window cropped to the Figma 1440x547 frame */}
      <div className="absolute inset-x-0 top-0 h-[547px]">
        <Image
          src="/images/homepage/keyvisual.png"
          alt={keyvisualAlt}
          fill
          priority
          sizes="100vw"
          className="object-cover object-[50%_58%]"
        />
      </div>
      {/* mm:313:8439 */}
      <div
        aria-hidden="true"
        className="absolute inset-x-0 top-0 h-[547px] bg-[linear-gradient(0deg,#00101a_-4.23%,rgba(0,19,32,0)_52.79%)]"
      />
      <div className={`${AWARDS_CONTAINER} relative flex flex-col gap-12 pt-12 md:gap-[120px] md:pt-[104px]`}>
        {/* mm:2789:12915 — "ROOT FURTHER" artwork (decorative, the h1 below names the page) */}
        <Image
          src="/images/homepage/root-further-logo.png"
          alt=""
          width={451}
          height={200}
          priority
          className="h-[110px] w-[248px] object-contain object-left md:h-[150px] md:w-[338px]"
        />
        {/* mm:313:8453 */}
        <div className="flex flex-col gap-4">
          {/* mm:313:8454 */}
          <p data-testid="awards-caption" className="m-0 text-center text-xl leading-8 font-bold text-white md:text-2xl">
            {caption}
          </p>
          {/* mm:313:8455 */}
          <div aria-hidden="true" className="h-px w-full bg-saa-divider" />
          {/* mm:313:8457 */}
          <h1 className="m-0 text-center text-4xl leading-tight font-bold tracking-[-0.25px] text-saa-gold md:text-[57px] md:leading-16">
            {title}
          </h1>
        </div>
      </div>
    </section>
  )
}
