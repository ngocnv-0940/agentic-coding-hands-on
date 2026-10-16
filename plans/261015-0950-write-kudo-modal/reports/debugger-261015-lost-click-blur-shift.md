# Debugger report: lost first click, blur shift, E2E_PROD env (F007 fix round 1)

Date 2026-10-15. Evidence: `plans/261015-0950-write-kudo-modal/evidence/fix-round1-*.txt`.

## Executive summary

- **Issues 1 and 2 have one root cause.** The Người nhận input has focus when the modal opens. A click on "+ Hashtag"
  starts with mousedown, which blurs that input; the blur reveals "Không được để trống" as an in-flow row, everything
  below moves down 28px, the mouseup lands on the modal body, and the browser fires `click` on the common ancestor, not the
  button. Not hydration, not the lazy chunk, not Tiptap. Real users hit it in prod.
- **Issue 3 is server reuse, not env precedence.** A fresh `E2E_PROD=1` launch does inline the mock URL (process env
  wins over `.env.local`, as `node_modules/next/dist/docs/01-app/02-guides/environment-variables.md` "Load Order" says).
  The tester's run reused a server already on :3100 that was built by a plain `bun run build` (from `.env.local`), because
  `reuseExistingServer` was true locally. Playwright prints nothing when it reuses a server, so this went unnoticed.
- Fixes: field error row taken out of flow (`write-kudo-field-row.tsx`); `E2E_PROD` never reuses a server
  (`playwright.config.ts`); ID-34 retry removed.

## Issue 1: prod-only lost first click (TC ID-34)

Hypotheses and verdicts (probes from a temporary spec, since deleted; outputs saved):

| # | Hypothesis | Test | Verdict |
|---|---|---|---|
| H-A | blur of the recipient input inserts the error row and moves the button between mousedown and mouseup | log the mousedown/mouseup/click targets + bounding box | **CONFIRMED** |
| H-B | the button is visible before its handler is attached (lazy chunk / hydration / Tiptap mount) | JS `el.click()` right after the modal is visible | eliminated: panel opens |
| H-C | picker state reset by a remount (`useLayoutEffect` cleanup `setOpen(false)`) | first real click after the error row already shows | eliminated: panel opens first try |

Key data (`fix-round1-probe-prod-before-fix.txt`):
```
{"focused":"write-kudo-recipient-input","before":{"y":660,...},"after":{"y":688,...},"shiftY":28,"underOldCenter":"DIV testid=write-kudo-modal"}
["mousedown:write-kudo-hashtag-add@680","mouseup:write-kudo-modal@680","click:write-kudo-modal@680"] panel= 0
```
RED without the retry, before the fix: `fix-round1-id34-prod-noretry-red-before-fix.txt`. The snapshot after the click shows
`alert: Không được để trống` on Người nhận and no hashtag panel.

Why prod only (`fix-round1-probe-dev-before-fix.txt`): in dev the button is already at y=688 when the modal opens. React
StrictMode runs `useModalFocusTrap`'s effect twice; the first cleanup moves focus back to the opener, blurring the recipient
input, so it is marked touched and its error shows from the start. Nothing moves when the user clicks, so the bug hides.
In prod there is a single effect run, the input is not touched until the user's click blurs it, and the row jumps.

Fix: see issue 2 (same change). After the fix (`fix-round1-probe-prod-after-fix.txt`): `shiftY:0`, mousedown, mouseup and
click all land on `write-kudo-hashtag-add`, panel=1; ID-34 without the retry passes in prod.

## Issue 2: recipient blur moves the controls

Proof: the 28px shift above (= 8px `gap-2` + 20px `leading-5` error line). It hits every control below any required row
whose error appears on blur (recipient, title), and the hashtag row when its panel closes empty.

Figma: frame 5c7PkAibyD has no image or style data in MoMorph (`reports/track-a-ui-handoff-notes.md`); the frame only fixes
the red #cf1322 border and message. The normal-state frame fixes the row rhythm (24px / 32px between rows). Reserving a
line under every row would add 4 x 28px to the normal state and break that spacing, so it was not used.

Fix (`app/(main)/sun-kudos/_components/write-kudo-field-row.tsx`): the row root is `relative`; the error `<p>` is
`absolute top-full left-0 mt-1`, so it sits in the existing row gap (4 + 20 = 24px <= gap 24/32px). Text, `role="alert"`,
`data-invalid` and the red border are unchanged. Normal-state layout is unchanged.

## Issue 3: E2E_PROD inlined the real Supabase URL

Timeline (tester's evidence + this run):
- 15:43–15:52 `final-W-prod-attempt1`: no webServer/build output at the top (= reused server), 63 failed with
  `navigated to "http://localhost:3100/login?error=auth_failed"` (= real Supabase).
- 15:55 manual build with a temporary `.env.production.local`; attempts 2–3 reused that server
  (`green-evidence.json`: "E2E_PROD=1 runs reused a prebuilt server on 3100").

Hypotheses:
| # | Hypothesis | Test | Verdict |
|---|---|---|---|
| 3-A | process env does not override `.env.local` in `next build` | `NEXT_PUBLIC_SUPABASE_URL=<mock> bun run build`, grep `.next/static` | eliminated: chunk holds `sO("http://localhost:54399",...)`; server bundles 5 hits |
| 3-B | Turbopack build cache keeps the old inlined value | `.env.local` build, then mock-env rebuild | eliminated: rebuild inlines the mock |
| 3-C | Playwright webServer does not pass `env` to the command | read `playwright/lib/runner/index.js` | eliminated: `env: {...DEFAULT, ...process.env, ...options.env}`, `shell: true` |
| 3-D | `reuseExistingServer` adopts a :3100 server built from `.env.local` | stale `bun run build` + `next start -p 3100`, run ID-34 under the old vs new config | **CONFIRMED**: old config: `auth_failed` (`fix-round1-prod-reuse-old-config-repro.txt`); new: `http://localhost:3100/ is already used` (`fix-round1-prod-reuse-new-config.txt`) |

Fix (`playwright.config.ts`): `reuseExistingServer: !CI && !E2E_PROD && !customEventEnv && !customLaunchEnv`. An
`E2E_PROD` run now always builds with the config env (mock), or fails loudly if the port is taken. A shell-inline env
prefix on `next build` was not added: the webServer env already reaches the build (3-A, 3-C), so it would duplicate it.
`.env.local` untouched.

Proof the documented path works as written: `E2E_PROD=1 bun run test:e2e e2e/write-kudo-`, started with the mock **down** and
:3100 free → 76 passed, exit 0 (`fix-round1-W-prod-*`).

## Verification

| Run | Exit | Result |
|---|---|---|
| `bunx tsc --noEmit` | 0 | |
| `bun run lint` | 0 | |
| `E2E_PROD=1 bun run test:e2e e2e/write-kudo-` | 0 | 76 passed |
| `bun run test:e2e e2e/write-kudo-` (dev) | 0 | 76 passed |
| `bun run test:e2e e2e/kudos-` (dev) | 0 | 60 passed |
| `bun run test:e2e` (full, dev; config changed) | 0 | 252 passed |

Skipped: pgTAP / SQL (untouched).

## Recurrence prevention

- Monitoring gap: no test clicks a control right after another field's blur in prod mode; dev StrictMode masked it.
  ID-34 without the retry now covers it in `E2E_PROD` runs. Keep running the W suite in prod mode before merge.
- Design rule: validation messages that appear on blur must not reflow the controls the user is aiming at.
- Harness: reused servers are silent; prod mode no longer reuses.

## Unresolved

1. Dev-only: the recipient error shows as soon as the modal opens (StrictMode focus round-trip marks it touched).
   It does not affect prod users; a fix would ignore blurs caused by the focus trap's cleanup. Not changed in this round.
2. The image-picker error (inside `ImagePickerView`) is still in flow; it sits above only the Ẩn danh row. Not reported, not changed.
3. A dev server reused on :3100 has the same env risk in dev mode (default runs still reuse); not changed (out of scope).
