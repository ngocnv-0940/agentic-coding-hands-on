# Re-Review Prompt Template

Use this template when dispatching a scoped re-review after a `tkm:takumi` Stage 5 fix round; every
other skill re-reviews with `reviewer-prompt-template.md`. The re-reviewer verifies that each open
finding and each open `refuted` / `unproven` / `reachableRegressions` entry was resolved, and checks
the fix diff for new breakage. It is not a fresh
review — the full review already happened. Pick the tier first:
`skills/_shared/dispatch-model-tiers.md` § Reviewer Dispatch.

````
Subagent:
  agent: [Where the harness cannot set reasoning effort per dispatch: general-purpose-<effort>,
          with <effort> from dispatch-model-tiers.md § Reviewer Dispatch.
          Where it can: the harness's built-in general agent (no custom agent type), with effort passed below.]
  description: "Re-review [scope] fix round [R]"
  model: [REQUIRED — the tier from dispatch-model-tiers.md § Reviewer Dispatch, sized to the fix diff,
          resolved for this harness. An omitted model silently inherits the session's, usually the most expensive.]
  effort: [Where the harness takes effort per dispatch: REQUIRED — the effort of this fix round's implementer,
           clamped to the band (§ Reviewer Dispatch), under the harness's own name for it.
           Send model and effort together, never the model alone.
           Where it does not: carried by the agent above; send nothing here.]
  prompt: |
    ## Your Task

    Findings under verification: [OPEN_FINDINGS — each with severity, location and summary, verbatim from the previous verdict]
    Verdict entries under verification: [the previous verdict's `refuted`, `unproven` and `reachableRegressions` entries, verbatim, or "none"]
    Fix diff: [BASE..HEAD of this fix round]
    Previous verdict: [PREVIOUS_VERDICT path]
    Plan: [PLAN_FILE path, or "none"]
    Evidence dir: [absolute EVIDENCE_DIR when a gate asks for a verdict, or "none"]

    Stay read-only — never edit what you judge.
    You may spawn only `Explore`.

    # Scoped Re-Review

    A previous review produced findings; an implementer has tried to fix them. Verdict each finding
    and each verdict entry under verification, and inspect the fix diff — nothing else. Code the fix did not touch was judged already; do not
    review it again.

    ## Each Finding

    - **Addressed** — the fix diff resolves it. Cite the `path:line` in the diff that proves it.
    - **Still open** — not resolved, or only partly. Say what is still missing.

    A finding is addressed only by evidence in the diff, never by the implementer's report alone.

    Each verdict entry under verification — a refuted claim, an unproven one, a reachable
    regression — is judged the same way: resolved only when the fix diff proves it, with the
    `path:line`; otherwise still open.

    ## The Fix Diff

    Read `git diff BASE..HEAD`. Hold the changed lines, and what they call, to the eight checks:
    concurrency, error boundaries, API contracts, backwards compatibility, input validation,
    identity and permission, query efficiency, data leakage. Anything the fix broke is a new
    finding, graded Critical / High / Medium / Low, with a concrete fix.

    ## Report

    ```markdown
    ## Re-Review: fix round [R]

    ### Findings Under Verification
    - [addressed | still open] [severity] [location] — [summary] — [evidence]

    ### Verdict Entries Under Verification
    [None, or one per line: resolved | still open] [refuted | unproven | reachableRegressions] — [entry] — [evidence]

    ### New Findings From The Fix Diff
    [None, or one per line: severity, location, problem, fix]

    ### Assessment
    [Ready, or what still blocks]
    ```

    ## Verdict (when an evidence dir is given)

    End your report with one fenced `json` block — the complete `inspection-verdict.json`, built
    from the previous verdict. You emit it; the calling skill writes it, once.

    - Carry `acceptanceCovered`, `regressionChecked` and `contractStatus` forward unchanged, unless
      the fix diff touches what an entry covers — then re-check that entry and update it.
    - Keep every previous finding's entry with its `severity`, `category`, `location` and
      `disposition`. Prefix the `summary` of each one the fix addressed with `addressed — `.
      Add no other key to a finding: an unknown key blocks the gate.
    - Append each new finding from the fix diff, every `Accept` with a real `path:NNN` location.
    - `criticalCount` counts the critical findings still open, old and new.
    - `score`: re-score the change as it stands after the fix; never carry the previous number
      forward. It stays advisory, but the calling loop reads it.
    - `refuted`, `unproven` and `reachableRegressions`: keep every previous entry that is still
      open. Drop one only when the fix diff resolves it, citing the `path:line`. Add an entry for
      anything the fix diff itself refutes, leaves unproven or regresses.
    - `riskGate`: carry the previous gate forward. Never clear `riskGate.signoffRequired`, and
      never set `humanSignedOff` to `true` — only a human does. If the fix diff lands in a
      high-risk area (`skills/_shared/references/evidence-artifacts.md` § `riskGate`), set
      `touchesSensitiveArea` and `signoffRequired` to `true` and `humanSignedOff` to `false`,
      whether or not the previous verdict had a gate: a sign-off covers the code the human saw,
      not the fix.
    - Carry every other top-level key of the previous verdict forward unchanged.
    - `decision` follows the reviewer's Evidence Verdict Contract
      (`skills/_shared/templates/reviewer-prompt-template.md`) exactly: `SEALED` only when
      `criticalCount` is 0, `refuted`, `unproven` and `reachableRegressions` are empty and
      `contractStatus` is not `UNKNOWN`.

    ## Constraints

    - Never modify source code — verdict and report only
    - Never widen the scope past what is under verification and the fix diff
    - Concision beats grammar. Anything left unresolved goes last.

    ## Status Protocol

    Report completion using one of:
    - **DONE** -- Every finding and verdict entry verdicted, fix diff inspected
    - **DONE_WITH_CONCERNS** -- Done, but a critical finding or a `refuted` / `unproven` /
      `reachableRegressions` entry is still open, the fix broke something, or you raised
      `riskGate.signoffRequired` (the change now needs a human sign-off)
    - **BLOCKED** -- Cannot re-review (missing diff range, previous verdict unreadable)
    - **NEEDS_CONTEXT** -- The findings or the fix round cannot be identified
````
