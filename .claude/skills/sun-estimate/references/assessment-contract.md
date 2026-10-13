# Assessment Contract

This is the canonical interchange contract between source adapters, semantic
assessment, deterministic validation/calibration, and the HTML renderer.
Unknown fields may be retained only in an explicit provenance object; do not
invent alternative names for required fields.

## Run payload

```json
{
  "schemaVersion": "2.0",
  "scoringModel": "standard-work-point",
  "scoringModelVersion": "swp-matrix-v2",
  "run": {
    "sourceFamily": "github",
    "sourceLabel": "sun-asterisk project 33",
    "sourceUrl": "https://github.com/orgs/sun-asterisk/projects/33",
    "project": "33",
    "period": null,
    "generatedAt": "2026-08-25T00:00:00Z",
    "calibrationStatus": "pending"
  },
  "issues": [],
  "parents": [],
  "representatives": [],
  "corrections": [],
  "calibrationRules": [],
  "caveats": []
}
```

Required root fields are shown above.

- `schemaVersion` is `"2.0"`; scoring model fields above are mandatory audit data.
- `run.sourceFamily` is `github|backlog|kpi-insight|file`.
- `run.calibrationStatus` is
  `pending|accepted|calibrated|skipped`. An empty readable run uses `skipped`
  with an empty-state caveat.
- nullable values are JSON `null`, never empty-string sentinels.

## Directly assessed work item

Each `issues[]` row starts with:

```json
{
  "sourceType": "github",
  "issueRef": "sun-asterisk/example#42",
  "url": "https://github.com/sun-asterisk/example/issues/42",
  "title": "Add retry-safe webhook handler",
  "body": "Untrusted source text or null",
  "labels": ["backend", "feature"],
  "issueType": "task",
  "state": "open",
  "status": "New",
  "sprints": ["Sprint 12"],
  "milestones": [],
  "functionRef": "AUTH-LOGIN",
  "activityType": "implement",
  "project": "EXAMPLE",
  "period": null,
  "parentRef": null,
  "provenance": {
    "retrievedVia": "gh",
    "detailStatus": "full",
    "fields": ["title", "body", "labels", "url"],
    "notes": []
  }
}
```

Rules:

- `sourceType` is `github|backlog|redmine|jira|notion|file`.
- `issueRef` is a non-empty stable source identifier. Preserve source spelling;
  do not silently convert a project item ID into an issue ref.
- `url` and `body` are string or `null`. Only a sanitized HTTPS issue URL may
  become a link in HTML.
- `labels` is a sorted, unique string array.
- `project` and `period` are string or `null`.
- `issueType` in `issues[]` is `task|bug|other`. A User Story or Epic is always
  a container. A Task/Bug/Other referenced as a parent is also a structural
  container. Containers belong in `parents[]`, never in this array.
- `functionRef` identifies the bounded product behavior this activity supports.
  `activityType` is exactly
  `implement|fix-bug|unit-test|document|performance-test`. Each applicable
  activity is a separate direct work item with its own score. Missing activity
  types are not auto-created.
- `parentRef` is the same-source parent container's `issueRef`, or `null`.
- `existingEstimate` (optional, object or `null`):
  `{standardWorkPoint: number|null, estimatedHours: number|null,
  source: "kpi"|"board"|"backlog"|"file"|"other"}`. It never alters scoring.
- `run.selection` (optional object) records how the issue set was chosen:
  `includeClosed`, `reestimateExisting`,
  `statusRule` (`issue-state|unavailable|not-applicable`),
  `existingEstimateCheck` (`checked|unavailable|not-applicable`),
  `filters {sprints[], milestones[], labels[]}`, and `excluded {<gate>: count}`.
  The renderer turns it into the scope banner; omitting it renders no banner.
- `provenance.detailStatus` is
  `full|partial|metadata-only|forbidden|unavailable`.
- `provenance.fields` is the sorted unique set actually retrieved.
- `provenance.notes` contains non-secret adapter caveats, not raw tool
  transcripts, headers, or credentials.

The identity tuple is `[sourceType, issueRef]`. Deduplicate on that tuple before
assessment, retaining the most complete provenance. A run may contain only one
`run.sourceFamily`. Canonically sort final rows by `sourceType` and natural
`issueRef` order.

## Parent containers and rollup

`parents[]` contains User Story/Epic containers and any Task/Bug/Other candidate
that another candidate references as its parent. It keeps the source
`issueType` plus the same identity, URL, title, labels, state/status,
sprint/milestone, provenance, and optional `parentRef` metadata as a direct
work item, but it must not contain Scope, Complexity, discipline, work type,
signatures, rationale, calibration, or split fields. A promoted task container
must not also appear in `issues[]`; this prevents bucket-and-child double count.

Validation derives these output-only fields:

```json
{
  "aggregationStatus": "derived",
  "childRefs": ["sun-asterisk/example#42"],
  "initialSWP": 3,
  "finalSWP": 5
}
```

For every parent container, SWP is the arithmetic sum of its direct work-item
children and recursively derived child containers. Do not apply the 6×6 matrix
or round the sum again. A container with no children, or with an
unresolved descendant, has `aggregationStatus: needs-breakdown` and both SWP
fields `null`. Parent containers cannot be representatives or calibration
targets.

## Assessment fields

Append these fields to every directly assessed work item:

```json
{
  "primaryDiscipline": "API",
  "workType": "feature",
  "scopeSignature": ["single-component"],
  "complexitySignature": ["stateful"],
  "initialScope": 2,
  "initialComplexity": 2,
  "initialSWP": 3,
  "finalScope": 2,
  "finalComplexity": 2,
  "finalSWP": 3,
  "confidence": "high",
  "evidenceStatus": "EXTRACTED",
  "rationale": "One endpoint and bounded state/idempotency behavior.",
  "assumptions": [],
  "gaps": [],
  "supportingEvidence": [],
  "splitRecommended": false,
  "splitReason": null,
  "calibration": {
    "isRepresentative": false,
    "selectionReasons": [],
    "approvedScope": null,
    "approvedComplexity": null,
    "issueSpecific": false,
    "matchedRuleId": null,
    "scopeBandDelta": 0,
    "complexityBandDelta": 0,
    "saturated": false,
    "status": "unchanged"
  }
}
```

Enum and vocabulary rules:

- `primaryDiscipline` and `workType` use the exact enums in
  [scoring-rubric.md](scoring-rubric.md).
- signatures are unique and serialized in rubric vocabulary order;
- `confidence` is `high|medium|low`;
- `evidenceStatus` is `EXTRACTED|INFERRED|AMBIGUOUS`;
- `calibration.status` is
  `unchanged|approved|issue-specific|propagated|skipped`.

`rationale` must identify the structural facts behind both axes.
`assumptions` and `gaps` are string arrays. `supportingEvidence` may describe
baseline historical context, but cannot be cited as the reason for a score.

`splitRecommended=true` requires terminal axes and a non-empty `splitReason`.
When false, `splitReason` is `null`.

## Derived-only invariants

The agent decides Scope and Complexity. It never decides SWP independently.
SWP fields are serialized as assertions for audit and rejected when they do
not equal the composition-matrix cell for their axes:

```text
initialSWP = SWP_MATRIX[initialScope][initialComplexity]
finalSWP   = SWP_MATRIX[finalScope][finalComplexity]
```

The matrix lives in `scripts/core/schema.py` (`SWP_MATRIX`, `derive_swp`);
every cell is `Scope × multiplier[Complexity]` rounded half-up to an integer
(multipliers ×1, ×1.25, ×1.5, ×2, ×3, ×5) — no Fibonacci snapping.

Before calibration, `finalScope`, `finalComplexity`, and `finalSWP` equal the
initial fields. After calibration, deterministic code alone writes final axes
and re-derives the final SWP from the matrix.
JSON booleans are not valid integers.

Changing confidence, evidence status, supporting evidence, or rationale without
changing an axis must leave both SWP fields unchanged.

## Calibration stratum

A stratum has exactly four fields:

```json
{
  "primaryDiscipline": "API",
  "workType": "feature",
  "scopeSignature": ["multi-component", "cross-layer"],
  "complexitySignature": ["stateful"]
}
```

Serialize signature arrays as compact JSON in vocabulary order when producing a
tuple key. Matching is exact on all four fields. Do not fuzzy-match, treat
`Unknown` as similar to a known discipline, or add confidence/source/historical
theme to the stratum.

## Representative and correction audit

`representatives[]` entries:

```json
{
  "sourceType": "github",
  "issueRef": "sun-asterisk/example#42",
  "selectionReasons": ["median"]
}
```

`selectionReasons` must come from the closed vocabulary in
[representative-calibration.md](representative-calibration.md). Unknown or
agent-authored synonyms are contract errors.

`corrections[]` entries:

```json
{
  "representative": {
    "sourceType": "github",
    "issueRef": "sun-asterisk/example#42"
  },
  "approvedScope": 3,
  "approvedComplexity": 2,
  "issueSpecific": false,
  "rationale": "Team treats this workflow as a wider API change."
}
```

The user edits axes only. Do not accept an independently supplied SWP.

`calibrationRules[]` entries:

```json
{
  "ruleId": "cal-001",
  "stratum": {
    "primaryDiscipline": "API",
    "workType": "feature",
    "scopeSignature": ["single-component"],
    "complexitySignature": ["stateful"]
  },
  "scopeBandDelta": 1,
  "complexityBandDelta": 0,
  "representativeRefs": ["github:sun-asterisk/example#42"]
}
```

`ruleId` is stable within the run. Band deltas are index steps in the allowed
band arrays, not numeric subtraction. Issue-specific corrections create no
propagation rule. Conflicting same-stratum, same-axis deltas are invalid until
the user resolves them.

Every changed non-representative row must name one `matchedRuleId`. Every
approved representative must retain its exact approved axes. Every unchanged
row outside a matched stratum keeps the complete initial values.

## Validation order

1. Validate root/run/scoring-model fields and one-source-family constraint.
2. Validate direct work items and parent containers; deduplicate all identities.
3. Validate enums, signatures, bands, split rules, and initial arithmetic.
4. Canonically sort and derive parent rollups.
5. Select representatives and accept validated corrections.
6. Apply calibration, then validate final arithmetic and change audit.
7. Remove raw bodies/tool transcripts from the renderer view model and render.
