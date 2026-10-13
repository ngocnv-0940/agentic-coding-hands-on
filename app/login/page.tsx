import { Suspense } from 'react'
import { getDictionary } from '@/lib/i18n/get-dictionary'
import { getLocale } from '@/lib/i18n/get-locale'
import { LoginScreen } from './_components/login-screen'
import { GoogleLoginContainer } from './google-login-container'
import { LanguageSelectorContainer } from './language-selector-container'

// cacheComponents: true makes cookies() and searchParams request-time reads, so they sit behind a
// <Suspense> boundary (docs: 01-app/01-getting-started/08-caching.md, "Working with runtime APIs").
export default function LoginPage({ searchParams }: PageProps<'/login'>) {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#00101A]" aria-hidden="true" />}>
      <LoginContent searchParams={searchParams} />
    </Suspense>
  )
}

async function LoginContent({ searchParams }: { searchParams: PageProps<'/login'>['searchParams'] }) {
  const [locale, params] = await Promise.all([getLocale(), searchParams])
  const dict = getDictionary(locale)

  // Only the presence of a non-empty `error` matters; its text is never rendered (F001:BR-001).
  const rawError = Array.isArray(params.error) ? params.error[0] : params.error
  const hasError = typeof rawError === 'string' && rawError.length > 0

  return (
    <LoginScreen
      title={dict['login.title']}
      subtitle={dict['login.subtitle']}
      tagline={dict['login.tagline']}
      footerText={dict['login.footer']}
      logoAlt={dict['login.logoAlt']}
      languageSelector={
        <LanguageSelectorContainer
          locale={locale}
          labels={{ vi: dict['language.vi'], en: dict['language.en'], menu: dict['language.menu'] }}
        />
      }
      loginArea={
        <GoogleLoginContainer
          label={dict['login.button']}
          loadingLabel={dict['login.loading']}
          errorText={dict['login.error']}
          initialError={hasError}
        />
      }
    />
  )
}
