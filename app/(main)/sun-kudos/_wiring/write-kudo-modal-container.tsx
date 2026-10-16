'use client'

import dynamic from 'next/dynamic'
import { useEffect } from 'react'
import { useKudoFeedback } from '../_behavior/kudo-feedback-provider'
import type { WriteKudoFormProps } from './write-kudo-form-container'

/** The chunk could not be fetched (offline, deploy in between): say so with the usual toast and close instead of hanging open. */
function ChunkLoadFailed({ onClose, labels }: WriteKudoFormProps) {
  const { show } = useKudoFeedback()
  useEffect(() => {
    show(labels.messages['writeKudo.error.unknown'], 'error')
    onClose()
  }, [show, onClose, labels])
  return null
}

// Tiptap and the whole form live in their own chunk: the board's first-load JS never carries them (loaded on first open).
const WriteKudoForm = dynamic<WriteKudoFormProps>(
  () =>
    import('./write-kudo-form-container').then(
      (module) => module.WriteKudoFormContainer,
      () => ChunkLoadFailed,
    ),
  { ssr: false },
)

type WriteKudoModalContainerProps = WriteKudoFormProps & { open: boolean }

/** Renders nothing while closed. Closing unmounts the form, which discards every field (FR-221). */
export function WriteKudoModalContainer({ open, ...form }: WriteKudoModalContainerProps) {
  if (!open) return null
  return <WriteKudoForm {...form} />
}
