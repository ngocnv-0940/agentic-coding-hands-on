# Create-Suite Workflow

Forging new tests is not paperwork after the fact — it is part of the blade.
A test written to satisfy a checklist proves nothing. A test written to catch
a real failure is the temper itself.

## Step 0: Pass the Authoring Gate

Before a single test is written, run it through `authoring-gate.md`: answer the four
questions, reject anything matching a junk pattern, add no test-only seam, and keep one
owner test per contract. A test that cannot answer the four questions does not get
written — this is the gate that stops over-testing before it starts. The steps below
assume the test has already earned its place.

## Step 1: Pick the Lowest Layer That Proves the Behavior

Unit before integration, integration before e2e. Climb the ladder only when
the layer below cannot see the thing you need proven:

- **Unit** — a function's contract, a pure transformation, a boundary condition. Fast, isolated, first choice.
- **Integration** — two or more real pieces talking (a service and its DB, a handler and its middleware). Reach here when the risk lives in the seam, not inside either piece alone.
- **E2E** — a full user-facing flow through the real stack. Reach here only when nothing lower can observe the behavior (a redirect chain, a multi-page form, a UI state machine).

A test one layer higher than it needs to be is slower, flakier, and hides
its failure cause behind more moving parts. Climb only when forced to.

## Step 2: Prove the Test Can Fail

A test that cannot fail is not a test — it is decoration. Before trusting a
new test, spot-check it:

1. Mutate the code under test — flip a comparison, skip a branch, drop a
   validation — something a real bug would plausibly produce.
2. Run the test. It must go red.
3. Revert the mutation. It must go green again.

If the test stays green through the mutation, it is not watching the
behavior it claims to watch — rewrite it before moving on. This one-shot
check costs a minute and catches the single most common defect in new
test code: assertions that pass regardless of the implementation.

## Step 3: Choose What Deserves a Test

Spend the effort where the risk lives:

- **Test**: behavior (what the caller observes), boundaries (empty, zero,
  max, off-by-one), invariants (what must always hold), state transitions
  (before/after, valid/invalid moves), and real error handling (the catch
  block that actually runs, not just the happy path around it).
- **Skip**: trivial plumbing — getters, pure pass-throughs, framework
  boilerplate with no logic of its own. A test on a getter proves the
  language works, not that your code does.

## Step 4: Reuse the Project's Test Framework

Never introduce a second test runner, assertion library, or mocking
framework into a project that already has one. Read the existing test
files first — match their runner, their assertion style, their fixture
conventions, their naming pattern. A second framework is a second thing
to maintain, a second thing to keep passing, and a signal to the next
reader that something is inconsistent.

If the project has no test framework at all, pick the one the language
ecosystem already leans on (see `test-execution-workflow.md` for the
per-language defaults) — don't invent bespoke tooling.

## Step 5: Treat Safety-Critical Surfaces as Never "Done" on Green Units

A few passing unit tests around permission checks, auth flows, persistence,
or cross-service calls is not coverage — it's a false sense of one. These
surfaces fail in the seams: a permission check that unit-tests clean but
never runs against the real session middleware; a write that unit-tests
clean but never runs against the real transaction boundary.

For anything on the safety-critical list — defined once in
`../../../rules/development-rules.md` → "Test Scope & the Scope Contract" —
climb to integration (or e2e where the risk is the full path) before calling
the surface proven. That list is the single source of truth for what always
gets the wider net; read it there rather than trusting a partial memory of it
here, since a category left out of a copy is a surface left on unit tests alone.

## Quality Checklist

- [ ] Lowest layer that can observe the behavior was chosen, not the
      first one reached for out of habit
- [ ] Test mutated once, confirmed red, confirmed green again on revert
- [ ] Behavior, boundaries, invariants, and error paths covered — not
      trivial plumbing
- [ ] Existing project framework reused, no second tool introduced
- [ ] Safety-critical surfaces climbed to integration/e2e, not left on
      unit tests alone
