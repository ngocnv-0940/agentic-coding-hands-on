import { IconChevronLeft, IconChevronRight } from './kudos-icons'
import { FOCUS_RING, KUDOS_CONTAINER } from './kudos-layout'
import type { CarouselViewProps } from './kudos-view-types'

const SIDE_BUTTON = `hidden size-20 cursor-pointer items-center justify-center rounded p-2.5 text-white transition-opacity duration-200 hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-30 xl:flex ${FOCUS_RING}`
const PAGER_BUTTON = `flex size-12 cursor-pointer items-center justify-center rounded p-2.5 text-white transition-opacity duration-200 hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-30 ${FOCUS_RING}`

/**
 * Highlight carousel (mm:2940:13461 + 2940:13471). Every slide is rendered; the active one is centred,
 * its neighbours are faded and `inert`. Under 1024px only the centre card shows (neighbours are transparent); under 1280px the active slide is centred and the side arrows give way
 * to the pager arrows. `index` and the handlers come from the wiring.
 */
export function CarouselView({ slides, index, onPrev, onNext, regionLabel, prevLabel, nextLabel, emptyLabel }: CarouselViewProps) {
  if (slides.length === 0) {
    return (
      <div className={`${KUDOS_CONTAINER} flex min-h-40 items-center justify-center`}>
        <p className="m-0 text-center font-[family-name:var(--font-montserrat)] text-xl leading-8 font-bold text-white">{emptyLabel}</p>
      </div>
    )
  }
  const atStart = index <= 0
  const atEnd = index >= slides.length - 1
  return (
    <div className="flex w-full flex-col gap-10">
      {/* mm:2940:13463 */}
      <div
        data-testid="kudos-carousel"
        role="group"
        aria-roledescription="carousel"
        aria-label={regionLabel}
        className="relative w-full overflow-hidden [--slide:min(528px,calc(100vw-32px))]"
      >
        <ul
          className="m-0 flex list-none gap-6 p-0 transition-transform duration-300 ease-out motion-reduce:transition-none ml-[calc((100%-var(--slide))/2)] xl:ml-[calc(50%-168px)]"
          style={{ transform: `translateX(calc(${index} * (var(--slide) + 24px) * -1))` }}
        >
          {slides.map((slide, position) => {
            const active = position === index
            return (
              <li
                key={position}
                inert={!active}
                aria-hidden={!active}
                className={`w-[var(--slide)] shrink-0 transition-opacity duration-300 ${active ? '' : 'opacity-0 lg:opacity-40'}`}
              >
                {slide}
              </li>
            )
          })}
        </ul>
        {/* mm:2940:13469 — left fade with the side arrow (mm:2940:13470) */}
        <div
          className="pointer-events-none absolute inset-y-0 left-0 hidden w-[400px] items-center bg-[linear-gradient(90deg,#00101a_50%,rgba(255,255,255,0)_100%)] pl-20 xl:flex"
        >
          <button type="button" data-testid="kudos-carousel-side-prev" aria-label={prevLabel} disabled={atStart} onClick={onPrev} className={`${SIDE_BUTTON} pointer-events-auto`}>
            <IconChevronLeft className="size-[60px]" />
          </button>
        </div>
        {/* mm:2940:13467 — right fade with the side arrow (mm:2940:13468) */}
        <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-[400px] items-center justify-end bg-[linear-gradient(270deg,#00101a_50%,rgba(255,255,255,0)_100%)] pr-[140px] xl:flex">
          <button type="button" data-testid="kudos-carousel-side-next" aria-label={nextLabel} disabled={atEnd} onClick={onNext} className={`${SIDE_BUTTON} pointer-events-auto`}>
            <IconChevronRight className="size-[60px]" />
          </button>
        </div>
      </div>
      {/* mm:2940:13471 */}
      <div className="flex items-center justify-center gap-8">
        {/* mm:2940:13472 */}
        <button type="button" data-testid="kudos-carousel-prev" aria-label={prevLabel} disabled={atStart} onClick={onPrev} className={PAGER_BUTTON}>
          <IconChevronLeft className="size-7" />
        </button>
        {/* mm:2940:13473 */}
        <p
          data-testid="kudos-carousel-pager"
          aria-live="polite"
          className="m-0 font-[family-name:var(--font-montserrat)] text-2xl leading-[52px] font-bold text-[#999]"
        >
          <span className="text-[44px] text-saa-gold">{index + 1}</span>/{slides.length}
        </p>
        {/* mm:2940:13474 */}
        <button type="button" data-testid="kudos-carousel-next" aria-label={nextLabel} disabled={atEnd} onClick={onNext} className={PAGER_BUTTON}>
          <IconChevronRight className="size-7" />
        </button>
      </div>
    </div>
  )
}
