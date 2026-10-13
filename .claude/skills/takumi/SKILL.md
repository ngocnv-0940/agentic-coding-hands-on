---
name: tkm:takumi
description: "Reach for this before any implementation — one skill that carries a feature from first study to sealed commit: research → plan → implement → test → review → commit. The whole craft cycle, start to finish, under one roof."
argument-hint: "[task|plan-path] [--interactive|--fast|--parallel|--auto|--no-test] [--e2e-test-first] [--advice]"
metadata:
  author: takumi-agent-kit
  version: "6.0.0"
module: implementation
triggers: ["implement", "build feature", "add X to app", "develop", "create functionality", "end-to-end"]
---

# Takumi — End-to-End Implementation

`/tkm:takumi <natural language task OR plan path>`. YAGNI, KISS, DRY; token efficiency; concise
stage reports. You judge depth within each stage; the gates, tables and verbatim blocks below are
the contract.

**Workshop Law:** no forge before a blueprint. `--fast` skips deep research but NOT the blueprint;
the user may explicitly waive it ("just code it", "skip planning") — honor that, nothing else.

## Disciplines

| Flag | Behavior |
|------|----------|
| `--interactive` *(default)* | Full pipeline, rest point at each stage |
| `--fast` | Scout → draft → forge; no deep research |
| `--parallel` | Multi-agent concurrent groups |
| `--no-test` | Skip tempering (only when conditions warrant) |
| `--auto` | No rest points — advances on its own |

**MoMorph work** (independent of discipline): test policy is `visual-contract` or `e2e-red-first`
(forced by `--e2e-test-first`, incompatible with `--no-test`). Full contract: `momorph-implement-design/references/momorph-workflow.md` (extras kit).

## Reading the Material

| Presented Material | Discipline | Pattern |
|-------------------|------------|---------|
| Path to `plan.md` / `phase-*.md` | code | Execute the existing blueprint |
| "fast", "quick" | fast | Scout → draft → forge |
| "trust me", "auto" | auto | Continuous, no rest points |
| 3+ distinct features OR "parallel" | parallel | Multi-agent execution |
| "no test", "skip test" | no-test | Skip tempering |
| *(default)* | interactive | Full pipeline with rest points |

Detection logic: `references/intent-detection.md`.

### Work-Type — classify BEFORE discipline, BEFORE any `F###` reservation

| Work Type | Meaning | Routing |
|-----------|---------|---------|
| `feature` | Product/system behavior (shipping code, screens, APIs, persistence) | Stage 1.5 runs normally |
| `deliverable` | One-off artifact for the user (excel/report/slide/doc, ad-hoc analysis, uncommitted script) | Skip Stage 1.5 entirely — no `F###`, no reservation |
| `ambiguous` | No clear cue either way | `AskUserQuestion` BLOCKING in all disciplines incl. `--auto` |

Cues: `references/intent-detection.md` → "Work-Type Detection".

### Right-Size — scale the pipeline to the change

The full cycle is the ceiling, not the floor. Reaching for research → blueprint → forge →
temper → inspect on a one-line change is exactly the waste that makes the craft feel slow and
burn tokens. Size the change first, then run only the stages it earns:

| Size | What it looks like | Pipeline |
|------|--------------------|----------|
| `trivial` | Docs/prose only · a copy or single-text edit · one cosmetic tweak · a localized one-file change that touches **no** safety-critical path | Skip research and blueprint; forge the edit; verify **only the touched surface** with an inline Scope Contract (`development-rules.md` → "Test Scope & the Scope Contract"). No `test-planner`, no full temper. |
| `standard` | A normal feature or fix — the everyday case | The full pipeline per the discipline table above. |
| `large` | Touches a **safety-critical path** · wide blast radius · a breaking or public-contract change · 3+ distinct features | Full pipeline, no stage waived; `test-planner` draws the plan at Temper. Never downgrade a `large` change. |

Two rules keep the gate honest, both erring toward *more* work, never less:

- **When unsure, size up.** Can't cleanly call a change `trivial`? It isn't — run it as
  `standard`. The gate only collapses the pipeline for a change you can prove is small.
- **Safety-critical is never `trivial`.** Any change touching the safety-critical list is
  `large` regardless of how few lines it is — a one-character edit to an auth check is a
  `large` change.

`--fast` and `--auto` change the *rest points*, not the size — a `large` change stays `large`
under `--fast`. An explicit user waiver ("just code it") still overrides, as it does everywhere.

### SDD Mode (project-level, not per-run)

State lives in config key `takumi.sddMode` (project `.claude/.tkm.json` → global → default);
injected each session as `## Plan Context` `- SDD mode:` and `$TKM_SDD_MODE`.

| Value | Effect |
|-------|--------|
| `ask` (default, unset) | **First-run gate:** prompt, then persist the choice to `.claude/.tkm.json` |
| `on` | Stage 1.5 runs per the discipline table |
| `off` | Stage 1.5 skipped project-wide; Pre-flight spec box = `N/A — SDD mode disabled (takumi.sddMode: off)` |

`off` skips ONLY the spec stage — Study, Blueprint, Forge, Temper, Inspect, Deliver are unaffected.

### Documentation lifecycle (SDD on)

Three interlocking mechanisms keep `docs/` faithful (detail: `references/workflow-steps.md`,
`_shared/docs-canonical-mapping.md`): **forward-draft** at Stage 1.5 (architecture/auth tasks draft
`docs/system/*`, promoted at implement-start), **gen gate** at Step 6.a-pre (bootstrap the absent
code-derived Core/Flow layer via `rebuild-spec` on final code), **guardrailed prose** by `doc-writer`
every delivery (`doc_lock: user` opts a file out).
<!-- layout-exempt: docs lifecycle overview — docs/system paths are takumi's own forward-draft targets -->

## Seven Stages (Authoritative Flow)

```mermaid
flowchart TD
    A[Read the Material] --> B{Blueprint exists?}
    B -->|Yes| MM
    B -->|No| C{Discipline?}
    C -->|fast| D[Scout → Draft]
    C -->|interactive/auto| E[Study → Review]
    E --> S[Spec — author/update]
    S --> MM{MoMorph detected?}
    MM -->|Yes| MG["Clarify + select test policy + optional tester RED"]
    MM -->|No| F[Load Blueprint]
    MG --> PA["Spawn MoMorph UI agents + forge RED-first backend"]
    PA --> TV["Tester GREEN + visual validation"]
    TV --> INT["Integrate verified UI + backend"]
    INT --> I
    D --> Sf[Spec — minimal]
    Sf --> MM
    F --> G[Rest Point]
    G -->|approved| PR[Promote spec draft → docs/features/ if spec_draft present]  %% layout-exempt: flowchart — docs/features/ is takumi's promote target
    PR --> H[Forge the Piece]
    G -->|rejected| E
    H --> I[Rest Point]
    I -->|approved| J{--no-test?}
    J -->|No| K[Temper the Edge]
    J -->|Yes| L[Deliver the Work]
    K --> L
    L --> M[Record + Session]
```

**The diagram is the source of truth for the flow.** Where prose and diagram disagree, the diagram wins.

**Skipping or shortening Study does NOT skip Spec.** Study reads what exists; Spec writes what will
exist — they never share a fate. An empty repo empties Study, not Spec: greenfield is precisely when
the spec is CREATED from zero. Spec is skipped ONLY in `code` discipline (blueprint already exists)
or when the user explicitly waives it; `fast` still writes the minimal spec. The full Stage 1.5
procedure lives in `references/workflow-steps.md` — read it BEFORE acting; the SKILL.md summary alone
is not enough to run the stage.

Stage output format: `⚒ Stage [N]: [Brief status] — [Key metrics]`

| Discipline | Study | Spec | Tempering | Rest Points | Progression |
|------------|-------|------|-----------|-------------|-------------|
| interactive | ✓ | ✓ | ✓ | **Approval at each stage** | One stage at a time |
| auto | ✓ | ✓ | ✓ | Auto if score≥9.5 | All stages, no pauses |
| fast | ✗ | minimal | ✓ | **Approval at each stage** | One stage at a time |
| parallel | Optional | ✓ | ✓ | **Approval at each stage** | Concurrent groups |
| no-test | ✓ | ✓ | ✗ | **Approval at each stage** | One stage at a time |
| code | ✗ | ✗ | ✓ | **Approval at each stage** | Per blueprint |

The **Spec** column applies only when `takumi.sddMode` is `on` (or `ask` resolved to on); `off` skips
it in every discipline. Non-auto disciplines pause after Study, Spec, Blueprint, Forge and Tempering.
`--auto` skips those pauses — but the **first-run SDD Mode Gate** and an **`ambiguous` work-type**
stay BLOCKING even there, because they define pipeline scope. So does a **`riskGate` sign-off** at
the Stage 6 evidence gate, because only a human may approve a sensitive-area change.
**Claude Tasks:** `TaskCreate`/`TaskUpdate`/`TaskGet`/`TaskList` during forge. CLI-only — unavailable
in the VSCode extension; on error use `TodoWrite`.

## Always Enforced (every discipline)

- **Blueprint Pre-flight (MANDATORY — emit BEFORE spawning `planner` in interactive/auto/parallel/no-test):**
  ```
  ⚒ Blueprint Pre-flight
  - [x] Spec drafted — spec_draft: plans/<plan_dir>/spec/<slug>/   (fast: minimal spec draft | code: N/A — blueprint exists | user waived: quote their words | deliverable: N/A — non-feature deliverable (work-type: deliverable) | SDD off: N/A — SDD mode disabled (takumi.sddMode: off))
  - [x] Spec language resolved — spec_lang: <en|vi|jp> (asked | inherited primary_lang | auto-en | N/A — no spec stage)
  - [x] System-doc forward-draft — drafted: plans/<plan_dir>/spec/system/<name>.md  (N/A — task touches neither architecture nor auth | N/A — SDD off / no spec stage)
  - [x] Gaps clarified — [N] resolved, [M] logged under Unresolved Questions
  ```
  If the spec box cannot honestly read `[x]`, do NOT spawn the planner — return to Stage 1.5 and run it.
  (`SDD off` is a legitimate `[x]` state.) The spec-language box makes a skipped Language Gate visible:
  a greenfield interactive run must read `(asked)`, never a silent `auto-en`. The System-doc box makes a
  skipped Step 2b visible: when the task TOUCHES architecture (new service/layer/integration/data-store)
  or auth (RBAC/policy/guard/middleware/roles) — detected via the Trigger Mapping in
  `references/subagent-patterns.md` → `## Documentation`, run by the orchestrator over the planned
  surface — Stage 1.5 MUST forward-draft the matching `docs/system/*` narrative and this box names the
  draft path; only a task touching neither (or SDD off / no spec stage) may read `N/A`
  (`workflow-steps.md` → Stage 1.5 "Forward-draft system docs").
  <!-- layout-exempt: forward-draft description — docs/system/ is takumi's own forward-draft target -->
  **A Pre-flight that was not printed to the user did not happen.** The planner's prompt MUST carry the
  `spec_draft` path shown here.
- **Tempering:** 100% pass required (unless no-test discipline).
- **Master's Inspection:** approval OR auto-approve (score ≥ 9.5, 0 critical).
- **Delivery (MANDATORY — never skip, never reorder).** The commit question is not the seal of the
  work — the Delivery Manifest is. Steps 0–4 run BEFORE the commit prompt, always.
  0. **Gen gate (Step 6.a-pre)** — runs FIRST (after Inspect, before the subagents). When
     `work_type: feature` AND `sddMode: on` AND code was forged this session: evaluate the
     `docs/.rebuild-state.json` cursor — Core/Flow **absent** → bootstrap the code-derived doc layer via
     `rebuild-spec` (interactive asks `[Core][Flow][Skip]`; `--auto` runs Core→Flow silently). Otherwise
     emit `⚒ Step 6.a-pre: gen gate skipped — <reason>`. **Either way you MUST emit one line.** Full
     logic: `references/workflow-steps.md` → Step 6.a-pre.
  1. `delivery-tracker` subagent → sync completed stages back to `phase-XX-*.md` and `plan.md`
  2. `doc-writer` subagent → review `./docs` AND (when present) the layered spec layer (`docs/system/`,
     `docs/generated/`, `docs/features/`, `docs/flows/`) for impact. **Docs root is mode-aware** — see
     [`_shared/docs-canonical-mapping.md` § Language Layout](../../_shared/docs-canonical-mapping.md#language-layout)
     (single-lang → `docs/` root; per-lang → `docs/<primary>/`). **ALWAYS spawn this subagent.**
     "No update needed" is `doc-writer`'s verdict to return, not Takumi's to assume.
     <!-- layout-exempt: doc-writer step — layered spec layer refs are mode-aware per pointer above -->
  3. `TaskUpdate` → mark Claude Tasks complete after sync-back
  4. **Evidence gate (hard stage)** — the work must prove itself before it is sealed:
     `node .claude/skills/_shared/lib/evidence-gate.cjs --evidence-dir <abs {plan}/evidence> --stage hard`.
     Exit 2 = BLOCKED — show the reasons and loop back; do NOT reach the commit prompt over unproven
     work. A `riskGate` sign-off block is not looped back: it stops for the user, `--auto` included
     (`workflow-steps.md` Stage 6 step 5). Detail + the 3 artifacts: `workflow-steps.md` → "Evidence Gate".
  5. **Emit the Delivery Manifest (below)**, then ask if the work should be committed via `git-manager`
  6. Run `/tkm:capture-lessons` to record the session

  **Delivery Manifest — emit verbatim to the user before the commit prompt:**
  ```
  ⚒ Delivery Manifest
  - [x] gen-gate (6.a-pre) — <ran Core|Flow|Both: <N> core artifacts @ <sha7> | skipped: <reason>>
  - [x] system-doc forward-draft — <promoted: docs/system/<name>.md | N/A — task touched neither architecture nor auth | N/A — SDD off>  <!-- layout-exempt: delivery manifest template — docs/system/ is takumi's own forward-draft target -->
  - [x] delivery-tracker — plan.md & phases reconciled
  - [x] orchestrator — spec promoted at implement-start + sentinel cleaned, shas refreshed (or N/A — deliverable/SDD-off; or ⚠ NOT promoted — see Step 6.b advisory if `spec_draft:` still in plan.md)
  - [x] doc-writer — docs/ + spec layer reviewed (verdict: <updated N files | no changes needed>)
  - [x] TaskUpdate — all tasks closed (or N/A in VSCode)
  - [x] evidence-gate — SEALED (hard stage; 3 artifacts verified, exit 0)
  - [ ] git-manager — awaiting your seal
  - [ ] /tkm:capture-lessons — pending
  ```
  - The gen-gate, system-doc, delivery-tracker, orchestrator, doc-writer, TaskUpdate, and evidence-gate boxes must read `[x]` before any commit prompt. If any is `[ ]`, complete it NOW. The gen-gate box reads `[x]` whether it ran a pass OR skipped with a stated reason — what it must never be is **absent** (a missing box is the silent skip this gate exists to prevent). When it RAN, the box carries **evidence derived from `docs/.rebuild-state.json`** (`<N> core artifacts @ <sha7>`, the advanced cursor) — never a self-asserted "ran" with no sha; a hand-rolled doc subset is a SKIP, not a run (see Delivery Anti-Rationalization). The evidence-gate box reads `[x]` only on a real exit-0 from the gate CLI — never hand-checked. (The orchestrator box's sentinel/sha cleanup is the orchestrator's own Step 6.b work — `doc-writer` cannot read `plan.md` to do it.)
  - A Manifest that was not printed to the user did not happen. Silent self-checks do not pass this gate.

## Spec Anti-Rationalization (Stage 1.5 Specific)

The task looks small. The repo looks empty. The temptation is to jump straight to the blueprint.
Resist — this is where the spec-first discipline most often fails.

<!-- layout-exempt: anti-pattern table — docs/ paths are takumi's own forward-draft and promote targets -->
| The Whisper | The Master's Answer |
|-------------|---------------------|
| "The repo is empty — there is nothing to spec." | Greenfield is when the spec is CREATED, not skipped. Stage 1.5 writes the draft to `plans/<plan_dir>/spec/` from zero; promote moves it to `docs/features/` at implement-start. |
| "Study had nothing to do, so Spec falls with it." | Study reads what exists. Spec writes what will exist. They never share a fate. |
| "The task is simple — a spec is overhead." | Simple pieces hide the hardest grain. The spec costs minutes; an unspecified feature costs rework. |
| "Token efficiency — trim the pipeline." | Trim prose, not gates. The Blueprint Pre-flight must still print `[x] Spec drafted`. |
| "I'll author the spec after planning." | The spec draft is the plan's INPUT (`spec_draft`). After is too late — the planner would re-derive requirements. |
| "Every task needs a spec — safer to always author one." | A spec describes the SYSTEM. A deliverable is not the system. Forcing `F###` onto throwaway artifacts pollutes feature-list permanently (contiguity never forgets). Classify first. |
| "The repo is empty, so default the spec to English." | Greenfield interactive MUST run the Language Gate and ASK (en/vi/jp). Only takumi `--auto` may default to `en`; an existing `primary_lang` is inherited. Silently writing `lang: en` on an interactive run is a skipped gate, not a default. |
| "The contract told me everything about the spec." | The contract (`spec-authoring-contract.md`) only points to the procedure — it does NOT contain the Language Gate or the step logic. You MUST read `spec-stage-procedure.md` § Pre-Step before authoring; the SKILL.md summary alone is not enough to run the stage. |
| "This touches auth/architecture, but I'll let the post-forge Core pass write the system docs." | Step 2b forward-draft and the Step 6.a-pre gen gate back EACH OTHER up — skip the forward-draft and the only safety net is a gen-gate that may itself be skipped (re-baseline advisory on an existing baseline). Draft `docs/system/*` NOW; the Pre-flight System-doc box must read the draft path, not `N/A`, when the Trigger Mapping fires. |

## Delivery Anti-Rationalization (Stage 6 Specific)

The forge is hot. The inspection passed. The temptation is to seal the work with one final question. Resist — that is where the discipline most often fails.

| The Whisper | The Master's Answer |
|-------------|---------------------|
| "Tests pass, review approved — just commit." | The commit is not the seal. The Manifest is. The Manifest comes first. |
| "This change touches no docs — skip `doc-writer`." | You are not the docs authority. `doc-writer` is. Spawn it. It returns its verdict in seconds. |
| "The plan is already in sync — skip `delivery-tracker`." | Stale checkboxes from earlier stages are the most common drift. Spawn it. |
| "The user said 'commit' — they want the commit." | A commit instruction is not a license to skip Delivery. Deliver first, then commit. |
| "rebuild-spec returned 'promoted 0 files' / errored — I'll hand-author the system + generated docs to fill the gap." | A hand-rolled doc subset is a SKIP of the gen gate, not a run — it never advances `docs/.rebuild-state.json`, so the cursor postcondition fails and the layer stays un-bootstrapped. ONLY `/tkm:rebuild-spec` satisfies the gate. A non-zero exit (incl. the `promoted 0` block) means STOP and fix the pipeline, never substitute your own files. |
| "I'll record the docs/journal in a follow-up session." | There is no follow-up session for this piece. It is sealed now or it is not sealed. |

## Workshop Delegation (Mandatory Subagents)

| Stage | Subagent | Requirement |
|-------|----------|-------------|
| Study | `researcher` | Optional in fast/code |
| Spec | `researcher` (spec-authoring contract) | Optional in fast/code |
| Scout | `tkm:scan-codebase` | Optional in code |
| Blueprint | `planner` | Optional in code |
| UI Craft | `ui-ux-designer` | If frontend work |
| **MoMorph UI** | **`momorph-ui-implementer` (background, 1 per screen)** | **After clarification and selected-policy gate; never use generic `implementer`** |
| Tempering | `tester`, `debugger` | **MUST** spawn |
| Inspection | `reviewer` (rendered from `reviewer-prompt-template.md`) | **MUST** spawn |
| Delivery | `delivery-tracker`, `doc-writer`, `git-manager` | **MUST** spawn all 3 |

**Critical enforcement:** stages 4, 5, 6 MUST spawn subagents via the Task tool — do NOT temper,
inspect or deliver yourself. A workflow ending with 0 Task tool calls is INCOMPLETE.
Pattern: `Task(subagent_type="[type]", prompt="[task]", description="[brief]")`.
**Every `implementer` dispatch names its own tier** — the model plus the reasoning effort — sized to
that phase, never inherited from the session. Read `skills/_shared/dispatch-model-tiers.md` before
the first Forge dispatch.

An `implementer` dispatch renders `skills/_shared/templates/implementer-prompt-template.md` at the
tier — model plus reasoning effort — picked by `skills/_shared/dispatch-model-tiers.md`. There is no
`implementer` agent type.

A `reviewer` dispatch renders `skills/_shared/templates/reviewer-prompt-template.md` — or
`re-review-prompt-template.md` for a scoped re-review — at the tier picked by
`skills/_shared/dispatch-model-tiers.md` § Reviewer Dispatch. There is no `reviewer` agent type.
Stage 5's first pass runs on `strong` — dispatch it on the strong model, not the session default.

## Stage 0 Pre-flight Gates

Three gates at the head of Stage 0, in order, before any spec/blueprint work. Full procedures
(sentinel rollback shapes, `.tkm.json` persistence bash, `spec_lang` resolution table):
**`references/stage0-preflight-gates.md`** — read it when executing Stage 0; the common `off` /
no-sentinel paths never need it.

1. **Promote Sentinel Check** — `docs/.spec-promote-pending.json` exists → a prior promote crashed
   mid-flight. **Do NOT proceed** — prompt REVERT/KEEP/Abort (SINGLE vs SYSTEM-v2 shapes per the
   reference), resolve before any new run.
2. **SDD Mode Gate** — resolve `takumi.sddMode`. `on` → Stage 1.5 runs; `off` → skip it project-wide
   (spec box `N/A — SDD mode disabled (takumi.sddMode: off)`); `ask` (first run) → **BLOCKING
   `AskUserQuestion` in all disciplines incl. `--auto`**, persist the answer to `.claude/.tkm.json`.
3. **Language Gate** — only when the spec stage will run (`on`, work-type ≠ deliverable, discipline ≠
   code): resolve `spec_lang`. Existing `primary_lang` inherited; greenfield `--auto` defaults `en`
   silently; **greenfield interactive is BLOCKING** (ask en/vi/jp/Other — never silent `auto-en`).
   When the SDD gate also prompts this run, ask BOTH in one `AskUserQuestion` call.

`code` discipline skips gates 2 and 3 (the blueprint already encodes those decisions); gate 1 runs on
every discipline — a crashed prior promote is discipline-independent.

## References

- `references/intent-detection.md` — material reading rules, discipline routing, work-type cues
- `references/stage0-preflight-gates.md` — Stage 0 gate procedures
- `references/workflow-steps.md` — detailed stage definitions for all disciplines
- `references/review-cycle.md` — interactive and auto inspection processes
- `references/subagent-patterns.md` — delegation patterns + Documentation Trigger Mapping
- `skills/_shared/dispatch-model-tiers.md` — the model + effort tier each `implementer` and reviewer dispatch runs on, and the escalation ladder after a failed fix round
- `skills/_shared/templates/implementer-prompt-template.md` — the prompt every `implementer` dispatch renders
- `skills/_shared/templates/reviewer-prompt-template.md` — the prompt every reviewer dispatch renders
- `skills/_shared/templates/re-review-prompt-template.md` — the prompt of a scoped re-review after a fix round
- `.claude/skills/_shared/docs-canonical-mapping.md` — surgical-edit rule, escalation heuristic, version policy
- `.claude/skills/rebuild-spec/references/spec-authoring-contract.md` — contract injected into the Stage 1.5 researcher prompt
- `.claude/skills/rebuild-spec/references/spec-stage-procedure.md` — authoritative Stage 1.5 steps incl. the **Pre-Step Language Gate**
