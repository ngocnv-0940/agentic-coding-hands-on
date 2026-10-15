---
name: project-e2e-lost-click-and-prod-reuse
description: Two proven e2e traps in this repo - a blur-inserted error row steals the next click (prod only, dev StrictMode masks it), and E2E_PROD silently reusing a :3100 server built from .env.local
metadata:
  type: project
---

**Lost first click = layout shift on blur, not hydration (F007, 2026-10-15).** The mousedown on a control blurs the
focused field, an in-flow error row appears, the target moves (+28px), mouseup lands on the parent, and `click` fires on
the common ancestor. Proved by logging mousedown/mouseup/click targets in capture phase.
**Why prod-only:** dev StrictMode re-runs the focus-trap effect; its cleanup refocuses the opener, blurring the
recipient input, so the error is already shown at open and nothing moves later.
**How to apply:** for "first click dropped" reports, log the three event targets plus bounding boxes before blaming
lazy chunks; field errors in the write-kudo modal must stay out of flow ([[e2e-harness-gotchas]]).

**E2E_PROD + reuseExistingServer = silent wrong env.** Playwright prints nothing when it reuses a server; a :3100
server built by a plain `bun run build` inlines the .env.local Supabase URL and every login ends `/login?error=auth_failed`.
Fresh webServer launches do inline the mock (process env beats .env files). Config now disables reuse under E2E_PROD.
**How to apply:** no webServer/build lines at the top of a Playwright run means a reused server; check its origin first.
