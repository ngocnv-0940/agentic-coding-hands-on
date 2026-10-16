/**
 * Single source of the Kudos fixture ids and the expected values the kudos specs assert.
 * The mock (mock-kudos-fixture-*.ts) builds its datasets from these ids; the specs read the
 * same constants, so a fixture edit cannot silently desync a spec. Pure data, no imports.
 * Expected orders were derived by hand from the fixture table in mock-kudos-fixture-kudos.ts:
 * ALG-001 = like count desc, then created_at desc (tie -> newer wins).
 */

const SUNNER_GROUP = '0000000001'
const KUDO_GROUP = '0000000002'

/** Deterministic v4-shaped UUID (version nibble 4, RFC variant 8) so zod-style uuid checks pass. */
const uid = (group: string, n: number) => `00000000-0000-4000-8000-${group}${String(n).padStart(2, '0')}`

/** Sunner row ids. `viewer` is the e2e-user identity; `outsider` has no row (see mock state).
 * Sunners from `writer` on are write-kudo fixtures: `Nguyễn …` names give >10 search matches (cap test). */
export const SUNNER = {
  viewer: uid(SUNNER_GROUP, 1),
  sender: uid(SUNNER_GROUP, 2),
  liker: uid(SUNNER_GROUP, 3),
  nhat: uid(SUNNER_GROUP, 4),
  xuan: uid(SUNNER_GROUP, 5),
  linh: uid(SUNNER_GROUP, 6),
  quy: uid(SUNNER_GROUP, 7),
  duc: uid(SUNNER_GROUP, 8),
  chuc: uid(SUNNER_GROUP, 9),
  tam: uid(SUNNER_GROUP, 10),
  /** Write-kudo identity (kudos-writer): own dataset copy, only the serial submit spec sends kudos. */
  writer: uid(SUNNER_GROUP, 11),
  an: uid(SUNNER_GROUP, 12),
  nguyenVanA: uid(SUNNER_GROUP, 13),
  binh: uid(SUNNER_GROUP, 14),
  cuong: uid(SUNNER_GROUP, 15),
  dung: uid(SUNNER_GROUP, 16),
  hang: uid(SUNNER_GROUP, 17),
  hieu: uid(SUNNER_GROUP, 18),
  huong: uid(SUNNER_GROUP, 19),
  khoa: uid(SUNNER_GROUP, 20),
  lan: uid(SUNNER_GROUP, 21),
} as const

/** Kudo ids: `kudoId(n)` for n in 1..25; index n is also the creation order (25 = newest). */
export const kudoId = (n: number) => uid(KUDO_GROUP, n)

/** Display names used in assertions (Figma content). */
export const NAME = {
  viewer: 'E2E User',
  sender: 'Phạm Thu Hà',
  liker: 'Đỗ Minh Khang',
  nhat: 'Huỳnh Dương Xuân Nhật',
  xuan: 'Huỳnh Dương Xuân',
  linh: 'Nguyễn Hoàng Linh',
  quy: 'Nguyễn Văn Quy',
  duc: 'Trần Minh Đức',
  chuc: 'Nguyễn Bá Chúc',
  tam: 'Lê Thị Tâm',
  writer: 'Vũ Hải Đăng',
  an: 'Nguyễn Văn An',
  nguyenVanA: 'NguyenVanA',
  binh: 'Nguyễn Thị Bình',
  cuong: 'Nguyễn Quốc Cường',
  dung: 'Nguyễn Đức Dũng',
  hang: 'Nguyễn Thanh Hằng',
  hieu: 'Nguyễn Minh Hiếu',
  huong: 'Nguyễn Thu Hương',
  khoa: 'Nguyễn Anh Khoa',
  lan: 'Nguyễn Ngọc Lan',
} as const

export const HASHTAG_SLUG = {
  dedicated: 'dedicated',
  teamwork: 'teamwork',
  likeTarget: 'like-target-2026',
  qualityFirst: 'quality-first',
} as const

export const DEPARTMENT_CODE = { marketing: 'MKT', hr: 'HR' } as const

export const EXPECT = {
  /** All kudos in the fixture (spotlight header and feed total). */
  kudoTotal: 25,
  /** Highlight with no filter: top 5, ties broken by newer (k21 beats k10 at 7 likes). */
  highlightAll: [25, 20, 18, 15, 21].map(kudoId),
  highlightTeamwork: [25, 18, 15, 10, 4].map(kudoId),
  highlightDedicated: [25, 20, 15, 4, 17].map(kudoId),
  /** Receiver department MKT (Nguyễn Hoàng Linh only). */
  highlightMarketing: [25, 20, 15, 10, 13].map(kudoId),
  /** Hashtag dedicated AND department MKT (kudos 5, 15, 20, 25). */
  highlightDedicatedMarketing: [25, 20, 15, 5].map(kudoId),
  /** Feed pages of 10 newest first: 25..16, 15..06, 05..01. */
  feedFirstPage: [25, 24, 23, 22, 21, 20, 19, 18, 17, 16].map(kudoId),
  feedPageSize: 10,
  /** Feed filtered by hashtag dedicated / department MKT. */
  dedicatedKudoCount: 8,
  marketingKudoCount: 6,
  /** Like targets sent by `sender`, receivers Quy (A) and Xuân (B); both carry #LikeTarget2026 and 0 likes. */
  likeTargetA: kudoId(24),
  likeTargetB: kudoId(23),
  /** Long content kudo (clamp), >5 hashtags kudo, >5 images kudo, 1.000 likes kudo. */
  longContentKudo: kudoId(11),
  overflowTagsKudo: kudoId(12),
  overflowImagesKudo: kudoId(13),
  thousandLikesKudo: kudoId(25),
  /** Spotlight: 8 distinct receivers; search "nguyen" matches Linh, Quy, Chúc. */
  spotlightReceiverCount: 8,
  spotlightSearchMatches: 3,
  spotlightNodeOfLinhLatestKudo: kudoId(25),
  /** Sidebar stats: viewer (e2e-user) and sender (kudos-sender). */
  viewerStats: { received: 3, sent: 2, hearts: 3, boxesOpened: 2, boxesUnopened: 1 },
  /** Row-derived (kudo 10 carries 7 anonymous likes). Like specs assert deltas from this baseline. */
  senderStats: { received: 0, sent: 4, hearts: 7, boxesOpened: 0, boxesUnopened: 0 },
  /** Latest gifts list: 12 opened boxes by 9 distinct Sunners -> 9 rows, one per Sunner, newest first. */
  giftsShown: 9,
  giftsTotal: 12,
  firstGiftPrize: 'Voucher 500.000 VND',
  /** Star counts from received totals: 9 -> 0, 10 -> 1, 20 -> 2, 50 -> 3 (Quy, Nhật, Xuân, Linh). */
  stars: { quy: 0, nhat: 1, xuan: 2, linh: 3 },
} as const
