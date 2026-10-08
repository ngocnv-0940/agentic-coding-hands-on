---
name: tkm:fix-bug
description: "Reach for this skill FIRST on any defect — bugs, errors, test failures, CI/CD breakage, type errors, lint complaints, log errors, UI glitches, or any misbehaving code."
argument-hint: "[issue] --auto|--review|--quick|--parallel [--codex-companion]"
metadata:
  author: takumi-agent-kit
  version: "3.0.0"
module: bug-fixing-debugging
triggers: ["bug", "error", "broken", "not working", "failing", "crash", "exception", "CI failing", "fix this"]
---

# Fix Bug

Trace the fault to where it lives, then touch the code. You plan the path; the invariants
and gates below are the contract — every one is checkable, none is optional.

## Modes

| Flag | Behavior |
|------|----------|
| `--auto` *(default)* | Autonomous; finalizes only when the Step-6 evidence gate passes (`decision: SEALED`, 0 critical) — advisory scores never approve by themselves |
| `--review` | Human-in-the-loop: pause for approval at each stage (`references/review-cycle.md`) |
| `--quick` | Compressed loop for throwaway issues (lint, type errors); evidence gate runs `--stage advisory` |
| `--parallel` | 2+ independent issues → one `general-purpose-<effort>` agent per issue, separate task tree each |
| `--codex-companion` | At the 2nd failed verification, delegate to Codex for a read-only fix proposal before escalating (`references/codex-companion.md`); its fix must still clear verification |

Ask the mode via `AskUserQuestion` only when the request names production-critical code and
carries no "auto" keyword; otherwise judge from context. User names a specific fix → do that.

## Invariants (each one blocks the next stage until met)

1. **No fix before diagnosis.** Survey the affected area first — `tkm:scan-codebase`, direct
   reads, or Explore agents, your call by scale. Then diagnose with evidence
   (`references/diagnosis-protocol.md`; `tkm:debug-code` techniques available).
   A hunch is not a diagnosis. `--quick` compresses this loop but never skips it.
2. **Capture pre-repair state verbatim** before touching code: exact error messages, failing
   test output, stack traces, the exact commands that produced them. This is the baseline
   verification measures against.
3. **Root cause cites an exact `file:line`** — "somewhere in the auth module" is not a
   diagnosis; keep tracing until the origin is pinned.
4. **Repair = smallest change at the root cause**, inside existing patterns. Never patch the
   symptom layer.
5. **Verify with fresh evidence:** re-run the EXACT captured commands, diff against baseline.
   No claim survives without a fresh run.
6. **Regression test** pinning this issue: MUST fail without the repair, pass with it.
   Add prevention where it fits (`references/prevention-gate.md`).
7. **Evidence is code-constructed, never narrated:** resolve the evidence dir once (active
   plan's `{plan}/evidence/`, else `plans/reports/<slug>/evidence/`); feed re-run results to
   `buildTemperResults()` (`hooks/lib/evidence-validator.cjs`) → `temper-results.json`; drop
   `study-context.json` (diagnosis as `task`, regression check as acceptance criterion).
   Reviewer (review/auto modes) writes `inspection-verdict.json` to the same dir.
   Shapes: `_shared/references/evidence-artifacts.md`.
8. **Evidence gate before any commit prompt:**
   `node .claude/skills/_shared/lib/evidence-gate.cjs --evidence-dir "<abs dir>" --stage hard`
   (quick mode: `--stage advisory`). Exit 2 = BLOCKED → back to verification; never reach the
   commit prompt over an unproven repair.

## Escalation (fixed ladder)

- Verification fails → re-diagnose (invariant 1), attempt again.
- **2nd failure** + `--codex-companion` → Codex rescue proposal, then re-verify.
- **2nd failure, re-dispatching the repair** → one tier above the dispatch that failed, with a
  fresh agent — two attempts at one tier is a fair trial, a third is a blind retry
  (`skills/_shared/dispatch-model-tiers.md` § Escalation Ladder).
- **3rd failure → STOP.** The design itself may be wrong. Question the architecture with the
  user before swinging again.

## Orchestration

- Moderate+ work: lay phases out as native Tasks upfront (`TaskCreate` + `addBlockedBy`,
  `TaskUpdate` as phases close — `references/task-orchestration.md`). Skip for quick loops.
  Task tools absent (VSCode) → `TodoWrite`; the repair runs to completion without them.
- Depth is your judgment: single-file lint fix needs minutes; system-wide fault may need
  research/plan first (`tkm:solve-problem` when hypotheses keep dying, `tkm:optimize-context`
  for AI/LLM code, `tkm:manage-project` for task sync on moderate+).
- Subagents available: `debugger`, `researcher`, `planner`, `reviewer`, `tester`, Explore, Bash.
- **When the repair goes to an `implementer`, the dispatch names its tier** — model and reasoning
  effort, sized to the repair the diagnosis actually calls for, not inherited from your session.
  `Task(subagent_type="general-purpose-[effort for the tier]", model="[tier]", prompt="[rendered
  implementer template]", ...)` — the agent type carries the effort. The ladder:
  `skills/_shared/dispatch-model-tiers.md`.

An `implementer` dispatch renders `skills/_shared/templates/implementer-prompt-template.md` at the
tier — model plus reasoning effort — picked by `skills/_shared/dispatch-model-tiers.md`. There is no
`implementer` agent type.

A `reviewer` dispatch renders `skills/_shared/templates/reviewer-prompt-template.md` at the tier picked by
`skills/_shared/dispatch-model-tiers.md` § Reviewer Dispatch. There is no `reviewer` agent type.

## Finalize (after the gate passes)

1. Summarize: confidence, root cause, changes, prevention.
2. `doc-writer` subagent refreshes `./docs` when the change warrants it (NON-OPTIONAL).
3. `TaskUpdate` all tasks `completed` (if Task tools available).
4. Ask the user whether to commit via `git-manager`; then `/tkm:capture-lessons`.

## Output Format (UX contract — keep these lines verbatim in shape)

```
⚒ Step 0: [Mode] selected
⚒ Step 1: Surveyed — [N] files, [M] deps
⚒ Step 2: Diagnosed — Root cause: [summary] at [file:line]
⚒ Step 3: [Complexity] detected
⚒ Step 4: Repaired — [N] files changed
⚒ Step 5: Verified + Prevented — [before/after], [tests added], [guards added]
⚒ Step 6: Complete — [action taken]
```

## Specialized Routes

`references/workflow-ci.md` (CI failures) · `workflow-logs.md` (log analysis) ·
`workflow-test.md` (test suites) · `workflow-types.md` (TS types) · `workflow-ui.md` (visual/UI).
## `--advice` (opt-in athena supervision, OFF by default)

Run this skill under `athena` supervision: at each decision gate it pauses for athena's one-shot
counsel before continuing, and passes `--advice` onward across handoffs. OFF by default — spend it
on high-stakes or error-prone work, not the everyday case. Full contract:
`../../rules/orchestration-protocol.md` → "Advisory Escalation".
