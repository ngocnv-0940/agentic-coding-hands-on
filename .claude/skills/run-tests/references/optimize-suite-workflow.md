# Optimize-Suite Workflow

**HARD RULE: optimize execution, never assertions.** Dropping real coverage
to save minutes is not an optimization — it is a failure wearing a faster
time. Everything below shortens the path to a verdict; nothing here weakens
what the verdict is allowed to catch.

## Six Levers

### 1. Change-Based Selection

Run only the test groups mapped to source that actually changed. Use the
same change→test mapping the `tester` agent already applies (see
`../../../agents/tester.md` → "Testing What Moved" — the five lookup
strategies and the fan-out escalation rules live there; don't reinvent them
here). A change that doesn't map cleanly to a narrow group is a change that
runs the wider set — selection is a floor-raiser, not a corner-cutter.

### 2. Docs-Only Skip

When a diff touches only prose — markdown, comments, doc-only config —
skip the code test lanes entirely; there's no code path to have broken.
The instant a diff mixes doc changes with even one code file, the code
lanes run in full — a partial doc/code diff is a code change.

### 3. Parallel Lanes / Sharding

Split the suite across workers by file or by test group. Two conditions
make this safe:

- **Deterministic** — the same shard assignment every run, so a failure
  is reproducible by shard number, not by luck of the scheduler.
- **Isolation-safe** — no shared mutable fixture, database, or port
  across shards. A suite that leans on shared state will produce false
  reds or false greens under parallel execution; fix the isolation before
  sharding, don't shard around it.

### 4. Cache and Setup Reuse

Cache dependency installs, compiled artifacts, and container/image layers
keyed on their real inputs (lockfile hash, source hash) — never on a
timestamp or a branch name, which silently serves a stale cache. Reuse a
warm test-database or fixture setup across a run instead of rebuilding it
per test file, as long as each test still cleans up its own data (see
`test-execution-workflow.md` → Quality Checklist, "test data swept up").

### 5. Tiering

- **Every push**: a fast smoke tier — the smallest set that would catch
  an obviously broken build.
- **Merge, release, or a risk-labeled change**: the full suite, no
  shortcuts.

Tiering trades latency for confidence on the cheap end of the pipeline
and buys the confidence back before anything ships. Never let a project
ship on smoke-tier results alone.

### 6. Kill Duplicate Work

Dedupe CI jobs that run the same command against the same input twice
(a lint step that fires in two workflows, a test job triggered by both a
push and its own PR event). Cancel a superseded run when a newer commit
lands on the same branch/PR — don't let two runs for the same ref race to
finish.

## Non-Negotiable Gates

- **Safety-critical groups always run in full**, on every code-touching
  change, no matter what the selection logic says. The definitive list lives
  in `../../../rules/development-rules.md` → "Test Scope & the Scope Contract".
  Point there; don't copy it — a stale copy is how a category quietly falls
  out of the always-run net.
- **Selection and skip logic fail open.** Any classifier error, any
  ambiguous mapping, any uncertainty about whether a change is
  docs-only — run the full suite. A selector that can't decide is not
  a selector that guesses narrow.
- **Never weaken, delete, or skip an assertion to buy time.** If a test
  is genuinely slow, profile and speed up the test itself, move it to a
  later tier, or parallelize it — the assertion stays intact either way.

## Proving the Savings

Optimization work isn't done until it's measured:

1. Record the baseline — wall-clock time (or CI minutes) for the run
   before the change, or a dry-run estimate if no baseline run exists.
2. Apply the optimization.
3. Record the new wall-clock time under the same conditions.
4. Confirm the safety-critical groups still ran in full on this pass —
   check the run log or job list, not the config alone.

Report both numbers and the safety-group confirmation together; a faster
number with no safety confirmation isn't a finished optimization.
