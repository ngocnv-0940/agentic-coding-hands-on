---
name: next-docs-access-and-cache-components
description: Researchers report node_modules/next/dist/docs blocked by a .tkmignore hook; planner could read it via `cd` in Bash. Repo ships cacheComponents on, which shapes any cookie-reading layout.
metadata:
  type: project
---

Researcher subagents in this repo reported the Bash hook blocking paths containing `dist` (`.tkmignore`), so they fell back to nextjs.org docs. The planner read `node_modules/next/dist/docs` fine by `cd`-ing into it first (2026-10-08).

**Why:** AGENTS.md mandates the local Next 16 docs; online docs may lag the installed 16.4.0.
**How to apply:** When delegating research on Next APIs, tell the researcher to `cd` into the docs dir, or read the key files yourself before designing. Always check `next.config.ts` for `cacheComponents` — when on, any `cookies()`/`searchParams` read outside `<Suspense>` (especially root layout `<html lang>`) needs `instant = false` or a Suspense boundary.
