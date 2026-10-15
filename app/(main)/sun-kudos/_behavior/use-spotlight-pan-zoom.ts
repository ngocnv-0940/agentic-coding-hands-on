'use client'

import { useCallback, useMemo, useRef, useState, type CSSProperties, type HTMLAttributes, type PointerEvent, type RefCallback } from 'react'
import { IDENTITY_VIEW, panBy, viewTransform, zoomAt, type CanvasSize, type PanZoomView } from './spotlight-pan-zoom-math'

/** A drag longer than this (px) is a drag, not a click on a node (A9). */
const DRAG_THRESHOLD = 4
/** Controls inside the drag surface keep their own clicks, typing and focus. */
const OWN_POINTER = 'button, input, label, select, textarea'

/**
 * `SpotlightBoardViewProps.canvasHandlers`, plus a `ref`. The wheel listener must be non-passive to call
 * `preventDefault` (React's `onWheel` is passive), so it is attached through this ref. Spread it unchanged on
 * the drag surface; `ref` travels with the spread (React 19 treats `ref` as an ordinary prop).
 */
export type SpotlightCanvasHandlers = HTMLAttributes<HTMLDivElement> & { ref: RefCallback<HTMLDivElement> }

export type SpotlightPanZoom = {
  panZoomOn: boolean
  /** `SpotlightBoardViewProps.onTogglePanZoom` */
  toggle: () => void
  /** `SpotlightBoardViewProps.canvasStyle`: the transform of the pan/zoom layer. */
  canvasStyle: CSSProperties
  canvasHandlers: SpotlightCanvasHandlers
}

type Drag = { pointerId: number; lastX: number; lastY: number; startX: number; startY: number; moved: boolean }

/**
 * Spotlight pan/zoom (A9, SM-002, ALG-006). Off by default; while off the canvas does not move and the wheel
 * is left alone so the page scrolls. While on: pointer drag translates, the wheel zooms around the pointer
 * (scale 0.5 to 3, translation clamped so the canvas stays partly in frame). A drag past 4 px swallows the click
 * that ends it, so releasing on a node does not open that kudo. Turning the mode off keeps the current view.
 */
export function useSpotlightPanZoom(): SpotlightPanZoom {
  const [panZoomOn, setPanZoomOn] = useState(false)
  const [view, setView] = useState<PanZoomView>(IDENTITY_VIEW)
  // Handlers run outside render and must see the latest values, so the sources of truth are refs.
  const modeRef = useRef(false)
  const viewRef = useRef<PanZoomView>(IDENTITY_VIEW)
  const elementRef = useRef<HTMLDivElement | null>(null)
  const dragRef = useRef<Drag | null>(null)
  const swallowClickRef = useRef(false)

  const commit = useCallback((next: PanZoomView) => {
    viewRef.current = next
    setView(next)
  }, [])

  const toggle = useCallback(() => {
    modeRef.current = !modeRef.current
    dragRef.current = null
    setPanZoomOn(modeRef.current)
  }, [])

  const sizeOf = useCallback((): CanvasSize | null => {
    const rect = elementRef.current?.getBoundingClientRect()
    return rect && rect.width > 0 && rect.height > 0 ? { width: rect.width, height: rect.height } : null
  }, [])

  const attachCanvas = useCallback<RefCallback<HTMLDivElement>>(
    (node) => {
      elementRef.current = node
      if (node === null) return
      const onWheel = (event: WheelEvent) => {
        if (!modeRef.current) return
        const rect = node.getBoundingClientRect()
        if (rect.width <= 0 || rect.height <= 0) return
        event.preventDefault()
        commit(zoomAt(viewRef.current, event.deltaY, event.clientX - rect.left, event.clientY - rect.top, { width: rect.width, height: rect.height }))
      }
      node.addEventListener('wheel', onWheel, { passive: false })
      return () => {
        node.removeEventListener('wheel', onWheel)
        if (elementRef.current === node) elementRef.current = null
      }
    },
    [commit],
  )

  const handlers = useMemo<HTMLAttributes<HTMLDivElement>>(() => {
    const endDrag = (event: PointerEvent<HTMLDivElement>) => {
      const drag = dragRef.current
      if (drag === null || drag.pointerId !== event.pointerId) return
      dragRef.current = null
      if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId)
    }
    return {
      onPointerDown: (event) => {
        swallowClickRef.current = false
        if (!modeRef.current || event.button !== 0 || (event.target as Element).closest(OWN_POINTER)) return
        dragRef.current = { pointerId: event.pointerId, lastX: event.clientX, lastY: event.clientY, startX: event.clientX, startY: event.clientY, moved: false }
      },
      onPointerMove: (event) => {
        const drag = dragRef.current
        if (drag === null || drag.pointerId !== event.pointerId) return
        if (!drag.moved) {
          if (Math.hypot(event.clientX - drag.startX, event.clientY - drag.startY) <= DRAG_THRESHOLD) return
          drag.moved = true
          swallowClickRef.current = true
          // From here the gesture belongs to the canvas, even when the pointer leaves it.
          try {
            event.currentTarget.setPointerCapture(event.pointerId)
          } catch {
            // The pointer is already gone; the drag simply ends on the next pointerup/cancel.
          }
        }
        const size = sizeOf()
        if (size !== null) commit(panBy(viewRef.current, event.clientX - drag.lastX, event.clientY - drag.lastY, size))
        drag.lastX = event.clientX
        drag.lastY = event.clientY
      },
      onPointerUp: endDrag,
      onPointerCancel: endDrag,
      onClickCapture: (event) => {
        if (!swallowClickRef.current) return
        swallowClickRef.current = false
        event.preventDefault()
        event.stopPropagation()
      },
    }
  }, [commit, sizeOf])

  const canvasHandlers = useMemo<SpotlightCanvasHandlers>(() => ({ ...handlers, ref: attachCanvas }), [handlers, attachCanvas])
  const canvasStyle = useMemo<CSSProperties>(() => ({ transform: viewTransform(view) }), [view])

  return { panZoomOn, toggle, canvasStyle, canvasHandlers }
}
