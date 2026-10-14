'use client'

import { useCallback, useEffect, useLayoutEffect, useRef, useState, type RefObject } from 'react'

export type FilterDropdown = {
  open: boolean
  /** Attach to an element wrapping the whole `FilterDropdownView` (`className="contents"` keeps layout): clicks inside it are not "outside". */
  rootRef: RefObject<HTMLDivElement | null>
  /** `FilterDropdownView.onToggle` */
  toggle: () => void
  /** `FilterDropdownView.onSelect`: closes the panel, then forwards the value. */
  select: (value: string | null) => void
}

/**
 * Open state of one filter dropdown (B.1.1 / B.1.2). Same behaviour as the header's `useDropdownMenu` (outside
 * pointerdown and Escape close, listeners only while open), but `FilterDropdownView` has no trigger ref to hand
 * out, so the trigger is found inside `rootRef`: Escape returns focus to it. The panel also closes when Activity
 * hides the page (`useLayoutEffect` cleanup, `02-guides/preserving-ui-state.md`) so it is not open on return.
 */
export function useFilterDropdown(onSelect: (value: string | null) => void): FilterDropdown {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => () => setOpen(false), [])

  useEffect(() => {
    if (!open) return
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false)
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      setOpen(false)
      rootRef.current?.querySelector<HTMLButtonElement>('button[aria-haspopup]')?.focus()
    }
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  const toggle = useCallback(() => setOpen((value) => !value), [])
  const select = useCallback(
    (value: string | null) => {
      setOpen(false)
      onSelect(value)
    },
    [onSelect],
  )

  return { open, rootRef, toggle, select }
}
