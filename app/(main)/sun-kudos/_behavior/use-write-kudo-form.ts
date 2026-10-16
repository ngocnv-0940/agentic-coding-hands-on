'use client'

import { useState } from 'react'
import { CONTENT_MAX, requiredFieldErrors, textLength, type RequiredField } from '@/lib/kudos/kudo-write-rules'
import type { SunnerOption } from '@/lib/kudos/kudo-write-types'

/** What a field shows under it: the required message, the too-long message (content only), or nothing. */
export type FieldError = 'required' | 'tooLong' | null

export type WriteKudoForm = {
  receiver: SunnerOption | null
  setReceiver: (option: SunnerOption | null) => void
  title: string
  setTitle: (value: string) => void
  anonymous: boolean
  /** `AnonymousFieldView.onToggle`; unchecking also clears the alias (DEC-005). */
  toggleAnonymous: () => void
  alias: string
  setAlias: (value: string) => void
  /** Marks a field the user has left (DEC-002). Content and hashtags report their own `touched` flag instead. */
  touch: (field: 'recipient' | 'title') => void
  /** Per `FieldRow.error`: map 'required' to `writeKudo.required` and 'tooLong' to `writeKudo.editor.tooLong`. */
  fieldErrors: Record<RequiredField, FieldError>
  /** `WriteKudoFooterView.incomplete`: a required field is empty or the content is too long. */
  incomplete: boolean
  /** Gửi was pressed while incomplete: every empty required field shows its error from now on. */
  revealAllErrors: () => void
}

type Externals = {
  /** `useKudoEditor().text`. */
  content: string
  contentTouched: boolean
  /** `useHashtagPicker().selected`. */
  hashtagSlugs: readonly string[]
  hashtagsTouched: boolean
}

/**
 * Field state and validation display of the Viết Kudo form (BR-001, DEC-002, DEC-005). It owns the recipient, title and
 * anonymous fields; content and hashtags live in their own hooks and arrive as `Externals`. An empty required field shows
 * its error once it was touched (left empty) or after Gửi was pressed, and the error disappears as soon as the field is
 * valid. Content longer than 2000 characters shows at once. `incomplete` never hides the click: Gửi stays pressable.
 */
export function useWriteKudoForm({ content, contentTouched, hashtagSlugs, hashtagsTouched }: Externals): WriteKudoForm {
  const [receiver, setReceiver] = useState<SunnerOption | null>(null)
  const [title, setTitle] = useState('')
  const [anonymous, setAnonymous] = useState(false)
  const [alias, setAlias] = useState('')
  const [touched, setTouched] = useState({ recipient: false, title: false })
  const [revealed, setRevealed] = useState(false)

  const missing = requiredFieldErrors({ recipientId: receiver?.id ?? null, title, content, hashtagSlugs })
  const tooLong = textLength(content.trim()) > CONTENT_MAX
  const seen: Record<RequiredField, boolean> = {
    recipient: revealed || touched.recipient,
    title: revealed || touched.title,
    content: revealed || contentTouched,
    hashtags: revealed || hashtagsTouched,
  }
  const errorOf = (field: RequiredField): FieldError => {
    if (field === 'content' && tooLong) return 'tooLong'
    return seen[field] && missing.includes(field) ? 'required' : null
  }

  return {
    receiver,
    setReceiver,
    title,
    setTitle,
    anonymous,
    toggleAnonymous: () => {
      if (anonymous) setAlias('')
      setAnonymous(!anonymous)
    },
    alias,
    setAlias,
    touch: (field) => setTouched((current) => ({ ...current, [field]: true })),
    fieldErrors: { recipient: errorOf('recipient'), title: errorOf('title'), content: errorOf('content'), hashtags: errorOf('hashtags') },
    incomplete: missing.length > 0 || tooLong,
    revealAllErrors: () => setRevealed(true),
  }
}
