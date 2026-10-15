import type { Extensions } from '@tiptap/core'
import { Mention } from '@tiptap/extension-mention'
import { Placeholder } from '@tiptap/extensions'
import { StarterKit } from '@tiptap/starter-kit'
import type { SuggestionOptions } from '@tiptap/suggestion'
import { isLinkUrlValid } from '@/lib/kudos/kudo-write-rules'

export type MentionSuggestionConfig = Omit<SuggestionOptions, 'editor'>

/**
 * Schema of the Viết Kudo editor. It is the whitelist `create_kudo` re-checks (doc, paragraph, text, orderedList, listItem,
 * blockquote, hardBreak, mention; marks bold, italic, strike, link): everything else StarterKit ships is switched off,
 * so pasted HTML outside the whitelist degrades to plain text instead of reaching the document (FR-605).
 * Links are http(s) only at every entry point (typed in the dialog, pasted) and never open on click inside the editor.
 */
export function createKudoEditorExtensions(placeholder: string, suggestion: MentionSuggestionConfig): Extensions {
  return [
    StarterKit.configure({
      heading: false,
      bulletList: false,
      codeBlock: false,
      code: false,
      horizontalRule: false,
      underline: false,
      dropcursor: false,
      gapcursor: false,
      trailingNode: false,
      link: {
        openOnClick: false,
        autolink: false,
        linkOnPaste: false,
        protocols: ['http', 'https'],
        isAllowedUri: (url) => isLinkUrlValid(url),
        HTMLAttributes: { target: '_blank', rel: 'noopener noreferrer' },
      },
    }),
    // The frame styles `p[data-placeholder]::before`; keep the hint while the editor is locked during a send.
    Placeholder.configure({ placeholder, showOnlyWhenEditable: false }),
    Mention.configure({
      // ALG-002: the plain text of a mention is "@Full Name" (also what `editor.getText()` serializes).
      renderText: ({ node }) => `@${node.attrs.label ?? node.attrs.id}`,
      suggestion,
    }),
  ]
}
