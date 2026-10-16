---
title: Unit tests and Definition of Done gaps
status: in-review
branch: test/unit-tests-and-aidd-docs
created: 2026-10-16
---

# Unit tests and Definition of Done gaps

Audit of the mock project against the course Definition of Done (UI = Figma, logic = MoMorph specs, Unit + E2E via TDD)
and a reviewer comment on another project found these gaps. This plan closes them.

| # | Gap | Fix | Test (layer) | Status |
|---|---|---|---|---|
| 1 | No unit tests (E2E + pgTAP only; plans chose "no unit runner, YAGNI") | `bun test` layer, 13 colocated `*.test.ts` files over the pure modules in `lib/` and `app/**/_behavior/`; `test:unit` script; `@types/bun`; CI `unit` job | unit, 133 tests | done |
| 2 | "10 SUNNER NHẬN QUÀ MỚI NHẤT" listed 10 boxes, so one Sunner could fill several rows (MoMorph D.3 says 10 Sunners) | migration `20261016030000_latest_gifts_distinct_sunners.sql`; E2E mock mirrors it; FR-312 + clarification updated | pgTAP `kudos-latest-gifts-distinct-sunners`, E2E FR-312 (RED first, `evidence/red-*`) | done |
| 3 | Viết Kudo: recipient field showed "Không được để trống" right after open (focus trap restored focus to the opener on an effect re-run, blurring the input) | `use-modal-focus-trap.ts` restores focus one task after cleanup, cancelled by a re-run | E2E DEC-002 (RED first) | done |
| 4 | UI drift vs Figma (audit `plans/reports/visual-parity-261016-report.md`) | header bell before VN; nav label "Award Information"; highlight side cards cream with edge fade only; flame "x2" stat icon; "Digital Numbers" countdown font (OFL, self-hosted); modal title wraps on two lines; Danh hiệu input 514px | visual-contract (tsc, lint, screenshots) + E2E label updates | done |
| 5 | README did not describe the AIDD process; TDD not visible in git history | README "Quy trình AIDD" section (flow, plan/PR map, test layers, TDD evidence, customizations); red-test commits before fix commits from this plan on | — | done |

Not changed, by decision: Secret Box opening flow (F006 Non-Scope), Highlight ranks by like count (clarification;
the card shows like count), awards unit/nav wrap (Figma wraps too), footer logo (present; only lazy in screenshots).

Open for the owner: repo visibility (currently private), flame asset re-export at 2x from Figma (MoMorph image endpoints
returned 500/401, so it is a 1x crop of the frame render).

Evidence: `evidence/`.
