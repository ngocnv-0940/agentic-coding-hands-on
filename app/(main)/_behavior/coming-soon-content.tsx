import { Suspense } from 'react'
import { getDictionary } from '@/lib/i18n/get-dictionary'
import { getLocale } from '@/lib/i18n/get-locale'

export function ComingSoonContent({ title }: { title: string }) {
  return (
    <section data-testid="coming-soon" className="flex min-h-[50vh] items-center justify-center px-4 py-24 text-center">
      <h1 className="font-[family-name:var(--font-montserrat)] text-3xl leading-10 font-bold text-white md:text-5xl md:leading-[56px]">
        {title}
      </h1>
    </section>
  )
}

async function LocalizedComingSoon() {
  // cookies() is a request-time API under cacheComponents, so it sits behind <Suspense>.
  const dict = getDictionary(await getLocale())
  return <ComingSoonContent title={dict['comingSoon.title']} />
}

/** Body of a placeholder route; header/footer come from the shared (main) layout. */
export function ComingSoonPage() {
  return (
    <Suspense fallback={<div className="min-h-[50vh]" aria-hidden="true" />}>
      <LocalizedComingSoon />
    </Suspense>
  )
}
