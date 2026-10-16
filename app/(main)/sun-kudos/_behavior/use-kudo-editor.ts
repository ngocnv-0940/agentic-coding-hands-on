'use client'

import { useEffect, useMemo, useState } from 'react'
import type { Editor } from '@tiptap/core'
import { useEditor, useEditorState } from '@tiptap/react'
import type { KudoContentDoc } from '@/lib/kudos/kudo-write-types'
import type { EditorToolName } from '../_components/write-kudo-view-types'
import { createKudoEditorExtensions, type MentionSuggestionConfig } from './kudo-editor-extensions'

export type KudoEditorTool = Exclude<EditorToolName, 'link'>

export type KudoEditorState = {
  /** `null` until the client has mounted (`immediatelyRender: false`); render `<EditorContent editor={editor} />` into `editorSlot`. */
  editor: Editor | null
  /** Plain text of the document (ALG-002, mentions as "@Full Name"), kept in step with every edit: feeds the required/too-long rules. */
  text: string
  /** The editor lost focus at least once (DEC-002): the empty-content error may now show. */
  touched: boolean
  /** `EditorTool.active` per toolbar button (`link` is active while the caret sits in a link). */
  active: Record<EditorToolName, boolean>
  /** `EditorTool.onClick` for the five formatting tools; the link tool belongs to `useAddLinkDialog`. */
  toggle: Record<KudoEditorTool, () => void>
  /** Snapshot for submit: plain text, trimmed (the RPC stores it trimmed). */
  plainText: () => string
  /** Snapshot for submit: `editor.getJSON()`. */
  json: () => KudoContentDoc
}

const EMPTY_DOC: KudoContentDoc = { type: 'doc', content: [{ type: 'paragraph' }] }

const readText = (editor: Editor) => editor.getText({ blockSeparator: '\n' })

type Options = {
  /** Dictionary `writeKudo.editor.placeholder`. */
  placeholder: string
  /** True while a send is under way: the document becomes read-only. */
  disabled: boolean
  /** `useMentionSuggestion().suggestion`. */
  suggestion: MentionSuggestionConfig
}

/**
 * The Tiptap instance of the Nội dung field (A5, A13). SSR-safe (`immediatelyRender: false`: the editor, and so the DOM it
 * writes, only exists after mount, which avoids a hydration mismatch). Toolbar state comes from `useEditorState`, so only
 * the toolbar re-renders per transaction; `text` changes only when the document does. Destroyed by `useEditor` on unmount.
 */
export function useKudoEditor({ placeholder, disabled, suggestion }: Options): KudoEditorState {
  const [text, setText] = useState('')
  const [touched, setTouched] = useState(false)
  const extensions = useMemo(() => createKudoEditorExtensions(placeholder, suggestion), [placeholder, suggestion])

  const editor = useEditor({
    extensions,
    immediatelyRender: false,
    editable: !disabled,
    onUpdate: ({ editor: current }) => setText(readText(current)),
    onBlur: () => setTouched(true),
  })

  useEffect(() => {
    editor?.setEditable(!disabled, false)
  }, [editor, disabled])

  const active = useEditorState({
    editor,
    selector: ({ editor: current }) => ({
      bold: current?.isActive('bold') ?? false,
      italic: current?.isActive('italic') ?? false,
      strike: current?.isActive('strike') ?? false,
      orderedList: current?.isActive('orderedList') ?? false,
      link: current?.isActive('link') ?? false,
      quote: current?.isActive('blockquote') ?? false,
    }),
  })

  const toggle = useMemo<Record<KudoEditorTool, () => void>>(
    () => ({
      bold: () => editor?.chain().focus().toggleBold().run(),
      italic: () => editor?.chain().focus().toggleItalic().run(),
      strike: () => editor?.chain().focus().toggleStrike().run(),
      orderedList: () => editor?.chain().focus().toggleOrderedList().run(),
      quote: () => editor?.chain().focus().toggleBlockquote().run(),
    }),
    [editor],
  )

  return {
    editor,
    text,
    touched,
    active: active ?? { bold: false, italic: false, strike: false, orderedList: false, link: false, quote: false },
    toggle,
    plainText: () => (editor ? readText(editor).trim() : ''),
    json: () => (editor ? editor.getJSON() : EMPTY_DOC),
  }
}
