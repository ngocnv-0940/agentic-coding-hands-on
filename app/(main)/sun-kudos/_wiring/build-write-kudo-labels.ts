import type { Dictionary } from '@/lib/i18n/dictionary-vi'
import type { SubmitMessageKey } from '../_behavior/use-submit-kudo'
import type { ImageErrorKey } from '../_behavior/use-image-attachments'
import type { LinkErrorKey } from '../_behavior/use-add-link-dialog'
import type {
  AddLinkDialogLabels,
  AnonymousFieldLabels,
  EditorToolName,
  HashtagPickerLabels,
  ImagePickerLabels,
  WriteKudoFooterLabels,
  WriteKudoModalLabels,
} from '../_components/write-kudo-view-types'

/** Every text of the Viết Kudo modal, translated on the server so the lazy client chunk never touches the dictionary. */
export type WriteKudoLabels = {
  modal: WriteKudoModalLabels
  required: string
  tooLong: string
  recipient: { label: string; placeholder: string; empty: string; loading: string; clear: string }
  titleField: { label: string; placeholder: string; hint: string }
  editor: { placeholder: string; mentionHint: string; standards: string; tools: Record<EditorToolName, string> }
  link: AddLinkDialogLabels & { errors: Record<LinkErrorKey, string> }
  hashtag: HashtagPickerLabels & { label: string }
  image: ImagePickerLabels & { label: string; errors: Record<ImageErrorKey, string> }
  anonymous: AnonymousFieldLabels
  footer: WriteKudoFooterLabels
  /** Toasts of a send: success, failed upload and one per error code. */
  messages: Pick<Dictionary, SubmitMessageKey>
}

/** Dictionary -> modal label props (DRY with `build-kudos-labels.ts`: containers never read dictionary keys). */
export function buildWriteKudoLabels(dict: Dictionary): WriteKudoLabels {
  return {
    modal: { title: dict['writeKudo.title'] },
    required: dict['writeKudo.required'],
    tooLong: dict['writeKudo.editor.tooLong'],
    recipient: {
      label: dict['writeKudo.recipient.label'],
      placeholder: dict['writeKudo.recipient.placeholder'],
      empty: dict['writeKudo.recipient.empty'],
      loading: dict['writeKudo.recipient.loading'],
      clear: dict['writeKudo.recipient.clear'],
    },
    titleField: {
      label: dict['writeKudo.titleField.label'],
      placeholder: dict['writeKudo.titleField.placeholder'],
      hint: dict['writeKudo.titleField.hint'],
    },
    editor: {
      placeholder: dict['writeKudo.editor.placeholder'],
      mentionHint: dict['writeKudo.editor.mentionHint'],
      standards: dict['writeKudo.editor.standards'],
      tools: {
        bold: dict['writeKudo.tool.bold'],
        italic: dict['writeKudo.tool.italic'],
        strike: dict['writeKudo.tool.strike'],
        orderedList: dict['writeKudo.tool.orderedList'],
        link: dict['writeKudo.tool.link'],
        quote: dict['writeKudo.tool.quote'],
      },
    },
    link: {
      title: dict['writeKudo.link.title'],
      textLabel: dict['writeKudo.link.text'],
      urlLabel: dict['writeKudo.link.url'],
      cancel: dict['writeKudo.link.cancel'],
      save: dict['writeKudo.link.save'],
      errors: {
        'writeKudo.link.textRequired': dict['writeKudo.link.textRequired'],
        'writeKudo.link.textTooLong': dict['writeKudo.link.textTooLong'],
        'writeKudo.link.urlRequired': dict['writeKudo.link.urlRequired'],
        'writeKudo.link.urlInvalid': dict['writeKudo.link.urlInvalid'],
        'writeKudo.link.urlTooLong': dict['writeKudo.link.urlTooLong'],
      },
    },
    hashtag: {
      label: dict['writeKudo.hashtag.label'],
      add: dict['writeKudo.hashtag.add'],
      hint: dict['writeKudo.hashtag.hint'],
      limit: dict['writeKudo.hashtag.limit'],
      remove: dict['writeKudo.hashtag.remove'],
    },
    image: {
      label: dict['writeKudo.image.label'],
      add: dict['writeKudo.image.add'],
      hint: dict['writeKudo.image.hint'],
      remove: dict['writeKudo.image.remove'],
      thumbAlt: dict['writeKudo.image.thumbAlt'],
      errors: {
        'writeKudo.image.invalidType': dict['writeKudo.image.invalidType'],
        'writeKudo.image.tooLarge': dict['writeKudo.image.tooLarge'],
      },
    },
    anonymous: { checkbox: dict['writeKudo.anonymous.checkbox'], name: dict['writeKudo.anonymous.name'] },
    footer: { cancel: dict['writeKudo.footer.cancel'], submit: dict['writeKudo.footer.submit'] },
    messages: {
      'writeKudo.toast.success': dict['writeKudo.toast.success'],
      'writeKudo.error.upload': dict['writeKudo.error.upload'],
      'writeKudo.error.unauthenticated': dict['writeKudo.error.unauthenticated'],
      'writeKudo.error.sunner_not_found': dict['writeKudo.error.sunner_not_found'],
      'writeKudo.error.receiver_not_found': dict['writeKudo.error.receiver_not_found'],
      'writeKudo.error.self_kudo': dict['writeKudo.error.self_kudo'],
      'writeKudo.error.title_invalid': dict['writeKudo.error.title_invalid'],
      'writeKudo.error.content_invalid': dict['writeKudo.error.content_invalid'],
      'writeKudo.error.content_doc_invalid': dict['writeKudo.error.content_doc_invalid'],
      'writeKudo.error.hashtags_invalid': dict['writeKudo.error.hashtags_invalid'],
      'writeKudo.error.images_invalid': dict['writeKudo.error.images_invalid'],
      'writeKudo.error.anonymous_name_invalid': dict['writeKudo.error.anonymous_name_invalid'],
      'writeKudo.error.invalid_input': dict['writeKudo.error.invalid_input'],
      'writeKudo.error.unknown': dict['writeKudo.error.unknown'],
    },
  }
}
