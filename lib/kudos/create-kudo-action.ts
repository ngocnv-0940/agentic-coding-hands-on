'use server'

import { getCurrentUser } from '@/lib/auth/get-current-user'
import { createClient } from '@/lib/supabase/server'
import { parseCreateKudoInput, toCreateKudoErrorCode } from './create-kudo-input'
import { isUuid } from './kudo-input-validation'
import type { CreateKudoResult } from './kudo-write-types'

const UNKNOWN: CreateKudoResult = { ok: false, code: 'unknown' }

/**
 * Sends one kudo (INT-002). A Server Action is a public POST endpoint, so it re-checks the session and treats every
 * field as untrusted (`parseCreateKudoInput`) before the SECURITY DEFINER RPC re-validates everything and writes kudo,
 * hashtags and images in one transaction. Images are NOT carried here: the browser already uploaded them to Storage
 * and only their neutral names arrive. The RPC's error text is mapped to a code, never forwarded. No `refresh()`: the
 * client calls `router.refresh()` once the result is `ok`, so a failed send leaves the board untouched.
 */
export async function createKudoAction(input: unknown): Promise<CreateKudoResult> {
  if (!(await getCurrentUser())) return { ok: false, code: 'unauthenticated' }
  const parsed = parseCreateKudoInput(input)
  if (!parsed) return { ok: false, code: 'invalid_input' }

  try {
    const supabase = await createClient()
    const { data, error } = await supabase.rpc('create_kudo', {
      p_receiver_id: parsed.receiverId,
      p_title: parsed.title,
      p_content: parsed.content,
      p_content_doc: parsed.contentDoc,
      p_hashtag_slugs: parsed.hashtagSlugs,
      p_image_paths: parsed.imagePaths,
      p_is_anonymous: parsed.isAnonymous,
      p_anonymous_name: parsed.isAnonymous ? parsed.anonymousName : null,
    })

    if (error) {
      const code = toCreateKudoErrorCode(error.message)
      if (code === 'unknown') console.error('[kudos] create_kudo failed', error.code)
      return { ok: false, code }
    }
    const kudoId = typeof data === 'object' && data !== null ? (data as { kudoId?: unknown }).kudoId : undefined
    if (!isUuid(kudoId)) {
      console.error('[kudos] create_kudo returned an unexpected shape')
      return UNKNOWN
    }
    return { ok: true, kudoId }
  } catch (error) {
    console.error('[kudos] create_kudo threw', error instanceof Error ? error.name : 'unknown')
    return UNKNOWN
  }
}
