# Study: Playwright E2E + Supabase Google-OAuth stubbing (Next 16.4, bun)
Date 2026-10-08. Sources ~8 (official Next docs v16.3.8, Next testmode README, @supabase/ssr 0.10.3 src/docs, community posts). Fewer than 3 independent refs on cookie chunk size -> flagged below.

## Verdict (ranked)
Server-side mocking: 1) (b) local mock Supabase HTTP server  2) (a) Next testmode `onFetch`  3) (c) real local Supabase (Docker; optional `@smoke` only).
Why (b): no Docker; no experimental Next API; covers proxy + route handler + server components identically; app code untouched (only env `NEXT_PUBLIC_SUPABASE_URL` points at mock = network boundary, matches clarification). (a) is documented "experimental", needs `experimental.testProxy` in next.config (app config change), README silent on dev-vs-start and on whether Next 16 `proxy.ts` fetches are proxied -> unverified risk. (c) violates "no Docker".

## 1. Install + config
- Latest `@playwright/test` = 1.64.0 (`npm view`). `bun add -d @playwright/test`; browsers: `bunx playwright install chromium` (CI/WSL: add `--with-deps`).
- Script: `"test:e2e": "playwright test"` (run via `bun run test:e2e`; bunx/playwright launches under node shebang - do not force `--bun`).
- Next official guide recommends testing against production build; `webServer` alternative is allowed ([Next docs](https://nextjs.org/docs/app/guides/testing/playwright)). Trade-off: `NEXT_PUBLIC_*` is inlined at build, so env must be set in the build command.
- Pick: dev server locally (fast, `reuseExistingServer: !process.env.CI`), `bun run build && bun run start` in CI. Dedicated ports (3100 app, 54399 mock) so a dev `next dev` on 3000 is not clobbered (Next 16 also locks one dev per dir).
- Use `localhost` everywhere (not 127.0.0.1): avoids dev cross-origin warnings, and gives predictable cookie name (see 4).

```ts
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test'
const APP = 'http://localhost:3100', MOCK = 'http://localhost:54399'
const env = { NEXT_PUBLIC_SUPABASE_URL: MOCK, NEXT_PUBLIC_SUPABASE_ANON_KEY: 'e2e-anon-key' }
export default defineConfig({
  testDir: './e2e', fullyParallel: true, workers: process.env.CI ? 2 : undefined,
  retries: process.env.CI ? 1 : 0, reporter: [['list'], ['html', { open: 'never' }]],
  use: { baseURL: APP, trace: 'on-first-retry' },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: [
    { command: 'bun e2e/support/mock-supabase-server.ts', url: `${MOCK}/health`, reuseExistingServer: !process.env.CI },
    { command: process.env.CI ? 'bun run build && bun run start -p 3100' : 'bun run dev -p 3100',
      url: `${APP}/login`, env, reuseExistingServer: !process.env.CI, timeout: 180_000 },
  ],
})
```
Add to .gitignore: `test-results/ playwright-report/ e2e/.auth/`. Keep tests in `e2e/` (not `app/`, which would route-scan).

## 2. Assert OAuth START without Google
Browser top-level navigation to an external URL is interceptable with `page.route`. Fulfil with 302 -> nothing leaves the machine; hold the handler to observe the loading state.
```ts
test('login starts google oauth', async ({ page }) => {
  let release!: () => void; const gate = new Promise<void>(r => (release = r))
  let seen: URL | undefined
  await page.route('**/auth/v1/authorize**', async route => {
    seen = new URL(route.request().url()); await gate
    await route.fulfill({ status: 302, headers: { location: '/login?stub=1' } }) // or /auth/callback?code=stub-code
  })
  await page.goto('/login')
  const btn = page.getByRole('button', { name: /login with google/i })
  await btn.click()
  await expect(btn).toBeDisabled()                    // observed BEFORE navigation completes
  await expect(page.getByRole('status')).toBeVisible() // loader: give it role=status / aria-busy in impl
  release()
  await page.waitForURL(/stub=1/)
  expect(seen!.origin).toBe('http://localhost:54399')
  expect(seen!.searchParams.get('provider')).toBe('google')
  expect(seen!.searchParams.get('redirect_to')).toContain('/auth/callback')
  expect(seen!.searchParams.get('code_challenge')).toBeTruthy()
  expect(seen!.searchParams.get('code_challenge_method')).toBe('s256')
})
```
Because SUPABASE_URL = mock server, one can also serve `/auth/v1/authorize` there; `page.route` is simpler for param asserts. Bonus honesty: letting the real button click run sets the genuine PKCE verifier cookie, so the follow-up callback test needs no forged verifier (route 302 -> `/auth/callback?code=stub-code`, in same test).

## 3. Server-side flows (callback exchange, proxy getUser)
`page.route` cannot see Node fetches. Chosen (b): ~60-line `node:http`/`Bun.serve` mock, run under webServer (above):
- `GET /health` -> 200
- `POST /auth/v1/token?grant_type=pkce` -> 200 session JSON when body `auth_code==='stub-code'`, else 400 `{error:'invalid_grant', error_description:'...'}` (drives failure/cancel -> `/login?error=`)
- `GET /auth/v1/user` -> 200 user JSON iff `Authorization: Bearer e2e-access-token`, else 401 (drives proxy redirect rules)
- `POST /auth/v1/logout` -> 204
- `POST /auth/v1/token?grant_type=refresh_token` -> new session (only if expiry < ~10s)
Session JSON: `{access_token, refresh_token, token_type:'bearer', expires_in:3600, expires_at, user:{id,email:'e2e@example.com',aud:'authenticated',...}}`.
Gotchas:
- If app uses `getClaims()` (asymmetric JWT) the client fetches `/auth/v1/.well-known/jwks.json`; mock must serve it or app should use `getUser()` (preferred for proxy; server-validated). Check the impl choice.
- Cancel path: Google cancel returns `/auth/callback?error=access_denied...` (no code) - test with no mock involvement.
- Honest framing: mock replaces Supabase/Google the external service, app code runs real (real @supabase/ssr, real cookies, real proxy). Does not prove Supabase actually accepts the config -> add optional `@smoke` (c) run with Docker, excluded from default via `--grep-invert @smoke`.
- (a) if ever preferred: `experimental:{testProxy:true}` gated by env in next.config, import `test`/`expect` from `next/experimental/testmode/playwright`, `next.onFetch(req => new Response(...) | 'abort')`; unhandled = abort unless `fetchLoopback` ([README](https://github.com/vercel/next.js/blob/canary/packages/next/src/experimental/testmode/playwright/README.md)). Does not intercept relative URLs.

## 4. Seeding an authenticated cookie (@supabase/ssr)
Facts ([ssr cookies.ts 0.10.3](https://cdn.jsdelivr.net/npm/@supabase/ssr@0.10.3/src/cookies.ts), [design.md](https://cdn.jsdelivr.net/npm/@supabase/ssr@0.10.3/docs/design.md)):
- Name `sb-<ref>-auth-token`; `<ref>` = first hostname label of SUPABASE_URL (from my knowledge of ssr, not re-verified in this pass) -> `http://localhost:54399` => `sb-localhost-auth-token`. Verify once by logging cookies in a spec.
- Value = `"base64-" + base64url(JSON.stringify(session))`, no padding. Invalid JSON after decode => treated as no session.
- Chunking: whole prefixed string split into `.0`, `.1`...; each <= ~3180 chars (UNVERIFIED, check `createChunks` in installed pkg). Keep fixture JWT small -> single unchunked cookie.
- Clear all `sb-*-auth-token*` first (stale-chunk bug) ([note](https://www.guardlayer.io/blog/supabase-ssr-stale-cookie-data)). Server client must use `getAll/setAll`.
```ts
// e2e/support/auth-cookie.ts
const b64u = (s: string) => Buffer.from(s).toString('base64url')
export async function signIn(context: BrowserContext) {
  const jwt = [b64u('{"alg":"HS256","typ":"JWT"}'), b64u(JSON.stringify({sub:'u1',exp:4102444800,role:'authenticated'})), 'sig'].join('.')
  const session = { access_token: 'e2e-access-token', refresh_token: 'r', token_type: 'bearer', expires_in: 3600,
    expires_at: 4102444800, user: { id: 'u1', email: 'e2e@example.com', aud: 'authenticated', role: 'authenticated' } }
  await context.clearCookies()
  await context.addCookies([{ name: 'sb-localhost-auth-token', value: 'base64-' + b64u(JSON.stringify(session)),
    url: 'http://localhost:3100', sameSite: 'Lax' }])
}
```
(Mock accepts literal `e2e-access-token`; `jwt` var only needed if impl calls getClaims.) Use as fixture (`test.extend`) or `storageState` via a setup project; do not persist `e2e/.auth` in git. Expires_at far future -> no refresh call.

## 5. Selector / assertion tips
- Prefer `getByRole`/`getByText`; the design text "LOGIN With Google" -> `getByRole('button',{name:/login with google/i})` (regex: case/spacing tolerant).
- i18n: `await context.addCookies([{name:'NEXT_LOCALE',value:'en',url:APP}])` + goto for a seeded-locale test; for dropdown test: click trigger, pick option, then `expect((await context.cookies()).find(c=>c.name==='NEXT_LOCALE')?.value).toBe('en')` and assert text changed via web-first `expect(locator).toHaveText` (auto-retry; no sleeps). Default (no cookie) -> vi + label "VN". Reload and assert persistence. Give dropdown `role=combobox|listbox|menu` consistently.
- Inline error: `goto('/login?error=auth_failed')` -> `expect(getByText('Đăng nhập không thành công. Vui lòng thử lại.')).toBeVisible()`; also test the error is absent on clean `/login`.
- Fixed header/footer: scroll with `page.mouse.wheel` / small viewport (`page.setViewportSize({width:1280,height:300})`) then `expect(header).toBeInViewport()`; or `expect(header).toHaveCSS('position', /fixed|sticky/)`. Prefer behavioral `toBeInViewport` after scroll.
- Proxy redirects: `await page.goto('/todo'); await expect(page).toHaveURL(/\/login$/)`; authed `/login` -> `/todo`; Logout -> `/login` then `/todo` redirects again (cookie cleared; mock `/logout` hit).
- red-first: write specs first; they fail (no /login) = valid red. Use `test.describe` tags `@smoke` for Docker run.

## Limits / unresolved
- Could NOT read `node_modules/next/dist/docs` or `@supabase/*` sources: Bash hook blocks `node_modules`/`dist` paths (did not alter `.tkmignore`). Used online Next docs v16.3.8 (project is 16.4.0). Implementer should verify: testmode existence/flag in 16.4 (only matters if choosing (a)), `proxy.ts` runtime, ssr cookie ref derivation + chunk size.
- Whether impl uses `getUser` vs `getClaims` in proxy changes mock endpoints (jwks).
- Playwright under bun: bunx uses node shebang; not validated on this WSL box. Chromium system deps may need `--with-deps` (sudo).
- Prod-build CI path requires env at build time; dev path may show first-compile latency (timeout set 180s).
