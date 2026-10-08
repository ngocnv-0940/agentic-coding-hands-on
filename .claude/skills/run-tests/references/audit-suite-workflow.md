# Audit-Suite Workflow

Not every green suite is sound metal. Some passes are earned; some are
lacquer over a crack. This workflow hunts the difference — every finding
carries a file:line, a severity, a proposed repair, and the risk the repair
itself introduces.

## Severity

Rank every finding:

- **Critical** — the test lies about safety: it passes with the bug
  present, it covers a safety-critical surface (see the list in
  `../../../rules/development-rules.md` → "Test Scope & the Scope
  Contract"), or it leaks a real secret.
- **Important** — the test is weak, redundant, or blind in a way that
  would let a real regression through on a normal change.
- **Minor** — style, naming, or a skip with a stale-but-plausible reason
  that should be revisited, not urgent to fix today.

## The 9 Classes to Hunt

The canonical write-time junk-pattern list and the keep-list live in
`authoring-gate.md` — treat it as the single source for what counts as a junk test.
The classes below are the audit-tuned superset: they fold in those junk patterns
(Deceptive, Ineffective, Redundant map straight onto them) and add the classes only an
audit surfaces (Disabled, Unfinished, Missing edge cases, Outdated, Security gaps, CI
blind spots). When judging a keep-or-cut, apply `authoring-gate.md`'s keep-list before
deleting.

For each class, cite the offending file:line, name the class, and propose
a repair plus the repair's own risk.

1. **Deceptive** — tautological asserts (`expect(true).toBe(true)`),
   asserting against the mock instead of the real behavior, snapshotting
   whatever the code currently outputs without checking it's correct,
   swallowed failures (`try { ... } catch {}` around an assertion), mocks
   so broad they replace the thing under test.
2. **Disabled** — `skip`/`todo`/`xit`/`it.skip` with no linked reason
   (issue, ticket, comment explaining why).
3. **Unfinished** — empty test bodies, a bare `TODO` where an assertion
   should be, setup code with no assertion at the end.
4. **Ineffective** — still green with the bug reintroduced (verify with
   the Step 2 mutation check from `create-suite-workflow.md`), asserts
   internal implementation details instead of observable behavior,
   duplicates a case another test already proves.
5. **Missing edge cases** — no boundary case (empty, zero, max,
   off-by-one), no null/empty input, no concurrency case where the code
   is concurrent, no error path, no permission-failure case where auth
   applies.
6. **Redundant** — two or more tests proving the same fact. Never delete
   on suspicion alone — pull a coverage diff first (run coverage with the
   candidate test excluded; if coverage doesn't drop, it's safe to cut).
7. **Outdated** — locked to a feature that's gone, an API that got
   renamed, a shape the code no longer produces.
8. **Security gaps** — a real (non-synthetic) secret hardcoded in a
   fixture or test body, a test that prints a secret to logs/output, an
   authz-failure path with no test at all, injection-shaped inputs
   (`'; DROP TABLE`, `<script>`, path traversal strings) that no test ever
   sends through.
9. **CI blind spots** — a lane defined but never actually invoked by the
   pipeline, a job that's always green because its exit code is masked
   (`|| true`, swallowed non-zero), a result file the quality gate never
   reads.

## Finding Format

```markdown
### [Critical|Important|Minor] {class} — `path/to/test.ts:42`
- **What**: one line, what's wrong
- **Evidence**: the assertion/line in question, quoted
- **Repair**: the concrete fix
- **Repair risk**: what could go wrong applying it (e.g. "re-enabling
  this skip may surface a real failure that needs its own fix first")
```

## Repair Rules

- **Deceptive/ineffective** — rewrite to assert the observable contract
  (return value, side effect, state change), not the mock call or the
  implementation detail.
- **Disabled** — re-enable by fixing the underlying cause. Never just
  strip the skip marker and call it done; if the cause can't be fixed in
  this pass, say so and leave the skip with an issue link.
- **Redundant** — delete only after a coverage diff proves nothing is
  lost by the deletion.
- **Security gaps** — replace real secrets with synthetic values
  (clearly-fake tokens, `test-only` prefixed keys); add the missing
  authz-failure and injection cases rather than just flagging their
  absence.

## Closing the Audit

The audit is done when:

- [ ] Every finding has file:line, class, severity, repair, and repair
      risk
- [ ] Repairs applied for Critical and Important findings
- [ ] Full suite green after repairs — no new failures introduced
- [ ] No new skips added as a side effect of a repair
- [ ] Any Minor findings left open are listed with a reason
