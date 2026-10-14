import { Suspense } from 'react'
import type { Metadata } from 'next'
import { connection } from 'next/server'
import { getDictionary } from '@/lib/i18n/get-dictionary'
import { getLocale } from '@/lib/i18n/get-locale'
import { filtersKey, type RawSearchParams } from '@/lib/kudos/kudo-filters'
import { ActionPillsContainer } from './_wiring/action-pills-container'
import { buildLikeErrorMessages } from './_wiring/build-kudos-labels'
import { FeedAndSidebarBlock } from './_wiring/feed-and-sidebar-block'
import { HighlightBlock } from './_wiring/highlight-block'
import { KudosBoardProviders } from './_wiring/kudos-board-providers'
import { resolveBoardFilters } from './_wiring/resolve-board-filters'
import { SpotlightBlock } from './_wiring/spotlight-block'

export async function generateMetadata(): Promise<Metadata> {
  return { title: getDictionary(await getLocale())['kudos.meta.title'] }
}

type PageProps = { searchParams: Promise<RawSearchParams> }

// searchParams, cookies() (locale, session) and the RPCs are request-time reads under cacheComponents, so they sit
// behind <Suspense> and the `searchParams` promise is handed down unread (docs: 02-guides/migrating-to-cache-components.md).
// One boundary on purpose: the blocks fetch in parallel, but the board appears whole (never with the feed missing).
export default function SunKudosPage({ searchParams }: PageProps) {
  return (
    <Suspense fallback={<div className="min-h-screen" aria-hidden="true" />}>
      <KudosBoard searchParams={searchParams} />
    </Suspense>
  )
}

async function KudosBoard({ searchParams }: PageProps) {
  await connection()
  const dict = getDictionary(await getLocale())
  const { filters } = await resolveBoardFilters(searchParams)

  return (
    <div data-testid="kudos-board" className="flex flex-col">
      <KudosBoardProviders
        modalTitle={dict['comingSoon.title']}
        modalCloseLabel={dict['kudos.modal.close']}
        likeErrorMessages={buildLikeErrorMessages(dict)}
        filtersKey={filtersKey(filters)}
      >
        <ActionPillsContainer
          title={dict['kudos.banner.title']}
          logoLabel={dict['kudos.banner.logoLabel']}
          composeLabel={dict['kudos.compose.placeholder']}
          profileSearchLabel={dict['kudos.profileSearch.label']}
        />
        <HighlightBlock searchParams={searchParams} dict={dict} />
        <SpotlightBlock dict={dict} />
        <FeedAndSidebarBlock searchParams={searchParams} dict={dict} />
      </KudosBoardProviders>
    </div>
  )
}
