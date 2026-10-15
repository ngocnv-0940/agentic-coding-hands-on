/**
 * Like toggle of the Kudos mock, same rules as the SQL RPC toggle_kudo_like (ALG-003, BR-002..006):
 * one like per sunner per kudo; the sender cannot like their own kudo; a like on a special day
 * awards 2 hearts, otherwise 1; an unlike removes the row, so exactly the stored value is revoked.
 */
import { likeCountOf } from './mock-kudos-board-queries'
import { kudosControl, likeRows, type MockDataset } from './mock-kudos-state'
import type { MockSunner } from './mock-kudos-fixture-people'

/** Raised with the PostgREST-style P0001 message the app maps to a toast. */
export class KudosRpcError extends Error {
  constructor(readonly code: 'sunner_not_found' | 'kudo_not_found' | 'self_like') {
    super(code)
  }
}

export function toggleKudoLike(ds: MockDataset, viewer: MockSunner | undefined, kudoId: string): { liked: boolean; likeCount: number } {
  if (!viewer) throw new KudosRpcError('sunner_not_found')
  const kudo = ds.kudos.find((item) => item.id === kudoId)
  if (!kudo) throw new KudosRpcError('kudo_not_found')
  if (kudo.senderId === viewer.id) throw new KudosRpcError('self_like')

  let rows = likeRows.get(kudoId)
  if (rows?.has(viewer.id)) {
    rows.delete(viewer.id)
    return { liked: false, likeCount: likeCountOf(kudo) }
  }
  if (!rows) {
    rows = new Map()
    likeRows.set(kudoId, rows)
  }
  rows.set(viewer.id, kudosControl.specialToday ? 2 : 1)
  return { liked: true, likeCount: likeCountOf(kudo) }
}
