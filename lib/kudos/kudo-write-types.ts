/**
 * Write-path shapes of Viết Kudo (F007): recipient search rows, the `create_kudo` payload and the result codes.
 * The nine RPC codes are the `message` of a P0001 raise in supabase/migrations/20261015035946_write_kudo_functions.sql;
 * the other three are produced by the Server Action itself.
 */

export type SunnerOption = {
  id: string
  name: string
  avatarUrl: string | null
  department: string | null
}

/** Tiptap document JSON (`editor.getJSON()`); its shape is re-validated by the RPC, never trusted here. */
export type KudoContentDoc = Record<string, unknown>

export type CreateKudoInput = {
  receiverId: string
  title: string
  /** Plain text derived from the editor (mentions as "@Full Name"). */
  content: string
  contentDoc: KudoContentDoc
  hashtagSlugs: string[]
  /** Neutral object names (`<uuid>.<ext>`) already uploaded to the `kudo-images` bucket. */
  imagePaths: string[]
  isAnonymous: boolean
  /** Alias; only sent when `isAnonymous`, blank means "show the default sender label". */
  anonymousName: string
}

export type CreateKudoRpcErrorCode =
  | 'sunner_not_found'
  | 'receiver_not_found'
  | 'self_kudo'
  | 'title_invalid'
  | 'content_invalid'
  | 'content_doc_invalid'
  | 'hashtags_invalid'
  | 'images_invalid'
  | 'anonymous_name_invalid'

export type CreateKudoErrorCode = CreateKudoRpcErrorCode | 'unauthenticated' | 'invalid_input' | 'unknown'

export type CreateKudoResult = { ok: true; kudoId: string } | { ok: false; code: CreateKudoErrorCode }

/** `{ ok: false }` covers a guest and a failed query alike: the UI then shows its "no result" text (INT-003). */
export type SearchSunnersResult = { ok: true; options: SunnerOption[] } | { ok: false }
