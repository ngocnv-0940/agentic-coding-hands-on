---
name: tkm:review-code
description: "Adversarial code review before merging — surfaces security holes, false assumptions, and failure modes across pending changes, PRs, commits, or full codebase scan. Red-team analysis prevents issues from shipping."
argument-hint: "[#PR | COMMIT | --pending | codebase [parallel]] [--level low|medium|high|max] [--ultra] [--codex-companion]"
metadata:
  author: takumi-agent-kit
  version: "3.0.0"
module: testing-code-quality
triggers: ["review code", "code review", "check my PR", "before merging", "is this safe"]
---

# Review Code

Adversarial, evidence-based inspection. You choose how to dig; the input modes, stages,
gates and verdict contract below are fixed.

## What to Inspect

Auto-detect from arguments; ambiguous → `AskUserQuestion` (header "Review Target"), options:
Pending changes / Enter PR number / Enter commit hash / Full codebase scan / Parallel codebase audit.

| Input | Mode | Diff source |
|-------|------|-------------|
| `#123` / PR URL | PR | `gh pr diff` |
| `abc1234` (7+ hex) | Commit | `git show` |
| `--pending` | Pending | `git diff` (staged + unstaged) |
| *(no args, recent changes)* | Default | Recent changes in context |
| `codebase` | Codebase | Full scan (`references/codebase-scan-workflow.md`) |
| `codebase parallel` | Codebase+ | Parallel audit (`references/parallel-review-workflow.md`) |

Details: `references/input-mode-resolution.md`.

## Processing Level (budget + gate overrides)

`--level low|medium|high|max` (default `medium`). Global semantics: `_shared/processing-levels.md`.

| Level | Stage 1 spec | Stage 2 quality | Stage 3 adversarial |
|-------|-------------|----------------|---------------------|
| `low` | Skip (plan context forces it back on) | Quick pass | No |
| `medium` *(default)* | Yes | Standard | Scope gate applies |
| `high` | Yes | Deep | Forced (overrides scope gate) |
| `max` | Yes | Deep | Parallel multi-reviewer (= `codebase parallel`) |

## Three-Stage Protocol (order is invariant)

1. **Spec compliance** — does the code match what was requested; missing requirements,
   unjustified extras. MUST pass before Stage 2. (`references/spec-compliance-review.md`;
   applies when work came from a plan/spec.)
2. **Code quality** — `reviewer` subagent: standards, security, performance, edge cases.
   Use `/tkm:lint-code` output as evidence when available; SunLint supports, never replaces,
   reasoning review.
3. **Adversarial** — ALWAYS-ON subject to scope gate (**skip only if ≤2 files, ≤30 lines,
   no security-relevant files; `--level high|max` removes the exemption**). Red-team with
   context anchoring (`references/adversarial-review.md`): security holes, false assumptions,
   resource exhaustion, race conditions, supply chain, observability gaps.
   Per finding: **Accept (must fix) / Reject (false positive) / Defer (GitHub issue)**.
   Critical findings block merge; re-reviews use fix-diff-only.

Before commissioning a reviewer: scout the edges — graph first when `graphify-out/graph.json`
exists (`../_shared/graphify-code-graph.md`: `affected`/`path`/`explain` seed impact scope;
the diff stays the review boundary — report issues outside ADDED/MODIFIED code only when the
change makes that code newly exploitable), then `/tkm:scan-codebase` with an edge-case prompt
(`references/edge-case-scouting.md`). Dispatch reviewer with WHAT, PLAN, BASE_SHA, HEAD_SHA,
DESCRIPTION (`references/requesting-code-review.md`).

A `reviewer` dispatch renders `skills/_shared/templates/reviewer-prompt-template.md` at the tier picked by
`skills/_shared/dispatch-model-tiers.md` § Reviewer Dispatch. There is no `reviewer` agent type.

## Verdict Contract (gate-facing — verbatim)

- **Iron Law: NO COMPLETION CLAIMS WITHOUT FRESH VERIFICATION EVIDENCE.** Identify the
  command → run it → read output → then claim. (`references/verification-before-completion.md`)
- Evidence-gated flows: adjudicated findings become `inspection-verdict.json.findings[]` —
  **every Accept finding needs a real `file:line`** or the evidence gate blocks
  (`_shared/references/evidence-artifacts.md`, `_shared/templates/reviewer-prompt-template.md` Evidence Verdict Contract).
- Cross-model dedupe (when `--codex-companion` ran — `references/codex-companion.md`):
  same `file:line` + symptom from both models → "confirmed by claude+codex"; single-model
  findings keep a `⚠ single-model` tag; no `file:line` → dropped regardless of source.
- Severity: Critical fixed immediately, Important before proceeding.

## Task-Managed Pipeline (3+ changed files, parallel scopes, fix cycles)

`TaskCreate` chain: scout → review → adversarial → fix → verify (each blockedBy the previous);
parallel reviewers for independent file groups, fix task blocks on all. Re-review cycles:
max 3, then escalate to user. Task tools CLI-only — on error use `TodoWrite`, run sequentially,
inspection quality identical. (`references/task-management-reviews.md`)

## Receiving Feedback

READ → UNDERSTAND → VERIFY → EVALUATE → RESPOND → IMPLEMENT. No performative agreement;
push back when wrong. (`references/code-review-reception.md`)

## `--ultra` — best-of-five (opt-in, high-stakes only)

Off by default. For a review that must not miss — a protected-branch merge, a release, a
security- or contract-sensitive change — `--ultra` runs the review as five independent passes
and returns the evidence-backed **union** of their findings. It costs ~5× the tokens, so spend
it where a miss is expensive, not on an everyday diff. Full semantics: `tkm:run-tests` →
"`--ultra` — best-of-five". It widens what the review catches; it never softens a verdict.

## References (load on demand)

input-mode-resolution · spec-compliance-review · adversarial-review · edge-case-scouting ·
requesting-code-review · code-review-reception · verification-before-completion ·
checklist-workflow (pre-landing / `/tkm:ship` / security audit) · task-management-reviews ·
codebase-scan-workflow · parallel-review-workflow · codex-companion
## `--advice` (opt-in athena supervision, OFF by default)

Run this skill under `athena` supervision: at each decision gate it pauses for athena's one-shot
counsel before continuing, and passes `--advice` onward across handoffs. OFF by default — spend it
on high-stakes or error-prone work, not the everyday case. Full contract:
`../../rules/orchestration-protocol.md` → "Advisory Escalation".
