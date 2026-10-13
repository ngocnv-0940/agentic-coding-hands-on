---
name: tkm:scan-codebase
description: "Read and map the codebase quickly — graph-first discovery, direct reads, and parallel agents only when the corpus demands it. Activate before any significant feature or investigation to understand what exists before changing it."
argument-hint: "[search-target] [ext] [--level low|medium|high|max]"
metadata:
  author: takumi-agent-kit
  version: "2.0.0"
module: project-context-management
triggers: ["find files", "where is X", "what files do I need", "scan code", "map the codebase"]
---

# Scan Codebase

Map what exists before changing it. Judge the depth yourself; the invariants below are the contract.

## Arguments

- Default: graph-first + direct read; Explore subagents only past the fan-out threshold (`./references/internal-scouting.md`)
- `ext`: survey via external Gemini/OpenCode CLI (`./references/external-scouting.md`)

## Processing Level — budget cap, not a recipe

`--level low|medium|high|max` (default `medium`). See `_shared/processing-levels.md` for global semantics.
The level sets the CEILING you may spend; you choose how much of it the task actually needs.

| Level | Max parallel agents | Cross-ref | Output |
|-------|--------------------|-----------|--------|
| `low` | 2 | No | File list |
| `medium` *(default)* | 4 | Light | Files + summary |
| `high` | 6 | Yes | Files + relationships |
| `max` | unlimited | Dep graph | Full report |

## Discovery Order (invariant)

1. **Graph first.** If `graphify-out/graph.json` exists, read `../_shared/graphify-code-graph.md` and use
   `graphify query|explain|path|affected` + `GRAPH_REPORT.md` as the first-pass map. Verify important
   graph claims with source reads or targeted grep. Graph missing/stale → continue without it.
2. **Direct read next.** Glob/Grep/Read the candidate areas yourself. For most codebases this beats
   fan-out: no spawn overhead, no information loss at agent boundaries.
3. **Fan out only past the threshold.** Spawn Explore subagents ONLY when the relevant corpus exceeds
   what direct reading covers well — as a rule of thumb: 6+ distinct top-level areas to cover, or the
   candidate set clearly exceeds your remaining context budget. Never exceed the level's agent cap.
   Each subagent has <200K context — scope each to explicit directories/files, no overlap.

## Task Registration (when fanning out)

- Skip if agent count ≤ 2 (overhead exceeds benefit) or Task tools unavailable (VSCode) — use `TodoWrite`.
- `TaskList` first; else `TaskCreate` per agent with scope metadata; `TaskUpdate` to `in_progress` before
  spawning, completed after. See `references/task-management-scouting.md`.
- Timeout: 3 minutes per agent — skip non-responders, never restart them, log in report.

## Output Contract

Invoke `/tkm:organize-files` for output placement. Report format:

```markdown
# Workshop Survey Report

## Relevant Files
- `path/to/file.ts` - Brief description

## Unresolved Questions
- Any gaps in findings (mark unverified graph leads `graph-suggested`)
```

## Configuration

`.claude/.tkm.json` → `gemini.model` (default `gemini-3-flash-preview`) — ext mode only.

## References

- `../_shared/graphify-code-graph.md` — graph consumption + verification rules
- `references/internal-scouting.md` — Explore fan-out (past threshold only)
- `references/external-scouting.md` — Gemini/OpenCode CLI
- `references/task-management-scouting.md` — Task patterns for survey coordination
