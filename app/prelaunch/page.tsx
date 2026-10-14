import type { Metadata } from 'next'
import { Suspense } from 'react'
import { connection } from 'next/server'
import { getDictionary } from '@/lib/i18n/get-dictionary'
import { getLocale } from '@/lib/i18n/get-locale'
import { readSiteLaunchFromEnv } from '@/lib/event/event-start-config'
import { readEventSnapshot } from '../(main)/_wiring/read-event-snapshot'
import { PrelaunchScreen } from './_components/prelaunch-screen'
import { PrelaunchCountdownContainer } from './_wiring/prelaunch-countdown-container'

// Same mechanism as the root layout's generateMetadata (locale cookie, request-time); the root
// layout opts out of static-shell validation with `instant = false`.
export async function generateMetadata(): Promise<Metadata> {
  return { title: getDictionary(await getLocale())['prelaunch.metaTitle'] }
}

// cookies() (locale) and the env/clock snapshot are request-time reads under cacheComponents, so they
// sit behind <Suspense> (docs: 01-app/01-getting-started/08-caching.md, "Working with runtime APIs").
export default function PrelaunchPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#00101A]" aria-hidden="true" />}>
      <PrelaunchContent />
    </Suspense>
  )
}

/** Plain helper (not a component) so the clock read stays request-time, after connection(). */
function msUntil(targetIso: string | null): number {
  return targetIso ? Date.parse(targetIso) - Date.now() : 0
}

async function PrelaunchContent() {
  // Date.now() below must not run during prerender (docs: 04-functions/connection.md).
  await connection()
  const dict = getDictionary(await getLocale())
  const event = readEventSnapshot(readSiteLaunchFromEnv())
  const remainingMs = msUntil(event.targetIso)

  return (
    <PrelaunchScreen
      title={dict['prelaunch.title']}
      countdown={
        <PrelaunchCountdownContainer
          targetIso={event.targetIso}
          initial={event.countdown}
          remainingMs={remainingMs}
          labels={{ days: dict['home.hero.days'], hours: dict['home.hero.hours'], minutes: dict['home.hero.minutes'] }}
        />
      }
    />
  )
}
