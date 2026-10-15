import Image from 'next/image'
import { MODAL_FOCUS_RING } from './write-kudo-field-row'
import { IconCloseTiny, IconPlus } from './write-kudo-icons'
import type { ImagePickerViewProps } from './write-kudo-view-types'

const INPUT_ID = 'write-kudo-image-input'

/**
 * Image row body (mm:I520:11647;520:9896): up to five 80px thumbnails with a red remove badge, then the "+ Image / Tối đa 5" button.
 * The button is a label for the visually hidden file input, so a click (or Enter/Space on the focused input) opens the native
 * picker without any script. The input stays in the DOM even when the button is hidden; the wiring owns `inputRef`, reads the
 * picked files (copy them: the list empties once it resets the input value) and enforces the 5 file / 5 MB / type limits.
 */
export function ImagePickerView({ items, canAdd, onPick, onRemove, error, accept, labels, disabled, inputRef }: ImagePickerViewProps) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-4">
        {items.map((item) => (
          // mm:I520:11647;662:9197
          <div key={item.id} data-testid="write-kudo-image-thumb" className="relative size-20 shrink-0">
            {/* mm:I520:11647;662:9197;256:4717 */}
            <div className="relative size-full overflow-hidden rounded border border-saa-gold-border bg-white">
              <Image src={item.previewUrl} alt={labels.thumbAlt} fill unoptimized sizes="80px" className="object-cover" />
            </div>
            {/* mm:I520:11647;662:9197;662:9287 — 20px #D4271D badge, 8px outside the thumbnail corner */}
            <button
              type="button"
              data-testid="write-kudo-image-remove"
              aria-label={labels.remove}
              disabled={disabled}
              onClick={() => onRemove(item.id)}
              className={`absolute -top-2 -right-2 inline-flex size-5 cursor-pointer items-center justify-center rounded-full bg-[#d4271d] p-[1.4px] text-white transition-transform duration-200 hover:scale-110 disabled:cursor-not-allowed disabled:opacity-60 motion-reduce:transition-none ${MODAL_FOCUS_RING}`}
            >
              <IconCloseTiny />
            </button>
          </div>
        ))}
        <input
          ref={inputRef}
          id={INPUT_ID}
          type="file"
          multiple
          data-testid="write-kudo-image-input"
          accept={accept}
          disabled={disabled}
          tabIndex={canAdd ? 0 : -1}
          onChange={(event) => {
            if (event.target.files && event.target.files.length > 0) onPick(event.target.files)
          }}
          className="peer sr-only"
        />
        {canAdd ? (
          // mm:I520:11647;662:9133
          <label
            htmlFor={INPUT_ID}
            data-testid="write-kudo-image-add"
            aria-disabled={disabled || undefined}
            className={`flex h-12 cursor-pointer items-center gap-2 rounded-lg border border-saa-gold-border bg-white px-2 py-1 text-left transition-colors duration-200 hover:bg-[rgba(255,234,158,0.3)] aria-disabled:cursor-not-allowed aria-disabled:opacity-60 peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-saa-navy`}
          >
            {/* mm:I520:11647;662:9133;186:2759 */}
            <IconPlus className="shrink-0 text-saa-gold-border" />
            {/* mm:I520:11647;662:9133;186:2760 */}
            <span className="flex flex-col">
              <span className="text-base leading-5 font-bold tracking-[0.15px] text-saa-navy">{labels.add}</span>
              <span className="text-[11px] leading-4 font-bold tracking-[0.5px] text-[#999]">{labels.hint}</span>
            </span>
          </label>
        ) : null}
      </div>
      {error ? (
        <p data-testid="write-kudo-image-error" role="alert" className="m-0 text-sm leading-5 font-bold text-[#cf1322]">
          {error}
        </p>
      ) : null}
    </div>
  )
}
