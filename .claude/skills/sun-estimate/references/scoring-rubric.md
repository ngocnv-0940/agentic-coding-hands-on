# Scope and Complexity Rubric

Use current issue structure, not historical hours. Score the two axes
independently, then derive Standard Work Point from the matrix.

## Canonical formula

```text
Scope      ∈ [1, 2, 3, 5, 8, 13]
Complexity ∈ [0, 1, 2, 3, 5, 8]
Standard Work Point (SWP) = SWP_MATRIX[Scope][Complexity]
                          = round_half_up(Scope × multiplier[Complexity])
multiplier = {C0: ×1, C1: ×1.25, C2: ×1.5, C3: ×2, C5: ×3, C8: ×5}

            C0   C1   C2   C3   C5   C8
S1           1    1    2    2    3    5
S2           2    3    3    4    6   10
S3           3    4    5    6    9   15
S5           5    6    8   10   15   25
S8           8   10   12   16   24   40
S13         13   16   20   26   39   65
```

Composition is a fixed matrix lookup, never a sum: difficulty applies to each
unit of breadth, so combined effort compounds multiplicatively. Cells are the
raw products rounded half-up to integers — no Fibonacci snapping and no
hand-tuned caps — so scores stay as close to the seed arithmetic as integers
allow. The matrix in `scripts/core/schema.py` (computed from
`COMPLEXITY_MULTIPLIERS`) is the single source of truth; re-tuning means
changing the multipliers there, never editing individual cells.

The matrix applies only to Task, Bug, and other directly assessable work items.
User Story and Epic are containers: their SWP is the plain sum of descendant
work-item SWP, without a second matrix lookup or re-rounding. A container
without a complete child breakdown has no score and is marked
`needs-breakdown`.

## Scope: how much work is affected

Scope measures breadth, component/layer count, blast radius, and verification
surface. Choose the smallest band that contains all evidenced work.

| Scope | Structural meaning | Typical evidence |
|---:|---|---|
| 1 | One localized component or change path | copy/constant change, one simple UI component, one narrow endpoint change, one focused test |
| 2 | Several related changes within one component or layer | one screen with a small form, endpoint plus ordinary validation, a few related tests |
| 3 | Several components in one layer, or one bounded cross-layer flow | screen plus endpoint wiring, one service with model/query changes, localized bug crossing two layers |
| 5 | A complete workflow or subsystem spanning multiple components/layers | multi-screen flow, API plus DB behavior, feature-level QA regression, one controlled migration/release unit |
| 8 | Several subsystems, repositories, environments, or a broad matrix | cross-repository feature, multi-service rollout, large backfill, multi-platform regression |
| 13 | Release-wide or cross-system scope at the edge of one deliverable | coordinated product area, many services/clients, broad migration with extensive verification |

### Discipline signals for Scope

| Discipline | Breadth signals |
|---|---|
| UI | number of screens/components/states, responsive platforms, shared component impact |
| API | endpoints/services/models, permission surfaces, background jobs |
| DB / Migration | tables/index groups/triggers, backfill population, readers/writers affected |
| Deploy / Infra | services/modules, environments/regions, rollout stages and traffic paths |
| QA | flows/states/platforms, regression matrix, manual and automated coverage |
| Bugfix | components/layers/systems the fix and regression touch |
| Integration | internal layers, repositories, or systems that must work together |

## Complexity: how difficult the work is inside that scope

Complexity measures intrinsic reasoning, state behavior, technical uncertainty,
integration difficulty, reversibility, and operational risk. It does not count
components a second time.

| Complexity | Intrinsic meaning | Typical evidence |
|---:|---|---|
| 0 | Routine and deterministic | known pattern, no meaningful branching, migration, integration, or operational risk |
| 1 | Standard implementation with bounded decisions | ordinary validation, familiar state, straightforward permissions or errors |
| 2 | Multiple states/edge cases or moderate technical coupling | nested model behavior, non-trivial permissions, retry/error paths, careful test design |
| 3 | Material integration, migration, concurrency, or rollout reasoning | background processing, controlled backfill, third-party contract, staged rollout |
| 5 | High-risk or poorly understood implementation with concrete evidence | legacy behavior inherently unknown, difficult external integration, rollback-sensitive data/operations |
| 8 | Exceptional difficulty combining several high-risk modes | irreversible/high-volume migration, novel algorithm plus operational safety, cross-system failure modes with no safe local boundary |

Use Complexity 5 or 8 only when the issue provides a concrete signal. A short or
missing body is not itself technical complexity.

## Anti-double-count rules

- Number of screens/endpoints/services/tables belongs to Scope.
- Difficulty of state, algorithm, migration, concurrency, external contract, or
  safe rollout inside those units belongs to Complexity.
- Cross-layer presence increases Scope. The hard state synchronization or
  failure recovery across layers may separately increase Complexity.
- External integration counts once as breadth only when it adds another system;
  protocol instability, authentication, rate limits, and failure handling count
  as Complexity.
- Missing information lowers confidence and adds a gap. It must not
  automatically raise either axis.
- `legacy-unknown` is valid only when evidence shows the implementation or fault
  domain is inherently unknown, not merely because detail access failed.

Example: three ordinary endpoints are broader than one and therefore affect
Scope; they are not automatically more complex. One endpoint with idempotent
concurrent updates can have narrow Scope and high Complexity.

## Canonical signatures

Signatures explain the structural score and form calibration strata. They are
closed vocabularies, not free-form tags.

`scopeSignature` vocabulary, in serialization order:

1. `single-component`
2. `multi-component`
3. `cross-layer`
4. `cross-repository`
5. `cross-system`
6. `data-migration`
7. `release-wide`
8. `qa-matrix`

`complexitySignature` vocabulary, in serialization order:

1. `routine`
2. `stateful`
3. `concurrency`
4. `migration`
5. `external-integration`
6. `legacy-unknown`
7. `operational-safety`
8. `algorithmic`

Arrays must be unique and sorted in the order above. Reject unknown values.
`single-component` and `multi-component` are mutually exclusive. `routine` is
used alone; if another complexity signature applies, omit `routine`. Source
incompleteness never becomes a signature.

## Discipline and work type

`primaryDiscipline` is exactly one of:

`UI|API|DB|Migration|Deploy|QA|Infra|Bugfix|Integration|Unknown`.

Use `Unknown` only when available evidence cannot establish a discipline. This
lowers confidence and must not invent a calibration relationship.

`workType` is exactly one of:

`feature|bugfix|refactor|migration|deployment|infrastructure|test-design|test-execution|investigation|documentation|other`.

Normalize tracker labels to this vocabulary and retain the raw label in
provenance when useful.

## Evidence and confidence

Evidence status:

- `EXTRACTED` — decisive structural facts appear directly in the issue or
  targeted source context;
- `INFERRED` — some structural facts follow from supported metadata or bounded
  assumptions;
- `AMBIGUOUS` — important structural facts remain unresolved.

Confidence:

- `high` — all material score signals are extracted and gaps do not affect a
  band decision;
- `medium` — one or more bounded assumptions affect classification or a band;
- `low` — title/metadata-only evidence, unresolved material gaps, or unknown
  discipline.

Always cite the facts behind each axis. Historical themes may be noted as
context but do not qualify as structural score evidence.

## Terminal and split handling

The maximum ticket score is the terminal matrix cell `(Scope 13, Complexity 8)
= 55`. A score of 55 does not automatically mean split.

Set `splitRecommended=true` only when evidence shows either:

- independently deliverable parts that should be separate issues; or
- work breadth/difficulty beyond what terminal bands can faithfully express.

When split is recommended, use terminal `Scope=13` and `Complexity=8`, keep
`SWP=55`, and provide a non-empty `splitReason` naming the proposed
boundaries. The reverse does not apply: a terminal 55 with no such evidence may
retain `splitRecommended=false`.
