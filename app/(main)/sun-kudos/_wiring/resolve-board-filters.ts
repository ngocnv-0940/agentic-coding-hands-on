import type { FilterOptions, KudoFilters } from '@/lib/kudos/kudo-board-types'
import { getFilterOptions } from '@/lib/kudos/kudo-board-queries'
import { sanitizeFilters, type RawSearchParams } from '@/lib/kudos/kudo-filters'

const NO_OPTIONS: FilterOptions = { hashtags: [], departments: [] }

/**
 * `searchParams` -> filters the DB can trust (unknown value = no filter, D014) plus the dropdown options.
 * `getFilterOptions` is request-cached, so each streamed block can call this itself. If the options cannot be read
 * the board still renders: no options means no filter, and the failure is logged server-side only.
 */
export async function resolveBoardFilters(
  searchParams: Promise<RawSearchParams>,
): Promise<{ filters: KudoFilters; options: FilterOptions }> {
  const params = await searchParams
  let options = NO_OPTIONS
  try {
    options = await getFilterOptions()
  } catch (error) {
    console.error('[kudos] filter options failed', error instanceof Error ? error.name : 'unknown')
  }
  return { filters: sanitizeFilters(params, options), options }
}
