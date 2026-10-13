# Representative Review and Calibration

Selection and propagation are deterministic and operate only on directly
assessed work items. User Story/Epic containers are never representatives or
calibration targets. Semantic scoring occurs before
this stage; historical evidence and confidence never modify an axis.

## Representative selection

Canonical identity order is `sourceType`, then natural `issueRef`. For zero
issues, select none. For one through five issues, select all once in canonical
order.

For more than five issues:

1. Sort by `(initialSWP, sourceType, natural issueRef)`.
2. Select unique low, lower median at `floor((n - 1) / 2)`, and high rows, in
   that role order.
3. Select a boundary row: the first canonical unselected
   `splitRecommended=true` row; otherwise the unselected row with greatest
   absolute distance from the median score, ties by canonical identity.
4. Select a low-confidence row from remaining rows. Rank `low` before `medium`
   before `high`, then `AMBIGUOUS` before `INFERRED` before `EXTRACTED`, then
   canonical identity.
5. If a role collides or has no candidate, fill remaining slots greedily:
   prefer a new `(primaryDiscipline, workType)` pair, then greatest score
   distance from the median, then canonical identity.

Stop at exactly five unique rows. Do not replace an already selected
low/median/high row to improve coverage. Record all roles/reasons that selected
each issue.

Selection reasons are a closed deterministic vocabulary:
`all-issues|minimum|lower-median|maximum|split-boundary|outlier|lowest-confidence|coverage-fill`.
Only `select_representatives()` may write them. Do not invent, paraphrase, or
manually assign a reason in the main-agent payload.

## One-round user review

Only the main agent asks the user. The user-facing question is a difficulty
check, not an axis-tuning form: Scope and Complexity are internal audit data
and must not appear in the cards. Present each representative on the
five-level difficulty scale derived from its initial SWP
(rất dễ 1–2 · dễ 3–5 · vừa 6–12 · khó 13–25 · rất khó 26+):

```text
<ref> — <title>
Đánh giá hiện tại: mức <difficulty level> (<initialSWP> SWP)
Việc gì: <one-line structural rationale in plain words>
Selected for: <selection reasons, translated to plain Vietnamese>
```

Review representatives ONE AT A TIME, finishing both rounds for one issue
before moving to the next — never ask all level questions first and all point
questions after; batching by round breaks the user's focus on the issue at
hand. The per-issue sequence is two rounds, so the user always ends on a
concrete number instead of a fuzzy level:

1. **Round 1 — difficulty level.** "Issue này ở mức nào?" with the five levels
   as options; the current level (from the initial SWP) is the recommendation.
   Choosing the current level AND keeping the current point in round 2 means
   approved unchanged.
2. **Round 2 — point within the level.** The question title states the level's
   point range, e.g. "Mức khó tương ứng 13–25 điểm — chọn điểm cụ thể". The
   options are exactly the valid SWP points inside the chosen level:

   ```text
   rất dễ  → 1, 2
   dễ      → 3, 4, 5
   vừa     → 6, 8, 9, 10, 12
   khó     → 13, 15, 16, 20, 24, 25
   rất khó → 26, 39, 40, 65
   ```

   Recommend the initial SWP when it falls inside the chosen level, otherwise
   the point nearest the initial SWP. When the harness caps the option count,
   show the points nearest the recommendation and leave the rest to the
   free-text path — every answer must still be one of the level's valid points.

Also offer accept-all and skip-calibration for the whole batch.

Map the chosen point deterministically to axes with `axes_for_swp()` in
`scripts/core/schema.py`: it picks the matrix cell with that exact SWP value
that moves fewest bands from the initial assessment (preferring a Complexity
move over a Scope move). Never hand-pick a cell. A user who explicitly states
Scope/Complexity band values may still correct either axis directly — accept
them verbatim after band validation. The user may add rationale/context and
mark a correction issue-specific.

SWP is display-only and always re-derived. Use native structured interaction
when the harness supports it — one question per call, keeping the per-issue
level→point order; otherwise ask in chat with the same one-issue-at-a-time
order and wait. Do not interpret silence as approval.

Reject an invalid band and ask one focused follow-up. If two corrections create
conflicting rules, explain the affected group in plain words and ask the user
to choose; do not silently use the last response.

## Exact calibration stratum

The stratum is the tuple:

```text
(
  primaryDiscipline,
  workType,
  compact(scopeSignature in vocabulary order),
  compact(complexitySignature in vocabulary order)
)
```

All four members must match exactly. Do not use title similarity, embeddings,
source type, confidence, historical theme, numeric proximity, or a global
offset. `Unknown` discipline does not match a known discipline.

## Build calibration rules

For each non-issue-specific correction:

1. Find the initial and approved positions in the relevant allowed band array.
2. Compute an independent band-index delta for Scope and Complexity.
3. Attach the representative's exact stratum and identity.
4. Corrections that leave an axis unchanged contribute zero for that axis.

If same-stratum representatives propose different non-zero deltas for the same
axis, return a typed conflict and wait. Equal deltas may share one rule. A Scope
delta and Complexity delta from compatible same-stratum corrections may combine.

An issue-specific correction locks only that representative and creates no
propagation rule.

## Apply rules

Start every final row equal to its initial row.

1. Lock every representative to its exact approved axes.
2. For each non-representative row, match at most one exact stratum rule.
3. Move each axis by its band-index delta, independently.
4. Bound at the first/last band; set `saturated=true` when a requested step
   crosses a boundary.
5. Derive `finalSWP` from the composition matrix:
   `SWP_MATRIX[finalScope][finalComplexity]`.
6. Record `matchedRuleId` and deltas for propagated rows.

Never change confidence/evidence/signatures during arithmetic propagation.
A saturation caveat may prompt split review, but it does not automatically set
`splitRecommended`; that flag still needs structural evidence.

## Status and audit

- `accepted`: representatives reviewed with no axis changes; all final axes equal
  initial.
- `calibrated`: at least one approved axis differs, whether issue-specific or
  propagated.
- `skipped`: user explicitly skipped, or the readable run was empty.
- `pending`: no final report while review is still required.

Per-row `calibration.status`:

- `approved` for an unchanged approved representative;
- `issue-specific` for a corrected issue-specific representative;
- `propagated` for a non-representative changed by a rule;
- `unchanged` for an unaffected row;
- `skipped` when the run intentionally skips calibration.

The audit must prove:

- every representative's initial and approved axes;
- every correction's issue-specific choice and rationale;
- every rule's stratum, axis deltas, and source representatives;
- every changed non-representative's matched rule;
- any bounded/saturated application;
- zero changes outside exact matching strata.
