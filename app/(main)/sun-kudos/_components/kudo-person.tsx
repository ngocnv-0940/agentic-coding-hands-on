import Image from 'next/image'
import Link from 'next/link'
import { HeroBadge } from './hero-badge'
import { IconStar, IconUserCircle } from './kudos-icons'
import { FOCUS_RING } from './kudos-layout'
import type { KudoCardLabels, PersonView } from './kudos-view-types'

const PROFILE_HREF = '/profile'

type KudoPersonProps = {
  /** `null` renders the anonymous sender: alias text only, no avatar image, no profile link, no badge. */
  person: PersonView | null
  role: 'sender' | 'receiver'
  labels: KudoCardLabels
  /** Display name of the anonymous sender (alias, or the default label when the alias is empty). */
  anonymousName?: string
}

/** Sender or receiver block of a kudo card (mm:256:4830): avatar, name, department, hero badge and stars. */
export function KudoPerson({ person, role, labels, anonymousName }: KudoPersonProps) {
  if (!person) {
    return (
      <div data-testid="kudo-person" data-role={role} data-anonymous="true" className="flex w-full min-w-0 max-w-[235px] flex-col items-center justify-center gap-[13px]">
        {/* neutral silhouette in the avatar slot keeps the card symmetrical; it is not an image of the sender */}
        <span aria-hidden="true" className="block size-16 shrink-0 overflow-hidden rounded-full border-[1.87px] border-white bg-[#eee]">
          <IconUserCircle className="size-full p-2 text-[#999]" />
        </span>
        <p className="m-0 w-full truncate text-center font-[family-name:var(--font-montserrat)] text-base leading-6 font-bold tracking-[0.15px] text-saa-navy">
          {anonymousName}
        </p>
      </div>
    )
  }
  const starTitle = person.stars > 0 ? labels.starTitles[person.stars - 1] : undefined
  return (
    // mm:I2940:13464;335:9443
    <div data-testid="kudo-person" data-role={role} className="flex w-full min-w-0 max-w-[235px] flex-col items-center justify-center gap-[13px]">
      {/* mm:I2940:13464;335:9443;256:4734 */}
      <Link
        href={PROFILE_HREF}
        aria-label={person.name}
        className={`relative block size-16 shrink-0 overflow-hidden rounded-full border-[1.87px] border-white bg-[#eee] ${FOCUS_RING}`}
      >
        {person.avatarUrl ? (
          <Image src={person.avatarUrl} alt="" fill unoptimized sizes="64px" className="object-cover" />
        ) : (
          <IconUserCircle className="size-full p-2 text-[#999]" />
        )}
      </Link>
      {/* mm:I2940:13464;335:9443;256:4737 */}
      <div className="flex w-full flex-col items-center gap-0.5">
        {/* mm:I2940:13464;335:9443;256:4735 */}
        <Link
          href={PROFILE_HREF}
          className={`block w-full truncate text-center font-[family-name:var(--font-montserrat)] text-base leading-6 font-bold tracking-[0.15px] text-saa-navy hover:underline ${FOCUS_RING}`}
        >
          {person.name}
        </Link>
        {/* mm:I2940:13464;335:9443;256:4741 */}
        <div className="flex max-w-full items-center justify-center gap-2.5 font-[family-name:var(--font-montserrat)] text-sm leading-5 font-bold tracking-[0.1px] text-[#999]">
          {person.department ? <span className="truncate">{person.department}</span> : null}
          {person.department && person.heroTitle ? <span aria-hidden="true" className="size-1 shrink-0 rounded-full bg-[#999] opacity-40" /> : null}
          {person.heroTitle ? <HeroBadge title={person.heroTitle} label={labels.heroTitles[person.heroTitle]} /> : null}
        </div>
        {person.stars > 0 ? (
          <div className="flex items-center gap-0.5 text-[#d4a017]">
            {Array.from({ length: person.stars }, (_, i) => (
              <span key={i} data-testid="kudo-person-star" title={starTitle} className="inline-flex">
                <IconStar />
              </span>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  )
}
