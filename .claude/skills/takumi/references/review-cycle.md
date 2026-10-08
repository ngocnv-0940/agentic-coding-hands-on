# The Master's Inspection

A craftsman does not release work that has not been examined.
The inspection cycle is where craft becomes quality.

Every pass dispatches from a template at the tier in `skills/_shared/dispatch-model-tiers.md`
§ Reviewer Dispatch. The first pass is the full review of the whole change. Every pass after a fix
round is a **scoped re-review**: it verdicts the open findings and the open `refuted` / `unproven` /
`reachableRegressions` entries, and inspects the fix diff, nothing else (§ Scoped Re-Review below).

## Interactive Inspection (max 3 cycles)

```
cycle = 0
LOOP:
  1. cycle == 0 → dispatch the reviewer (reviewer-prompt-template.md, strong)
     cycle  > 0 → dispatch the scoped re-review (re-review-prompt-template.md)
     → score, critical_count, warnings, suggestions

  2. DISPLAY FINDINGS:
     ┌─────────────────────────────────────────┐
     │ Inspection Results: [score]/10          │
     ├─────────────────────────────────────────┤
     │ Summary: [what was forged], tempering   │
     │ [X/X passed]                            │
     ├─────────────────────────────────────────┤
     │ Critical Defects ([N]): MUST FIX        │
     │  - [defect] at [file:line]              │
     │ Concerns ([N]): SHOULD FIX             │
     │  - [concern] at [file:line]             │
     │ Refinements ([N]): CONSIDER             │
     │  - [suggestion]                         │
     └─────────────────────────────────────────┘

  3. AskUserQuestion (header: "Inspect & Approve"):
     IF critical_count > 0:
       - "Fix critical defects" → record BASE, fix, re-run tempering, cycle++, LOOP
       - "Fix all issues" → record BASE, fix all, re-run tempering, cycle++, LOOP
       - "Approve anyway" → PROCEED
       - "Abort" → stop
     ELSE:
       - "Approve" → PROCEED
       - "Address concerns" → record BASE, fix, cycle++, LOOP
       - "Abort" → stop

  4. IF cycle >= 3 AND user selects fix:
     → "⚠ 3 inspection cycles completed. Final decision required."
     → AskUserQuestion: "Approve with noted concerns" / "Abort workflow"
```

## Auto-Inspection (for auto discipline)

```
cycle = 0
LOOP:
  1. cycle == 0 → dispatch the reviewer (reviewer-prompt-template.md, strong)
     cycle  > 0 → dispatch the scoped re-review (re-review-prompt-template.md)
     → score, critical_count, warnings

  2. IF score >= 9.5 AND critical_count == 0:
     → Auto-approve, PROCEED

  3. ELSE IF critical_count > 0 AND cycle < 3:
     → Record BASE, auto-fix critical defects
     → Re-run tempering
     → cycle++, LOOP

  4. ELSE IF critical_count > 0 AND cycle >= 3:
     → ESCALATE TO USER

  5. ELSE (no critical, score < 9.5):
     → Approve with concerns logged, PROCEED
```

## Scoped Re-Review

Before each fix dispatch, record `BASE` (`git rev-parse HEAD`). After the fix lands, render
`skills/_shared/templates/re-review-prompt-template.md` with:

- the findings still open, verbatim from the last verdict
- the last verdict's `refuted`, `unproven` and `reachableRegressions` entries, verbatim — they
  are under verification too, and stay until the fix diff resolves them
- the fix diff `BASE..HEAD`
- the last verdict file, so the re-reviewer carries forward what the fix did not touch, `riskGate`
  included
- the plan file and the absolute `{plan}/evidence/` dir

The re-reviewer emits a complete `inspection-verdict.json`; the skill writes it, once, as before.

## Re-Review Tier

Size the re-review to the fix diff, not to the whole change: `balanced` for a small fix, `strong`
for a large or risky one. Its effort is the effort of that fix round's implementer, after any
escalation, clamped to the band. Both rules: `skills/_shared/dispatch-model-tiers.md`
§ Reviewer Dispatch.

## Re-Forge Tier

Both loops above re-dispatch on a defect. The first two re-forges stay at the tier that produced the
work, at the top of its effort band; from the **third** on, a defect that keeps surviving is evidence about the tier — climb **one
tier** with a **fresh** agent, model and effort both, per the escalation ladder in
`skills/_shared/dispatch-model-tiers.md`.

## Critical Defect Definition

A defect that must be remedied before the work leaves the workshop:
- Security: XSS, SQL injection, OWASP vulnerabilities
- Performance: bottlenecks, inefficient algorithms
- Architecture: violations of established patterns, excessive coupling
- Principles: YAGNI, KISS, DRY violations

## Output Formats

- Waiting: `⚒ Stage 5: Inspected — [score]/10 — AWAITING approval`
- After fix: `⚒ Stage 5: [old]/10 → Fixed [N] defects → [new]/10 — Approved`
- Auto-approved: `⚒ Stage 5: Inspected — 9.8/10 — Auto-approved`
- Approved: `⚒ Stage 5: Inspected — [score]/10 — Approved`
