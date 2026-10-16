'use client'

import { useEffect, useMemo, useRef, useState, type RefObject } from 'react'
import type { SuggestionProps } from '@tiptap/suggestion'
import type { SunnerOption } from '@/lib/kudos/kudo-write-types'
import type { MentionSuggestionConfig } from './kudo-editor-extensions'
import { useSunnerSearch, type SunnerSearchStatus } from './use-sunner-search'

type MentionAttrs = { id: string; label: string }
type Position = { top: number; left: number }
type Session = { query: string; command: (attrs: MentionAttrs) => void; position: Position | null }

export type MentionSuggestion = {
  /** Pass to `useKudoEditor({ suggestion })`; stable for the whole life of the component. */
  suggestion: MentionSuggestionConfig
  /** The list is visible: `@` followed by text with a search under way or answered. */
  open: boolean
  status: SunnerSearchStatus
  options: SunnerOption[]
  activeIndex: number
  /** `SunnerOptionListView.position`: where the "@" caret sits, relative to `anchorRef` (or the viewport without one). */
  position: Position | undefined
  /** `SunnerOptionListView.onPick`: inserts the mention node for that option. */
  pick: (id: string) => void
}

const LIST_WIDTH = 318
const LIST_HEIGHT = 340
const EDGE = 8

/** Caret rect (viewport) -> `absolute` top/left of the list, kept inside the viewport, relative to the positioned `anchor`. */
function listPosition(rect: DOMRect, anchor: HTMLElement | null): Position {
  const top = Math.max(EDGE, Math.min(rect.bottom + 4, window.innerHeight - LIST_HEIGHT))
  const left = Math.max(EDGE, Math.min(rect.left, window.innerWidth - LIST_WIDTH - EDGE))
  if (!anchor) return { top, left }
  const box = anchor.getBoundingClientRect()
  return { top: top - box.top - anchor.clientTop + anchor.scrollTop, left: left - box.left - anchor.clientLeft + anchor.scrollLeft }
}

/**
 * Bridge between the Tiptap Suggestion plugin and React state for the "@" mention (A7). The plugin reports the typed query
 * and the caret; the list itself is a React `SunnerOptionListView` fed by `useSunnerSearch` (same debounce, 10 results, viewer
 * excluded). Arrow keys move the highlight, Enter picks it; both return true so ProseMirror consumes the key. Escape is
 * handled by the plugin (closes the list, keeps the typed text) and, as a handled key, never reaches the modal's Escape rule.
 * Typing "@" alone searches nothing (min one character after trim), so the list stays closed until text follows.
 */
export function useMentionSuggestion(anchorRef?: RefObject<HTMLElement | null>): MentionSuggestion {
  const [session, setSession] = useState<Session | null>(null)
  const [activeIndex, setActiveIndex] = useState(0)
  const { status, options } = useSunnerSearch(session?.query ?? '')

  const index = Math.min(activeIndex, Math.max(options.length - 1, 0))
  // What the key handler below needs; it lives in the plugin, outside React's render cycle.
  const live = useRef({ session, status, options, index })
  useEffect(() => {
    live.current = { session, status, options, index }
  })

  const suggestion = useMemo<MentionSuggestionConfig>(() => {
    const sync = (props: SuggestionProps<unknown, MentionAttrs>) => {
      if (live.current.session?.query !== props.query) setActiveIndex(0)
      const rect = props.clientRect?.() ?? null
      setSession({ query: props.query, command: props.command, position: rect ? listPosition(rect, anchorRef?.current ?? null) : null })
    }
    return {
      render: () => ({
        onStart: sync,
        onUpdate: sync,
        onExit: () => setSession(null),
        onKeyDown: ({ event }) => {
          const { session: current, status: state, options: rows, index: highlighted } = live.current
          if (state !== 'ready') return false
          if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
            const step = event.key === 'ArrowDown' ? 1 : rows.length - 1
            setActiveIndex((from) => (Math.min(from, rows.length - 1) + step) % rows.length)
            return true
          }
          if (event.key !== 'Enter') return false
          current?.command({ id: rows[highlighted].id, label: rows[highlighted].name })
          return true
        },
      }),
    }
  }, [anchorRef])

  const pick = (id: string) => {
    const row = options.find((option) => option.id === id)
    if (row) session?.command({ id: row.id, label: row.name })
  }

  return {
    suggestion,
    open: session !== null && status !== 'idle',
    status,
    options,
    activeIndex: index,
    position: session?.position ?? undefined,
    pick,
  }
}
