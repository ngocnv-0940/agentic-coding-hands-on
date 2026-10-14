/** Pure geometry of the Spotlight canvas (ALG-006). `tx`/`ty` are the translation in px, `scale` the zoom factor. */
export type PanZoomView = { tx: number; ty: number; scale: number }
export type CanvasSize = { width: number; height: number }

export const IDENTITY_VIEW: PanZoomView = { tx: 0, ty: 0, scale: 1 }
export const MIN_SCALE = 0.5
export const MAX_SCALE = 3
/** One wheel notch zooms by 10 percent. */
const ZOOM_STEP = 1.1
/** At least this fraction of the canvas edge stays inside the frame, so the content cannot be dragged away. */
const KEEP_VISIBLE = 0.25

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max)

/** One axis: content spans `[t, t + size * scale]`; keep `KEEP_VISIBLE * size` of it overlapping `[0, size]`. */
function clampAxis(t: number, size: number, scale: number): number {
  const keep = size * KEEP_VISIBLE
  return clamp(t, keep - size * scale, size - keep)
}

/** Keeps the canvas partly visible. */
export function clampView(view: PanZoomView, size: CanvasSize): PanZoomView {
  return { ...view, tx: clampAxis(view.tx, size.width, view.scale), ty: clampAxis(view.ty, size.height, view.scale) }
}

/** Drag by `(dx, dy)` px. */
export function panBy(view: PanZoomView, dx: number, dy: number, size: CanvasSize): PanZoomView {
  return clampView({ ...view, tx: view.tx + dx, ty: view.ty + dy }, size)
}

/** One wheel step (`deltaY < 0` zooms in) around the pointer at `(px, py)` px inside the canvas: that point stays put. */
export function zoomAt(view: PanZoomView, deltaY: number, px: number, py: number, size: CanvasSize): PanZoomView {
  const scale = clamp(view.scale * (deltaY < 0 ? ZOOM_STEP : 1 / ZOOM_STEP), MIN_SCALE, MAX_SCALE)
  const ratio = scale / view.scale
  return clampView({ scale, tx: px - (px - view.tx) * ratio, ty: py - (py - view.ty) * ratio }, size)
}

export const viewTransform = ({ tx, ty, scale }: PanZoomView): string => `translate(${tx}px, ${ty}px) scale(${scale})`
