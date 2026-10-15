import type { CreateKudoErrorCode, CreateKudoInput, CreateKudoRpcErrorCode, SunnerOption } from './kudo-write-types'
import { isUuid } from './kudo-input-validation'
import {
  CONTENT_DOC_MAX_BYTES,
  IMAGES_MAX,
  KUDO_IMAGE_NAME,
  isAnonymousNameValid,
  isContentValid,
  isHashtagSelectionValid,
  isTitleValid,
} from './kudo-write-rules'

/** Pure helpers of the write Server Actions, kept out of the `'use server'` files (those may only export async functions). */

const RPC_ERROR_CODES: ReadonlySet<string> = new Set<CreateKudoRpcErrorCode>([
  'sunner_not_found',
  'receiver_not_found',
  'self_kudo',
  'title_invalid',
  'content_invalid',
  'content_doc_invalid',
  'hashtags_invalid',
  'images_invalid',
  'anonymous_name_invalid',
])

/** PostgREST `message` -> code. Anything that is not one of the fixed `create_kudo` codes is `unknown` (raw DB text never leaves the server). */
export function toCreateKudoErrorCode(message: unknown): CreateKudoErrorCode {
  return typeof message === 'string' && RPC_ERROR_CODES.has(message) ? (message as CreateKudoRpcErrorCode) : 'unknown'
}

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const isStringArray = (value: unknown): value is string[] => Array.isArray(value) && value.every((item) => typeof item === 'string')

function docFitsBudget(doc: unknown): boolean {
  try {
    return new TextEncoder().encode(JSON.stringify(doc)).length <= CONTENT_DOC_MAX_BYTES
  } catch {
    return false // e.g. a BigInt or a cycle: not a document the editor produced
  }
}

/**
 * Validates an untrusted Server Action argument as a `CreateKudoInput` with the same rules the client applies.
 * Returns `null` for anything malformed. Only known keys are copied out, so extra client fields never reach the RPC.
 */
export function parseCreateKudoInput(value: unknown): CreateKudoInput | null {
  if (!isPlainObject(value)) return null
  const { receiverId, title, content, contentDoc, hashtagSlugs, imagePaths, isAnonymous, anonymousName } = value
  if (!isUuid(receiverId)) return null
  if (typeof title !== 'string' || !isTitleValid(title)) return null
  if (typeof content !== 'string' || !isContentValid(content)) return null
  if (!isPlainObject(contentDoc) || !docFitsBudget(contentDoc)) return null
  if (!isStringArray(hashtagSlugs) || !isHashtagSelectionValid(hashtagSlugs)) return null
  if (!isStringArray(imagePaths) || imagePaths.length > IMAGES_MAX) return null
  if (new Set(imagePaths).size !== imagePaths.length || !imagePaths.every((name) => KUDO_IMAGE_NAME.test(name))) return null
  if (typeof isAnonymous !== 'boolean') return null
  if (typeof anonymousName !== 'string' || !isAnonymousNameValid(anonymousName)) return null
  return {
    receiverId,
    title,
    content,
    contentDoc,
    hashtagSlugs: [...hashtagSlugs],
    imagePaths: [...imagePaths],
    isAnonymous,
    anonymousName,
  }
}

/** `search_sunners` rows -> options; a row of the wrong shape is skipped rather than trusted. */
export function toSunnerOptions(data: unknown): SunnerOption[] {
  if (!Array.isArray(data)) return []
  return data.flatMap((row): SunnerOption[] => {
    if (!isPlainObject(row) || !isUuid(row.id) || typeof row.name !== 'string') return []
    const { avatarUrl, department } = row
    return [
      {
        id: row.id,
        name: row.name,
        avatarUrl: typeof avatarUrl === 'string' ? avatarUrl : null,
        department: typeof department === 'string' ? department : null,
      },
    ]
  })
}
