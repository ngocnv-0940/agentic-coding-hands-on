import type { CSSProperties, HTMLAttributes, ReactNode, Ref } from 'react'

/**
 * Prop contracts of the Kudos live board presentational components (phase 2).
 * Field names match the phase-03 RPC contract (`KudoCard` / `Person`, camelCase). Components are
 * stateless and prop-driven: formatting (time, stars) and every handler arrive from the wiring layer.
 */

export type HeroTitle = 'new_hero' | 'rising_hero' | 'super_hero' | 'legend_hero'
export type StarCount = 0 | 1 | 2 | 3

/** RPC `Person` plus `stars`, which the wiring derives with `starsFor(receivedCount)`. */
export type PersonView = {
  id: string
  name: string
  avatarUrl: string | null
  department: string | null
  heroTitle: HeroTitle | null
  receivedCount: number
  stars: StarCount
}

export type HashtagView = { slug: string; label: string }

/** RPC `KudoCard` (people carry `stars`) plus the pre-formatted `timeLabel` ("HH:mm - MM/DD/YYYY"). */
export type KudoCardView = {
  id: string
  title: string | null
  content: string
  createdAt: string
  likeCount: number
  likedByViewer: boolean
  canLike: boolean
  /** `null` for an anonymous kudo: the board never receives the real sender (write-kudo FR-401). */
  sender: PersonView | null
  /** Anonymous kudo: the card shows `anonymousName`, or `labels.anonymousSender` when that is empty, with no avatar, link or badge. */
  isAnonymous?: boolean
  anonymousName?: string | null
  receiver: PersonView
  hashtags: HashtagView[]
  images: { url: string }[]
  timeLabel: string
}

export type KudoCardLabels = {
  /** "Xem chi tiết" */
  detail: string
  /** Native tooltip of one star for a person with 1, 2 or 3 stars. */
  starTitles: [string, string, string]
  /** Hero badge text per title; also the image alt of the badge artwork. */
  heroTitles: Record<HeroTitle, string>
  /** Alt text of an attached image thumbnail. */
  imageAlt: string
  /** "Người gửi ẩn danh": sender text of an anonymous kudo whose alias is empty. */
  anonymousSender?: string
}

export type LikeButtonViewProps = {
  liked: boolean
  count: number
  disabled: boolean
  pending: boolean
  onToggle: () => void
  /** Accessible name; the wiring words it for the liked / not liked state. */
  label: string
}

export type CopyLinkButtonViewProps = { onCopy: () => void; label: string }

export type FilterOption = { value: string; label: string }

export type FilterDropdownViewProps = {
  /** data-testid of the trigger button, e.g. "kudos-filter-hashtag". */
  testId: string
  /** Trigger text while nothing is selected ("Hashtag", "Phòng ban"). */
  label: string
  options: FilterOption[]
  selected: string | null
  open: boolean
  onToggle: () => void
  onSelect: (value: string | null) => void
  /** Text of the clear option ("Bỏ lọc"). */
  clearLabel: string
}

export type CarouselViewProps = {
  slides: ReactNode[]
  index: number
  onPrev: () => void
  onNext: () => void
  /** Accessible name of the carousel region. */
  regionLabel?: string
  prevLabel?: string
  nextLabel?: string
  /** Shown instead of the carousel when there are no slides. */
  emptyLabel?: string
}

export type HighlightSectionProps = {
  /** Defaults to the Figma copy "Sun* Annual Awards 2025". */
  eyebrow?: string
  title: string
  filterBar: ReactNode
  carousel: ReactNode
}

export type SpotlightNodeView = {
  id: string
  name: string
  /** Position inside the canvas, percent (0 to 100) of its width and height. */
  x: number
  y: number
  href: string
  /** "name · HH:mm - MM/DD/YYYY" */
  tooltip: string
  match: boolean
}

export type SpotlightBoardViewProps = {
  eyebrow?: string
  title: string
  total: number
  nodes: SpotlightNodeView[]
  /** Lines of the recent-activity ticker (display only). */
  recent: string[]
  panZoomOn: boolean
  /** Transform of the pan/zoom layer. */
  canvasStyle: CSSProperties
  /** Pointer and wheel handlers spread on the drag surface. */
  canvasHandlers: HTMLAttributes<HTMLDivElement>
  /** The search field (see SpotlightSearchInput). */
  searchSlot: ReactNode
  emptyLabel: string
  panZoomLabel: string
  onTogglePanZoom: () => void
}

export type FeedStatus = 'idle' | 'loading' | 'error' | 'done'

export type FeedViewProps = {
  /** Keyed by kudo id so a card keeps its state when pages or filters change the list. */
  cards: { id: string; node: ReactNode }[]
  sentinelRef: Ref<HTMLDivElement>
  status: FeedStatus
  labels: { empty: string; loading: string; error: string }
}

export type SidebarStats = { received: number; sent: number; hearts: number; opened: number; unopened: number }
export type SidebarGift = { sunnerId: string; name: string; avatarUrl: string | null; prize: string }

export type SidebarLabels = {
  received: string
  sent: string
  hearts: string
  opened: string
  unopened: string
  openBox: string
  giftsTitle: string
  giftsEmpty: string
}

export type SidebarViewProps = {
  stats: SidebarStats
  gifts: SidebarGift[]
  canOpenBox: boolean
  onOpenBox: () => void
  labels: SidebarLabels
}

export type ToastKind = 'success' | 'error'
export type ToastViewProps = { message: string | null; kind: ToastKind }

export type ComingSoonModalViewProps = {
  open: boolean
  title: string
  closeLabel: string
  onClose: () => void
}
