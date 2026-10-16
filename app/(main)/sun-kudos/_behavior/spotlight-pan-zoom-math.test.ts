import { describe, expect, test } from 'bun:test'
import { IDENTITY_VIEW, MAX_SCALE, MIN_SCALE, clampView, panBy, viewTransform, zoomAt } from './spotlight-pan-zoom-math'

const SIZE = { width: 800, height: 400 }

describe('clampView', () => {
  test('leaves a view inside the bounds unchanged', () => {
    expect(clampView({ tx: 100, ty: -50, scale: 1 }, SIZE)).toEqual({ tx: 100, ty: -50, scale: 1 })
  })

  test('keeps at least a quarter of the canvas visible on each axis', () => {
    // scale 1, width 800: tx in [200 - 800, 800 - 200] = [-600, 600]
    expect(clampView({ tx: 5000, ty: 5000, scale: 1 }, SIZE)).toEqual({ tx: 600, ty: 300, scale: 1 })
    expect(clampView({ tx: -5000, ty: -5000, scale: 1 }, SIZE)).toEqual({ tx: -600, ty: -300, scale: 1 })
  })

  test('the lower bound grows with the zoom factor', () => {
    expect(clampView({ tx: -5000, ty: 0, scale: 2 }, SIZE).tx).toBe(200 - 1600)
  })
})

describe('panBy', () => {
  test('moves by the drag delta', () => {
    expect(panBy(IDENTITY_VIEW, 30, -20, SIZE)).toEqual({ tx: 30, ty: -20, scale: 1 })
  })

  test('cannot drag the canvas out of the frame', () => {
    expect(panBy(IDENTITY_VIEW, 10_000, 10_000, SIZE)).toEqual({ tx: 600, ty: 300, scale: 1 })
  })
})

describe('zoomAt (ALG-006)', () => {
  test('wheel up zooms in by 10 percent, wheel down zooms out', () => {
    expect(zoomAt(IDENTITY_VIEW, -1, 0, 0, SIZE).scale).toBeCloseTo(1.1)
    expect(zoomAt(IDENTITY_VIEW, 1, 0, 0, SIZE).scale).toBeCloseTo(1 / 1.1)
  })

  test('the point under the pointer stays put', () => {
    const before = { tx: 40, ty: 20, scale: 1.5 }
    const [px, py] = [300, 150]
    const after = zoomAt(before, -1, px, py, SIZE)
    const contentX = (px - before.tx) / before.scale
    const contentY = (py - before.ty) / before.scale
    expect(after.tx + contentX * after.scale).toBeCloseTo(px)
    expect(after.ty + contentY * after.scale).toBeCloseTo(py)
  })

  test('scale is clamped to the min and max', () => {
    let view = IDENTITY_VIEW
    for (let i = 0; i < 50; i += 1) view = zoomAt(view, -1, 400, 200, SIZE)
    expect(view.scale).toBe(MAX_SCALE)
    for (let i = 0; i < 50; i += 1) view = zoomAt(view, 1, 400, 200, SIZE)
    expect(view.scale).toBe(MIN_SCALE)
  })
})

describe('viewTransform', () => {
  test('renders a CSS transform', () => {
    expect(viewTransform({ tx: 12, ty: -3, scale: 1.5 })).toBe('translate(12px, -3px) scale(1.5)')
  })
})
