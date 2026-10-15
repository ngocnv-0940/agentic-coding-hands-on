'use client'

import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from 'react'
import type { LikeErrorCode } from '@/lib/kudos/kudo-board-types'
import { toggleKudoLikeAction } from '@/lib/kudos/toggle-kudo-like-action'
import { useKudoFeedback } from './kudo-feedback-provider'

export type LikeValue = { liked: boolean; count: number }

/** Server-confirmed like state of one kudo; absent until the viewer toggles that kudo. */
type LikeEntry = LikeValue

/** What a card knows about its own like; the provider layers confirmed toggles on top of it. */
export type LikeSource = { id: string; likedByViewer: boolean; likeCount: number; canLike: boolean }

export type KudoLikeContextValue = {
  entries: Readonly<Record<string, LikeEntry>>
  pendingIds: ReadonlySet<string>
  toggle: (kudoId: string) => Promise<void>
}

const KudoLikeContext = createContext<KudoLikeContextValue | null>(null)

export function useKudoLikeContext(): KudoLikeContextValue {
  const value = useContext(KudoLikeContext)
  if (value === null) throw new Error('useKudoLike must be used inside <KudoLikeStateProvider>')
  return value
}

type KudoLikeStateProviderProps = {
  /** Dictionary `kudos.error.like.${code}` for every `LikeErrorCode`, passed down from the server. */
  errorMessages: Record<LikeErrorCode, string>
  /** Current filter key. A filter change refetches every card from the server, so confirmed entries are dropped. */
  resetKey: string
  children: ReactNode
}

/**
 * Like state shared by every card of the page (A6): a Highlight card and the same kudo in All Kudos read one entry,
 * so a like in one shows in the other. Cards seed themselves (`useKudoLike` falls back to the server values until
 * an entry exists). There is no optimistic flip: a toggle marks the kudo pending, waits for the server action, then
 * stores `{liked, likeCount}`; on any failure nothing changes and an error toast says why (SM-001, DEC-003).
 * Must sit inside `KudoFeedbackProvider`.
 */
export function KudoLikeStateProvider({ errorMessages, resetKey, children }: KudoLikeStateProviderProps) {
  const { show } = useKudoFeedback()
  const [entries, setEntries] = useState<Record<string, LikeEntry>>({})
  const [entriesKey, setEntriesKey] = useState(resetKey)
  // Adjust state during render (no effect): fresher server data after a filter change must win over old entries.
  if (entriesKey !== resetKey) {
    setEntriesKey(resetKey)
    setEntries({})
  }
  const [pendingIds, setPendingIds] = useState<ReadonlySet<string>>(() => new Set())
  // The ref answers "is it already running?" synchronously; state only drives rendering.
  const running = useRef<Set<string>>(new Set())

  const setPending = useCallback((kudoId: string, pending: boolean) => {
    if (pending) running.current.add(kudoId)
    else running.current.delete(kudoId)
    setPendingIds(new Set(running.current))
  }, [])

  const toggle = useCallback(
    async (kudoId: string) => {
      if (running.current.has(kudoId)) return
      setPending(kudoId, true)
      try {
        const result = await toggleKudoLikeAction(kudoId)
        if (result.ok) setEntries((current) => ({ ...current, [kudoId]: { liked: result.liked, count: result.likeCount } }))
        else show(errorMessages[result.code], 'error')
      } catch {
        show(errorMessages.unknown, 'error')
      } finally {
        setPending(kudoId, false)
      }
    },
    [errorMessages, setPending, show],
  )

  const value = useMemo<KudoLikeContextValue>(() => ({ entries, pendingIds, toggle }), [entries, pendingIds, toggle])
  return <KudoLikeContext value={value}>{children}</KudoLikeContext>
}
