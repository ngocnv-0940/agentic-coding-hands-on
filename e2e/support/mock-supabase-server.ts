/**
 * Mock Supabase Auth HTTP server for E2E only (node:http, no dependencies).
 * It stands in for the Supabase project at the network boundary: the app runs its
 * real @supabase/ssr client, cookies and proxy against this server via
 * NEXT_PUBLIC_SUPABASE_URL. Tokens are unsigned JWT-shaped strings; the app checks
 * sessions with getUser(), so no JWKS endpoint is served.
 * Unknown routes answer 404 and log to stderr to surface contract drift.
 * Importing this module has no side effects; start it via start-mock-supabase.ts.
 */
import { randomUUID } from 'node:crypto'
import { createServer, type IncomingMessage, type ServerResponse } from 'node:http'

export const MOCK_PORT = Number(process.env.E2E_SUPABASE_PORT ?? 54399)
export const STUB_CODE = 'stub-code'
export const STUB_CODE_ADMIN = 'stub-code-admin'
/** Security negative: `role: 'admin'` only in user_metadata (user-editable). The app must NOT grant admin. */
export const STUB_CODE_USERMETA_ADMIN = 'stub-code-usermeta-admin'

interface MockUser {
  id: string
  aud: string
  role: string
  email: string
  app_metadata: { provider: string; providers: string[]; role?: string }
  user_metadata: { full_name: string; role?: string }
  created_at: string
}

const USER: MockUser = {
  id: 'e2e-user',
  aud: 'authenticated',
  role: 'authenticated',
  email: 'e2e@example.com',
  app_metadata: { provider: 'google', providers: ['google'] },
  user_metadata: { full_name: 'E2E User' },
  created_at: '2026-01-01T00:00:00Z',
}

/** Same Google identity shape as USER, plus the app_metadata.role the homepage gate reads. */
const ADMIN_USER: MockUser = {
  ...USER,
  id: 'e2e-admin',
  email: 'e2e-admin@example.com',
  app_metadata: { provider: 'google', providers: ['google'], role: 'admin' },
  user_metadata: { full_name: 'E2E Admin' },
}

/** Same as USER but the admin claim sits in user_metadata only; app_metadata has no role. */
const USERMETA_ADMIN_USER: MockUser = {
  ...USER,
  id: 'e2e-usermeta-admin',
  email: 'e2e-usermeta-admin@example.com',
  user_metadata: { full_name: 'E2E Usermeta Admin', role: 'admin' },
}

/** Auth code issued by the stubbed Google redirect -> the identity the code signs in. */
const USERS: Record<string, MockUser> = {
  [STUB_CODE]: USER,
  [STUB_CODE_ADMIN]: ADMIN_USER,
  [STUB_CODE_USERMETA_ADMIN]: USERMETA_ADMIN_USER,
}

/** access token -> owner. A user endpoint call resolves the owner, so each session keeps its identity. */
const accessOwners = new Map<string, MockUser>()
/** refresh token -> owner. Refresh issues a new session for the same identity. */
const refreshOwners = new Map<string, MockUser>()

type Body = Record<string, unknown>

const b64url = (value: object) => Buffer.from(JSON.stringify(value)).toString('base64url')

function issueSession(user: MockUser) {
  const now = Math.floor(Date.now() / 1000)
  const expiresAt = now + 3600
  const accessToken = [
    b64url({ alg: 'HS256', typ: 'JWT' }),
    b64url({ sub: user.id, aud: 'authenticated', role: 'authenticated', email: user.email, iat: now, exp: expiresAt, jti: randomUUID() }),
    'e2e-unsigned',
  ].join('.')
  const refreshToken = `e2e-refresh-${randomUUID()}`
  accessOwners.set(accessToken, user)
  refreshOwners.set(refreshToken, user)
  return { access_token: accessToken, token_type: 'bearer', expires_in: 3600, expires_at: expiresAt, refresh_token: refreshToken, user }
}

async function readBody(req: IncomingMessage): Promise<Body> {
  const chunks: Buffer[] = []
  for await (const chunk of req) chunks.push(chunk as Buffer)
  const raw = Buffer.concat(chunks).toString('utf8')
  if (!raw) return {}
  if ((req.headers['content-type'] ?? '').includes('application/x-www-form-urlencoded')) {
    return Object.fromEntries(new URLSearchParams(raw))
  }
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

function bearerToken(req: IncomingMessage): string | undefined {
  const header = req.headers.authorization
  return header?.startsWith('Bearer ') ? header.slice('Bearer '.length) : undefined
}

async function handle(req: IncomingMessage, res: ServerResponse) {
  const url = new URL(req.url ?? '/', `http://localhost:${MOCK_PORT}`)
  const { pathname, searchParams } = url

  if (req.method === 'GET' && pathname === '/health') return send(res, 200, { status: 'ok' })

  if (req.method === 'POST' && pathname === '/auth/v1/token') {
    const body = await readBody(req)
    const grant = searchParams.get('grant_type')
    if (grant === 'pkce') {
      const owner = USERS[String(body.auth_code)]
      if (owner) return send(res, 200, issueSession(owner))
      console.error(`[e2e-mock-supabase] pkce rejected auth_code=${String(body.auth_code)}`)
      return send(res, 400, { error: 'invalid_grant', error_description: 'Invalid authorization code' })
    }
    const refreshOwner = refreshOwners.get(String(body.refresh_token))
    if (grant === 'refresh_token' && refreshOwner) {
      return send(res, 200, issueSession(refreshOwner))
    }
    return send(res, 400, { error: 'invalid_grant', error_description: `Unsupported grant ${grant}` })
  }

  if (req.method === 'GET' && pathname === '/auth/v1/user') {
    const owner = accessOwners.get(bearerToken(req) ?? '')
    if (owner) return send(res, 200, owner)
    return send(res, 401, { code: 401, error_code: 'bad_jwt', msg: 'invalid JWT' })
  }

  if (req.method === 'POST' && pathname === '/auth/v1/logout') {
    const token = bearerToken(req)
    if (token) accessOwners.delete(token)
    return send(res, 204)
  }

  console.error(`[e2e-mock-supabase] unhandled ${req.method} ${pathname}`)
  return send(res, 404, { code: 404, msg: `e2e mock has no route for ${req.method} ${pathname}` })
}

export function startMockSupabaseServer() {
  const server = createServer((req, res) => {
    handle(req, res).catch((error: unknown) => {
      console.error('[e2e-mock-supabase] handler error', error)
      send(res, 500, { code: 500, msg: 'mock handler error' })
    })
  })
  server.listen(MOCK_PORT, () => console.log(`[e2e-mock-supabase] listening on ${MOCK_PORT}`))
  return server
}
