'use client'

import { useRef, useState } from 'react'
import type { Editor } from '@tiptap/core'
import type { Dictionary } from '@/lib/i18n/dictionary-vi'
import { LINK_URL_MAX, isLinkTextValid, isLinkUrlValid } from '@/lib/kudos/kudo-write-rules'
import { useEscapeLayer } from './use-escape-layer'

/** Dictionary keys of the link dialog messages (`AddLinkDialogViewProps.errors` takes the translated text). */
export const LINK_ERROR_KEYS = {
  textRequired: 'writeKudo.link.textRequired',
  textTooLong: 'writeKudo.link.textTooLong',
  urlRequired: 'writeKudo.link.urlRequired',
  urlInvalid: 'writeKudo.link.urlInvalid',
  urlTooLong: 'writeKudo.link.urlTooLong',
} as const satisfies Record<string, keyof Dictionary>

export type LinkErrorKey = (typeof LINK_ERROR_KEYS)[keyof typeof LINK_ERROR_KEYS]

export type AddLinkDialog = {
  /** `AddLinkDialogView`: `open`, `text`, `url`, `onText`, `onUrl`, `onCancel`, `onSave`. */
  open: boolean
  text: string
  url: string
  onText: (value: string) => void
  onUrl: (value: string) => void
  onCancel: () => void
  onSave: () => void
  /** Keys of the errors to translate into `AddLinkDialogViewProps.errors`; set by a failed Lưu, cleared as the field is edited. */
  errors: { text?: LinkErrorKey; url?: LinkErrorKey }
  /** `EditorTool.onClick` of the link tool: opens the dialog with "Text" prefilled from the selection. */
  openDialog: () => void
}

function validate(text: string, url: string): AddLinkDialog['errors'] {
  const errors: AddLinkDialog['errors'] = {}
  if (!isLinkTextValid(text)) errors.text = text.trim() === '' ? LINK_ERROR_KEYS.textRequired : LINK_ERROR_KEYS.textTooLong
  if (!isLinkUrlValid(url)) {
    errors.url = url === '' ? LINK_ERROR_KEYS.urlRequired : url.length > LINK_URL_MAX ? LINK_ERROR_KEYS.urlTooLong : LINK_ERROR_KEYS.urlInvalid
  }
  return errors
}

/**
 * Add link dialog (A6). Opens from the link tool with the selected text prefilled. Lưu trims both inputs, validates the
 * trimmed values (text 1 to 100, http(s) URL 5 to 2048) and inserts that same trimmed text carrying a link mark with that
 * same trimmed URL (the server rejects an href that does not start with the scheme), replacing the selection; on an error
 * nothing is inserted and the dialog stays. Hủy and Escape (via `useEscapeLayer`, only this dialog) close it and give focus
 * back to what had it before (the link tool for a keyboard user, else the editor); Lưu leaves the caret in the editor.
 */
export function useAddLinkDialog(editor: Editor | null): AddLinkDialog {
  const [open, setOpen] = useState(false)
  const [text, setText] = useState('')
  const [url, setUrl] = useState('')
  const [errors, setErrors] = useState<AddLinkDialog['errors']>({})
  const opener = useRef<HTMLElement | null>(null)

  const close = () => {
    setOpen(false)
    const previous = opener.current
    opener.current = null
    if (previous?.isConnected && previous !== document.body) previous.focus()
    else editor?.commands.focus()
  }
  useEscapeLayer(open, close)

  const openDialog = () => {
    if (!editor || editor.isDestroyed) return
    const { from, to, empty } = editor.state.selection
    opener.current = document.activeElement instanceof HTMLElement ? document.activeElement : null
    setText(empty ? '' : editor.state.doc.textBetween(from, to, ' '))
    setUrl('')
    setErrors({})
    setOpen(true)
  }

  const onSave = () => {
    if (!editor || editor.isDestroyed) return
    const linkText = text.trim()
    const href = url.trim()
    const found = validate(linkText, href)
    setErrors(found)
    if (found.text || found.url) return
    editor
      .chain()
      .focus()
      .insertContent({ type: 'text', text: linkText, marks: [{ type: 'link', attrs: { href } }] })
      .run()
    opener.current = null
    setOpen(false)
  }

  return {
    open,
    text,
    url,
    onText: (value) => {
      setText(value)
      setErrors((current) => ({ ...current, text: undefined }))
    },
    onUrl: (value) => {
      setUrl(value)
      setErrors((current) => ({ ...current, url: undefined }))
    },
    onCancel: close,
    onSave,
    errors,
    openDialog,
  }
}
