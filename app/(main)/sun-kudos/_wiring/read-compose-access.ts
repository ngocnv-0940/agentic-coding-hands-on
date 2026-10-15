import { getFilterOptions, getSidebar } from '@/lib/kudos/kudo-board-queries'
import type { Hashtag } from '@/lib/kudos/kudo-board-types'

export type ComposeAccess = {
  /** The viewer has a sunners row, so they may send a kudo (the compose pill is disabled otherwise). */
  hasSunner: boolean
  hashtags: Hashtag[]
}

/**
 * What the compose pill and the Viết Kudo form need from the server. Both reads are `cache`d, so the blocks that
 * already ask for them share the result. A failed read degrades to "cannot compose" and no hashtags, never to a crash.
 */
export async function readComposeAccess(): Promise<ComposeAccess> {
  const [sidebar, filterOptions] = await Promise.all([
    getSidebar().catch(() => null),
    getFilterOptions().catch(() => null),
  ])
  return { hasSunner: sidebar?.hasSunner === true, hashtags: filterOptions?.hashtags ?? [] }
}
