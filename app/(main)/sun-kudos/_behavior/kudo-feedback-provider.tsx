'use client'

import { createContext, useCallback, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { ComingSoonModalView } from '../_components/coming-soon-modal-view'
import { ToastView } from '../_components/toast-view'
import type { ToastKind } from '../_components/kudos-view-types'

/** E31: a toast stays about 3 seconds (clarifications). */
const TOAST_MS = 3000

type ToastState = { message: string; kind: ToastKind }

export type KudoFeedback = {
  /** One toast at a time: a new call replaces the text and restarts the 3 s timer. */
  show: (message: string, kind: ToastKind) => void
  /** Open the Coming soon modal; `trigger` gets focus back when it closes (A12). Pass `event.currentTarget`. */
  openModal: (trigger: HTMLElement | null) => void
  closeModal: () => void
}

const KudoFeedbackContext = createContext<KudoFeedback | null>(null)

export function useKudoFeedback(): KudoFeedback {
  const feedback = useContext(KudoFeedbackContext)
  if (feedback === null) throw new Error('useKudoFeedback must be used inside <KudoFeedbackProvider>')
  return feedback
}

type KudoFeedbackProviderProps = {
  /** Modal text: dictionary `comingSoon.title` and `kudos.modal.close`, passed down from the server. */
  modalTitle: string
  modalCloseLabel: string
  children: ReactNode
}

/**
 * Owns the toast (E31) and the Coming soon modal (E32) of the board and renders both, so every entry point only
 * calls `show` / `openModal`. The modal closes on its button, the backdrop (both handled by `ComingSoonModalView`)
 * and Escape anywhere in the document; it also closes when Activity hides the page.
 */
export function KudoFeedbackProvider({ modalTitle, modalCloseLabel, children }: KudoFeedbackProviderProps) {
  const [toast, setToast] = useState<ToastState | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const trigger = useRef<HTMLElement | null>(null)

  const clearTimer = useCallback(() => {
    if (timer.current !== null) clearTimeout(timer.current)
    timer.current = null
  }, [])

  useEffect(() => clearTimer, [clearTimer])
  useLayoutEffect(() => () => setModalOpen(false), [])

  const show = useCallback(
    (message: string, kind: ToastKind) => {
      clearTimer()
      setToast({ message, kind })
      timer.current = setTimeout(() => {
        timer.current = null
        setToast(null)
      }, TOAST_MS)
    },
    [clearTimer],
  )

  const openModal = useCallback((element: HTMLElement | null) => {
    trigger.current = element
    setModalOpen(true)
  }, [])

  const closeModal = useCallback(() => {
    setModalOpen(false)
    const element = trigger.current
    trigger.current = null
    if (element?.isConnected) element.focus()
  }, [])

  useEffect(() => {
    if (!modalOpen) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeModal()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [modalOpen, closeModal])

  const value = useMemo<KudoFeedback>(() => ({ show, openModal, closeModal }), [show, openModal, closeModal])

  return (
    <KudoFeedbackContext value={value}>
      {children}
      <ToastView message={toast?.message ?? null} kind={toast?.kind ?? 'success'} />
      <ComingSoonModalView open={modalOpen} title={modalTitle} closeLabel={modalCloseLabel} onClose={closeModal} />
    </KudoFeedbackContext>
  )
}
