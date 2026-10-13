'use client'

import { useEffect, useRef, useState } from 'react'
import { signInWithGoogle } from '@/lib/auth/sign-in-with-google'
import { LoginButton } from './_components/login-button'
import { LoginErrorMessage } from './_components/login-error-message'

type Status = 'idle' | 'initiating' | 'error'

type Props = {
  label: string
  loadingLabel: string
  errorText: string
  /** Server-detected `?error=` flag (callback failure); the param's own text is never shown. */
  initialError: boolean
}

export function GoogleLoginContainer({ label, loadingLabel, errorText, initialError }: Props) {
  const [status, setStatus] = useState<Status>('idle')
  const wrapperRef = useRef<HTMLDivElement>(null)

  // Back/forward cache can restore the page frozen in `initiating`; reset it.
  useEffect(() => {
    const onPageShow = (event: PageTransitionEvent) => {
      if (event.persisted) setStatus('idle')
    }
    window.addEventListener('pageshow', onPageShow)
    return () => window.removeEventListener('pageshow', onPageShow)
  }, [])

  const showError = status === 'error' || (status === 'idle' && initialError)

  const handleClick = async () => {
    setStatus('initiating')
    const { ok } = await signInWithGoogle()
    // ok: the browser is navigating to Google; keep the button disabled until then.
    if (ok) return
    setStatus('error')
    wrapperRef.current?.querySelector('button')?.focus()
  }

  return (
    <div ref={wrapperRef} className="flex flex-col items-start gap-3">
      <LoginButton
        label={label}
        loadingLabel={loadingLabel}
        loading={status === 'initiating'}
        disabled={status === 'initiating'}
        onClick={handleClick}
      />
      <LoginErrorMessage message={showError ? errorText : ''} />
    </div>
  )
}
