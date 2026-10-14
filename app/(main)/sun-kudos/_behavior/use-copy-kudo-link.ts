'use client'

import { useCallback } from 'react'
import { useKudoFeedback } from './kudo-feedback-provider'

export type CopyKudoLinkMessages = {
  /** Dictionary `kudos.toast.copied`. */
  copied: string
  /** Dictionary `kudos.error.copy`. */
  error: string
}

/**
 * "Copy Link" (A7, FR-406/407): writes `${origin}/sun-kudos/<id>` to the clipboard. The success toast shows only
 * after the write resolved; a rejected write or a missing Clipboard API (insecure origin, old browser) shows the
 * error toast instead. The text is origin + encoded id only. Returns `copy(kudoId)`, which never throws.
 */
export function useCopyKudoLink({ copied, error }: CopyKudoLinkMessages): (kudoId: string) => Promise<void> {
  const { show } = useKudoFeedback()

  return useCallback(
    async (kudoId: string) => {
      try {
        if (typeof navigator === 'undefined' || !navigator.clipboard?.writeText) throw new Error('Clipboard API unavailable')
        await navigator.clipboard.writeText(`${window.location.origin}/sun-kudos/${encodeURIComponent(kudoId)}`)
        show(copied, 'success')
      } catch {
        show(error, 'error')
      }
    },
    [show, copied, error],
  )
}
