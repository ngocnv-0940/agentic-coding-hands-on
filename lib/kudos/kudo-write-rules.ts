/**
 * Viết Kudo validation rules (BR-001..010), shared by the client hooks, the Server Actions and the browser upload
 * helper so every layer agrees; the `create_kudo` RPC enforces the same numbers and stays the authority.
 * Pure and environment-free: no `window`, no `next/*`, safe to import from client and server code.
 * "Trimmed" always means `String.prototype.trim` (all whitespace, as `kudos_private.trim_whitespace` in SQL).
 */

export const TITLE_MAX = 100
export const CONTENT_MAX = 2000
export const HASHTAGS_MIN = 1
export const HASHTAGS_MAX = 5
export const IMAGES_MAX = 5
export const IMAGE_MAX_BYTES = 5 * 1024 * 1024
export const ANON_NAME_MAX = 50
export const LINK_TEXT_MAX = 100
export const LINK_URL_MIN = 5
export const LINK_URL_MAX = 2048
export const SEARCH_QUERY_MAX = 100
export const SEARCH_DEBOUNCE_MS = 250
/** Serialized `content_doc` bound (D011), measured in UTF-8 bytes. */
export const CONTENT_DOC_MAX_BYTES = 64 * 1024

/** Accepted image types and the extension of their neutral object name. */
export const IMAGE_MIME = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' } as const
export type KudoImageMime = keyof typeof IMAGE_MIME

/** Neutral object name: uuid v4 plus an allowed extension, no uid in the path (same pattern as the SQL and the mock). */
export const KUDO_IMAGE_NAME = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\.(jpg|png|webp)$/

/** Length in code points, like Postgres `char_length` (an emoji counts once). */
export const textLength = (value: string): number => [...value].length

const inRange = (value: number, min: number, max: number) => value >= min && value <= max

export function isTitleValid(title: string): boolean {
  return inRange(textLength(title.trim()), 1, TITLE_MAX)
}

/** `plain` is the editor's plain text (ALG-002), not the JSON document. */
export function isContentValid(plain: string): boolean {
  return inRange(textLength(plain.trim()), 1, CONTENT_MAX)
}

/** An alias is optional: blank is fine, otherwise at most 50 characters after trimming. */
export function isAnonymousNameValid(name: string): boolean {
  return textLength(name.trim()) <= ANON_NAME_MAX
}

/** 1..5 slugs, none repeated. Whether each slug exists is for the database to decide. */
export function isHashtagSelectionValid(slugs: readonly string[]): boolean {
  return inRange(slugs.length, HASHTAGS_MIN, HASHTAGS_MAX) && new Set(slugs).size === slugs.length
}

/** Link dialog "Text": required, 1..100 after trimming (whitespace-only is empty). */
export function isLinkTextValid(text: string): boolean {
  return inRange(textLength(text.trim()), 1, LINK_TEXT_MAX)
}

/**
 * Link dialog "Link": http(s) only, 5..2048 characters, parseable. Strict about whitespace: callers must trim before
 * validating and insert the same trimmed value, otherwise the server (`^https?://`) would reject the whole kudo.
 */
export function isLinkUrlValid(url: string): boolean {
  if (!inRange(url.length, LINK_URL_MIN, LINK_URL_MAX) || !/^https?:\/\/\S+$/.test(url)) return false
  try {
    const { protocol } = new URL(url)
    return protocol === 'http:' || protocol === 'https:'
  } catch {
    return false
  }
}

/** Image type by magic bytes (JPEG `FF D8 FF`, PNG signature, WebP `RIFF....WEBP`), never by file name or `File.type`. */
export function sniffImageMime(bytes: Uint8Array): KudoImageMime | null {
  const startsWith = (signature: readonly number[], offset = 0) =>
    bytes.length >= offset + signature.length && signature.every((byte, i) => bytes[offset + i] === byte)
  if (startsWith([0xff, 0xd8, 0xff])) return 'image/jpeg'
  if (startsWith([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return 'image/png'
  if (startsWith([0x52, 0x49, 0x46, 0x46]) && startsWith([0x57, 0x45, 0x42, 0x50], 8)) return 'image/webp'
  return null
}

export type RequiredField = 'recipient' | 'title' | 'content' | 'hashtags'

export type RequiredFieldsState = {
  recipientId: string | null
  title: string
  /** Plain text of the editor. */
  content: string
  hashtagSlugs: readonly string[]
}

/** BR-001: the required fields still empty after trimming (recipient, title, content, at least one hashtag). */
export function requiredFieldErrors(state: RequiredFieldsState): RequiredField[] {
  const missing: RequiredField[] = []
  if (!state.recipientId) missing.push('recipient')
  if (state.title.trim() === '') missing.push('title')
  if (state.content.trim() === '') missing.push('content')
  if (state.hashtagSlugs.length < HASHTAGS_MIN) missing.push('hashtags')
  return missing
}
