# Orchestration Protocol

## Workflow Tool (Opt-In Only)

**Never use the `Workflow` tool unless the user explicitly requests it with the word "workflow".** Orchestrate with the `Task` tool instead.

## Delegation Context (MANDATORY)

Every time you spawn a subagent through the Task tool, the prompt **ALWAYS** carries three things:

1. **Work Context Path**: the git root of the PRIMARY files being touched
2. **Reports Path**: `{work_context}/plans/reports/` for that project
3. **Plans Path**: `{work_context}/plans/` for that project

**Example:**
```
Task prompt: "Fix parser bug.
Work context: /path/to/project-b
Reports: /path/to/project-b/plans/reports/
Plans: /path/to/project-b/plans/"
```

**Rule:** When your CWD and the work context differ (you are editing files in another project), point at the **work context paths**, not the CWD paths.

**Scope Contract:** when the delegated task includes testing or verification, the prompt also carries the Scope Contract for the change (see `development-rules.md` → "Test Scope & the Scope Contract"), so the subagent verifies the declared surface instead of re-testing the whole repo. A subagent that never sees the contract falls back to over-testing.

---

#### Sequential Chaining
Chain subagents when one step depends on another or needs an earlier step's output:
- **Planning → Implementation → Simplification → Testing → Review**: the shape for feature development (tests run against the simplified code).
- **Research → Design → Code → Documentation**: the shape for a brand-new system component.
- Each agent finishes fully before the next one starts.
- Carry the context and outputs forward through the chain.

#### Parallel Execution
Fire off several subagents at once when the tasks don't touch each other:
- **Code + Tests + Docs**: separate, non-conflicting pieces.
- **Multiple Feature Branches**: different agents on isolated features.
- **Cross-platform Development**: iOS and Android handled separately.
- **Careful Coordination**: keep them off the same files and shared resources.
- **Merge Strategy**: settle the integration points before the parallel work begins.

---

## Subagent Status Protocol

When a subagent wraps up, it MUST report exactly one of these statuses:

| Status | Meaning | Controller Action |
|--------|---------|-------------------|
| **DONE** | Task completed successfully | Proceed to next step (review, next task) |
| **DONE_WITH_CONCERNS** | Completed but flagged doubts | Read concerns → address if correctness/scope issue → proceed if observational |
| **BLOCKED** | Cannot complete task | Assess blocker → provide context / break task / escalate to user |
| **NEEDS_CONTEXT** | Missing information to proceed | Provide missing context → re-dispatch |

### Handling Rules

- **Never** let BLOCKED or NEEDS_CONTEXT slide — something has to change before you retry.
- **Never** re-run the same approach after BLOCKED — escalate the response: more context → simpler task → more capable model → **`athena` counsel** (see "Advisory Escalation" below) → escalate to user.
- **DONE_WITH_CONCERNS** about file growth or tech debt → log it for later, keep moving now.
- **DONE_WITH_CONCERNS** about correctness → settle it before review.
- A subagent that fails the same task 3+ times → escalate to the user; don't keep retrying blind.

### Reporting Format

Subagents should close their response with:

```
**Status:** DONE | DONE_WITH_CONCERNS | BLOCKED | NEEDS_CONTEXT
**Summary:** [1-2 sentence summary]
**Concerns/Blockers:** [if applicable]
```

---

## Advisory Escalation

When a run needs judgment rather than another pair of hands, two advisors sit above the ordinary
flow. They are the **single source** for how counsel enters the work; other rules and skills point
here rather than restating it.

- **`athena`** (agent) — **autonomous** counsel in one shot. Spawn her when a subagent is stuck, a
  design fork has real trade-offs, or an approach has failed twice — she reads the evidence, reframes
  the call, and returns a ranked recommendation with graded assumptions, without ever asking a
  question back. She is a step in the BLOCKED escalation chain above, before escalating to the user.
  She advises only; she never edits the code.
- **`tkm:consult`** (skill) — **interactive** counsel. Reach for it when the requirement itself is
  still fuzzy: it interviews the user one question at a time (via `grill-loop-protocol.md`) to
  reframe a vague idea into exact requirements, then advises. Use it when the decision genuinely
  needs the user in the loop.

**Three advisory roles, kept distinct** — don't reach for the wrong one:

| Role | Shape | Use when |
|------|-------|----------|
| `tkm:ask-expert` | Q&A with citations over the project's own artifacts | You need a *fact* about what exists — feature, architecture, impact |
| `tkm:consult` | Interactive interview → reframed requirement → advice | The *requirement* is not yet clear and the user must help shape it |
| `athena` | Autonomous one-shot strategy counsel | You're mid-task on a *hard call* and need judgment now, no user round-trip |

### Auto-consult on a fork (model escalation)

An agent running on a model **below `fable`** does not have to guess its way through a hard call
alone. When it hits a **genuine fork** — two or more paths with real trade-offs it cannot settle
from the evidence — or is **stuck after two attempts**, it spawns `athena` once for one-shot
counsel before it commits (`Task(athena)` with the task, the evidence gathered, what was already
tried, and the exact question). She advises; the agent still decides and acts.

This is the standing rule the weaker agents carry (`planner`, `planner-lite`, `debugger`,
`tester`, `test-planner` hold `Task(athena)` and point here). It fires **only** at
a real fork or a repeated failure — never on an ordinary step, so a strong advisor shadows the
weaker agents without flooding every run with spawns. The `fable`-tier agents (`athena` itself,
`planner-max`, `brainstormer-max`) are the strong tier already and do not self-escalate.

The template-dispatched `implementer` is the exception by design: it runs at a fixed model/effort
tier and **does not spawn subagents**, so it never self-consults. When it hits an architectural
fork it names it in a `BLOCKED`/`NEEDS_CONTEXT` report; its **controller** takes athena's counsel
on its behalf and re-dispatches with the call resolved.

### `--advice` (opt-in supervision, OFF by default)

Any workflow skill may be invoked with `--advice` to run under `athena` supervision: at each phase
or decision gate the skill pauses to take athena's counsel before continuing, and passes `--advice`
onward across handoffs. It is **off by default** and never auto-enabled — spend it on high-stakes or
error-prone work, where a wrong turn is expensive, not on the everyday case. It composes with any
mode flag.

## Context Isolation Principle

**A subagent gets only the context it needs — never the whole session history.**

### Rules

1. **Craft prompts explicitly** — spell out the task, the file paths that matter, and the acceptance criteria. Not "here's what we discussed."
2. **No session history** — the subagent starts fresh. Summarize the decisions that matter; don't replay the conversation.
3. **Scope file references** — name the specific files to read or change. Not "look at the codebase."
4. **Include plan context** — working from a plan, pass the one relevant phase, not the whole plan.
5. **Preserve controller context** — coordination stays in the main agent; keep that detail out of subagent prompts.

### Prompt Template

```
Task: [specific task description]
Files to modify: [list]
Files to read for context: [list]
Acceptance criteria: [list]
Constraints: [any relevant constraints]
Plan reference: [phase file path if applicable]

Work context: [project path]
Reports: [reports path]
```

### Anti-Patterns

| Bad | Good |
|-----|------|
| "Continue from where we left off" | "Implement X feature per spec in phase-02.md" |
| "Fix the issues we discussed" | "Fix null check in auth.ts:45, root cause: missing validation" |
| "Look at the codebase and figure out" | "Read src/api/routes.ts and add POST /users endpoint" |
| Passing 50+ lines of conversation | 5-line task summary with file paths |

---

## Agent Teams (Optional)

For multi-session parallel collaboration inside a Claude Code agent team, follow `team-coordination-rules.md` (file ownership, communication, task claiming). It sits outside the default orchestration flow.
