'use client'

import { useEffect, useRef, useState, type RefObject } from 'react'
import { IMAGE_MAX_BYTES, IMAGE_MIME, IMAGES_MAX, sniffImageMime } from '@/lib/kudos/kudo-write-rules'
import type { Dictionary } from '@/lib/i18n/dictionary-vi'

/** Dictionary keys of the inline picker errors (`ImagePickerViewProps.error` takes the translated text). */
export const IMAGE_ERROR_KEYS = {
  invalidType: 'writeKudo.image.invalidType',
  tooLarge: 'writeKudo.image.tooLarge',
} as const satisfies Record<string, keyof Dictionary>

export type ImageErrorKey = (typeof IMAGE_ERROR_KEYS)[keyof typeof IMAGE_ERROR_KEYS]

type Attachment = { id: string; file: File; previewUrl: string }

export type ImageAttachments = {
  /** `ImagePickerViewProps.items`: one thumbnail per kept file. */
  items: { id: string; previewUrl: string }[]
  canAdd: boolean
  /** `ImagePickerViewProps.onPick`. */
  add: (files: FileList) => void
  onRemove: (id: string) => void
  /** Dictionary key of the message for the last rejected pick (`null` when the last pick was clean); translate and pass to the picker only. */
  errorKey: ImageErrorKey | null
  accept: string
  inputRef: RefObject<HTMLInputElement | null>
  /** The kept files in display order, for `uploadKudoImages` on send. */
  files: () => File[]
}

const ACCEPT = Object.keys(IMAGE_MIME).join(',')
const SNIFF_BYTES = 12

/** `null` = fine. The type comes from the magic bytes (never from the name or `File.type`), then the 5 MB bound. */
async function rejection(file: File): Promise<ImageErrorKey | null> {
  const mime = sniffImageMime(new Uint8Array(await file.slice(0, SNIFF_BYTES).arrayBuffer()))
  if (!mime) return IMAGE_ERROR_KEYS.invalidType
  return file.size > IMAGE_MAX_BYTES ? IMAGE_ERROR_KEYS.tooLarge : null
}

/**
 * Image field (A9, F). Picking checks each file right away (magic bytes, then size); a rejected file is not added and sets
 * the inline error (the first reason of that pick), the valid ones are kept up to `5 - already kept`, extra ones are ignored.
 * Previews are object URLs, revoked on remove and on unmount. Nothing is uploaded here: `files()` hands the kept files to
 * the submit hook, so a cancelled draft leaves nothing in Storage.
 */
export function useImageAttachments(): ImageAttachments {
  const [items, setItems] = useState<Attachment[]>([])
  const [errorKey, setErrorKey] = useState<ImageErrorKey | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  // Mirror of `items` for code that runs after an `await` (it must see the picks that landed meanwhile) and for unmount.
  const kept = useRef<Attachment[]>([])

  useEffect(
    () => () => {
      kept.current.forEach((item) => URL.revokeObjectURL(item.previewUrl))
      kept.current = []
    },
    [],
  )

  const commit = (next: Attachment[]) => {
    kept.current = next
    setItems(next)
  }

  const add = (list: FileList) => {
    // The FileList is live: copy it before the input is reset (or the first `await` returns control to the browser).
    const picked = Array.from(list)
    if (inputRef.current) inputRef.current.value = ''
    void (async () => {
      let reason: ImageErrorKey | null = null
      const accepted: File[] = []
      for (const file of picked) {
        const failure = await rejection(file).catch(() => IMAGE_ERROR_KEYS.invalidType)
        if (failure) reason ??= failure
        else accepted.push(file)
      }
      setErrorKey(reason)
      const room = IMAGES_MAX - kept.current.length
      if (room <= 0 || accepted.length === 0) return
      const added = accepted.slice(0, room).map((file) => ({ id: crypto.randomUUID(), file, previewUrl: URL.createObjectURL(file) }))
      commit([...kept.current, ...added])
    })()
  }

  const onRemove = (id: string) => {
    const gone = kept.current.find((item) => item.id === id)
    if (!gone) return
    URL.revokeObjectURL(gone.previewUrl)
    commit(kept.current.filter((item) => item.id !== id))
  }

  return {
    items: items.map(({ id, previewUrl }) => ({ id, previewUrl })),
    canAdd: items.length < IMAGES_MAX,
    add,
    onRemove,
    errorKey,
    accept: ACCEPT,
    inputRef,
    files: () => kept.current.map((item) => item.file),
  }
}
