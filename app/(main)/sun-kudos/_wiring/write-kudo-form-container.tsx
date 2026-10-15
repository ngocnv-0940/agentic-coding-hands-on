'use client'

import { useEffect, useRef } from 'react'
import { TITLE_MAX } from '@/lib/kudos/kudo-write-rules'
import type { Hashtag } from '@/lib/kudos/kudo-board-types'
import { useAddLinkDialog } from '../_behavior/use-add-link-dialog'
import { useHashtagPicker } from '../_behavior/use-hashtag-picker'
import { useImageAttachments } from '../_behavior/use-image-attachments'
import { useKudoEditor } from '../_behavior/use-kudo-editor'
import { useMentionSuggestion } from '../_behavior/use-mention-suggestion'
import { useModalFocusTrap } from '../_behavior/use-modal-focus-trap'
import { useRecipientPicker } from '../_behavior/use-recipient-picker'
import { useSubmitKudo } from '../_behavior/use-submit-kudo'
import { useWriteKudoForm, type FieldError } from '../_behavior/use-write-kudo-form'
import { AnonymousFieldView } from '../_components/anonymous-field-view'
import { HashtagPickerView } from '../_components/hashtag-picker-view'
import { ImagePickerView } from '../_components/image-picker-view'
import { RecipientPickerView } from '../_components/recipient-picker-view'
import { SunnerOptionListView } from '../_components/sunner-option-list-view'
import { WriteKudoFieldRow, WriteKudoTitleInputView } from '../_components/write-kudo-field-row'
import { WriteKudoFooterView } from '../_components/write-kudo-footer-view'
import { WriteKudoModalView } from '../_components/write-kudo-modal-view'
import type { WriteKudoLabels } from './build-write-kudo-labels'
import { WriteKudoEditorContainer } from './write-kudo-editor-container'

export type WriteKudoFormProps = {
  /** The compose pill: focus returns to it on close. */
  opener: HTMLElement | null
  /** Closes the modal; the parent then unmounts this form and with it every field (FR-221). */
  onClose: () => void
  labels: WriteKudoLabels
  hashtags: Hashtag[]
}

/**
 * The open Viết Kudo modal. Hooks are built in dependency order (mention, editor, link, hashtags, images, form, recipient,
 * send, focus trap) and handed to the stateless views. Mounted only while open, so it starts empty every time.
 */
export function WriteKudoFormContainer({ opener, onClose, labels, hashtags }: WriteKudoFormProps) {
  const dialogRef = useRef<HTMLDivElement>(null)
  const editorAnchorRef = useRef<HTMLDivElement>(null)

  const mention = useMentionSuggestion(editorAnchorRef)
  // The send hook needs the editor text and the editor needs `submitting`: the lock is applied by the effect below instead.
  const editor = useKudoEditor({ placeholder: labels.editor.placeholder, disabled: false, suggestion: mention.suggestion })
  const link = useAddLinkDialog(editor.editor)
  const { rootRef: hashtagsRootRef, ...picker } = useHashtagPicker(hashtags)
  const images = useImageAttachments()
  const form = useWriteKudoForm({ content: editor.text, contentTouched: editor.touched, hashtagSlugs: picker.selected, hashtagsTouched: picker.touched })
  const recipient = useRecipientPicker({ selected: form.receiver, onSelect: form.setReceiver, onTouch: () => form.touch('recipient') })
  const send = useSubmitKudo({
    canSubmit: !form.incomplete,
    onInvalid: form.revealAllErrors,
    getDraft: () => ({
      receiverId: form.receiver?.id ?? '',
      title: form.title.trim(),
      content: editor.plainText(),
      contentDoc: editor.json(),
      hashtagSlugs: picker.selected,
      isAnonymous: form.anonymous,
      anonymousName: form.anonymous ? form.alias : '',
    }),
    getFiles: images.files,
    messages: labels.messages,
    onSuccess: onClose,
  })
  const { submitting } = send
  const tiptap = editor.editor
  useEffect(() => {
    tiptap?.setEditable(!submitting, false)
  }, [tiptap, submitting])
  useModalFocusTrap({
    open: true,
    dialogRef,
    initialFocusRef: recipient.inputRef,
    opener,
    onEscape: onClose,
    submitting: send.submitting,
    layerOpen: recipient.open || picker.open || link.open || mention.open,
  })

  const message = (error: FieldError) => (error === 'required' ? labels.required : error === 'tooLong' ? labels.tooLong : null)

  return (
    <WriteKudoModalView open labels={labels.modal} dialogRef={dialogRef}>
      <WriteKudoFieldRow field="recipient" label={labels.recipient.label} required error={message(form.fieldErrors.recipient)}>
        <RecipientPickerView
          query={recipient.query}
          onQueryChange={recipient.onQueryChange}
          onFocus={recipient.onFocus}
          onBlur={recipient.onBlur}
          onKeyDown={recipient.onKeyDown}
          open={recipient.open}
          selected={form.receiver}
          onClear={recipient.onClear}
          listSlot={
            <SunnerOptionListView
              options={recipient.options}
              activeIndex={recipient.activeIndex}
              status={recipient.status}
              onPick={recipient.onPick}
              emptyLabel={labels.recipient.empty}
            />
          }
          disabled={submitting}
          placeholder={labels.recipient.placeholder}
          inputRef={recipient.inputRef}
          invalid={form.fieldErrors.recipient !== null}
          clearLabel={labels.recipient.clear}
          activeOptionId={recipient.activeOptionId}
        />
      </WriteKudoFieldRow>
      <WriteKudoFieldRow field="title" label={labels.titleField.label} required error={message(form.fieldErrors.title)} align="start">
        <WriteKudoTitleInputView
          value={form.title}
          onChange={form.setTitle}
          onBlur={() => form.touch('title')}
          placeholder={labels.titleField.placeholder}
          hint={labels.titleField.hint}
          maxLength={TITLE_MAX}
          disabled={submitting}
          invalid={form.fieldErrors.title !== null}
        />
      </WriteKudoFieldRow>
      <WriteKudoFieldRow field="content" label="" required error={message(form.fieldErrors.content)}>
        <WriteKudoEditorContainer
          editor={editor}
          link={link}
          mention={mention}
          anchorRef={editorAnchorRef}
          labels={labels}
          disabled={submitting}
          invalid={form.fieldErrors.content !== null}
        />
      </WriteKudoFieldRow>
      <WriteKudoFieldRow field="hashtags" label={labels.hashtag.label} required error={message(form.fieldErrors.hashtags)}>
        <div ref={hashtagsRootRef} className="contents">
          <HashtagPickerView
            options={picker.options}
            open={picker.open}
            onToggleOpen={picker.onToggleOpen}
            onToggle={picker.onToggle}
            onRemove={picker.onRemove}
            atLimit={picker.atLimit}
            labels={labels.hashtag}
            disabled={submitting}
          />
        </div>
      </WriteKudoFieldRow>
      <WriteKudoFieldRow field="images" label={labels.image.label} required={false} error={null}>
        <ImagePickerView
          items={images.items}
          canAdd={images.canAdd}
          onPick={images.add}
          onRemove={images.onRemove}
          error={images.errorKey ? labels.image.errors[images.errorKey] : null}
          accept={images.accept}
          labels={labels.image}
          disabled={submitting}
          inputRef={images.inputRef}
        />
      </WriteKudoFieldRow>
      <WriteKudoFieldRow field="anonymous" label="" required={false} error={null}>
        <AnonymousFieldView
          checked={form.anonymous}
          onToggle={form.toggleAnonymous}
          name={form.alias}
          onName={form.setAlias}
          labels={labels.anonymous}
          disabled={submitting}
        />
      </WriteKudoFieldRow>
      <WriteKudoFooterView submitting={submitting} incomplete={form.incomplete} onCancel={onClose} onSubmit={send.submit} labels={labels.footer} />
    </WriteKudoModalView>
  )
}
