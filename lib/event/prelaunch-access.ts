export const PRELAUNCH_PATH = '/prelaunch'

const LOGIN_PATH = '/login'
// Prefixes that stay reachable while the site is locked.
const LOCK_EXEMPT_PREFIXES = ['/auth/', '/_next/']

/**
 * - `lock`: before the start, send the request to {@link PRELAUNCH_PATH}.
 * - `unlock`: after the start (or with no valid start), `/prelaunch` has no purpose: send it to `/`.
 * - `pass`: hand over to the regular route guards unchanged.
 */
export type PrelaunchAccess = 'lock' | 'unlock' | 'pass'

/**
 * ALG-001: pre-launch lock decision. Pure: the caller supplies the server clock and the
 * parsed `EVENT_START_AT`, so nothing from the client can influence it (FR-601).
 *
 * - BR-001: `start === null` (missing or invalid env) means "already started" — no lock, on
 *   purpose, so a broken config never locks everyone out.
 * - BR-005: `now == start` counts as started (strict `<`).
 * - BR-003: `/login` and `/auth/*` stay open so users can sign in before launch.
 * - `/_next/*` stays open as well: the proxy matcher only excludes `_next/static` and
 *   `_next/image`, so without this the dev HMR socket and other Next internals would be
 *   redirected (FR-102 lists `_next` as exempt).
 * - Only `/prelaunch` itself is exempt; `/prelaunch/x` and unknown paths are locked.
 */
export function decidePrelaunchAccess(
  pathname: string,
  nowMs: number,
  start: Date | null,
): PrelaunchAccess {
  const locked = start !== null && nowMs < start.getTime()
  if (!locked) return pathname === PRELAUNCH_PATH ? 'unlock' : 'pass'

  const exempt =
    pathname === PRELAUNCH_PATH ||
    pathname === LOGIN_PATH ||
    LOCK_EXEMPT_PREFIXES.some((prefix) => pathname.startsWith(prefix))
  return exempt ? 'pass' : 'lock'
}
