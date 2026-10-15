# Kudos Live Board: sync-back status report

Date: 2026-10-14 · Branch: feat/kudos-live-board · Plan: `plans/261014-0900-kudos-live-board/plan.md`
Method: each phase's done-criteria checked against `evidence/` and code paths. No commit made. `tkm plan check` not run: no shell tool in this session, so Status cells and checkboxes were hand-edited (3-column table kept).

**Final sync addendum (supersedes the phase 6 row and blockers below):** Phase 6 is Done. Final tree evidence: K dev 60/60 and K prod 60/60 (`final2-kudos-*-exit.txt`), D 176, P 35 / I 2 / L 2 PASS (`final-*-exit.txt`), tsc/lint/build exit 0 (`final2-*`), pgTAP 119/119, SC mapping `evidence/sc-mapping.md`, review SEALED 9/10. Visual 1440 is outside ±4 px and was accepted as a minor deviation (`clarifications.md`, session "visual verdict after polish round 2"); UI follow-up open. Closed: P/I/L, prod K, SC mapping, permissions.md placeholders (doc-writer). Open follow-ups: homepage list edit (tester), UI visual follow-up (UI), time-label fixture day≠month (tester), screen-flow.md and F006 PERM codes (docs), cold-start flake (tester), L2/L4/L7/NF2/L9 (deferred), PR (user).

## Phase status (verified)

| Phase | Status | Basis |
|-------|--------|-------|
| 1 E2E RED + mock | Done, 1 todo open | `red-evidence.json`: exit 1, 52 failed on screen assertions, 110/110 non-kudos regression. Open: `/sun-kudos` still in `PLACEHOLDER_PATHS` (`e2e/homepage-access-and-landing.spec.ts:6`). Harmless today, the step is not done as written. |
| 2 UI (Track A) | Done | 6 phase-2 files plus polish; tsc/lint in `polish-tsc/lint.txt`; asset coverage in `asset-coverage-phase-02.md` |
| 3 DB | Done | 3 migrations, `seed.sql`, pgTAP 119/119 PASS after `db reset` (`review-fix-pgtap-output.txt`) |
| 4 Data layer | Done | `lib/kudos/*` present; `phase4-tsc-lint.txt` exit 0 |
| 5 Hooks | Done | 8 hook/provider files present; `phase5-tsc-lint.txt` exit 0 |
| 6 Integration | In progress | Code, tsc/lint/build, SQL, D and K-dev all green on final code. Open: P/I/L, K-prod on final code, visual mismatch list, SC-001..011 mapping |

Gate status on final code (nf1-fix and review-fix runs):

| Gate | Result | Evidence |
|------|--------|----------|
| K dev `e2e/kudos-` | 57/57 PASS | `nf1-fix-e2e-kudos-exit.txt` = 0 |
| K prod `E2E_PROD=1` | 57/57 PASS, but pre-review only | `e2e-green-kudos-prod-exit.txt` |
| D full | 173/173 PASS | `nf1-fix-e2e-full-exit.txt` = 0 |
| P `@prelaunch`, I `@event-env-invalid`, L `@launch-env-invalid` | Not run | No evidence files. Tagged specs exist but are env-gated and absent from the default run output |
| SQL `db reset` + `supabase test db` | 119/119 PASS | `review-fix-pgtap-output.txt` |
| tsc / lint / build | exit 0 | `tsc-final`, `lint-final`, `build-final`, `nf1-fix-build` |
| Visual 1440/768/375 | Captured; no horizontal scroll | `visual/visual-metrics.json` (scrollWidth == clientWidth). Captured before the nf1 page change. No written mismatch list or tolerance |
| TC mapping (41) | Mapped | `tc-mapping.md`: 37 automated, 4 with recorded reasons |
| SC-001..011 mapping | Missing | Only test titles mention SC ids; no mapping file |
| Review | SEALED 9/10, 0 critical | `inspection-verdict.json`. 7 findings addressed, 4 deferred (L2, L4, L7, NF2) |

## Blockers
1. P/I/L gates not run on final code. Blocks "Done" for phase 6 and the plan. Owner: tester. Clears with three exit-0 runs.
2. K prod predates the review and nf1 fixes. Owner: tester. Clears with one `E2E_PROD=1` run.
3. Cold-start login flake: first run 78/110 failed with `auth_failed`, identical rerun 110/110, cause not isolated. Owner: tester. Not a blocker for merge, but unexplained.

## Scope drift
| Drift | Reason | Cost |
|-------|--------|------|
| Extra pgTAP file `kudos-seed-matches-e2e-fixture.test.sql` | Not recorded; fits the mock/SQL drift risk | Positive, more coverage |
| Migration split into 3 files (grants separate) | Not recorded | None observed |
| `import 'server-only'` dropped (package not installed) | Handoff note | Relies on import graph only |
| Visual via scratch script, not Playwright MCP screenshots | Not recorded | No MCP screenshot record |
| Phase-2 view contract additions (`stars`, `eyebrow`, `regionLabel`, `active`, etc.) | Handoff note | Contract wider than phase-02 file; covered by GREEN |
| Approximations for missing Figma artwork (inline SVG, text pill for `new_hero`, copied portraits, `next/image unoptimized`) | Handoff note | Icon fidelity and image optimisation below spec |
| `formatLikeCount` duplicated in `_components/format-kudos-count.ts` and `lib/kudos` | Not recorded | DRY debt |
| Extra files: `kudo-input-validation.ts`, `spotlight-pan-zoom-math.ts`, `feed-container.tsx`, `resolve-board-filters.ts`, `to-kudo-card-view.ts`, `mock-kudos-state.ts` | Not recorded (likely the <200-line rule) | Small |
| TC 19/20/21 asserted differently (modal, no required message, not automated) | Source CSV contradicts BR-011, or out of scope | Recorded in `tc-mapping.md` |

## Risk register (live)
Closed: parallel like race (serial spec, K green); SECURITY DEFINER search_path (`set search_path = ''`, revoke anon); cacheComponents prerender (build exit 0); filter-stale state (keyed remount, K green).
Mitigated: mock/SQL drift (pgTAP fixture-match suite); hydration (D green, but no console-hydration check recorded).
Open: P/I/L unrun; cold-start flake; L2 concurrent toggle (deferred); L4 `secret_boxes` readable incl. unopened prizes (deferred, must close before real prize data); L7 image href without scheme check (deferred, must close at write path).

## Next moves
| # | Move | Owner | Done when |
|---|------|-------|-----------|
| 1 | Run P, I, L on final code | tester | Three exit-0 evidence files |
| 2 | Run `E2E_PROD=1 bun run test:e2e e2e/kudos-` on current tree | tester | Exit 0 evidence |
| 3 | Remove `/sun-kudos` from `PLACEHOLDER_PATHS`, keep D green | tester | Line gone, D 173/173 |
| 4 | Write visual mismatch list; recapture 1440/768/375 after nf1 | momorph-ui-implementer | List approved by user |
| 5 | Write SC-001..011 mapping | tester | File in `evidence/`, each SC to a test or reason |
| 6 | Decide L2 toggle semantics | user, then implementer | Decision recorded; pgTAP or accepted risk |
| 7 | Tighten `secret_boxes` RLS, add image scheme check (L4, L7) | implementer | Before real prize data or user image URLs; pgTAP/E2E proof |
| 8 | Approve EN copy, error toasts, Spotlight flat navy, the Sunner pill behaviour | user | Written confirmation |
| 9 | Promote spec and `spec/system/*` (fix `docs/system/permissions.md:38` placeholders), changelog, run `/tkm:rebuild-spec --flows` after merge | doc-writer | Docs match code |
| 10 | Approve commit and open PR against `master` (`gh pr create -R ngocnv-0940/agentic-coding-hands-on`) | user approves, implementer opens | PR merged |

## Plan status
Frontmatter set to `completed` as the user ruled ("completed (implementation), PR pending"). That ruling conflicts with phase 6 (In progress) and with the Done definition in plan.md Verification (P/I/L not run). Decision for the user: keep `completed` once moves 1–2 close, or set `in_progress` until then.

## Unresolved
- Does the user accept `completed` for the plan while phase 6 gates are open?
- Is the flat navy Spotlight background and the text-pill `new_hero` badge acceptable without Figma artwork?
- Who owns the cold-start flake investigation if it does not reproduce in three cold runs?

**Status:** DONE_WITH_CONCERNS. Phases 1 to 5 verified done (phase 1 has one open todo). Phase 6 in progress: P/I/L gates and K-prod on final code are not evidenced. Plan.md sync-back and this report are written; no commit made.
