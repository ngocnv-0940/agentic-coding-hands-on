/**
 * In-memory Kudos state for the E2E mock: the full dataset (every identity except
 * kudos-empty), the empty dataset, the mutable like rows, and the mock-only special-day flag.
 * Only the serial like spec mutates this state; it calls POST /__e2e/kudos/reset-likes in beforeAll.
 * The write specs own the writer dataset and call POST /__e2e/kudos/reset-writes, so neither reset touches the other's state.
 */
import { BOX_ROWS, HASHTAGS, KUDO_ROWS, boxOpenedAt, kudoCreatedAt } from './mock-kudos-fixture-kudos'
import { SUNNER_BY_KEY, SUNNERS, type MockSunner } from './mock-kudos-fixture-people'
import { kudoId } from './kudos-fixture-ids'

export interface MockKudo {
  id: string
  senderId: string
  receiverId: string
  title: string | null
  content: string
  createdAt: string
  /** Anonymous likes that have no like row (1 heart each). */
  baseLikes: number
  hashtagSlugs: string[]
  /** Stored image urls: `/images/...` for fixtures, `kudo-images/<name>` for uploads (resolved by the app). */
  imageUrls: string[]
  isAnonymous: boolean
  anonymousName: string | null
  /** Tiptap JSON the editor saved (null for fixtures). */
  contentDoc: unknown | null
}

export interface MockBox {
  ownerId: string
  openedAt: string | null
  prize: string | null
}

export interface MockDataset {
  sunners: MockSunner[]
  kudos: MockKudo[]
  boxes: MockBox[]
  hashtags: Array<{ slug: string; label: string }>
}

const FULL_KUDOS: MockKudo[] = KUDO_ROWS.map((row, index) => {
  const n = index + 1
  return {
    id: kudoId(n),
    senderId: SUNNER_BY_KEY[row.sender].id,
    receiverId: SUNNER_BY_KEY[row.receiver].id,
    title: row.title,
    content: row.content,
    createdAt: kudoCreatedAt(n),
    baseLikes: row.baseLikes,
    hashtagSlugs: row.tags,
    imageUrls: Array.from({ length: row.images }, (_, i) => `/images/kudos/posts/kudo-${n}-${i + 1}.jpg`),
    isAnonymous: false,
    anonymousName: null,
    contentDoc: null,
  }
})

const FULL_BOXES: MockBox[] = BOX_ROWS.map((row, index) => ({
  ownerId: SUNNER_BY_KEY[row.owner].id,
  openedAt: row.opened ? boxOpenedAt(index) : null,
  prize: row.prize,
}))

export const FULL_DATASET: MockDataset = { sunners: SUNNERS, kudos: FULL_KUDOS, boxes: FULL_BOXES, hashtags: [...HASHTAGS] }

/** kudos-empty identity: the seed exists (hashtags) but there are no sunners, kudos or boxes. */
export const EMPTY_DATASET: MockDataset = { sunners: [], kudos: [], boxes: [], hashtags: [...HASHTAGS] }

/**
 * Identity kudos-writer: a private copy of the full dataset that create_kudo appends to. Only the serial
 * submit spec sends kudos, so the shared FULL_DATASET the F006 specs read never changes.
 */
export const WRITER_DATASET: MockDataset = { ...FULL_DATASET, kudos: [...FULL_KUDOS] }

/** kudo id -> sunner id -> hearts_awarded (1 or 2). Only the full dataset ever receives likes. */
export const likeRows = new Map<string, Map<string, 1 | 2>>()

/** Mock-only control; not part of the app contract. */
export const kudosControl = { specialToday: false }

/** Like state back to start: no like rows, normal day. Called by POST /__e2e/kudos/reset-likes. */
export function resetLikeState(): void {
  likeRows.clear()
  kudosControl.specialToday = false
}

/** Writer dataset back to start: no kudos created by the write path. Called by POST /__e2e/kudos/reset-writes. */
export function resetWriterState(): void {
  WRITER_DATASET.kudos = [...FULL_KUDOS]
}

/** Kudos the writer created since the last reset (the submit spec asserts this, not the feed). */
export const createdKudoCount = (): number => WRITER_DATASET.kudos.length - FULL_KUDOS.length

/** Reads the viewer's sunner id from the dataset; `undefined` when the identity has no row. */
export function viewerIn(dataset: MockDataset, userId: string): MockSunner | undefined {
  return dataset.sunners.find((sunner) => sunner.userId === userId)
}
