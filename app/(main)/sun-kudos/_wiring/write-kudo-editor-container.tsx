'use client'

import { EditorContent } from '@tiptap/react'
import type { RefObject } from 'react'
import type { AddLinkDialog } from '../_behavior/use-add-link-dialog'
import type { KudoEditorState } from '../_behavior/use-kudo-editor'
import type { MentionSuggestion } from '../_behavior/use-mention-suggestion'
import { AddLinkDialogView } from '../_components/add-link-dialog-view'
import { KudoEditorFrameView } from '../_components/kudo-editor-frame-view'
import { SunnerOptionListView } from '../_components/sunner-option-list-view'
import type { EditorTool, EditorToolName } from '../_components/write-kudo-view-types'
import type { WriteKudoLabels } from './build-write-kudo-labels'

type WriteKudoEditorContainerProps = {
  editor: KudoEditorState
  link: AddLinkDialog
  mention: MentionSuggestion
  /** Positioned wrapper the mention list is placed in (the same ref `useMentionSuggestion` measures against). */
  anchorRef: RefObject<HTMLDivElement | null>
  labels: WriteKudoLabels
  /** A send is under way. */
  disabled: boolean
  invalid: boolean
}

/** Nội dung field body: formatting toolbar and editor box, the "@" mention list and the Add link dialog. */
export function WriteKudoEditorContainer({ editor, link, mention, anchorRef, labels, disabled, invalid }: WriteKudoEditorContainerProps) {
  const { editor: tiptap, active, toggle } = editor
  const tool = (name: EditorToolName, onClick: () => void): EditorTool => ({ active: active[name], onClick, label: labels.editor.tools[name] })
  const tools: Record<EditorToolName, EditorTool> = {
    bold: tool('bold', toggle.bold),
    italic: tool('italic', toggle.italic),
    strike: tool('strike', toggle.strike),
    orderedList: tool('orderedList', toggle.orderedList),
    link: tool('link', link.openDialog),
    quote: tool('quote', toggle.quote),
  }

  return (
    <div ref={anchorRef} className="relative">
      <KudoEditorFrameView
        tools={tools}
        standardsHref="/standards"
        standardsLabel={labels.editor.standards}
        editorSlot={<EditorContent editor={tiptap} />}
        hint={labels.editor.mentionHint}
        disabled={disabled}
        invalid={invalid}
      />
      {mention.open ? (
        <SunnerOptionListView
          options={mention.options}
          activeIndex={mention.activeIndex}
          status={mention.status}
          onPick={mention.pick}
          emptyLabel={labels.recipient.empty}
          position={mention.position}
        />
      ) : null}
      <AddLinkDialogView
        open={link.open}
        text={link.text}
        url={link.url}
        errors={{
          text: link.errors.text ? labels.link.errors[link.errors.text] : undefined,
          url: link.errors.url ? labels.link.errors[link.errors.url] : undefined,
        }}
        onText={link.onText}
        onUrl={link.onUrl}
        onCancel={link.onCancel}
        onSave={link.onSave}
        labels={labels.link}
      />
    </div>
  )
}
