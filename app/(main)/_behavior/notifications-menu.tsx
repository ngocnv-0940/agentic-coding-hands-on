'use client'

import type { ReactNode } from 'react'
import { PANEL_CLASS } from './dropdown-panel-styles'
import { useDropdownMenu, type DropdownTriggerProps } from './use-dropdown-menu'

export type NotificationsMenuProps = {
  labels: { trigger: string; title: string; empty: string }
  renderTrigger: (props: DropdownTriggerProps & { label: string; 'data-testid': string }) => ReactNode
}

/** Empty-state panel only: no notification data source yet (clarification D009), hence no badge. */
export function NotificationsMenu({ labels, renderTrigger }: NotificationsMenuProps) {
  const { open, rootRef, triggerProps, panelProps } = useDropdownMenu()

  return (
    <div ref={rootRef} className="relative">
      {renderTrigger({ ...triggerProps, label: labels.trigger, 'data-testid': 'notifications-trigger' })}
      {open && (
        <section {...panelProps} aria-label={labels.title} data-testid="notifications-panel" className={`${PANEL_CLASS} min-w-[260px] gap-2 p-4`}>
          <h2 className="font-[family-name:var(--font-montserrat)] text-base leading-6 font-bold text-white">{labels.title}</h2>
          <p className="font-[family-name:var(--font-montserrat)] text-sm leading-5 text-white/70">{labels.empty}</p>
        </section>
      )}
    </div>
  )
}
