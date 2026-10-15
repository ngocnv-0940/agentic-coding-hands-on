import { Suspense, type ReactNode } from 'react'
import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { connection } from 'next/server'
import { getCurrentUser } from '@/lib/auth/get-current-user'
import { getDictionary } from '@/lib/i18n/get-dictionary'
import { getLocale } from '@/lib/i18n/get-locale'
import { homeFontClassName } from './_components/home-fonts'
import { FabContainer } from './_wiring/fab-container'
import { SiteFooterContainer } from './_wiring/site-footer-container'
import { SiteHeaderContainer } from './_wiring/site-header-container'

export async function generateMetadata(): Promise<Metadata> {
  return { title: getDictionary(await getLocale())['home.meta.title'] }
}

export default function MainLayout({ children }: { children: ReactNode }) {
  return (
    <div className={`${homeFontClassName} flex min-h-screen flex-col bg-saa-navy text-white`}>
      <Suspense fallback={<div className="min-h-screen" aria-hidden="true" />}>
        <MainShell>{children}</MainShell>
      </Suspense>
    </div>
  )
}

async function MainShell({ children }: { children: ReactNode }) {
  // Auth reads Date.now(); Cache Components rejects that during prerender (docs: connection.md).
  await connection()
  // Backup layer: proxy.ts already answers guests with a real 307. Inside streamed content a
  // redirect() only emits a client-side redirect, which is acceptable for this rare race.
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  const locale = await getLocale()
  const dict = getDictionary(locale)

  return (
    <>
      <SiteHeaderContainer
        locale={locale}
        isAdmin={user.isAdmin}
        logoAlt={dict['home.header.logoAlt']}
        navItems={[
          { key: 'about', href: '/', label: dict['home.nav.about'] },
          { key: 'awards', href: '/awards-information', label: dict['home.nav.awards'] },
          { key: 'kudos', href: '/sun-kudos', label: dict['home.nav.kudos'] },
        ]}
        notificationLabels={{
          trigger: dict['home.header.notifications'],
          title: dict['home.notifications.title'],
          empty: dict['home.notifications.empty'],
        }}
        accountLabels={{
          trigger: dict['home.header.account'],
          profile: dict['home.account.profile'],
          signOut: dict['home.account.signOut'],
          admin: dict['home.account.admin'],
        }}
        languageLabels={{ vi: dict['language.vi'], en: dict['language.en'], menu: dict['language.menu'] }}
      />
      <main className="flex-1">{children}</main>
      <SiteFooterContainer
        logoAlt={dict['home.header.logoAlt']}
        links={[
          { href: '/', label: dict['home.nav.about'] },
          { href: '/awards-information', label: dict['home.nav.awards'] },
          { href: '/sun-kudos', label: dict['home.nav.kudos'] },
          { href: '/standards', label: dict['home.footer.standards'] },
        ]}
        copyright={dict['home.footer.copyright']}
      />
      <FabContainer
        label={dict['home.widget.label']}
        menuLabels={{
          menu: dict['home.widget.label'],
          rules: dict['home.widget.rules'],
          writeKudo: dict['home.widget.writeKudo'],
          close: dict['home.widget.close'],
        }}
        comingSoonTitle={dict['comingSoon.title']}
        comingSoonCloseLabel={dict['kudos.modal.close']}
      />
    </>
  )
}
