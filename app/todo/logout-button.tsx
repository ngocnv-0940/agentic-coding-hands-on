'use client'

import { useState } from 'react'

// Native form POST (full navigation). Disabled right after the click so it cannot be submitted twice (SCR002 E02).
export function LogoutButton({ label }: { label: string }) {
  const [pending, setPending] = useState(false)

  return (
    <button
      type="submit"
      // Deferred: disabling synchronously in the click handler would cancel the submit.
      onClick={() => setTimeout(() => setPending(true), 0)}
      disabled={pending}
      className="cursor-pointer rounded-lg bg-[#FFEA9E] px-5 py-2.5 text-base font-bold text-[#00101A] transition-shadow duration-200 hover:shadow-[0_4px_20px_rgba(255,234,158,0.55)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:shadow-none"
    >
      {label}
    </button>
  )
}
