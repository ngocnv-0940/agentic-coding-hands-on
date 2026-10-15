/**
 * HTTP routing for the Kudos part of the E2E mock: PostgREST-style POST /rest/v1/rpc/<fn> and the
 * mock-only control endpoints under /__e2e/kudos/. Called from mock-supabase-server.ts only.
 * Caller identity = the access token owner (same as /auth/v1/user); no bearer -> 401 like PostgREST.
 * Unknown /rest/v1 paths answer 404 and log to stderr, the same drift guard as the auth routes.
 */
import type { IncomingMessage, ServerResponse } from 'node:http'
import { EMPTY_DATASET, FULL_DATASET, kudosControl, resetKudosState, viewerIn, type MockDataset } from './mock-kudos-state'
import { filterOptions, feedPage, highlight, sidebar, spotlight } from './mock-kudos-board-queries'
import { KudosRpcError, toggleKudoLike } from './mock-kudos-like-rules'

/** Auth identity whose sunner set is empty (board, spotlight, gifts and stats all empty). */
export const KUDOS_EMPTY_USER_ID = 'kudos-empty'

type Body = Record<string, unknown>

async function readJson(req: IncomingMessage): Promise<Body> {
  const chunks: Buffer[] = []
  for await (const chunk of req) chunks.push(chunk as Buffer)
  const raw = Buffer.concat(chunks).toString('utf8')
  if (!raw) return {}
  try {
    return JSON.parse(raw) as Body
  } catch {
    return {}
  }
}

function send(res: ServerResponse, status: number, body?: unknown) {
  res.writeHead(status, { 'content-type': 'application/json' })
  res.end(body === undefined ? undefined : JSON.stringify(body))
}

const textArg = (value: unknown): string | null => (typeof value === 'string' ? value : null)

function datasetFor(owner: { id: string }): MockDataset {
  return owner.id === KUDOS_EMPTY_USER_ID ? EMPTY_DATASET : FULL_DATASET
}

/** Runs one RPC by name; returns the jsonb result or throws KudosRpcError / Error('unknown'). */
function runRpc(fn: string, args: Body, owner: { id: string }): unknown {
  const ds = datasetFor(owner)
  const viewer = viewerIn(ds, owner.id)
  switch (fn) {
    case 'kudos_filter_options':
      return filterOptions(ds)
    case 'kudos_highlight':
      return highlight(ds, viewer, textArg(args.p_hashtag), textArg(args.p_department))
    case 'kudos_feed_page':
      return feedPage(ds, viewer, {
        hashtag: textArg(args.p_hashtag),
        department: textArg(args.p_department),
        beforeCreatedAt: textArg(args.p_before_created_at),
        beforeId: textArg(args.p_before_id),
        limit: typeof args.p_limit === 'number' ? args.p_limit : 10,
      })
    case 'kudos_spotlight':
      return spotlight(ds)
    case 'kudos_sidebar':
      return sidebar(ds, viewer)
    case 'toggle_kudo_like':
      return toggleKudoLike(ds, viewer, String(args.p_kudo_id))
    default:
      throw new Error('unknown-function')
  }
}

/** Handles /rest/v1/rpc/* and /__e2e/kudos/*; every other request in this module is a 404. */
export async function handleKudosRest(req: IncomingMessage, res: ServerResponse, pathname: string, owner: { id: string } | undefined) {
  if (req.method === 'POST' && pathname === '/__e2e/kudos/reset') {
    resetKudosState()
    return send(res, 200, { ok: true })
  }
  if (req.method === 'POST' && pathname === '/__e2e/kudos/special-today') {
    kudosControl.specialToday = (await readJson(req)).on === true
    return send(res, 200, { specialToday: kudosControl.specialToday })
  }
  const rpc = /^\/rest\/v1\/rpc\/([a-z_]+)$/.exec(pathname)
  if (req.method === 'POST' && rpc) {
    const args = await readJson(req)
    if (!owner) return send(res, 401, { code: 'PGRST301', message: 'JWT invalid', details: null, hint: null })
    try {
      return send(res, 200, runRpc(rpc[1], args, owner))
    } catch (error) {
      if (error instanceof KudosRpcError) {
        return send(res, 400, { code: 'P0001', message: error.code, details: null, hint: null })
      }
      if (error instanceof Error && error.message === 'unknown-function') {
        console.error(`[e2e-mock-supabase] unhandled rpc ${rpc[1]}`)
        return send(res, 404, { code: 'PGRST202', message: `Could not find the function public.${rpc[1]}`, details: null, hint: null })
      }
      throw error
    }
  }
  console.error(`[e2e-mock-supabase] unhandled ${req.method} ${pathname}`)
  return send(res, 404, { code: 404, msg: `e2e mock has no route for ${req.method} ${pathname}` })
}
