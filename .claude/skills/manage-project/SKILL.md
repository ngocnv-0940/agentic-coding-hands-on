---
name: tkm:manage-project
description: "Keep the whole commission in view as it moves — read plan state, drive Tasks, write reports, and call for doc updates. Reach for it on oversight passes, status checks, task hydration, and picking work back up across sessions."
argument-hint: "[status | hydrate | sync | report]"
metadata:
  author: takumi-agent-kit
  version: "1.0.0"
module: project-context-management
triggers: ["project status", "what's done", "update plan", "track progress", "task management"]
---

# Manage Project

Hold the plan and the actual work pointing the same direction, across sessions and agents.
Spend tokens sparingly, keep reports tight, let the data talk.

## Invariants

1. **Report what the evidence says, not what the file claims.** `status: completed` in a
   frontmatter is a claim. The checkbox counts, the phase files and the code are the evidence.
   Where they disagree, the evidence wins and the disagreement is itself the finding worth
   reporting.
2. **Nothing is done until its acceptance criteria are met.** A ticked box with unmet criteria
   is a box someone ticked, not work that landed.
3. **Sync-back sweeps every phase file, not the one in front of you** — see the guard below.
   It is the rule this skill exists to enforce.
4. **A blocker without an owner is a complaint.** Name who clears it.
5. **Lead with what needs attention now.** A status report read top-down should surface the
   thing that is stuck before the thing that is fine.

## Tool Availability

`TaskCreate`, `TaskUpdate`, `TaskGet`, `TaskList` live in the CLI only — the VSCode extension switches them off behind an `isTTY` check.

| Environment | Task Tools | Fallback |
|-------------|-----------|----------|
| CLI terminal | Available | — |
| VSCode extension | **Disabled** | `TodoWrite` |

**Fallback behavior:** When the Task tools throw, reach for `TodoWrite` to carry progress instead. Nothing downstream breaks — plan-file sync-back (the checkboxes, the YAML frontmatter) behaves exactly the same with or without them, and the PM workflow stays whole.

## References — load on the job

| Doing this | Load |
|---|---|
| Driving `TaskCreate/Update/Get/List`, metadata, dependencies, parallel ownership | `references/task-operations.md` |
| Bridging sessions: hydrate `[ ]` into tasks, sync back, resume | `references/hydration-workflow.md` |
| Sweeping `./plans/*/plan.md`, tallying completion, checking against acceptance criteria | `references/progress-tracking.md` |
| Deciding when `./docs` needs updating (hand the writing to `doc-writer`) | `references/documentation-triggers.md` |
| Report shape — session summary, plan completion, cross-plan view | `references/reporting-patterns.md` |

Report path: `{reports-path}/pm-{date}-{time}-{slug}.md`. Tables over paragraphs; unresolved
questions at the end.

## Mandatory Sync-Back Guard

Updating plan status is never a matter of ticking off the phase you happen to be standing in.

1. Sweep all `phase-XX-*.md` files under the target plan directory.
2. Match every `TaskUpdate(status: "completed")` item back to its phase metadata (`phase` / `phaseFile`).
3. Catch up the stale checkboxes in earlier phases before you call a later phase done.
4. Recompute `plan.md` status/progress from the real checkbox counts.
5. If a completed task won't map to any phase file, surface the loose ends and stop short of declaring full completion.

## Plan YAML Frontmatter

Every `plan.md` carries this header — no exceptions:

```yaml
---
title: Feature name
status: in-progress  # pending | in-progress | completed
priority: P1
effort: medium
branch: feature-branch
tags: [auth, api]
created: 2026-02-05
---
```

Move `status` whenever the plan's state moves.

## Related

`tkm:create-plan` draws the blueprint · `tkm:takumi` carries it out and hands off to
`delivery-tracker` at the finish.
