import { Suspense } from 'react'
import { connection } from 'next/server'
import { AWARD_DETAILS } from '@/lib/awards/award-details'
import { getDictionary } from '@/lib/i18n/get-dictionary'
import { getLocale } from '@/lib/i18n/get-locale'
import { AwardsInformationScreen } from '../_components/awards-information/awards-information-screen'
import { AwardsCategoryMenuContainer } from '../_wiring/awards-category-menu-container'
import { buildAwardsInformationProps } from '../_wiring/build-awards-information-props'

// The locale cookie is a request-time read under cacheComponents, so it sits behind <Suspense>
// (docs: 01-app/01-getting-started/08-caching.md, "Working with runtime APIs").
export default function AwardsInformationPage() {
  return (
    <Suspense fallback={<div className="min-h-screen" aria-hidden="true" />}>
      <AwardsInformationContent />
    </Suspense>
  )
}

async function AwardsInformationContent() {
  // Mirrors the (main) layout: keeps the request-time read explicit (docs: 04-functions/connection.md).
  await connection()
  const dict = getDictionary(await getLocale())

  const menu = (
    <AwardsCategoryMenuContainer
      ariaLabel={dict['home.awards.title']}
      items={AWARD_DETAILS.map(({ slug, menuLabelKey }) => ({ slug, label: dict[menuLabelKey] }))}
    />
  )

  return <AwardsInformationScreen {...buildAwardsInformationProps({ dict, menu })} />
}
