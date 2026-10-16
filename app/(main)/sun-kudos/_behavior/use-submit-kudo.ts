'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Dictionary } from '@/lib/i18n/dictionary-vi'
import { createKudoAction } from '@/lib/kudos/create-kudo-action'
import { KudoImageUploadError, removeKudoImages, uploadKudoImages } from '@/lib/kudos/kudo-image-storage'
import type { CreateKudoErrorCode, CreateKudoInput, CreateKudoResult } from '@/lib/kudos/kudo-write-types'
import { useKudoFeedback } from './kudo-feedback-provider'

/** Dictionary keys of every toast of a send: success, a failed upload, and one per `CreateKudoErrorCode`. */
export type SubmitMessageKey = 'writeKudo.toast.success' | 'writeKudo.error.upload' | `writeKudo.error.${CreateKudoErrorCode}`

export type SubmitDraft = Omit<CreateKudoInput, 'imagePaths'>

type Options = {
  /** `!form.incomplete`. */
  canSubmit: boolean
  /** Gửi pressed while incomplete (`form.revealAllErrors`): nothing is sent. */
  onInvalid: () => void
  /** Reads the fields at the moment of sending (editor snapshot included). */
  getDraft: () => SubmitDraft
  /** `useImageAttachments().files`. */
  getFiles: () => File[]
  messages: Pick<Dictionary, SubmitMessageKey>
  /** Closes the modal after a successful send. */
  onSuccess: () => void
}

export type SubmitKudo = {
  /** `WriteKudoFooterView.onSubmit`. */
  submit: () => void
  /** Lock inputs, Hủy and Escape (`useModalFocusTrap.submitting`) and show the spinner while true. */
  submitting: boolean
}

/**
 * Send flow (SM-001, INT-002). Incomplete: reveal every error and return, no request. Otherwise lock the form, upload the
 * images straight to Storage, then call the Server Action with their neutral names. Success: close, success toast,
 * `router.refresh()` so the board shows the new kudo. A definite `{ok:false}` removes the uploads (best effort); a thrown
 * send leaves them, since the RPC may still have committed (orphans are accepted). Either way: toast the error and return
 * to editing with every field kept (BR-010). A second press while sending is ignored.
 */
export function useSubmitKudo({ canSubmit, onInvalid, getDraft, getFiles, messages, onSuccess }: Options): SubmitKudo {
  const [submitting, setSubmitting] = useState(false)
  const inFlight = useRef(false)
  const { show } = useKudoFeedback()
  const router = useRouter()

  const send = async () => {
    const draft = getDraft()
    const files = getFiles()
    let uploaded: string[] = []
    let result: CreateKudoResult
    try {
      uploaded = await uploadKudoImages(files)
      result = await createKudoAction({ ...draft, imagePaths: uploaded })
    } catch (error) {
      // No cleanup: a failed upload already cleaned up after itself, and a thrown send has an unknown outcome.
      show(messages[error instanceof KudoImageUploadError ? 'writeKudo.error.upload' : 'writeKudo.error.unknown'], 'error')
      return
    }
    if (result.ok) {
      onSuccess()
      show(messages['writeKudo.toast.success'], 'success')
      router.refresh()
      return
    }
    await removeKudoImages(uploaded)
    show(messages[`writeKudo.error.${result.code}`], 'error')
  }

  const submit = () => {
    if (inFlight.current) return
    if (!canSubmit) {
      onInvalid()
      return
    }
    inFlight.current = true
    setSubmitting(true)
    void send().finally(() => {
      inFlight.current = false
      setSubmitting(false)
    })
  }

  return { submit, submitting }
}
