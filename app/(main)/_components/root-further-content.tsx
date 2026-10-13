import Image from 'next/image'

export type RootFurtherContentProps = {
  /** Body paragraphs in reading order; the quote is inserted after `quoteAfter` of them. */
  paragraphs: string[]
  /** Two lines separated by "\n": the English proverb, then its Vietnamese gloss. */
  quote: string
  /** Number of paragraphs shown before the quote (Figma: 3). */
  quoteAfter?: number
}

const BODY = 'font-[family-name:var(--font-montserrat)] text-base leading-7 font-bold text-white md:text-2xl md:leading-8 text-justify'

function Paragraphs({ items }: { items: string[] }) {
  return (
    <div className="flex flex-col">
      {items.map((text, i) => (
        <p key={i} className={BODY}>
          {text}
        </p>
      ))}
    </div>
  )
}

export function RootFurtherContent({ paragraphs, quote, quoteAfter = 3 }: RootFurtherContentProps) {
  return (
    // mm:3204:10152
    <section className="mx-auto flex w-full max-w-[1152px] flex-col items-center gap-8">
      {/* mm:3204:10153 */}
      <h2 className="m-0 flex w-[290px] flex-col items-start">
        {/* mm:3204:10155 */}
        <Image src="/images/homepage/root-text.png" alt="" width={189} height={67} className="ml-[51px] h-[67px] w-[189px]" />
        {/* mm:3204:10154 */}
        <Image src="/images/homepage/further-text.png" alt="" width={290} height={67} className="h-[67px] w-[290px]" />
        <span className="sr-only">ROOT FURTHER</span>
      </h2>
      {/* mm:5001:14827 */}
      <div className="flex w-full flex-col gap-8">
        {/* mm:3204:10156 */}
        <Paragraphs items={paragraphs.slice(0, quoteAfter)} />
        {/* mm:3204:10161 */}
        <p className="text-center font-[family-name:var(--font-montserrat)] text-xl leading-8 font-bold whitespace-pre-line text-white">{quote}</p>
        {/* mm:3204:10162 */}
        <Paragraphs items={paragraphs.slice(quoteAfter)} />
      </div>
    </section>
  )
}
