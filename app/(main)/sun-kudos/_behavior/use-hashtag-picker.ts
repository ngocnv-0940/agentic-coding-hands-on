'use client'

import { useEffect, useLayoutEffect, useRef, useState, type RefObject } from 'react'
import { HASHTAGS_MAX } from '@/lib/kudos/kudo-write-rules'
import type { HashtagOptionView } from '../_components/write-kudo-view-types'
import { useEscapeLayer } from './use-escape-layer'

export type HashtagPicker = {
  /** Wrap `HashtagPickerView` in an element with this ref and `className="contents"`: a press inside is not "outside". */
  rootRef: RefObject<HTMLDivElement | null>
  /** `HashtagPickerView.options`: every available tag with its picked / disabled state. */
  options: HashtagOptionView[]
  open: boolean
  onToggleOpen: () => void
  onToggle: (slug: string) => void
  onRemove: (slug: string) => void
  atLimit: boolean
  /** Picked slugs in pick order; feeds the required rule and the `create_kudo` payload. */
  selected: string[]
  /** The panel was opened and closed at least once (DEC-002): the empty-hashtag error may now show. */
  touched: boolean
}

/**
 * Hashtag field (A8). The panel stays open across picks; an outside press or Escape closes it (Escape closes only this
 * panel and returns focus to "+ Hashtag"). A tag can be picked up to five times; at the cap the unpicked rows are disabled and
 * `toggle` ignores them, so the limit holds even if a disabled row is somehow triggered. Free text is not possible: only
 * `available` tags exist. The panel also closes when Activity hides the page, so it is not open on return.
 */
export function useHashtagPicker(available: readonly { slug: string; label: string }[]): HashtagPicker {
  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState<string[]>([])
  const [touched, setTouched] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  const close = () => {
    setOpen(false)
    setTouched(true)
  }

  useLayoutEffect(() => () => setOpen(false), [])

  useEscapeLayer(open, () => {
    close()
    rootRef.current?.querySelector<HTMLButtonElement>('button[aria-haspopup]')?.focus()
  })

  useEffect(() => {
    if (!open) return
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false)
        setTouched(true)
      }
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [open])

  const atLimit = selected.length >= HASHTAGS_MAX

  return {
    rootRef,
    options: available.map(({ slug, label }) => {
      const picked = selected.includes(slug)
      return { slug, label, selected: picked, disabled: atLimit && !picked }
    }),
    open,
    onToggleOpen: () => (open ? close() : setOpen(true)),
    onToggle: (slug) =>
      setSelected((current) => {
        if (current.includes(slug)) return current.filter((item) => item !== slug)
        return current.length >= HASHTAGS_MAX || !available.some((tag) => tag.slug === slug) ? current : [...current, slug]
      }),
    onRemove: (slug) => setSelected((current) => current.filter((item) => item !== slug)),
    atLimit,
    selected,
    touched,
  }
}
