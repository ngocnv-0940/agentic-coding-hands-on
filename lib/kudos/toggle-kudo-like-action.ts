'use server'

import { getCurrentUser } from '@/lib/auth/get-current-user'
import { createClient } from '@/lib/supabase/server'
import type { LikeActionResult, LikeErrorCode } from './kudo-board-types'
import { isUuid } from './kudo-input-validation'

const KNOWN_ERRORS: ReadonlySet<string> = new Set<LikeErrorCode>(['self_like', 'sunner_not_found', 'kudo_not_found'])

const FAILED: LikeActionResult = { ok: false, code: 'unknown' }

/**
 * Like or unlike one kudo (A6, INT-002). Public POST endpoint: re-checks the session and the id shape, then calls
 * the SECURITY DEFINER RPC with the user's own session, which decides everything else (who the viewer is, self-like,
 * hearts awarded). The RPC's error text is mapped to a code and never forwarded. No `refresh()`/revalidate: the page
 * does not re-render, so Highlight keeps its order after a like (A6).
 */
export async function toggleKudoLikeAction(kudoId: string): Promise<LikeActionResult> {
  if (!isUuid(kudoId)) return FAILED
  if (!(await getCurrentUser())) return FAILED

  try {
    const supabase = await createClient()
    const { data, error } = await supabase.rpc('toggle_kudo_like', { p_kudo_id: kudoId })

    if (error) {
      if (KNOWN_ERRORS.has(error.message)) return { ok: false, code: error.message as LikeErrorCode }
      console.error('[kudos] toggle_kudo_like failed', error.code)
      return FAILED
    }
    if (
      typeof data !== 'object' ||
      data === null ||
      typeof data.liked !== 'boolean' ||
      !Number.isSafeInteger(data.likeCount) ||
      data.likeCount < 0
    ) {
      console.error('[kudos] toggle_kudo_like returned an unexpected shape')
      return FAILED
    }
    return { ok: true, liked: data.liked, likeCount: data.likeCount }
  } catch (error) {
    console.error('[kudos] toggle_kudo_like threw', error instanceof Error ? error.name : 'unknown')
    return FAILED
  }
}
