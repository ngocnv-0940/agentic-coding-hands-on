/**
 * Row shapes returned by the Kudos board RPCs. Field names and nullability match the phase-03 "RPC contract"
 * key for key (supabase/migrations/20261014095441_kudos_live_board_functions.sql); ids are uuid strings and
 * every timestamp is an ISO string `YYYY-MM-DDTHH:mm:ss.SSSZ` (UTC, millisecond precision).
 */

export type HeroTitle = 'new_hero' | 'rising_hero' | 'super_hero' | 'legend_hero'

export type Person = {
  id: string
  name: string
  avatarUrl: string | null
  /** Department name (not code). */
  department: string | null
  heroTitle: HeroTitle | null
  /** Number of kudos this person received; the star count derives from it (`starsFor`). */
  receivedCount: number
}

export type Hashtag = { slug: string; label: string }

export type KudoCard = {
  id: string
  title: string | null
  content: string
  createdAt: string
  likeCount: number
  likedByViewer: boolean
  /** Viewer has a sunners row and is not the sender. */
  canLike: boolean
  /** Anonymous kudo: the alias for everyone, the sender included. */
  isAnonymous: boolean
  /** Alias of an anonymous kudo; null when not anonymous or when the sender left it blank. */
  anonymousName: string | null
  /** `null` iff `isAnonymous`: the board RPCs never reveal the real sender of an anonymous kudo. */
  sender: Person | null
  receiver: Person
  hashtags: Hashtag[]
  /** At most 5, ordered by position. */
  images: { url: string }[]
}

export type FilterOptions = {
  hashtags: Hashtag[]
  departments: { code: string; name: string }[]
}

/** Active filters after sanitising: `null` means "no filter". */
export type KudoFilters = { hashtag: string | null; department: string | null }

export type SpotlightData = {
  total: number
  /** Distinct receivers, latest kudo first, at most 100. */
  receivers: { sunnerId: string; name: string; latestKudoId: string; latestCreatedAt: string }[]
  /** The 5 newest kudos, newest first. */
  recent: { kudoId: string; receiverName: string; createdAt: string }[]
}

export type SidebarData = {
  /** False when the signed-in user has no sunners row: stats are all 0 and hearts stay disabled. */
  hasSunner: boolean
  stats: { received: number; sent: number; hearts: number; boxesOpened: number; boxesUnopened: number }
  latestGifts: { sunnerId: string; name: string; avatarUrl: string | null; prize: string | null; openedAt: string }[]
}

/** Keyset position of the last item of a page: pass it back unchanged to fetch the next page. */
export type FeedCursor = { createdAt: string; id: string }

export type FeedPage = { items: KudoCard[]; nextCursor: FeedCursor | null }

export type LikeResult = { liked: boolean; likeCount: number }

export type LikeErrorCode = 'self_like' | 'sunner_not_found' | 'kudo_not_found' | 'unknown'

export type LikeActionResult = ({ ok: true } & LikeResult) | { ok: false; code: LikeErrorCode }
