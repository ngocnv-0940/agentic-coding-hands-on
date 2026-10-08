# Research: Supabase SSR Google OAuth, Next 16.4 (local Supabase CLI)
Date 2026-10-08. No applicable tkm skill beyond help/research/search-docs; used WebFetch + raw GitHub.

## CAVEAT: local Next docs not read
Hook blocked Bash on `node_modules/next/dist/docs` ("dist" in .tkmignore). Did NOT bypass. Used official nextjs.org pages instead (frontmatter `version: 16.4.0`, same content source). Lead may add `!dist` to `.claude/.tkmignore` if file:line citations from node_modules are required.

## 1. Packages (npm view, 2026-10-08)
- `@supabase/supabase-js` 2.117.3; `@supabase/ssr` 0.12.7 (peer `supabase-js ^2.114.0`); `supabase` CLI 2.120.0.
- No React/Next peer deps on ssr -> no 16/19 conflict. Install: `bun add @supabase/supabase-js @supabase/ssr`; `bun add -d supabase` (then `bunx supabase ...`).
- ssr >=0.10.0 passes cache headers as 2nd arg to `setAll` (advanced-guide.mdx:73).

## 2. Next 16 facts (nextjs.org/docs/app/api-reference/file-conventions/proxy, v16.4.0)
- `middleware.ts` DEPRECATED -> `proxy.ts` since v16.0.0. Export named `proxy` (or default fn). Codemod: `npx @next/codemod@canary middleware-to-proxy .`
- Signature: `export function proxy(request: NextRequest)` (may be async); optional `export const config = { matcher }`. Type `NextProxy` available.
- Runtime = Node.js default; `runtime` config in proxy THROWS. File at project root (same level as `app/`).
- Server Actions are POSTs to the page route; matcher exclusion skips them -> verify auth inside each action too (proxy doc, Execution order note).
- `cookies()` is async (`await cookies()`); read in Server Components; `.set/.delete` only in Server Function or Route Handler (cookies doc). Using it opts route into dynamic rendering.

## 3. Canonical @supabase/ssr files (Vercel `examples/with-supabase`, current canary; Supabase docs ssr guide)
Env (`.env.local`): `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. Docs now say "publishable"; legacy "anon" key still works but new default. Local `supabase start` prints `Publishable sb_publishable_...` and `Secret sb_secret_...` (getting-started.mdx:185).

`lib/supabase/client.ts`
```ts
import { createBrowserClient } from "@supabase/ssr";
export function createClient() {
  return createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!);
}
```
`lib/supabase/server.ts` (new client per call, never global)
```ts
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
export async function createClient() {
  const cookieStore = await cookies();
  return createServerClient(URL, KEY, { cookies: {
    getAll() { return cookieStore.getAll(); },
    setAll(cookiesToSet) {
      try { cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options)); }
      catch { /* called from Server Component; ignorable because proxy refreshes session */ }
    },
  }});
}
```
`lib/supabase/proxy.ts` `updateSession(request)`: create `supabaseResponse = NextResponse.next({ request })`; `createServerClient` with `getAll: request.cookies.getAll()`; `setAll`: set on `request.cookies`, rebuild `supabaseResponse = NextResponse.next({ request })`, set on `supabaseResponse.cookies`. Then NO code between client creation and:
```ts
const { data } = await supabase.auth.getClaims(); const user = data?.claims;
```
Must RETURN `supabaseResponse` as-is; any custom redirect/response must copy cookies (+ cache headers) or sessions drop.
Root `proxy.ts`:
```ts
export async function proxy(request: NextRequest) { return await updateSession(request); }
export const config = { matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"] };
```
Redirect pattern for our need (inside updateSession after getClaims): `/todo*` && !user -> `url.pathname='/login'`, `NextResponse.redirect(url)`; `/login` && user -> `/todo`. Skip `/auth/*`. Copy cookies onto redirect: `redirect.cookies.setAll(supabaseResponse.cookies.getAll())`.

## 4. Google sign-in + callback
Same-tab PKCE (client component click handler; browser client auto-redirects to Google):
```ts
await createClient().auth.signInWithOAuth({ provider: "google",
  options: { redirectTo: `${location.origin}/auth/callback` } }); // add ?next=/todo if wanted
```
(oauth_pkce_flow.mdx; redirectTo MUST be in allow-list.) Browser client stores PKCE verifier cookie; callback `app/auth/callback/route.ts`:
```ts
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  let next = searchParams.get("next") ?? "/todo"; if (!next.startsWith("/")) next = "/todo";
  if (code) { const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(`${origin}${next}`); }
  return NextResponse.redirect(`${origin}/login?error=...`);
}
```
Official sample redirects to `/auth/auth-code-error` and handles `x-forwarded-host` in prod (redirect `https://${forwardedHost}`) - keep that for deploy; local = `origin`.
Cancel/deny: UNVERIFIED in docs (docs mention no error params). General GoTrue behaviour: redirect to `redirectTo` with `?error=access_denied&error_code=...&error_description=...` and no `code`. Callback should read `error`/`error_description` first, then `code`; neither -> `/login?error=...`. Cancel at Google consent surfaces as `access_denied`. Verify manually against local stack (e2e).
Logout: Server Action `'use server'` -> `await (await createClient()).auth.signOut(); redirect('/login')` (cookie clear allowed in Server Function). Alt: POST route handler.

## 5. Local Supabase
- `bunx supabase init` creates `supabase/config.toml` (+ `.gitignore`, dir). `supabase start`: API http://127.0.0.1:54321, Studio :54323, Postgres :54322 (needs Docker).
- config.toml (config docs): `auth.site_url` default `http://localhost:3000`; `auth.additional_redirect_urls` default `["https://localhost:3000"]` (NOTE https; set to `["http://localhost:3000/**"]` or exact `http://localhost:3000/auth/callback`; wildcard `/*` excludes nested/trailing slash, `/**` matches nested - redirect-urls.mdx:55). Exact-match list.
```toml
[auth]
site_url = "http://localhost:3000"
additional_redirect_urls = ["http://localhost:3000/**", "http://127.0.0.1:3000/**"]
[auth.external.google]
enabled = true
client_id = "env(SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_ID)"   # docs show literal id; env() is supported for secret, assume same for id (verify on `supabase start`)
secret = "env(SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_SECRET)"
skip_nonce_check = false   # keep false for redirect (non-ID-token) flow; true only for native/one-tap issues
```
- Secret env: `supabase/.env` (CLI reads it for `env()` substitution) with `SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_SECRET=...`; gitignore it. Restart `supabase stop && supabase start` after config change.
- Google Cloud (Web application client): Authorized redirect URI `http://127.0.0.1:54321/auth/v1/callback`; Authorized JS origin `http://localhost:3000` (auth-google.mdx:~70). Use 127.0.0.1 for callback (not localhost) as docs say.
- Gotcha: stick to ONE host in the browser (localhost vs 127.0.0.1) - PKCE verifier cookie is per-host; mismatch = "code verifier not found"/invalid flow state.
- `.env.local`: URL `http://127.0.0.1:54321`, publishable key from `supabase status`.

## 6. Pitfalls
- `getSession()` on server = unverified cookie data; don't trust for authz. Proxy uses `getClaims()` (verifies JWT signature/expiry, current recommendation). `getUser()` hits Auth server, detects revoked sessions - use where that matters (advanced-guide.mdx:51). With asymmetric JWT signing keys getClaims is local; local CLI uses default config - works.
- Server Components can't set cookies -> proxy must refresh; `setAll` try/catch in server.ts is intentional.
- Cache: don't ISR/static-cache pages that refresh session; Set-Cookie could leak to other users (advanced-guide.mdx:65-73). Authenticated pages reading `cookies()` are dynamic by default. If Cache Components is enabled, wrap in `<Suspense>`.
- Don't put the server client in a global/module variable.
- Proxy-only auth is insufficient: re-check user in Server Actions/pages for `/todo` data (Next proxy doc note).
- Redirect built in proxy must carry the refreshed cookies.
- `next` param: validate startsWith("/") (open redirect).

## Ranking / decision
1. Browser-client `signInWithOAuth` + `/auth/callback` route + proxy `getClaims` (official, minimal, YAGNI). Risk: low; ssr is 0.x (semver-minor can break) but is Supabase-maintained, canonical.
2. Server-action-initiated OAuth: more code, no benefit here.
3. Google One-Tap/`signInWithIdToken`: needs skip_nonce_check/nonce handling, not required.
Source credibility: Supabase official docs/repo + Next.js official docs + Vercel example (high). Blog results (iloveblogs, eastondev) low; not used.

## Unresolved
- Error param names on cancel not confirmed from official docs; confirm via e2e/manual.
- `env()` in `client_id` not explicitly documented; docs example is literal id. Test on `supabase start`, else hardcode client_id (not secret).
- Next dist docs unread (hook block); verify nothing differs from web v16.4.0 docs.
- Whether Cache Components is enabled in next.config.ts not checked.

**Status:** DONE_WITH_CONCERNS
**Summary:** Report written with versions (ssr 0.12.7, supabase-js 2.117.3), proxy.ts rename (named `proxy` export, Node runtime), code shapes, local config.toml and Google URIs, pitfalls, ranked call.
**Concerns/Blockers:** hook blocked reading node_modules/next/dist/docs (not bypassed; used nextjs.org v16.4.0 docs); error query-param behavior and `env()` for client_id not confirmed by official docs.
