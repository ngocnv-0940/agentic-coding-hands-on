import Link from 'next/link'
import { Fragment, type ComponentType, type SVGProps } from 'react'
import { IconLink } from './kudos-icons'
import { MODAL_FOCUS_RING } from './write-kudo-field-row'
import { IconBold, IconItalic, IconOrderedList, IconQuote, IconStrikethrough } from './write-kudo-icons'
import type { EditorToolName, KudoEditorFrameViewProps } from './write-kudo-view-types'

type ToolSpec = { name: EditorToolName; testId: string; Icon: ComponentType<SVGProps<SVGSVGElement>> }

// Figma order C.1 to C.6: mm:I520:11647;520:9881, mm:I520:11647;662:11119, mm:I520:11647;662:11213,
// mm:I520:11647;662:10376, mm:I520:11647;662:10647. The link tool reuses the F006 IconLink (same artwork):
// mm:I520:11647;662:10507;186:1420
const TOOLS: ToolSpec[] = [
  { name: 'bold', testId: 'write-kudo-tool-bold', Icon: IconBold },
  { name: 'italic', testId: 'write-kudo-tool-italic', Icon: IconItalic },
  { name: 'strike', testId: 'write-kudo-tool-strike', Icon: IconStrikethrough },
  { name: 'orderedList', testId: 'write-kudo-tool-ordered-list', Icon: IconOrderedList },
  { name: 'link', testId: 'write-kudo-tool-link', Icon: IconLink },
  { name: 'quote', testId: 'write-kudo-tool-quote', Icon: IconQuote },
]

const TOOL_CLASS =
  'flex h-10 flex-1 cursor-pointer items-center justify-center border border-saa-gold-border bg-transparent px-2 text-saa-navy transition-colors duration-200 hover:bg-[rgba(255,234,158,0.4)] aria-pressed:bg-[rgba(255,234,158,0.7)] disabled:cursor-not-allowed disabled:opacity-50 sm:flex-none sm:px-4 sm:py-2.5'

/**
 * Styles of the editor content. The editor (Tiptap) injects bare ProseMirror markup, so the typography lives here as
 * Tailwind arbitrary variants on the wrapper instead of global CSS: 16/24 text, lists, quote, links, mentions and the
 * placeholder the editor writes into `p[data-placeholder]`.
 */
const PROSE = [
  '[&_.ProseMirror]:h-full [&_.ProseMirror]:min-h-full [&_.ProseMirror]:outline-none',
  '[&_.ProseMirror]:text-base [&_.ProseMirror]:leading-6 [&_.ProseMirror]:font-medium [&_.ProseMirror]:tracking-[0.15px] [&_.ProseMirror]:break-words',
  '[&_.ProseMirror_p]:m-0 [&_.ProseMirror_strong]:font-bold [&_.ProseMirror_s]:line-through',
  '[&_.ProseMirror_ol]:m-0 [&_.ProseMirror_ol]:list-decimal [&_.ProseMirror_ol]:pl-6',
  '[&_.ProseMirror_blockquote]:m-0 [&_.ProseMirror_blockquote]:border-l-4 [&_.ProseMirror_blockquote]:border-saa-gold-border [&_.ProseMirror_blockquote]:pl-4',
  '[&_.ProseMirror_a]:text-[#0b57d0] [&_.ProseMirror_a]:underline',
  '[&_.ProseMirror_span[data-type=mention]]:rounded-sm [&_.ProseMirror_span[data-type=mention]]:bg-[rgba(255,234,158,0.5)] [&_.ProseMirror_span[data-type=mention]]:px-0.5 [&_.ProseMirror_span[data-type=mention]]:font-bold',
  '[&_.ProseMirror_p[data-placeholder]::before]:pointer-events-none [&_.ProseMirror_p[data-placeholder]::before]:float-left [&_.ProseMirror_p[data-placeholder]::before]:h-0 [&_.ProseMirror_p[data-placeholder]::before]:font-bold [&_.ProseMirror_p[data-placeholder]::before]:text-[#999] [&_.ProseMirror_p[data-placeholder]::before]:content-[attr(data-placeholder)]',
].join(' ')

/**
 * Nội dung editor frame (mm:I520:11647;520:9875): the formatting toolbar with the "Tiêu chuẩn cộng đồng" link, the editor box
 * (`editorSlot`, 200px, scrolls inside) and the "@ + tên" hint. Stateless: `tools` carry the pressed state and click handlers.
 */
export function KudoEditorFrameView({ tools, standardsHref, standardsLabel, editorSlot, hint, disabled, invalid }: KudoEditorFrameViewProps) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex flex-col">
        {/* mm:I520:11647;520:9877 */}
        <div role="toolbar" className="flex flex-wrap">
          {TOOLS.map(({ name, testId, Icon }, index) => (
            <Fragment key={name}>
              <button
                type="button"
                data-testid={testId}
                aria-pressed={tools[name].active}
                aria-label={tools[name].label}
                title={tools[name].label}
                disabled={disabled}
                // keep the editor selection: a toolbar press must not take focus away from the text
                onMouseDown={(event) => event.preventDefault()}
                onClick={tools[name].onClick}
                className={`${TOOL_CLASS} ${index === 0 ? 'rounded-tl-lg' : ''} ${index === TOOLS.length - 1 ? 'max-sm:rounded-tr-lg' : ''} ${MODAL_FOCUS_RING}`}
              >
                <Icon />
              </button>
            </Fragment>
          ))}
          {/* mm:I520:11647;3053:11619 */}
          <div className="flex h-10 basis-full items-center justify-center border border-saa-gold-border px-4 py-2.5 sm:min-w-0 sm:flex-1 sm:basis-0 sm:rounded-tr-lg">
            {/* mm:I520:11647;3053:11621 */}
            <Link
              href={standardsHref}
              target="_blank"
              rel="noopener noreferrer"
              data-testid="write-kudo-standards-link"
              className={`truncate text-base leading-6 font-bold tracking-[0.15px] text-[#e46060] underline ${MODAL_FOCUS_RING}`}
            >
              {standardsLabel}
            </Link>
          </div>
        </div>
        {/* mm:I520:11647;520:9886 */}
        <div
          data-testid="write-kudo-editor"
          aria-invalid={invalid || undefined}
          className={`h-[200px] min-h-[120px] overflow-y-auto rounded-b-lg border border-saa-gold-border bg-white px-6 text-saa-navy ${
            invalid ? 'border-[#cf1322]' : ''
          } ${disabled ? 'opacity-60' : ''} ${PROSE}`}
        >
          {editorSlot}
        </div>
      </div>
      {/* mm:I520:11647;520:9887 */}
      <p data-testid="write-kudo-mention-hint" className="m-0 text-center text-base leading-6 font-bold tracking-[0.5px] text-saa-navy">
        {hint}
      </p>
    </div>
  )
}
