import type { KeyboardEventHandler, ReactNode, Ref } from 'react'

/**
 * Prop contracts of the Viết Kudo modal presentational components (MoMorph ihQ26W78P2, phase 2).
 * Everything is stateless and prop-driven: strings arrive pre-translated and every handler comes from the wiring layer.
 */

export type WriteKudoFieldName = 'recipient' | 'title' | 'content' | 'hashtags' | 'images' | 'anonymous'

export type WriteKudoModalLabels = {
  /** Heading "Gửi lời cám ơn và ghi nhận đến đồng đội" (the contract id `write-kudo-heading`). */
  title: string
}

export type WriteKudoModalViewProps = {
  open: boolean
  labels: WriteKudoModalLabels
  /** A click on the mask (press and release both on it) closes and discards like Hủy; leave undefined while a send is under way. */
  onBackdropClick?: () => void
  dialogRef: Ref<HTMLDivElement>
  /** Pinned under the scrolling field area (Hủy / Gửi). */
  footer: ReactNode
  /** The field rows: the only region that scrolls. */
  children: ReactNode
}

export type WriteKudoFieldRowProps = {
  field: WriteKudoFieldName
  /** Visible label; an empty string renders the row without a label (content, anonymous). */
  label: string
  required: boolean
  /** Error message ("Không được để trống"); sets `data-invalid="true"` on the row. */
  error: string | null
  /** 'start' pins the label to the first line (title row, whose hint sits under the input). */
  align?: 'center' | 'start'
  children: ReactNode
}

export type WriteKudoTitleInputViewProps = {
  value: string
  onChange: (value: string) => void
  onBlur?: () => void
  placeholder: string
  /** Helper lines separated by "\n". */
  hint: string
  maxLength: number
  disabled: boolean
  invalid: boolean
  inputRef?: Ref<HTMLInputElement>
}

export type SunnerOptionView = { id: string; name: string; avatarUrl: string | null; department: string | null }

export type SunnerOptionListViewProps = {
  options: SunnerOptionView[]
  activeIndex: number
  status: 'idle' | 'loading' | 'empty' | 'ready'
  onPick: (id: string) => void
  emptyLabel: string
  /** Anchors the list at a point of its positioned ancestor (the "@" mention); without it the list drops under its field. */
  position?: { top: number; left: number }
}

export type RecipientPickerViewProps = {
  query: string
  onQueryChange: (value: string) => void
  onFocus: () => void
  onBlur: () => void
  onKeyDown: KeyboardEventHandler<HTMLInputElement>
  open: boolean
  selected: SunnerOptionView | null
  onClear: () => void
  /** `SunnerOptionListView` built by the wiring; rendered only while `open`. */
  listSlot: ReactNode
  disabled: boolean
  placeholder: string
  inputRef: Ref<HTMLInputElement>
  invalid?: boolean
  clearLabel?: string
  /** Id of the highlighted option, for `aria-activedescendant`. */
  activeOptionId?: string
}

export type EditorToolName = 'bold' | 'italic' | 'strike' | 'orderedList' | 'link' | 'quote'
export type EditorTool = { active: boolean; onClick: () => void; label: string }

export type KudoEditorFrameViewProps = {
  tools: Record<EditorToolName, EditorTool>
  standardsHref: string
  standardsLabel: string
  /** The Tiptap `EditorContent`; this frame owns `data-testid="write-kudo-editor"`, the slot must not repeat it. */
  editorSlot: ReactNode
  /** "Bạn có thể “@ + tên” để nhắc tới đồng nghiệp khác" */
  hint: string
  disabled: boolean
  invalid: boolean
}

export type AddLinkDialogLabels = {
  title: string
  textLabel: string
  urlLabel: string
  cancel: string
  save: string
}

export type AddLinkDialogViewProps = {
  open: boolean
  text: string
  url: string
  /** Messages shown under the matching input. */
  errors: { text?: string; url?: string }
  onText: (value: string) => void
  onUrl: (value: string) => void
  onCancel: () => void
  onSave: () => void
  labels: AddLinkDialogLabels
}

export type HashtagOptionView = { slug: string; label: string; selected: boolean; disabled: boolean }

export type HashtagPickerLabels = {
  /** "Hashtag" */
  add: string
  /** "Tối đa 5" */
  hint: string
  /** "Tối đa 5 hashtag" */
  limit: string
  /** Accessible name of a chip's remove button. */
  remove: string
}

export type HashtagPickerViewProps = {
  options: HashtagOptionView[]
  open: boolean
  onToggleOpen: () => void
  onToggle: (slug: string) => void
  onRemove: (slug: string) => void
  atLimit: boolean
  labels: HashtagPickerLabels
  disabled: boolean
}

export type ImagePickerLabels = {
  /** "Image" */
  add: string
  /** "Tối đa 5" */
  hint: string
  /** Accessible name of a thumbnail's remove button. */
  remove: string
  /** Alt text of a thumbnail. */
  thumbAlt: string
}

export type ImagePickerViewProps = {
  items: { id: string; previewUrl: string }[]
  canAdd: boolean
  onPick: (files: FileList) => void
  onRemove: (id: string) => void
  error: string | null
  /** "image/jpeg,image/png,image/webp" */
  accept: string
  labels: ImagePickerLabels
  disabled: boolean
  inputRef: Ref<HTMLInputElement>
}

export type AnonymousFieldLabels = {
  /** "Gửi lời cám ơn và ghi nhận ẩn danh" */
  checkbox: string
  /** Placeholder and accessible name of the alias input ("Tên ẩn danh"). */
  name: string
}

export type AnonymousFieldViewProps = {
  checked: boolean
  onToggle: () => void
  name: string
  onName: (value: string) => void
  labels: AnonymousFieldLabels
  disabled: boolean
}

export type WriteKudoFooterLabels = { cancel: string; submit: string }

export type WriteKudoFooterViewProps = {
  submitting: boolean
  /** A required field is empty: Gửi dims and reports `aria-disabled`, but stays clickable so the errors can show. */
  incomplete: boolean
  onCancel: () => void
  onSubmit: () => void
  labels: WriteKudoFooterLabels
}
