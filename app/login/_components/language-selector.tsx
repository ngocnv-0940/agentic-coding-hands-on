'use client'

import Image from 'next/image'
import { useEffect, useId, useRef, useState } from 'react'

export type LanguageLocale = 'vi' | 'en'

export type LanguageSelectorProps = {
  locale: LanguageLocale
  labels: { vi: string; en: string; menu: string }
  onSelect: (locale: LanguageLocale) => void
  pending?: boolean
}

const OPTIONS: { locale: LanguageLocale; flag: string }[] = [
  { locale: 'vi', flag: '/images/login/flag-vn.svg' },
  { locale: 'en', flag: '/images/login/flag-gb.svg' },
]

const CODES: Record<LanguageLocale, string> = { vi: 'VN', en: 'EN' }

export function LanguageSelector({ locale, labels, onSelect, pending = false }: LanguageSelectorProps) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const menuId = useId()
  const current = OPTIONS.find((o) => o.locale === locale) ?? OPTIONS[0]

  useEffect(() => {
    if (!open) return
    const onPointerDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false)
    }
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      setOpen(false)
      triggerRef.current?.focus()
    }
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  const choose = (next: LanguageLocale) => {
    setOpen(false)
    if (next !== locale) onSelect(next)
  }

  return (
    // mm:I662:14391;186:1696
    <div ref={rootRef} className="relative">
      {/* mm:I662:14391;186:1696;186:1821 */}
      <button
        ref={triggerRef}
        type="button"
        data-testid="language-selector-trigger"
        aria-label={labels.menu}
        aria-expanded={open}
        aria-haspopup="true"
        aria-controls={open ? menuId : undefined}
        onClick={() => setOpen((v) => !v)}
        className="flex h-14 cursor-pointer items-center justify-between gap-0.5 rounded px-3 py-4 transition-colors duration-200 hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-white md:px-4"
      >
        {/* mm:I662:14391;186:1696;186:1821;186:1937 */}
        <span className="flex items-center gap-1">
          {/* mm:I662:14391;186:1696;186:1821;186:1709 */}
          <Image src={current.flag} alt="" width={24} height={24} unoptimized />
          {/* mm:I662:14391;186:1696;186:1821;186:1439 */}
          <span className="font-[family-name:var(--font-montserrat)] text-base leading-6 font-bold tracking-[0.15px] text-white">
            {CODES[locale]}
          </span>
        </span>
        {/* mm:I662:14391;186:1696;186:1821;186:1441 */}
        <Image src="/images/login/chevron-down.svg" alt="" width={24} height={24} unoptimized />
      </button>
      {open && (
        <ul
          id={menuId}
          className="absolute top-full right-0 z-40 m-0 mt-1 flex min-w-[140px] list-none flex-col gap-1 rounded-lg border border-[#2E3940] bg-[#0B0F12] p-1"
        >
          {OPTIONS.map(({ locale: value, flag }) => (
            <li key={value}>
              <button
                type="button"
                data-testid={`language-option-${value}`}
                aria-current={value === locale ? 'true' : undefined}
                disabled={pending}
                onClick={() => choose(value)}
                className={`flex w-full cursor-pointer items-center gap-2 rounded px-3 py-3 text-left transition-colors duration-200 hover:bg-white/15 focus-visible:bg-white/15 focus-visible:outline-2 focus-visible:outline-white disabled:cursor-wait ${value === locale ? 'bg-white/10' : ''}`}
              >
                <Image src={flag} alt="" width={24} height={24} unoptimized />
                <span className="font-[family-name:var(--font-montserrat)] text-base leading-6 font-bold text-white">
                  {labels[value]}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
