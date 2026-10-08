---
name: tkm:debug-code
description: "Locate the fault before you reach for a tool. Reach for this on bugs, failing tests, behavior that surprises you, slowdowns, call-stack tracing, layered validation, reading logs, broken CI/CD runs, database trouble, and wider system investigation."
languages: all
argument-hint: "[error or issue description] [--level low|medium|high|max]"
metadata:
  author: takumi-agent-kit
  version: "5.0.0"
module: bug-fixing-debugging
triggers: ["investigate", "why is X happening", "root cause", "strange behavior", "unexpected", "trace", "diagnose"]
---

# Debug Code

Sand over a crack and the crack comes back. Follow the symptom to where the failure is born,
repair it there, and earn the word "fixed" with evidence.

## Invariants

1. **Prove the root cause before changing a line.** Guessing burns hours and seeds fresh
   defects.
2. **Reproduce it first.** A defect you have not made happen on demand has not been diagnosed —
   you are reading code and imagining. Capture the exact command and its exact output.
3. **A root cause is a `file:line`, not a layer.** "The serializer" is a direction;
   `serializers.py:214 drops the tz before comparing` is a cause. If it cannot be named that
   precisely, the hunt is not finished.
4. **Fix at the origin, not where the symptom surfaced.** A guard added at the call site leaves
   the defect alive for the next caller.
5. **No completion claim without fresh verification evidence.** Run the command, read what it
   printed, then state the result — in that order, every time. Details:
   `references/verification.md`.

## Processing level

`--level low|medium|high|max` (default `medium`) — see `_shared/processing-levels.md`.

| Level | Depth | Task tracking | Parallel collection |
|---|---|---|---|
| `low` | Root cause only | No | No |
| `medium` | Root cause + tracing | No | No |
| `high` | Full investigation + layered validation | Yes (3+ steps) | No |
| `max` | Everything + performance diagnostics | Yes | Yes |

## References — load on the symptom

| Symptom | Load |
|---|---|
| About to call work done, fixed, or passing | `references/verification.md` (the iron law, in full) |
| Red CI job, server incident, evidence living in logs | `references/log-and-ci-analysis.md` (`gh` CLI, correlation across sources) |
| Slow endpoint, regression, resource exhaustion | `references/performance-diagnostics.md` |
| Writing the debug report | `references/reporting-standards.md` (shape, evidence chain, open questions) |
| Investigation spans 3+ steps or parallel collection | `references/task-management-debugging.md` |
| Frontend files, UI defect, visual regression | `references/frontend-verification.md` (Chrome MCP, falls back to `tkm:automate-browser`) |
| A test passes alone and fails in the suite | `scripts/find-polluter.sh` — bisects to the polluting test |

## Reaching for other tools

`psql` for database state · `gh` for Actions logs · `/tkm:scan-codebase` to locate the files
that matter · `tkm:search-docs` for a dependency's own documentation · `tkm:solve-problem` when
two hypotheses have already fallen and you need a different angle.

## Warning signs

Each of these is the same thought wearing a different hat, and each one precedes the next
defect. Catching yourself mid-sentence is the point:

- "Quick patch now, I'll dig in later"
- "Let me just tweak X and watch what happens"
- "Probably X — I'll change that"
- "Should be working now" / "Looks fixed"
- "Tests are green, call it done"

Return to the invariants. The shortcut that skips them is what plants the next one.
