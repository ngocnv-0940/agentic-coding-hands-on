---
name: tkm:run-tests
description: "Temper the work under fire — run unit, integration, e2e, and UI tests. Covers test execution, new-suite authoring, suite auditing, suite optimization, coverage analysis, build verification, visual regression, and QA reports. A piece untested is a piece unfinished."
argument-hint: "[scope] | create | audit | optimize | ui [url] [--ultra]"
metadata:
  author: takumi-agent-kit
  version: "1.0.0"
module: testing-code-quality
triggers: ["run tests", "test coverage", "unit test", "e2e", "visual regression", "does it pass"]
---

# Tempering the Work

A blade fresh from the forge is soft. It cuts nothing.
Tempering is what reveals whether the metal holds — applying heat, then controlled stress, until the flaw shows or the strength proves out.

This skill is that tempering: structured, thorough, unsparing.
Passing builds do not prove correctness. Evidence does.

## Modes — how to run

Pass the mode as the first word of the argument; leave it off to just run tests. Each mode loads
its own reference under `references/` for the full procedure.

| Command | What it does | When to use | Loads |
|---------|--------------|-------------|-------|
| `/tkm:run-tests [scope]` | Run unit/integration/e2e tests for a scope and report results + coverage. | After a change, before review or ship. | `test-execution-workflow.md` |
| `/tkm:run-tests create [scope]` | Author new tests for a feature, a fix, or a coverage gap. Every test clears the authoring gate first. | You need tests written, not just run. | `authoring-gate.md` + `create-suite-workflow.md` |
| `/tkm:run-tests audit [scope]` | Review an existing suite for weak, deceptive, or redundant tests. Reports each finding with `file:line`, severity, and a repair. Report-only unless you ask it to apply fixes. | A suite is green but you don't trust it, or before a big refactor. | `authoring-gate.md` (junk list) + `audit-suite-workflow.md` |
| `/tkm:run-tests optimize [scope]` | Cut test/CI cost — change-based selection, sharding, cache, tiering — without weakening any assertion. | CI is slow or wasteful. | `optimize-suite-workflow.md` |
| `/tkm:run-tests ui <url>` | Visual / browser tests on a URL. | Frontend, responsive, or accessibility checks. | `ui-testing-workflow.md` |

Notes:
- `[scope]` is optional — a path, a module, a feature name, or the changed set. Omit it to test what changed.
- `--ultra` works with any mode: runs five independent passes and keeps the union of evidence-backed findings. Use it only for a release or a protected-branch merge — it costs ~5x.
- Called with no argument at all, the skill asks whether you want to run tests or UI tests (see below).

## When Called Without Arguments

Given a scope to test, get to work. Called bare, with nothing to chew on, surface the two paths through `AskUserQuestion`:

| Operation | Description |
|-----------|-------------|
| `(default)` | Run unit/integration/e2e tests |
| `ui` | Run UI tests on a website |

Frame the `AskUserQuestion` with header "Test Operation" and the prompt "What would you like to do?".

## The Tempering Law

**NEVER IGNORE FAILING TESTS.** Fix root causes, not symptoms. No mocks, tricks, or workarounds to pass builds.

A test that is silenced rather than fixed is a crack hidden under lacquer.

## When to Temper

- **After forging**: Prove out fresh features or the bug you just patched
- **Coverage checks**: Confirm the project's thresholds hold (80%+)
- **UI verification**: Visual regression, responsive layout, accessibility
- **Build validation**: Confirm the build, its dependencies, and CI/CD all behave
- **Before delivery**: The last gate standing between you and a commit or push

## Tempering Methods

### 0. Authoring Gate (`references/authoring-gate.md`)

The gate every test passes before it is written. Four questions (what contract it
protects, what regression it catches, why existing coverage misses it, whether it needs a
test-only seam), the canonical junk-pattern list, one-owner-per-contract, and the keep-list.
Applied silently — it exists to stop over-testing: a one-line change spawning a dozen tests,
private-helper tests, mocks that implement the logic under test, one scenario replayed at
every layer, exports added only so a test can reach in.

**Load when:** writing, changing, reviewing, or sweeping tests — before create-suite or audit.

### 1. Code Testing (`references/test-execution-workflow.md`)

Drive the suites, read what comes back, pull coverage. Reaches across JS/TS (Jest/Vitest/Mocha), Python (pytest), Go, Rust, and Flutter — carries the procedure, the bar to clear, and the commands to run.

**Load when:** Running unit/integration/e2e tests, checking coverage, validating builds

### 2. UI Testing (`references/ui-testing-workflow.md`)

Visual work driven through the browser via the `tkm:automate-browser` skill: screenshots, responsive sweeps, accessibility audits, form automation, and console-error capture. Carries auth injection for routes behind a login.

**Load when:** Visual regression testing, UI bugs, responsive layout checks, accessibility audits

### 3. Code Quality Preflight (`/tkm:lint-code`)

Run SunLint after typecheck/analyze and before the deeper suites. The lint-code skill chooses changed-aware scanning by default and writes `.takumi/reports/sunlint.json`.

**Load when:** Checking code quality, static analysis, security lint, architecture lint

### 4. Report Format (`references/report-format.md`)

A laid-out QA report template — results at a glance, coverage numbers, the tests that broke, performance, build state, and what to do next.

**Load when:** Generating test summary reports

### 5. Create Suite (`references/create-suite-workflow.md`)

Forging new tests: pick the lowest layer that can prove the behavior, prove the test can actually fail by mutating the code once, skip trivial plumbing, and never bring in a second test framework.

**Load when:** Writing new tests for a feature, a fix, or a gap the coverage report just exposed

### 6. Audit Suite (`references/audit-suite-workflow.md`)

Hunting bad metal in an existing suite: deceptive, disabled, unfinished, ineffective, missing-edge-case, redundant, outdated, security-gap, and CI-blind-spot tests — each finding with file:line, severity, and a repair plus the repair's own risk.

**Load when:** A suite is green but trust in it is low, before a big refactor, or as a periodic suite health check

### 7. Optimize Suite (`references/optimize-suite-workflow.md`)

Making the suite or CI cheaper without losing safety: change-based selection, docs-only skip, sharding, cache reuse, tiering, and killing duplicate CI work — all gated by fail-open selection and safety-critical groups that always run in full.

**Load when:** CI is too slow, a suite tier needs defining, or duplicate/wasted CI runs need trimming

## Quick Reference

```
Code tests     → test-execution-workflow.md
  npm test / pytest / go test / cargo test / flutter test
  Coverage: npm run test:coverage / pytest --cov

Lint preflight → /tkm:lint-code
  SunLint changed-aware by default; report: .takumi/reports/sunlint.json

UI tests       → ui-testing-workflow.md
  Screenshots, responsive, a11y, forms, console errors
  Auth: inject-auth.js for protected routes

Create suite   → create-suite-workflow.md
  Lowest-layer-first, mutate-to-prove-it-fails, reuse the existing framework

Audit suite    → audit-suite-workflow.md
  9 bad-test classes, file:line findings, severity + repair + repair risk

Optimize suite → optimize-suite-workflow.md
  Selection, sharding, cache, tiering — never weakens an assertion

Reports        → report-format.md
  Structured QA summary with metrics & recommendations
```

## The Tempering Process

1. Read the recent changes (or the requirements) and settle on what needs testing
2. Fire the typecheck/analyze commands first — syntax errors should fall here, not mid-suite
3. Run `/tkm:lint-code` for the SunLint quality preflight
4. Run the suites that fit the scope
5. Sift the output, eyes on what broke
6. Pull coverage reports where they apply
7. Frontend work: drive UI tests through the `tkm:automate-browser` skill
8. Write up the structured summary report

## `--ultra` — best-of-five (opt-in, high-stakes only)

Off by default. When the stakes justify the cost — a merge to a protected branch, a release, an
irreversible or safety-critical change — `--ultra` runs the temper as **five independent passes**
instead of one and reconciles them: keep the **union** of findings the passes can each back with
evidence, drop what none can stand behind. Five passes cost roughly five times the tokens and
wall-clock, so this is a deliberate choice for the moments that earn it — never a default, never
a way to feel safer without a reason.

It never lowers the bar: `--ultra` widens what verification *catches*; it does not touch what the
assertions are allowed to fail on. The same flag carries to `tkm:review-code`, and to the
`test-planner` agent when a plan itself must be pressure-tested. Reaching for it on an everyday
change is the tell that you don't need it — scope the run instead.

## Tools

- **Test runners**: Jest, Vitest, Mocha, pytest, go test, cargo test, flutter test
- **Coverage**: Istanbul/c8/nyc, pytest-cov, go cover
- **Static analysis**: the `tkm:lint-code` skill runs SunLint and reports `.takumi/reports/sunlint.json`
- **Browser**: the `tkm:automate-browser` skill carries the UI work — screenshots, ARIA, console, network
- **Debugging**: reach for the `tkm:debug-code` skill when a test exposes a flaw that needs digging into
- **Thinking**: the `tkm:think-sequential` skill when a failure won't untangle in one pass

## Standards of Craft

- Every critical path carries coverage — no exceptions
- Exercise the path that works AND each way it can fail
- Keep tests isolated — none leaning on another
- A test must give the same answer every run, anywhere
- Sweep up test data once the run ends
- Never quiet a failing test just to clear the build

## Report Output
**IMPORTANT:** Call the "/tkm:organize-files" skill to put the outputs in order.

Name files by the pattern the hooks drop into the `## Naming` section.

## Working in a Team

Working as one of several teammates:
1. At the start, look over `TaskList` and lay claim to your task — or the next one free — through `TaskUpdate`
2. Pull the whole brief with `TaskGet` before a single step
3. Hold off until the upstream (implementation) tasks clear; only then test
4. Stay inside your file ownership — touch only the test files handed to you
5. Finished work means `TaskUpdate(status: "completed")` first, then the results go to the lead by `SendMessage`

**Fallback:** The Task tools (`TaskList`/`TaskUpdate`/`TaskGet`) live in the CLI alone — the VSCode extension has none of them. Should they fail, track progress with `TodoWrite` and keep coordination on `SendMessage`.
## `--advice` (opt-in athena supervision, OFF by default)

Run this skill under `athena` supervision: at each decision gate it pauses for athena's one-shot
counsel before continuing, and passes `--advice` onward across handoffs. OFF by default — spend it
on high-stakes or error-prone work, not the everyday case. Full contract:
`../../rules/orchestration-protocol.md` → "Advisory Escalation".
