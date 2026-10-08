# Sun Estimate v1.7.0 Baseline Contract

## Provenance

This contract was derived from the 1,403-line flat bundle
`sun-estimate-v1.7.0.skill`, SHA-256
`4931f1680fb23db9835433b6b150eed5e9f788f64b97865f7ca041810826106a`.
The bundle remains the business baseline; this reference records each V1
decision so runtime does not depend on that external file.

Decision labels:

- **preserved** — same business intent;
- **refined** — intent retained with an explicit, testable contract;
- **deferred** — valid baseline capability postponed until compatibility is
  demonstrated;
- **excluded-v1** — intentionally outside this read-only reporting skill.

## Cross-cutting traceability

| Baseline rule or section | Decision | V1 contract and reason |
|---|---|---|
| One source per invocation | preserved | One run selects GitHub, Backlog, or KPI Insight before retrieval; mixed families and mixed Backlog domains stop early. |
| Source-agnostic estimate after fetch | preserved | All adapters emit one normalized issue contract before assessment. |
| Issue body as the estimate basis | preserved | Body is primary evidence; metadata-only fallback is explicit and lowers confidence. |
| Classify UI/API/DB/Migration/Deploy/QA/Infra/Bugfix/Integration components | refined | Preserve discipline signals, then assign one canonical primary discipline, work type, and two structural signature arrays. |
| Structural size does not derive from hours | preserved | Scope and Complexity come only from current issue structure. Historical hours never change either axis. |
| Fibonacci Story Point mapping | refined | Replaced by the fixed 6×6 composition matrix `SWP = SWP_MATRIX[Scope][Complexity]` — cells are `Scope × complexity multiplier` rounded half-up, with no Fibonacci snapping (v2 dropped the snap and hand-tuned caps to keep figures close to the raw arithmetic). This closes the baseline mismatch where most discipline files supplied hours but no structural SP bands. Values are no longer constrained to the Fibonacci series, so they are not directly comparable with v1.7.0/PI Fibonacci `point` scales. |
| SP greater than 21 should split | refined | Ticket values are bounded to the terminal matrix cell `(13, 8) = 55`. `splitRecommended` requires evidence of beyond-rubric work or independently deliverable parts; a score of 55 alone is insufficient. |
| Estimated time and L2/L3/L4 multipliers | deferred | V1 does not infer or display time until historical scale compatibility with the new axes is validated. |
| Historical themes and drift | refined | Read-only supporting evidence/caveat only; use only `baseline=true` themes, never AI-assisted comparison themes. |
| Confidence from evidence coverage | refined | `high|medium|low` plus `EXTRACTED|INFERRED|AMBIGUOUS`. Missing evidence changes confidence, not points. |
| Ask user to verify/override every issue | refined | Review at most five deterministic representatives in one round, then exact-stratum calibration with full audit. |
| Use user-approved numbers verbatim | preserved | Approved representative axes are locked exactly; SWP is re-derived rather than accepted independently. |
| Provenance/audit on changed values | refined | Preserve initial/final axes, representative approvals, matched rule, saturation, and reasons inside the final HTML. |
| Per-discipline rules, ticket detail stays runtime-only | preserved | The rubric stores reusable structural rules; ticket-specific observations are not added to the skill library. |
| Fill missing view-points and append to local files | excluded-v1 | V1 never self-modifies its rubric or evidence base. Gaps are recorded for human follow-up. |
| GitHub/Backlog field detection | refined | Fields may be read as provenance but are not required and never created or edited. |
| GitHub/Backlog write and provenance comment | excluded-v1 | No project-item, field, issue, custom-field, or comment mutation. |
| KPI candidate/detail/theme reads | preserved | Retained as the KPI Insight read allowlist with detail batching and permission-aware fallback. |
| KPI estimate write and server-side AI fill | excluded-v1 | Both mutate estimate state and bypass representative calibration. |
| Theme mining, local theme refresh, status | excluded-v1 | Mining/maintenance is not part of issue-list scoring. Theme reads remain optional supporting evidence. |
| Export/package and version verbs | excluded-v1 | Takumi release/package workflows own distribution and versioning. |
| Summary table | refined | Replaced by exactly one self-contained HTML containing all rows, rationale, provenance, and calibration audit. |
| Privacy: aggregate-only historical data, min-n, no raw history | preserved | Do not fetch raw historical tickets for reference evidence or expose project/customer breakdowns. Trust only permission-gated aggregate theme responses. |
| Secrets remain local and never enter chat/output | preserved | Read credentials only through operator configuration; never echo, copy to workers, or embed in HTML. |

## Logical-file coverage

| Baseline logical file | Rules carried into V1 | Rules not carried into V1 |
|---|---|---|
| `commands/sun-estimate.md` | source routing, issue selection/read, structural classification, evidence separation, confidence, human approval, summary intent | field creation/write, comments, bulk persistence, server AI fill, mine/status/export/version verbs |
| `commands/sun-estimate-backlog.md` | URL/domain parsing, local-token hygiene, GET detail, partial/forbidden distinctions | custom-field detection for writing, PATCH, provenance comment |
| `commands/sun-estimate-mine.md` | aggregate-only privacy, `baseline=false` exclusion, historical evidence does not invent points | DB/SSH mining pipeline and theme writes |
| `estimation/base.md` | two independent axes, reusable rules, structural classification, evidence-based confidence | level/time multipliers, old Fibonacci mapping, self-appending view-points |
| `estimation/themes.json` | source/period/sample provenance and baseline flags as optional evidence | hours-to-points or hours output |
| `estimation/ui.md` | component, list, rich-component, responsive signals | seed hours |
| `estimation/api.md` | endpoint, model, edge-case, permission, job, external-integration signals | seed hours |
| `estimation/integration.md` | cross-layer wiring/state/caching signals | glue hours |
| `estimation/db-migration.md` | table count, source/index/trigger impact, backfill, rollback/dry-run signals | seed hours |
| `estimation/deploy-ci.md` | target, service count, gated rollout, rollback, smoke-test signals | seed hours |
| `estimation/qa-test.md` | flow/state/platform matrix, third-party/payment, regression, automation signals | seed hours |
| `estimation/bugfix.md` | touched layers, cause/reproduction, regression signals | fix-factor and investigation hours |
| `estimation/README.md` | shared reusable rules versus runtime ticket detail | local bundle installation/extension mechanics |

## Precedence

When a baseline example conflicts with the approved V1 contract, use this order:

1. Scope/Complexity bands and exact formula in
   [scoring-rubric.md](scoring-rubric.md);
2. canonical fields and invariants in
   [assessment-contract.md](assessment-contract.md);
3. source safety in [source-adapters.md](source-adapters.md);
4. preserved baseline intent in this file.

Never reintroduce a deferred or excluded behavior as an implicit fallback.
