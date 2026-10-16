/**
 * Kudos mock fixtures: departments, sunners and the auth identity each sunner belongs to.
 * Names, departments and hero titles come from the Figma frame (MaZUn5xHXZ). Sunners with
 * `userId` null are receivers only. `receivedCount` is stored (not derived) so the star tiers
 * 9/10/20/50 are reachable without 50 fixture kudos; the real SQL derives it at seed scale.
 */
import { NAME, SUNNER } from './kudos-fixture-ids'

export interface MockDepartment {
  code: string
  name: string
}

export type MockHeroTitle = 'new_hero' | 'rising_hero' | 'super_hero' | 'legend_hero'

export interface MockSunner {
  id: string
  /** auth.users id of the signed-in identity this sunner belongs to, or null. */
  userId: string | null
  name: string
  avatarUrl: string | null
  /** department code (FK-style reference into DEPARTMENTS). */
  departmentCode: string | null
  heroTitle: MockHeroTitle | null
  receivedCount: number
}

export const DEPARTMENTS: MockDepartment[] = [
  { code: 'CEVC10', name: 'CEVC10' },
  { code: 'DEV', name: 'Development' },
  { code: 'HR', name: 'Human Resources' },
  { code: 'MKT', name: 'Marketing' },
]

const avatar = (key: string) => `/images/kudos/avatars/${key}.png`

/** Receiver-only fixture rows for the recipient search (no kudos, so the F006 board counts do not move). */
const WRITE_KUDO_RECEIVERS: MockSunner[] = (['an', 'nguyenVanA', 'binh', 'cuong', 'dung', 'hang', 'hieu', 'huong', 'khoa', 'lan'] as const).map((key) => ({
  id: SUNNER[key],
  userId: null,
  name: NAME[key],
  avatarUrl: null,
  departmentCode: key === 'nguyenVanA' ? 'HR' : 'DEV',
  heroTitle: null,
  receivedCount: 0,
}))

export const SUNNERS: MockSunner[] = [
  { id: SUNNER.viewer, userId: 'e2e-user', name: NAME.viewer, avatarUrl: avatar('viewer'), departmentCode: 'DEV', heroTitle: 'rising_hero', receivedCount: 3 },
  { id: SUNNER.sender, userId: 'kudos-sender', name: NAME.sender, avatarUrl: avatar('sender'), departmentCode: 'MKT', heroTitle: 'new_hero', receivedCount: 0 },
  { id: SUNNER.liker, userId: 'kudos-liker', name: NAME.liker, avatarUrl: null, departmentCode: 'DEV', heroTitle: null, receivedCount: 0 },
  { id: SUNNER.nhat, userId: null, name: NAME.nhat, avatarUrl: avatar('nhat'), departmentCode: 'CEVC10', heroTitle: 'new_hero', receivedCount: 10 },
  { id: SUNNER.xuan, userId: null, name: NAME.xuan, avatarUrl: avatar('xuan'), departmentCode: 'CEVC10', heroTitle: 'legend_hero', receivedCount: 20 },
  { id: SUNNER.linh, userId: null, name: NAME.linh, avatarUrl: avatar('linh'), departmentCode: 'MKT', heroTitle: 'super_hero', receivedCount: 50 },
  { id: SUNNER.quy, userId: null, name: NAME.quy, avatarUrl: avatar('quy'), departmentCode: 'DEV', heroTitle: 'rising_hero', receivedCount: 9 },
  { id: SUNNER.duc, userId: null, name: NAME.duc, avatarUrl: null, departmentCode: 'DEV', heroTitle: null, receivedCount: 10 },
  { id: SUNNER.chuc, userId: null, name: NAME.chuc, avatarUrl: avatar('chuc'), departmentCode: 'HR', heroTitle: 'super_hero', receivedCount: 0 },
  { id: SUNNER.tam, userId: null, name: NAME.tam, avatarUrl: null, departmentCode: 'HR', heroTitle: null, receivedCount: 0 },
  { id: SUNNER.writer, userId: 'kudos-writer', name: NAME.writer, avatarUrl: null, departmentCode: 'DEV', heroTitle: null, receivedCount: 0 },
  ...WRITE_KUDO_RECEIVERS,
]

/** Sunner row key -> fixture row, for the kudos table (`sunnerKey`) to resolve people by key. */
export const SUNNER_BY_KEY: Record<keyof typeof SUNNER, MockSunner> = Object.fromEntries(
  (Object.keys(SUNNER) as Array<keyof typeof SUNNER>).map((key) => [key, SUNNERS.find((s) => s.id === SUNNER[key])!]),
) as Record<keyof typeof SUNNER, MockSunner>
