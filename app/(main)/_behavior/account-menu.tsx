'use client'

import Link from 'next/link'
import { useState, type ReactNode } from 'react'
import { PANEL_CLASS, PANEL_ITEM_CLASS } from './dropdown-panel-styles'
import { useDropdownMenu, type DropdownTriggerProps } from './use-dropdown-menu'

export type AccountMenuProps = {
  /** From the server (`getCurrentUser`) only: hiding the entry is cosmetic, proxy + page are the gate. */
  isAdmin: boolean
  labels: { trigger: string; profile: string; signOut: string; admin: string }
  renderTrigger: (props: DropdownTriggerProps & { label: string; 'data-testid': string }) => ReactNode
}

export function AccountMenu({ isAdmin, labels, renderTrigger }: AccountMenuProps) {
  const { open, rootRef, triggerProps, panelProps, close } = useDropdownMenu()
  const [signingOut, setSigningOut] = useState(false)

  return (
    <div ref={rootRef} className="relative">
      {renderTrigger({ ...triggerProps, label: labels.trigger, 'data-testid': 'account-trigger' })}
      {open && (
        <div {...panelProps} data-testid="account-menu" className={PANEL_CLASS}>
          <Link href="/profile" data-testid="account-menu-profile" onClick={close} className={PANEL_ITEM_CLASS}>
            {labels.profile}
          </Link>
          {isAdmin && (
            <Link href="/admin" data-testid="account-menu-admin" onClick={close} className={PANEL_ITEM_CLASS}>
              {labels.admin}
            </Link>
          )}
          {/* Native POST (full navigation): no client router state survives sign out. */}
          <form action="/auth/logout" method="post">
            <button
              type="submit"
              data-testid="account-menu-signout"
              disabled={signingOut}
              // Deferred: disabling synchronously in the click handler would cancel the submit.
              onClick={() => setTimeout(() => setSigningOut(true), 0)}
              className={PANEL_ITEM_CLASS}
            >
              {labels.signOut}
            </button>
          </form>
        </div>
      )}
    </div>
  )
}
