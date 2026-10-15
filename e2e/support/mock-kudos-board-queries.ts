/**
 * Read RPCs of the Kudos mock, shaped exactly like phase-03 "RPC contract" (camelCase jsonb).
 * Sorting and filtering over arrays only; the SQL in supabase/migrations is the authority.
 * Viewer = the sunner for the caller (undefined when the identity has no row).
 */
import { DEPARTMENTS, type MockSunner } from './mock-kudos-fixture-people'
import { likeRows, type MockDataset, type MockKudo } from './mock-kudos-state'

export type Json = Record<string, unknown>

const sunnerById = (ds: MockDataset, id: string) => ds.sunners.find((sunner) => sunner.id === id)

function departmentNameOf(sunner: MockSunner): string | null {
  if (!sunner.departmentCode) return null
  return DEPARTMENTS.find((d) => d.code === sunner.departmentCode)?.name ?? null
}

function personJson(sunner: MockSunner | undefined): Json {
  if (!sunner) throw new Error('mock: kudo references a sunner missing from the dataset')
  return {
    id: sunner.id,
    name: sunner.name,
    avatarUrl: sunner.avatarUrl,
    department: departmentNameOf(sunner),
    heroTitle: sunner.heroTitle,
    receivedCount: sunner.receivedCount,
  }
}

/** Likes a kudo shows: anonymous base likes plus stored like rows. */
export function likeCountOf(kudo: MockKudo): number {
  return kudo.baseLikes + (likeRows.get(kudo.id)?.size ?? 0)
}

/** Hearts a kudo's likes award its sender: 1 per anonymous like plus each row's stored value. */
export function heartsOnKudo(kudo: MockKudo): number {
  let hearts = kudo.baseLikes
  for (const awarded of likeRows.get(kudo.id)?.values() ?? []) hearts += awarded
  return hearts
}

function cardJson(kudo: MockKudo, ds: MockDataset, viewer: MockSunner | undefined): Json {
  const likedByViewer = viewer ? likeRows.get(kudo.id)?.has(viewer.id) === true : false
  const hashtags = kudo.hashtagSlugs
    .map((slug) => ds.hashtags.find((tag) => tag.slug === slug)!)
    .sort((a, b) => a.label.localeCompare(b.label))
    .map((tag) => ({ slug: tag.slug, label: tag.label }))
  return {
    id: kudo.id,
    title: kudo.title,
    content: kudo.content,
    createdAt: kudo.createdAt,
    likeCount: likeCountOf(kudo),
    likedByViewer,
    canLike: viewer !== undefined && viewer.id !== kudo.senderId,
    sender: personJson(sunnerById(ds, kudo.senderId)),
    receiver: personJson(sunnerById(ds, kudo.receiverId)),
    hashtags,
    images: kudo.imageUrls.slice(0, 5).map((url) => ({ url })),
  }
}

/** Optional hashtag slug and department code (receiver's department) filters, combined with AND. */
function filterKudos(ds: MockDataset, hashtag: string | null, department: string | null): MockKudo[] {
  return ds.kudos.filter((kudo) => {
    if (hashtag && !kudo.hashtagSlugs.includes(hashtag)) return false
    if (department && sunnerById(ds, kudo.receiverId)?.departmentCode !== department) return false
    return true
  })
}

/** created_at desc, then id desc (the feed order and the highlight tie-break). */
const newestFirst = (a: MockKudo, b: MockKudo) => Date.parse(b.createdAt) - Date.parse(a.createdAt) || (a.id < b.id ? 1 : -1)

export function filterOptions(ds: MockDataset): Json {
  return {
    hashtags: ds.hashtags.map((tag) => ({ slug: tag.slug, label: tag.label })).sort((a, b) => a.label.localeCompare(b.label)),
    departments: DEPARTMENTS.map((d) => ({ code: d.code, name: d.name })).sort((a, b) => a.name.localeCompare(b.name)),
  }
}

/** ALG-001: most likes first, ties broken by newer created_at, capped at 5. */
export function highlight(ds: MockDataset, viewer: MockSunner | undefined, hashtag: string | null, department: string | null): Json[] {
  return filterKudos(ds, hashtag, department)
    .sort((a, b) => likeCountOf(b) - likeCountOf(a) || newestFirst(a, b))
    .slice(0, 5)
    .map((kudo) => cardJson(kudo, ds, viewer))
}

/** Keyset page: rows strictly older than (beforeCreatedAt, beforeId) when both cursor parts are set. */
export function feedPage(
  ds: MockDataset,
  viewer: MockSunner | undefined,
  args: { hashtag: string | null; department: string | null; beforeCreatedAt: string | null; beforeId: string | null; limit: number },
): Json[] {
  const limit = Math.min(Math.max(Math.trunc(args.limit), 1), 50)
  const cursor = args.beforeCreatedAt && args.beforeId ? { at: Date.parse(args.beforeCreatedAt), id: args.beforeId } : null
  return filterKudos(ds, args.hashtag, args.department)
    .filter((kudo) => {
      if (!cursor) return true
      const at = Date.parse(kudo.createdAt)
      return at < cursor.at || (at === cursor.at && kudo.id < cursor.id)
    })
    .sort(newestFirst)
    .slice(0, limit)
    .map((kudo) => cardJson(kudo, ds, viewer))
}

/** Distinct receivers by latest kudo (cap 100) plus the five newest kudos for the ticker. */
export function spotlight(ds: MockDataset): Json {
  const newest = [...ds.kudos].sort(newestFirst)
  const latestByReceiver = new Map<string, MockKudo>()
  for (const kudo of newest) if (!latestByReceiver.has(kudo.receiverId)) latestByReceiver.set(kudo.receiverId, kudo)
  const receivers = [...latestByReceiver.values()].slice(0, 100).map((kudo) => ({
    sunnerId: kudo.receiverId,
    name: sunnerById(ds, kudo.receiverId)!.name,
    latestKudoId: kudo.id,
    latestCreatedAt: kudo.createdAt,
  }))
  const recent = newest.slice(0, 5).map((kudo) => ({
    kudoId: kudo.id,
    receiverName: sunnerById(ds, kudo.receiverId)!.name,
    createdAt: kudo.createdAt,
  }))
  return { total: ds.kudos.length, receivers, recent }
}

const NO_STATS = { received: 0, sent: 0, hearts: 0, boxesOpened: 0, boxesUnopened: 0 }

/** Sidebar: viewer stats (all 0 without a sunner row) plus the public latest-gifts list (10 newest opened). */
export function sidebar(ds: MockDataset, viewer: MockSunner | undefined): Json {
  const latestGifts = ds.boxes
    .filter((box) => box.openedAt !== null)
    .sort((a, b) => Date.parse(b.openedAt!) - Date.parse(a.openedAt!))
    .slice(0, 10)
    .map((box) => {
      const owner = sunnerById(ds, box.ownerId)!
      return { sunnerId: owner.id, name: owner.name, avatarUrl: owner.avatarUrl, prize: box.prize, openedAt: box.openedAt }
    })
  if (!viewer) return { hasSunner: false, stats: NO_STATS, latestGifts }
  const boxes = ds.boxes.filter((box) => box.ownerId === viewer.id)
  const sent = ds.kudos.filter((kudo) => kudo.senderId === viewer.id)
  return {
    hasSunner: true,
    stats: {
      received: ds.kudos.filter((kudo) => kudo.receiverId === viewer.id).length,
      sent: sent.length,
      hearts: sent.reduce((sum, kudo) => sum + heartsOnKudo(kudo), 0),
      boxesOpened: boxes.filter((box) => box.openedAt !== null).length,
      boxesUnopened: boxes.filter((box) => box.openedAt === null).length,
    },
    latestGifts,
  }
}
