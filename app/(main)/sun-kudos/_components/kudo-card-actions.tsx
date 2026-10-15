import { formatKudosCount } from './format-kudos-count'
import { IconHeart, IconLink } from './kudos-icons'
import { FOCUS_RING } from './kudos-layout'
import type { CopyLinkButtonViewProps, LikeButtonViewProps } from './kudos-view-types'

/** Heart with the like count (mm:I2940:13464;335:9462). Grey until liked, red after; disabled for the sender. */
export function LikeButtonView({ liked, count, disabled, pending, onToggle, label }: LikeButtonViewProps) {
  return (
    <button
      type="button"
      data-testid="kudo-like"
      aria-pressed={liked}
      aria-label={label}
      aria-busy={pending}
      disabled={disabled || pending}
      onClick={onToggle}
      className={`flex h-8 cursor-pointer items-center gap-1 rounded text-saa-navy transition-opacity duration-200 hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-60 ${FOCUS_RING}`}
    >
      {/* mm:I2940:13464;335:9463 */}
      <span data-testid="kudo-like-count" className="font-[family-name:var(--font-montserrat)] text-2xl leading-8 font-bold">
        {formatKudosCount(count)}
      </span>
      {/* mm:I2940:13464;335:9464 */}
      <IconHeart className={`transition-colors duration-200 ${liked ? 'text-[#d4271d]' : 'text-[#999]'}`} />
    </button>
  )
}

export const CARD_BUTTON_CLASS = `flex h-14 cursor-pointer items-center gap-1 rounded p-4 font-[family-name:var(--font-montserrat)] text-base leading-6 font-bold tracking-[0.15px] text-saa-navy transition-colors duration-200 hover:bg-[rgba(0,16,26,0.08)] ${FOCUS_RING}`

/** "Copy Link" (mm:I3127:21871;256:5216). */
export function CopyLinkButtonView({ onCopy, label }: CopyLinkButtonViewProps) {
  return (
    <button type="button" data-testid="kudo-copy-link" onClick={onCopy} className={CARD_BUTTON_CLASS}>
      {label}
      <IconLink className="text-saa-navy" />
    </button>
  )
}
