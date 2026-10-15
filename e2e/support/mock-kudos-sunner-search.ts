/**
 * search_sunners of the Kudos mock (phase-03 §Contract, ALG-001 of the write path): the query is trimmed,
 * lower-cased and stripped of diacritics (đ -> d), then matched as a literal substring of the full name.
 * Empty or >100-char queries answer []. The viewer is never listed; results are name-ordered and capped at 10.
 * Array logic only; the SQL in supabase/migrations is the authority.
 */
import { DEPARTMENTS, type MockSunner } from './mock-kudos-fixture-people'
import type { MockDataset } from './mock-kudos-state'

export const SEARCH_LIMIT = 10

/** Vietnamese-insensitive fold: NFD, drop combining marks, map đ/Đ to d/D, lower-case. */
export const foldText = (value: string): string =>
  value.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase()

export interface SunnerOptionJson {
  id: string
  name: string
  avatarUrl: string | null
  department: string | null
}

export function searchSunners(ds: MockDataset, viewer: MockSunner | undefined, rawQuery: string): SunnerOptionJson[] {
  const trimmed = rawQuery.trim()
  if (trimmed === '' || trimmed.length > 100) return []
  const query = foldText(trimmed)
  return ds.sunners
    .filter((sunner) => sunner.id !== viewer?.id && foldText(sunner.name).includes(query))
    .sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : a.id < b.id ? -1 : 1))
    .slice(0, SEARCH_LIMIT)
    .map((sunner) => ({
      id: sunner.id,
      name: sunner.name,
      avatarUrl: sunner.avatarUrl,
      department: DEPARTMENTS.find((d) => d.code === sunner.departmentCode)?.name ?? null,
    }))
}
