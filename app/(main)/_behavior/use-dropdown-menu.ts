'use client'

import { useCallback, useEffect, useId, useRef, useState, type MouseEventHandler, type RefObject } from 'react'

export type DropdownTriggerProps = {
  ref: RefObject<HTMLButtonElement | null>
  'aria-expanded': boolean
  'aria-controls': string | undefined
  onClick: MouseEventHandler<HTMLButtonElement>
}

export type DropdownMenu = {
  open: boolean
  /** Attach to the element wrapping both trigger and panel: clicks inside it are not "outside". */
  rootRef: RefObject<HTMLDivElement | null>
  triggerProps: DropdownTriggerProps
  panelProps: { id: string }
  close: () => void
}

/**
 * Disclosure behaviour for a header dropdown: click toggles, outside pointerdown closes,
 * Escape closes and returns focus to the trigger. A native <button> already fires click on
 * Enter/Space, so keyboard opening needs no extra handler. Listeners exist only while open.
 */
export function useDropdownMenu(): DropdownMenu {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const panelId = useId()

  const close = useCallback(() => setOpen(false), [])

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

  return {
    open,
    rootRef,
    triggerProps: {
      ref: triggerRef,
      'aria-expanded': open,
      'aria-controls': open ? panelId : undefined,
      onClick: () => setOpen((v) => !v),
    },
    panelProps: { id: panelId },
    close,
  }
}
