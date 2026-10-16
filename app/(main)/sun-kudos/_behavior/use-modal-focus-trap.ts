'use client'

import { useEffect, useEffectEvent, useRef, type RefObject } from 'react'

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]):not([hidden]), select:not([disabled]), textarea:not([disabled]), [contenteditable="true"], [tabindex]:not([tabindex="-1"])'

type Options = {
  open: boolean
  /** The `WriteKudoModalView.dialogRef` element. */
  dialogRef: RefObject<HTMLElement | null>
  /** The recipient input (`RecipientPicker.inputRef`): first focus on open (FR-225). */
  initialFocusRef: RefObject<HTMLElement | null>
  /** The compose pill, where focus returns on close (FR-104). Without it, whatever had focus at open time. */
  opener?: HTMLElement | null
  /** Closes and discards (Hủy and Esc, FR-224). */
  onEscape: () => void
  /** A send is under way: Escape is ignored. */
  submitting: boolean
  /** Some nested layer is open (mention list, link dialog, hashtag panel, recipient list): Escape belongs to it. */
  layerOpen: boolean
}

/** Focusable, visible elements of `root` in DOM order. */
function tabbables(root: HTMLElement): HTMLElement[] {
  return Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE)).filter((el) => !el.closest('[hidden], [inert]') && el.getClientRects().length > 0)
}

/**
 * Focus and Escape rules of the Viết Kudo modal. On open the recipient input takes focus; Tab and Shift+Tab cycle inside the
 * modal (inside the link dialog while that nested dialog is open; focus that strayed out, e.g. after a click on the mask,
 * is pulled back in); on close focus returns to the opener. Escape closes the modal only when nothing else wants it: not
 * when an inner layer already handled it (`event.defaultPrevented`: the layers call `preventDefault`, and ProseMirror
 * does for a handled mention key), not while a layer is open and not while submitting.
 */
export function useModalFocusTrap({ open, dialogRef, initialFocusRef, opener, onEscape, submitting, layerOpen }: Options): void {
  const handleKeyDown = useEffectEvent((event: KeyboardEvent) => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (event.key === 'Escape') {
      if (!event.defaultPrevented && !submitting && !layerOpen) onEscape()
      return
    }
    if (event.key !== 'Tab') return
    const scope = dialog.querySelector<HTMLElement>('[role="dialog"]') ?? dialog
    const items = tabbables(scope)
    if (items.length === 0) {
      event.preventDefault()
      scope.focus()
      return
    }
    const first = items[0]
    const last = items[items.length - 1]
    const current = document.activeElement
    if (!scope.contains(current)) {
      event.preventDefault()
      ;(event.shiftKey ? last : first).focus()
    } else if (event.shiftKey && (current === first || current === scope)) {
      event.preventDefault()
      last.focus()
    } else if (!event.shiftKey && current === last) {
      event.preventDefault()
      first.focus()
    }
  })

  // Focus goes back to the opener one task after cleanup, so an effect re-run while the modal stays open (StrictMode's
  // dev re-mount, a dependency change) cancels it: an immediate restore would blur the recipient input on open and
  // mark it touched, showing its error before the user did anything (DEC-002).
  const pendingRestore = useRef<ReturnType<typeof setTimeout> | null>(null)
  const restoreTarget = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (!open) return
    const reRun = pendingRestore.current !== null
    if (reRun) clearTimeout(pendingRestore.current!)
    pendingRestore.current = null
    if (!reRun) {
      restoreTarget.current = document.activeElement instanceof HTMLElement ? document.activeElement : null
      ;(initialFocusRef.current ?? dialogRef.current)?.focus()
    }
    const onKeyDown = (event: KeyboardEvent) => handleKeyDown(event)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      const previous = opener ?? restoreTarget.current
      pendingRestore.current = setTimeout(() => {
        pendingRestore.current = null
        if (previous?.isConnected) previous.focus()
      })
    }
  }, [open, opener, dialogRef, initialFocusRef])
}
