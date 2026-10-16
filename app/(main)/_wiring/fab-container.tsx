'use client'

import { useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { ComingSoonModalView } from '../sun-kudos/_components/coming-soon-modal-view'
import { requestCompose } from '../_behavior/compose-bridge'
import { useFabMenu } from '../_behavior/use-fab-menu'
import { FAB_MENU_ID, FabMenuView, type FabMenuLabels } from '../_components/fab-menu-view'
import { WidgetButton } from '../_components/widget-button'

type FabContainerProps = {
  label: string
  menuLabels: FabMenuLabels
  comingSoonTitle: string
  comingSoonCloseLabel: string
}

/** Where "Viết KUDOS" goes from any page but the board; the board opens the modal once and drops the param. */
export const COMPOSE_HREF = '/sun-kudos?compose=1'

/**
 * Floating action button of every main page. Opens the quick-action group (mm:313:9139); "Thể lệ" shows the Coming soon
 * modal (the rules page is not built yet) and "Viết KUDOS" opens the Viết Kudo modal, directly when the board is on screen
 * or after a hop to `/sun-kudos?compose=1`. Focus returns to the FAB when either modal or the group closes.
 */
export function FabContainer({ label, menuLabels, comingSoonTitle, comingSoonCloseLabel }: FabContainerProps) {
  const router = useRouter()
  const pathname = usePathname()
  const menu = useFabMenu()
  // The page the Coming soon modal was opened on; null = closed. Leaving that page (link, Back/Forward) closes it for good.
  const [rulesPath, setRulesPath] = useState<string | null>(null)
  if (rulesPath !== null && rulesPath !== pathname) setRulesPath(null)
  const showRules = rulesPath !== null

  const onRules = () => {
    menu.close()
    setRulesPath(pathname)
  }
  const onWriteKudo = () => {
    menu.close()
    if (!requestCompose(menu.fabRef.current)) router.push(COMPOSE_HREF)
  }
  const closeRules = () => {
    setRulesPath(null)
    menu.fabRef.current?.focus()
  }

  return (
    <>
      <WidgetButton label={label} onClick={menu.toggle} buttonRef={menu.fabRef} expanded={menu.open} controlsId={FAB_MENU_ID} />
      {menu.open ? (
        <FabMenuView labels={menuLabels} menuRef={menu.menuRef} onRules={onRules} onWriteKudo={onWriteKudo} onClose={menu.closeToFab} />
      ) : null}
      <ComingSoonModalView open={showRules} title={comingSoonTitle} closeLabel={comingSoonCloseLabel} onClose={closeRules} />
    </>
  )
}
