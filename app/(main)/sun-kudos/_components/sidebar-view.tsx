import Image from 'next/image'
import Link from 'next/link'
import { IconGift, IconHeart, IconUserCircle } from './kudos-icons'
import { FOCUS_RING } from './kudos-layout'
import type { SidebarGift, SidebarStats, SidebarViewProps } from './kudos-view-types'

const PANEL = 'flex w-full flex-col gap-4 rounded-[17px] border border-saa-gold-border bg-[#00070c] p-6'
const FONT = 'font-[family-name:var(--font-montserrat)] font-bold'

const ROWS: Array<{ key: keyof SidebarStats; label: 'received' | 'sent' | 'hearts' | 'opened' | 'unopened' }> = [
  { key: 'received', label: 'received' },
  { key: 'sent', label: 'sent' },
  { key: 'hearts', label: 'hearts' },
  { key: 'opened', label: 'opened' },
  { key: 'unopened', label: 'unopened' },
]

function StatRow({ id, label, value, marker }: { id: string; label: string; value: number; marker?: boolean }) {
  return (
    // mm:2940:13491 and siblings
    <div className="flex h-10 items-center justify-between gap-2">
      <span className={`${FONT} flex items-center gap-1 text-[22px] leading-7 text-white`}>
        {label}
        {marker ? (
          // mm:3241:14931 — "x2" heart marker beside the hearts statistic
          <span aria-hidden="true" className="relative inline-flex size-8 items-center justify-center text-[#d4271d]">
            <IconHeart className="size-8" />
            <span className="absolute text-[11px] leading-none font-bold text-white [-webkit-text-stroke:0.6px_#000]">x2</span>
          </span>
        ) : null}
      </span>
      <span data-testid={`sidebar-stat-${id}`} className={`${FONT} min-w-[46px] text-right text-[32px] leading-10 text-saa-gold`}>
        {value}
      </span>
    </div>
  )
}

function GiftRow({ gift }: { gift: SidebarGift }) {
  return (
    // mm:2940:13516
    <li data-testid="sidebar-gift-row" className="flex items-center gap-2">
      <Link
        href="/profile"
        aria-label={gift.name}
        className={`relative block size-16 shrink-0 overflow-hidden rounded-full border-[1.87px] border-white bg-[#eee] ${FOCUS_RING}`}
      >
        {gift.avatarUrl ? (
          <Image src={gift.avatarUrl} alt="" fill unoptimized sizes="64px" className="object-cover" />
        ) : (
          <IconUserCircle className="size-full p-2 text-[#999]" />
        )}
      </Link>
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <Link href="/profile" className={`${FONT} block truncate text-[22px] leading-7 text-saa-gold hover:underline ${FOCUS_RING}`}>
          {gift.name}
        </Link>
        <p className={`${FONT} m-0 truncate text-base leading-6 tracking-[0.15px] text-white`}>{gift.prize}</p>
      </div>
    </li>
  )
}

/** Right column of ALL KUDOS (mm:2940:13488): personal statistics with the Secret Box button, then the latest gifts. */
export function SidebarView({ stats, gifts, canOpenBox, onOpenBox, labels }: SidebarViewProps) {
  return (
    <aside
      data-testid="kudos-sidebar"
      className="flex w-full flex-col gap-6 lg:sticky lg:top-24 lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto"
    >
      {/* mm:2940:13489 */}
      <div className={PANEL}>
        {/* mm:2940:13490 */}
        <div className="flex flex-col gap-4">
          {ROWS.map(({ key, label }, position) => (
            <div key={key} className="contents">
              {position === 3 ? <div aria-hidden="true" className="h-px w-full bg-saa-divider" /> : null}
              <StatRow id={key} label={labels[label]} value={stats[key]} marker={key === 'hearts'} />
            </div>
          ))}
          {/* mm:2940:13497 */}
          <button
            type="button"
            data-testid="sidebar-open-box"
            disabled={!canOpenBox}
            onClick={onOpenBox}
            className={`${FONT} flex h-[60px] w-full cursor-pointer items-center justify-center gap-1 rounded-lg bg-saa-gold p-4 text-[22px] leading-7 text-saa-navy transition-[box-shadow,opacity] duration-200 hover:shadow-[0_0_12px_#fae287] disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none ${FOCUS_RING}`}
          >
            {labels.openBox}
            <IconGift />
          </button>
        </div>
      </div>
      {/* mm:2940:13510 */}
      <div className={`${PANEL} gap-4 pr-4`}>
        {/* mm:2940:13513 */}
        <h3 className={`${FONT} m-0 text-center text-[22px] leading-7 whitespace-pre-line text-saa-gold`}>{labels.giftsTitle}</h3>
        {gifts.length === 0 ? (
          <p data-testid="sidebar-gifts-empty" className={`${FONT} m-0 py-4 text-center text-base leading-6 text-white`}>
            {labels.giftsEmpty}
          </p>
        ) : (
          // mm:2940:13515 + scrollbar 2940:13521
          <ul className="m-0 flex max-h-96 list-none flex-col gap-4 overflow-y-auto p-0 pr-3 [scrollbar-color:#999_transparent] [scrollbar-width:thin]">
            {gifts.map((gift) => (
              <GiftRow key={gift.sunnerId + gift.prize} gift={gift} />
            ))}
          </ul>
        )}
      </div>
    </aside>
  )
}
