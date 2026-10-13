'use client'

import { useTransition } from 'react'
import { setLocale } from '@/lib/i18n/set-locale-action'
import { LanguageSelector, type LanguageSelectorProps } from './_components/language-selector'

type Props = Pick<LanguageSelectorProps, 'locale' | 'labels'>

/** Wires the presentational selector to the setLocale server action (cookie write + refresh). */
export function LanguageSelectorContainer({ locale, labels }: Props) {
  const [pending, startTransition] = useTransition()

  return (
    <LanguageSelector
      locale={locale}
      labels={labels}
      pending={pending}
      onSelect={(next) => startTransition(() => setLocale(next))}
    />
  )
}
