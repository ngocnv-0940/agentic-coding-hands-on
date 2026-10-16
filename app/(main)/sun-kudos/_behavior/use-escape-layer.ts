'use client'

import { useEffect, useEffectEvent } from 'react'

/** Open layers, oldest first. Only the last one answers Escape, so nested layers close one at a time. */
const openLayers: object[] = []

/**
 * Registers a transient layer (hashtag panel, recipient list, link dialog) while `open` is true. Escape closes only the
 * topmost layer: it runs in the capture phase, calls `preventDefault()` and so tells the modal's own Escape handler
 * (`useModalFocusTrap`, which skips defaultPrevented events) to leave the modal open. Works wherever focus sits.
 */
export function useEscapeLayer(open: boolean, onEscape: () => void): void {
  const close = useEffectEvent(onEscape)

  useEffect(() => {
    if (!open) return
    const layer = {}
    openLayers.push(layer)
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape' || event.defaultPrevented || openLayers[openLayers.length - 1] !== layer) return
      event.preventDefault()
      close()
    }
    document.addEventListener('keydown', onKeyDown, true)
    return () => {
      document.removeEventListener('keydown', onKeyDown, true)
      openLayers.splice(openLayers.indexOf(layer), 1)
    }
  }, [open])
}
