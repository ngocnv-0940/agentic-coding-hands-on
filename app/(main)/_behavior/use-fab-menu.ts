'use client'

import { useEffect, useEffectEvent, useRef, useState, type RefObject } from 'react'

type FabMenu = {
  open: boolean
  fabRef: RefObject<HTMLButtonElement | null>
  menuRef: RefObject<HTMLDivElement | null>
  toggle: () => void
  /** Closes and puts focus back on the FAB (the red ×, Escape). */
  closeToFab: () => void
  /** Closes without touching focus: the chosen action (or an outside click) decides where focus goes. */
  close: () => void
}

/**
 * Open state of the quick-action group (mm:313:9140). While open, Escape closes it with focus back on the FAB and a press
 * outside the group closes it (focus stays where the user pressed). The FAB itself is hidden while the group shows.
 */
export function useFabMenu(): FabMenu {
  const [open, setOpen] = useState(false)
  const fabRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const restoreFocus = useRef(false)

  const close = () => setOpen(false)
  const closeToFab = () => {
    restoreFocus.current = true
    setOpen(false)
  }
  const onEscape = useEffectEvent((event: KeyboardEvent) => {
    if (event.key !== 'Escape' || event.defaultPrevented) return
    closeToFab()
  })
  const onOutside = useEffectEvent((event: PointerEvent) => {
    if (event.target instanceof Node && !menuRef.current?.contains(event.target)) close()
  })

  useEffect(() => {
    if (!open) {
      if (restoreFocus.current) fabRef.current?.focus()
      restoreFocus.current = false
      return
    }
    // Focus moves into the group so the keyboard user lands on its first action.
    menuRef.current?.querySelector<HTMLElement>('button')?.focus()
    const keydown = (event: KeyboardEvent) => onEscape(event)
    const pointerdown = (event: PointerEvent) => onOutside(event)
    document.addEventListener('keydown', keydown)
    document.addEventListener('pointerdown', pointerdown)
    return () => {
      document.removeEventListener('keydown', keydown)
      document.removeEventListener('pointerdown', pointerdown)
    }
  }, [open])

  return { open, fabRef, menuRef, toggle: () => setOpen((value) => !value), closeToFab, close }
}
