# Authoring Gate

The gate a test passes before it earns its place. A blade gains nothing from more
edges — only from the one that cuts. Coverage that climbs while real bugs slip
through is lacquer over a crack: it hides the flaw, and the next refactor pays for it
by breaking a pile of tests that never guarded anything.

Apply this gate silently at write time. Write the answers out only when the user asks.

_Adapted from the MIT-licensed OpenClaw `test-audit` skill (rights: OpenClaw Foundation
and Thiệu Nguyễn), condensed for takumi-kit. MIT notice preserved._

## The four questions

Before adding or changing a test, answer all four. A missing answer means do not add it.

1. **What observable behavior, invariant, or contract does it protect?** Not a private
   helper, not a call shape — what the caller actually observes.
2. **What realistic regression would make it fail?** Name the bug it would catch.
3. **Why doesn't existing coverage already catch that?** Each contract has one primary
   test at its strongest boundary; another layer earns a test only for its own distinct
   risk. Prefer extending an existing table case or fixture over a near-duplicate test.
4. **Does it need a test-only seam** — an export, flag, wrapper, or injection hook that
   no production code uses? If yes, test at the real boundary instead.

A test that breaks under a behavior-preserving refactor is testing implementation.
Rewrite it at the public boundary.

## Junk patterns — reject at write time (canonical list)

Reject a new test matching any of these. In an audit, hunt for existing tests that do —
`audit-suite-workflow.md` points here for its hunt list.

- no meaningful assertion (only proves the code ran);
- self-comparisons or identity copies;
- copied fixtures, inventories, manifests, or export lists;
- assertions on source text, imports, or exact string greps;
- private-helper or call-shape tests already covered at the public boundary;
- the same contract invoked twice, or a shared helper replayed once per caller;
- tests that exist only to keep a test-only export, global, or wrapper alive;
- expected values produced by the code under test;
- mocks that implement the asserted behavior, or one mock standing in for different APIs;
- fixtures that supply the very result the code under test should produce;
- tests that restate a declared flag instead of exercising the behavior it promises;
- negative cases that pass for an unrelated reason (a different guard rejected the input);
- names or fixtures that promise more than the assertions check.

## No test-only seams

Do not add an export, wrapper, flag, or injection hook whose only caller is a test.
If a behavior can't be reached from the real boundary, that is a design signal — fix the
boundary, don't drill a hole for the test.

## One owner per contract

Each contract gets one owner test at its strongest boundary; do not replay the same
scenario at every layer it crosses. A bug fix gets one regression test at the owning
boundary (see the fix-bug `prevention-gate.md` regression rule), not one per layer.

## Keep

Keep a test that independently guards a public API, config, migration, storage, security,
protocol, platform, or default-value contract — even if it looks static or simple. Keep
call-ordering tests when order is observable behavior. Static or slow is not a reason to
delete.
