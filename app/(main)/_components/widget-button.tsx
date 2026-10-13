import Image from 'next/image'
import { IconPen } from './icons'

/** Fixed bottom-right floating pill (quick-action menu is deferred; no click behaviour yet). */
export function WidgetButton({ label }: { label: string }) {
  return (
    // mm:5022:15169
    <button
      type="button"
      data-testid="widget-button"
      aria-label={label}
      className="fixed right-4 bottom-6 z-20 flex h-16 w-[106px] cursor-pointer items-center gap-2 rounded-full bg-saa-gold p-4 text-saa-navy shadow-[0_4px_4px_rgba(0,0,0,0.25),0_0_6px_#fae287] transition-[transform,box-shadow] duration-200 hover:scale-105 focus-visible:outline-2 focus-visible:outline-white md:right-[19px] md:bottom-12"
    >
      {/* mm:I5022:15169;214:3839;186:1935 */}
      <span className="flex items-center gap-2">
        {/* mm:I5022:15169;214:3839;186:1763 */}
        <IconPen />
        {/* mm:I5022:15169;214:3839;186:1568 */}
        <span aria-hidden="true" className="font-[family-name:var(--font-montserrat)] text-2xl leading-8 font-bold">
          /
        </span>
      </span>
      {/* mm:I5022:15169;214:3839;186:1766 / mm:I5022:15169;214:3839;186:1766;214:3762 */}
      <Image src="/images/homepage/icon-kudos-mark.svg" alt="" width={20} height={19} unoptimized />
    </button>
  )
}
