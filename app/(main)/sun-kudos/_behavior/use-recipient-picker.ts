'use client'

import { useEffect, useRef, useState, type KeyboardEvent, type RefObject } from 'react'
import type { SunnerOption } from '@/lib/kudos/kudo-write-types'
import { sunnerOptionId } from '../_components/sunner-option-list-view'
import { useEscapeLayer } from './use-escape-layer'
import { useSunnerSearch, type SunnerSearchStatus } from './use-sunner-search'

export type RecipientPicker = {
  /** `RecipientPickerView`: `query`, `onQueryChange`, `onFocus`, `onBlur`, `onKeyDown`, `open`, `onClear`, `inputRef`, `activeOptionId`. */
  query: string
  onQueryChange: (value: string) => void
  onFocus: () => void
  onBlur: () => void
  onKeyDown: (event: KeyboardEvent<HTMLInputElement>) => void
  open: boolean
  onClear: () => void
  inputRef: RefObject<HTMLInputElement | null>
  activeOptionId: string | undefined
  /** `SunnerOptionListView`: `options`, `status`, `activeIndex`, `onPick`. */
  options: SunnerOption[]
  status: SunnerSearchStatus
  activeIndex: number
  onPick: (id: string) => void
}

type Options = {
  /** The chosen recipient, owned by `useWriteKudoForm`. */
  selected: SunnerOption | null
  onSelect: (option: SunnerOption | null) => void
  /** The field was left (`useWriteKudoForm().touch('recipient')`). */
  onTouch: () => void
}

/**
 * Người nhận field (A3, A4). The list is open while the input is focused, has text and a search is under way or answered;
 * blur (including a click outside) and Escape close it (Escape through `useEscapeLayer`, so the modal stays open).
 * Arrow keys move the highlight, Enter picks it. Picking fills the field and closes the list; clearing brings the input
 * back, searches again from empty and puts focus in it (FR-308). The search is idle while a recipient is selected.
 */
export function useRecipientPicker({ selected, onSelect, onTouch }: Options): RecipientPicker {
  const [query, setQuery] = useState('')
  const [listOpen, setListOpen] = useState(false)
  const [highlight, setHighlight] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const refocus = useRef(false)
  const { status, options } = useSunnerSearch(selected ? '' : query)

  const open = listOpen && status !== 'idle'
  const activeIndex = Math.min(highlight, Math.max(options.length - 1, 0))

  useEscapeLayer(open, () => setListOpen(false))

  // The input is `hidden` while a recipient is selected, so focus can only return once it is shown again.
  useEffect(() => {
    if (selected === null && refocus.current) {
      refocus.current = false
      inputRef.current?.focus()
    }
  }, [selected])

  const onPick = (id: string) => {
    const option = options.find((row) => row.id === id)
    if (!option) return
    onSelect(option)
    setQuery('')
    setListOpen(false)
  }

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (!open || status !== 'ready') return
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault()
      setHighlight((activeIndex + (event.key === 'ArrowDown' ? 1 : options.length - 1)) % options.length)
    } else if (event.key === 'Enter') {
      event.preventDefault()
      onPick(options[activeIndex].id)
    }
  }

  return {
    query,
    onQueryChange: (value) => {
      setQuery(value)
      setHighlight(0)
      setListOpen(true)
    },
    onFocus: () => setListOpen(true),
    onBlur: () => {
      setListOpen(false)
      onTouch()
    },
    onKeyDown,
    open,
    onClear: () => {
      refocus.current = true
      setQuery('')
      setHighlight(0)
      onSelect(null)
    },
    inputRef,
    activeOptionId: open && status === 'ready' ? sunnerOptionId(activeIndex) : undefined,
    options,
    status,
    activeIndex,
    onPick,
  }
}
