import { Suspense } from 'react'
import { connection } from 'next/server'
import { getDictionary } from '@/lib/i18n/get-dictionary'
import { getLocale } from '@/lib/i18n/get-locale'
import { buildHomeScreenProps } from './_wiring/build-home-screen-props'
import { CountdownContainer } from './_wiring/countdown-container'
import { readEventSnapshot } from './_wiring/read-event-snapshot'
import { HomeScreen } from './_components/home-screen'

// cookies() (locale) and the env/clock snapshot are request-time reads under cacheComponents, so they
// sit behind <Suspense> (docs: 01-app/01-getting-started/08-caching.md, "Working with runtime APIs").
export default function HomePage() {
  return (
    <Suspense fallback={<div className="min-h-screen" aria-hidden="true" />}>
      <HomeContent />
    </Suspense>
  )
}

async function HomeContent() {
  // Date.now() below must not run during prerender (docs: 04-functions/connection.md).
  await connection()
  const dict = getDictionary(await getLocale())
  const event = readEventSnapshot()

  const countdown = (
    <CountdownContainer
      targetIso={event.targetIso}
      initial={event.countdown}
      labels={{ days: dict['home.hero.days'], hours: dict['home.hero.hours'], minutes: dict['home.hero.minutes'] }}
      comingSoonText={dict['home.hero.comingSoon']}
    />
  )

  return <HomeScreen {...buildHomeScreenProps({ dict, countdown, eventDate: event.date })} />
}
