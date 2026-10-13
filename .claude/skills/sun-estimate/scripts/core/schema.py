"""Strict normalization and arithmetic invariants for issue assessments."""

from __future__ import annotations

import re
from typing import Any, Iterable

SCHEMA_VERSION = "2.0"
SCORING_MODEL = "standard-work-point"
SCORING_MODEL_VERSION = "swp-matrix-v2"
SCOPE_BANDS = (1, 2, 3, 5, 8, 13)
COMPLEXITY_BANDS = (0, 1, 2, 3, 5, 8)
# Complexity acts as a multiplier on the whole scope (effort compounds across
# breadth rather than adding to it): SWP = Scope × multiplier[Complexity],
# rounded half-up to an integer. No Fibonacci snapping and no hand-tuned caps
# (v2) — rounded raw products keep scores as close to the seed arithmetic as
# integers allow.
COMPLEXITY_MULTIPLIERS = (1, 1.25, 1.5, 2, 3, 5)


def _round_half_up(value: float) -> int:
    """Round .5 upward (business rounding); Python's round() is banker's."""
    return int(value + 0.5)


# Rows follow SCOPE_BANDS, columns follow COMPLEXITY_BANDS.
SWP_MATRIX = tuple(
    tuple(_round_half_up(scope * multiplier) for multiplier in COMPLEXITY_MULTIPLIERS)
    for scope in SCOPE_BANDS
)


def derive_swp(scope: int, complexity: int) -> int:
    """Look up Standard Work Point for already-validated band values."""
    return SWP_MATRIX[SCOPE_BANDS.index(scope)][COMPLEXITY_BANDS.index(complexity)]


def axes_for_swp(target_swp: int, initial_scope: int, initial_complexity: int) -> tuple[int, int]:
    """Resolve a user-chosen SWP point back to one matrix cell deterministically.

    Several cells can share one SWP value (e.g. 3 = S3×C0 = S2×C1 = S1×C5).
    Pick the cell whose bands move least from the initial assessment: fewest
    total band steps, then the smaller Scope move (a difficulty review should
    reshape Complexity before Scope), then the lower Scope band, then the lower
    Complexity band. Raises ContractError when the value is not a matrix cell.
    """
    initial_s = SCOPE_BANDS.index(initial_scope)
    initial_c = COMPLEXITY_BANDS.index(initial_complexity)
    candidates = [
        (row_index, col_index)
        for row_index, row in enumerate(SWP_MATRIX)
        for col_index, cell in enumerate(row)
        if cell == target_swp
    ]
    if not candidates:
        raise ContractError(
            "invalid-swp-point", "corrections.approvedSWP",
            f"no Scope×Complexity cell yields SWP {target_swp}",
        )
    row_index, col_index = min(
        candidates,
        key=lambda cell: (
            abs(cell[0] - initial_s) + abs(cell[1] - initial_c),
            abs(cell[0] - initial_s),
            cell[0],
            cell[1],
        ),
    )
    return SCOPE_BANDS[row_index], COMPLEXITY_BANDS[col_index]


SOURCE_FAMILIES = ("github", "backlog", "kpi-insight", "file")
SOURCE_TYPES = ("github", "backlog", "redmine", "jira", "notion", "file")
ISSUE_TYPES = ("task", "bug", "user-story", "epic", "other")
INTRINSIC_PARENT_ISSUE_TYPES = ("user-story", "epic")
ISSUE_STATES = ("open", "closed", "unknown")
DISCIPLINES = (
    "UI", "API", "DB", "Migration", "Deploy", "QA", "Infra",
    "Bugfix", "Integration", "Unknown",
)
WORK_TYPES = (
    "feature", "bugfix", "refactor", "migration", "deployment",
    "infrastructure", "test-design", "test-execution", "investigation",
    "documentation", "other",
)
ACTIVITY_TYPES = ("implement", "fix-bug", "unit-test", "document", "performance-test")
SCOPE_SIGNATURES = (
    "single-component", "multi-component", "cross-layer", "cross-repository",
    "cross-system", "data-migration", "release-wide", "qa-matrix",
)
COMPLEXITY_SIGNATURES = (
    "routine", "stateful", "concurrency", "migration", "external-integration",
    "legacy-unknown", "operational-safety", "algorithmic",
)
CONFIDENCE_LEVELS = ("high", "medium", "low")
EVIDENCE_STATUSES = ("EXTRACTED", "INFERRED", "AMBIGUOUS")
DETAIL_STATUSES = ("full", "partial", "metadata-only", "forbidden", "unavailable")
RUN_CALIBRATION_STATUSES = ("pending", "accepted", "calibrated", "skipped")
STATUS_RULES = ("issue-state", "unavailable", "not-applicable")
ESTIMATE_CHECK_STATES = ("checked", "unavailable", "not-applicable")
EXISTING_ESTIMATE_SOURCES = ("kpi", "board", "backlog", "file", "other")
AGGREGATION_STATUSES = ("derived", "needs-breakdown")
ROW_CALIBRATION_STATUSES = (
    "unchanged", "approved", "issue-specific", "propagated", "skipped",
)
REPRESENTATIVE_SELECTION_REASONS = (
    "all-issues", "minimum", "lower-median", "maximum", "split-boundary",
    "outlier", "lowest-confidence", "coverage-fill",
)


class ContractError(ValueError):
    """A machine-readable input contract violation."""

    def __init__(self, code: str, path: str, message: str):
        self.code = code
        self.path = path
        super().__init__(f"{path}: {message}")

    def as_dict(self) -> dict[str, str]:
        return {"type": "contract-error", "code": self.code, "path": self.path, "message": str(self)}


def _error(code: str, path: str, message: str) -> None:
    raise ContractError(code, path, message)


def _object(value: Any, path: str) -> dict[str, Any]:
    if not isinstance(value, dict):
        _error("invalid-type", path, "must be an object")
    return value


def _string(value: Any, path: str, *, nullable: bool = False) -> str | None:
    if value is None and nullable:
        return None
    if not isinstance(value, str) or not value.strip():
        _error("invalid-string", path, "must be a non-empty string")
    return value.strip()


def _integer(value: Any, path: str) -> int:
    if isinstance(value, bool) or not isinstance(value, int):
        _error("invalid-integer", path, "must be an integer, not a boolean")
    return value


def _boolean(value: Any, path: str) -> bool:
    if not isinstance(value, bool):
        _error("invalid-boolean", path, "must be a boolean")
    return value


def _enum(value: Any, allowed: Iterable[str], path: str) -> str:
    text = _string(value, path)
    if text not in allowed:
        _error("invalid-enum", path, f"must be one of {list(allowed)}")
    return text


def _strings(value: Any, path: str) -> list[str]:
    if not isinstance(value, list):
        _error("invalid-list", path, "must be a list")
    result: list[str] = []
    for index, item in enumerate(value):
        result.append(_string(item, f"{path}[{index}]"))
    return result


def _sorted_unique_strings(value: Any, path: str) -> list[str]:
    return sorted(set(_strings(value, path)), key=str.casefold)


def _signature(value: Any, vocabulary: tuple[str, ...], path: str) -> list[str]:
    values = _strings(value, path)
    if not values:
        _error("empty-signature", path, "must contain at least one canonical signal")
    if len(values) != len(set(values)):
        _error("duplicate-signature", path, "must not contain duplicates")
    unknown = sorted(set(values) - set(vocabulary))
    if unknown:
        _error("unknown-signature", path, f"contains unknown values: {unknown}")
    return [item for item in vocabulary if item in values]


def natural_issue_ref_key(value: str) -> tuple[tuple[int, Any], ...]:
    """Return a comparison-safe natural key for issue references."""
    return tuple(
        (0, int(part)) if part.isdigit() else (1, part.casefold())
        for part in re.split(r"(\d+)", value)
        if part
    )


def canonical_issue_key(issue: dict[str, Any]) -> tuple[str, tuple[tuple[int, Any], ...]]:
    return issue["sourceType"], natural_issue_ref_key(issue["issueRef"])


def issue_identity(issue: dict[str, Any]) -> tuple[str, str]:
    return issue["sourceType"], issue["issueRef"]


def calibration_stratum(issue: dict[str, Any]) -> tuple[str, str, tuple[str, ...], tuple[str, ...]]:
    return (
        issue["primaryDiscipline"],
        issue["workType"],
        tuple(issue["scopeSignature"]),
        tuple(issue["complexitySignature"]),
    )


def stratum_object(issue: dict[str, Any]) -> dict[str, Any]:
    discipline, work_type, scope, complexity = calibration_stratum(issue)
    return {
        "primaryDiscipline": discipline,
        "workType": work_type,
        "scopeSignature": list(scope),
        "complexitySignature": list(complexity),
    }


def _normalize_provenance(value: Any, path: str) -> dict[str, Any]:
    source = _object(value, path)
    return {
        "retrievedVia": _string(source.get("retrievedVia"), f"{path}.retrievedVia"),
        "detailStatus": _enum(source.get("detailStatus"), DETAIL_STATUSES, f"{path}.detailStatus"),
        "fields": _sorted_unique_strings(source.get("fields", []), f"{path}.fields"),
        "notes": _sorted_unique_strings(source.get("notes", []), f"{path}.notes"),
    }


def _nullable_text(value: Any, path: str) -> str | None:
    if value is None:
        return None
    if not isinstance(value, str):
        _error("invalid-string", path, "must be a string or null")
    return value.strip() or None


def _normalize_existing_estimate(value: Any, path: str) -> dict[str, Any] | None:
    if value is None:
        return None
    source = _object(value, path)
    normalized: dict[str, Any] = {}
    for numeric in ("standardWorkPoint", "estimatedHours"):
        item = source.get(numeric)
        if item is not None and (
            isinstance(item, bool) or not isinstance(item, (int, float)) or item < 0
        ):
            _error("invalid-number", f"{path}.{numeric}", "must be a non-negative number or null")
        normalized[numeric] = item
    normalized["source"] = _enum(
        source.get("source", "kpi"), EXISTING_ESTIMATE_SOURCES, f"{path}.source",
    )
    return normalized


def infer_issue_type(value: Any, labels: list[str], title: str, path: str) -> str:
    """Normalize tracker/file type evidence into work item or container types."""
    if value is not None:
        return _enum(value, ISSUE_TYPES, path)
    normalized = {label.casefold().replace("_", "-") for label in labels}
    if normalized & {"type:epic", "epic"}:
        return "epic"
    if normalized & {"type:story", "type:user-story", "story", "user-story"}:
        return "user-story"
    if any("bug" in label for label in normalized):
        return "bug"
    prefix = title.strip().casefold()
    if prefix.startswith(("[epic]", "epic:")):
        return "epic"
    if prefix.startswith(("[story]", "[user story]", "story:", "user story:")):
        return "user-story"
    if prefix.startswith(("[bug]", "bug:")):
        return "bug"
    return "other"


def infer_activity_type(value: Any, work_type: str, path: str) -> str:
    """Map a direct work item to one delivery activity."""
    if value is not None:
        return _enum(value, ACTIVITY_TYPES, path)
    if work_type == "bugfix":
        return "fix-bug"
    if work_type in {"test-design", "test-execution"}:
        return "unit-test"
    if work_type == "documentation":
        return "document"
    return "implement"


def _normalize_calibration(value: Any, path: str) -> dict[str, Any]:
    source = _object(value or {}, path)
    approved_scope = source.get("approvedScope")
    approved_complexity = source.get("approvedComplexity")
    if approved_scope is not None:
        approved_scope = _integer(approved_scope, f"{path}.approvedScope")
        if approved_scope not in SCOPE_BANDS:
            _error("invalid-band", f"{path}.approvedScope", f"must be one of {list(SCOPE_BANDS)}")
    if approved_complexity is not None:
        approved_complexity = _integer(approved_complexity, f"{path}.approvedComplexity")
        if approved_complexity not in COMPLEXITY_BANDS:
            _error("invalid-band", f"{path}.approvedComplexity", f"must be one of {list(COMPLEXITY_BANDS)}")
    matched_rule = source.get("matchedRuleId")
    if matched_rule is not None:
        matched_rule = _string(matched_rule, f"{path}.matchedRuleId")
    return {
        "isRepresentative": _boolean(source.get("isRepresentative", False), f"{path}.isRepresentative"),
        "selectionReasons": _strings(source.get("selectionReasons", []), f"{path}.selectionReasons"),
        "approvedScope": approved_scope,
        "approvedComplexity": approved_complexity,
        "issueSpecific": _boolean(source.get("issueSpecific", False), f"{path}.issueSpecific"),
        "matchedRuleId": matched_rule,
        "scopeBandDelta": _integer(source.get("scopeBandDelta", 0), f"{path}.scopeBandDelta"),
        "complexityBandDelta": _integer(source.get("complexityBandDelta", 0), f"{path}.complexityBandDelta"),
        "saturated": _boolean(source.get("saturated", False), f"{path}.saturated"),
        "status": _enum(source.get("status", "unchanged"), ROW_CALIBRATION_STATUSES, f"{path}.status"),
    }


def normalize_issue(value: Any, path: str = "issues[]") -> dict[str, Any]:
    source = _object(value, path)
    title = _string(source.get("title"), f"{path}.title")
    labels = _sorted_unique_strings(source.get("labels", []), f"{path}.labels")
    issue_type = infer_issue_type(source.get("issueType"), labels, title, f"{path}.issueType")
    if issue_type in INTRINSIC_PARENT_ISSUE_TYPES:
        _error(
            "parent-in-direct-issues", f"{path}.issueType",
            "User Story and Epic belong in parents[] and must not be assessed directly",
        )
    initial_scope = _integer(source.get("initialScope"), f"{path}.initialScope")
    initial_complexity = _integer(source.get("initialComplexity"), f"{path}.initialComplexity")
    if initial_scope not in SCOPE_BANDS:
        _error("invalid-band", f"{path}.initialScope", f"must be one of {list(SCOPE_BANDS)}")
    if initial_complexity not in COMPLEXITY_BANDS:
        _error("invalid-band", f"{path}.initialComplexity", f"must be one of {list(COMPLEXITY_BANDS)}")
    initial_swp = derive_swp(initial_scope, initial_complexity)
    if "initialSWP" in source and _integer(source["initialSWP"], f"{path}.initialSWP") != initial_swp:
        _error("formula-mismatch", f"{path}.initialSWP", "must equal the SWP matrix cell for (initialScope, initialComplexity)")

    final_scope = _integer(source.get("finalScope", initial_scope), f"{path}.finalScope")
    final_complexity = _integer(source.get("finalComplexity", initial_complexity), f"{path}.finalComplexity")
    if final_scope not in SCOPE_BANDS:
        _error("invalid-band", f"{path}.finalScope", f"must be one of {list(SCOPE_BANDS)}")
    if final_complexity not in COMPLEXITY_BANDS:
        _error("invalid-band", f"{path}.finalComplexity", f"must be one of {list(COMPLEXITY_BANDS)}")
    final_swp = derive_swp(final_scope, final_complexity)
    if "finalSWP" in source and _integer(source["finalSWP"], f"{path}.finalSWP") != final_swp:
        _error("formula-mismatch", f"{path}.finalSWP", "must equal the SWP matrix cell for (finalScope, finalComplexity)")

    split_recommended = _boolean(source.get("splitRecommended", False), f"{path}.splitRecommended")
    split_reason = _string(source.get("splitReason"), f"{path}.splitReason", nullable=True)
    if split_recommended and not split_reason:
        _error("missing-split-evidence", f"{path}.splitReason", "is required when splitRecommended is true")
    if split_recommended and (initial_scope != SCOPE_BANDS[-1] or initial_complexity != COMPLEXITY_BANDS[-1]):
        _error("non-terminal-split", path, "splitRecommended requires terminal Scope and Complexity")
    if not split_recommended and split_reason:
        _error("unexpected-split-reason", f"{path}.splitReason", "requires splitRecommended=true")

    body = source.get("body")
    if body is not None and not isinstance(body, str):
        _error("invalid-string", f"{path}.body", "must be a string or null")
    url = _nullable_text(source.get("url"), f"{path}.url")
    project = _nullable_text(source.get("project"), f"{path}.project")
    period = _nullable_text(source.get("period"), f"{path}.period")
    parent_ref = _nullable_text(source.get("parentRef"), f"{path}.parentRef")
    existing = _normalize_existing_estimate(source.get("existingEstimate"), f"{path}.existingEstimate")

    scope_signature = _signature(source.get("scopeSignature"), SCOPE_SIGNATURES, f"{path}.scopeSignature")
    complexity_signature = _signature(
        source.get("complexitySignature"), COMPLEXITY_SIGNATURES, f"{path}.complexitySignature",
    )
    if "single-component" in scope_signature and "multi-component" in scope_signature:
        _error("exclusive-signature", f"{path}.scopeSignature", "single-component and multi-component are exclusive")
    if "routine" in complexity_signature and len(complexity_signature) > 1:
        _error("exclusive-signature", f"{path}.complexitySignature", "routine must be used alone")
    provenance = _normalize_provenance(source.get("provenance"), f"{path}.provenance")
    discipline = _enum(source.get("primaryDiscipline"), DISCIPLINES, f"{path}.primaryDiscipline")
    work_type = _enum(source.get("workType"), WORK_TYPES, f"{path}.workType")
    function_ref = _nullable_text(source.get("functionRef"), f"{path}.functionRef") or parent_ref or _string(
        source.get("issueRef"), f"{path}.issueRef",
    )
    confidence = _enum(source.get("confidence"), CONFIDENCE_LEVELS, f"{path}.confidence")
    evidence_status = _enum(source.get("evidenceStatus"), EVIDENCE_STATUSES, f"{path}.evidenceStatus")
    title_only = (
        provenance["detailStatus"] in {"metadata-only", "forbidden", "unavailable"}
        or (body is None and "body" not in provenance["fields"])
    )
    if title_only and (confidence != "low" or evidence_status != "AMBIGUOUS"):
        _error("evidence-confidence-mismatch", path, "title/metadata-only evidence requires low confidence and AMBIGUOUS status")
    if discipline == "Unknown" and confidence != "low":
        _error("unknown-confidence-mismatch", path, "Unknown discipline requires low confidence")

    return {
        "sourceType": _enum(source.get("sourceType"), SOURCE_TYPES, f"{path}.sourceType"),
        "issueRef": _string(source.get("issueRef"), f"{path}.issueRef"),
        "url": url,
        "title": title,
        "body": body,
        "labels": labels,
        "issueType": issue_type,
        "state": _enum(source.get("state", "unknown"), ISSUE_STATES, f"{path}.state"),
        "status": _nullable_text(source.get("status"), f"{path}.status"),
        "sprints": _sorted_unique_strings(source.get("sprints", []), f"{path}.sprints"),
        "milestones": _sorted_unique_strings(source.get("milestones", []), f"{path}.milestones"),
        "project": project,
        "period": period,
        "parentRef": parent_ref,
        "functionRef": function_ref,
        "existingEstimate": existing,
        "provenance": provenance,
        "primaryDiscipline": discipline,
        "workType": work_type,
        "activityType": infer_activity_type(source.get("activityType"), work_type, f"{path}.activityType"),
        "scopeSignature": scope_signature,
        "complexitySignature": complexity_signature,
        "initialScope": initial_scope,
        "initialComplexity": initial_complexity,
        "initialSWP": initial_swp,
        "finalScope": final_scope,
        "finalComplexity": final_complexity,
        "finalSWP": final_swp,
        "confidence": confidence,
        "evidenceStatus": evidence_status,
        "rationale": _string(source.get("rationale"), f"{path}.rationale"),
        "assumptions": _strings(source.get("assumptions", []), f"{path}.assumptions"),
        "gaps": _strings(source.get("gaps", []), f"{path}.gaps"),
        "supportingEvidence": _strings(source.get("supportingEvidence", []), f"{path}.supportingEvidence"),
        "splitRecommended": split_recommended,
        "splitReason": split_reason,
        "calibration": _normalize_calibration(source.get("calibration", {}), f"{path}.calibration"),
    }


def normalize_parent(value: Any, path: str = "parents[]") -> dict[str, Any]:
    """Normalize a structural container without direct assessment fields."""
    source = _object(value, path)
    forbidden = {
        "initialScope", "initialComplexity",
        "finalScope", "finalComplexity",
        "primaryDiscipline", "workType", "activityType", "functionRef",
        "scopeSignature", "complexitySignature", "confidence", "evidenceStatus",
        "rationale", "assumptions", "gaps", "supportingEvidence",
        "splitRecommended", "splitReason", "calibration",
    }
    supplied = sorted(forbidden & set(source))
    if supplied:
        _error(
            "direct-score-on-parent", path,
            f"parent containers cannot supply direct assessment fields: {supplied}",
        )
    title = _string(source.get("title"), f"{path}.title")
    labels = _sorted_unique_strings(source.get("labels", []), f"{path}.labels")
    issue_type = infer_issue_type(source.get("issueType"), labels, title, f"{path}.issueType")
    claimed_initial = source.get("initialSWP")
    claimed_final = source.get("finalSWP")
    for field, claimed in (("initialSWP", claimed_initial), ("finalSWP", claimed_final)):
        if claimed is not None and (isinstance(claimed, bool) or not isinstance(claimed, int) or claimed < 0):
            _error("invalid-integer", f"{path}.{field}", "must be a non-negative integer or null")
    return {
        "sourceType": _enum(source.get("sourceType"), SOURCE_TYPES, f"{path}.sourceType"),
        "issueRef": _string(source.get("issueRef"), f"{path}.issueRef"),
        "url": _nullable_text(source.get("url"), f"{path}.url"),
        "title": title,
        "labels": labels,
        "issueType": issue_type,
        "state": _enum(source.get("state", "unknown"), ISSUE_STATES, f"{path}.state"),
        "status": _nullable_text(source.get("status"), f"{path}.status"),
        "sprints": _sorted_unique_strings(source.get("sprints", []), f"{path}.sprints"),
        "milestones": _sorted_unique_strings(source.get("milestones", []), f"{path}.milestones"),
        "project": _nullable_text(source.get("project"), f"{path}.project"),
        "period": _nullable_text(source.get("period"), f"{path}.period"),
        "parentRef": _nullable_text(source.get("parentRef"), f"{path}.parentRef"),
        "provenance": _normalize_provenance(source.get("provenance"), f"{path}.provenance"),
        "_claimedInitialSWP": claimed_initial if "initialSWP" in source else "absent",
        "_claimedFinalSWP": claimed_final if "finalSWP" in source else "absent",
    }


def _derive_parent_rollups(
    issues: list[dict[str, Any]], parents: list[dict[str, Any]],
) -> list[dict[str, Any]]:
    """Derive parent SWP recursively; never score or re-round a parent."""
    parent_by_key = {issue_identity(parent): parent for parent in parents}
    direct_children: dict[tuple[str, str], list[dict[str, Any]]] = {
        key: [] for key in parent_by_key
    }
    parent_children: dict[tuple[str, str], list[dict[str, Any]]] = {
        key: [] for key in parent_by_key
    }

    def parent_key(row: dict[str, Any], path: str) -> tuple[str, str] | None:
        ref = row.get("parentRef")
        if not ref:
            return None
        key = (row["sourceType"], ref)
        if key not in parent_by_key:
            _error("unknown-parent", path, f"does not match parents[] identity {key[0]}:{key[1]}")
        if key == issue_identity(row):
            _error("hierarchy-cycle", path, "cannot reference itself")
        return key

    for index, issue in enumerate(issues):
        key = parent_key(issue, f"issues[{index}].parentRef")
        if key:
            direct_children[key].append(issue)
    for index, parent in enumerate(parents):
        key = parent_key(parent, f"parents[{index}].parentRef")
        if key:
            parent_children[key].append(parent)

    visiting: set[tuple[str, str]] = set()
    complete: set[tuple[str, str]] = set()

    def derive(key: tuple[str, str]) -> tuple[int | None, int | None]:
        if key in complete:
            parent = parent_by_key[key]
            return parent["initialSWP"], parent["finalSWP"]
        if key in visiting:
            _error("hierarchy-cycle", "parents", f"cycle contains {key[0]}:{key[1]}")
        visiting.add(key)
        parent = parent_by_key[key]
        nested = [derive(issue_identity(child)) for child in parent_children[key]]
        has_children = bool(direct_children[key] or parent_children[key])
        complete_children = all(initial is not None and final is not None for initial, final in nested)
        if not has_children or not complete_children:
            parent.update({
                "aggregationStatus": "needs-breakdown",
                "childRefs": sorted(
                    [child["issueRef"] for child in direct_children[key] + parent_children[key]],
                    key=natural_issue_ref_key,
                ),
                "initialSWP": None,
                "finalSWP": None,
            })
        else:
            direct_initial = sum(child["initialSWP"] for child in direct_children[key])
            direct_final = sum(child["finalSWP"] for child in direct_children[key])
            parent.update({
                "aggregationStatus": "derived",
                "childRefs": sorted(
                    [child["issueRef"] for child in direct_children[key] + parent_children[key]],
                    key=natural_issue_ref_key,
                ),
                "initialSWP": direct_initial + sum(initial for initial, _ in nested if initial is not None),
                "finalSWP": direct_final + sum(final for _, final in nested if final is not None),
            })
        for field, claimed_key in (("initialSWP", "_claimedInitialSWP"), ("finalSWP", "_claimedFinalSWP")):
            claimed = parent.pop(claimed_key)
            if claimed != "absent" and claimed != parent[field]:
                _error(
                    "aggregation-mismatch", f"parents[{key[0]}:{key[1]}].{field}",
                    "must equal the derived sum of child work items",
                )
        visiting.remove(key)
        complete.add(key)
        return parent["initialSWP"], parent["finalSWP"]

    for key in sorted(parent_by_key, key=lambda item: (item[0], natural_issue_ref_key(item[1]))):
        derive(key)
    return sorted(parents, key=canonical_issue_key)


def _normalize_selection(value: Any) -> dict[str, Any] | None:
    """Optional run.selection block: how the issue set was chosen (the scope banner)."""
    if value is None:
        return None
    source = _object(value, "run.selection")
    filters = _object(source.get("filters", {}), "run.selection.filters")
    excluded = _object(source.get("excluded", {}), "run.selection.excluded")
    for key, count in excluded.items():
        if not isinstance(count, int) or isinstance(count, bool) or count < 0:
            _error("invalid-count", f"run.selection.excluded.{key}", "must be a non-negative integer")
    return {
        "includeClosed": _boolean(source.get("includeClosed", False), "run.selection.includeClosed"),
        "reestimateExisting": _boolean(
            source.get("reestimateExisting", False), "run.selection.reestimateExisting",
        ),
        "statusRule": _enum(source.get("statusRule", "not-applicable"), STATUS_RULES, "run.selection.statusRule"),
        "existingEstimateCheck": _enum(
            source.get("existingEstimateCheck", "not-applicable"),
            ESTIMATE_CHECK_STATES, "run.selection.existingEstimateCheck",
        ),
        "filters": {
            "sprints": _sorted_unique_strings(filters.get("sprints", []), "run.selection.filters.sprints"),
            "milestones": _sorted_unique_strings(filters.get("milestones", []), "run.selection.filters.milestones"),
            "labels": _sorted_unique_strings(filters.get("labels", []), "run.selection.filters.labels"),
        },
        "excluded": {key: excluded[key] for key in sorted(excluded)},
    }


def _normalize_run(value: Any) -> dict[str, Any]:
    source = _object(value, "run")
    family = _enum(source.get("sourceFamily"), SOURCE_FAMILIES, "run.sourceFamily")
    result = {
        "sourceFamily": family,
        "sourceLabel": _string(source.get("sourceLabel"), "run.sourceLabel"),
        "sourceUrl": _string(source.get("sourceUrl"), "run.sourceUrl", nullable=True),
        "project": _string(source.get("project"), "run.project", nullable=True),
        "period": _string(source.get("period"), "run.period", nullable=True),
        "generatedAt": _string(source.get("generatedAt"), "run.generatedAt"),
        "calibrationStatus": _enum(
            source.get("calibrationStatus", "pending"), RUN_CALIBRATION_STATUSES,
            "run.calibrationStatus",
        ),
        "selection": _normalize_selection(source.get("selection")),
    }
    return result


def _normalize_stratum(value: Any, path: str) -> dict[str, Any]:
    source = _object(value, path)
    result = {
        "primaryDiscipline": _enum(source.get("primaryDiscipline"), DISCIPLINES, f"{path}.primaryDiscipline"),
        "workType": _enum(source.get("workType"), WORK_TYPES, f"{path}.workType"),
        "scopeSignature": _signature(source.get("scopeSignature"), SCOPE_SIGNATURES, f"{path}.scopeSignature"),
        "complexitySignature": _signature(
            source.get("complexitySignature"), COMPLEXITY_SIGNATURES, f"{path}.complexitySignature",
        ),
    }
    if "single-component" in result["scopeSignature"] and "multi-component" in result["scopeSignature"]:
        _error("exclusive-signature", f"{path}.scopeSignature", "single-component and multi-component are exclusive")
    if "routine" in result["complexitySignature"] and len(result["complexitySignature"]) > 1:
        _error("exclusive-signature", f"{path}.complexitySignature", "routine must be used alone")
    return result


def _normalize_corrections(values: Any) -> list[dict[str, Any]]:
    if not isinstance(values, list):
        _error("invalid-list", "corrections", "must be a list")
    result = []
    for index, value in enumerate(values):
        path = f"corrections[{index}]"
        source = _object(value, path)
        representative = _object(source.get("representative"), f"{path}.representative")
        approved_scope = _integer(source.get("approvedScope"), f"{path}.approvedScope")
        approved_complexity = _integer(source.get("approvedComplexity"), f"{path}.approvedComplexity")
        if approved_scope not in SCOPE_BANDS:
            _error("invalid-band", f"{path}.approvedScope", f"must be one of {list(SCOPE_BANDS)}")
        if approved_complexity not in COMPLEXITY_BANDS:
            _error("invalid-band", f"{path}.approvedComplexity", f"must be one of {list(COMPLEXITY_BANDS)}")
        if "approvedSWP" in source:
            _error("derived-field", f"{path}.approvedSWP", "must not be supplied")
        result.append({
            "representative": {
                "sourceType": _enum(
                    representative.get("sourceType"), SOURCE_TYPES,
                    f"{path}.representative.sourceType",
                ),
                "issueRef": _string(representative.get("issueRef"), f"{path}.representative.issueRef"),
            },
            "approvedScope": approved_scope,
            "approvedComplexity": approved_complexity,
            "issueSpecific": _boolean(source.get("issueSpecific", False), f"{path}.issueSpecific"),
            "rationale": _string(source.get("rationale"), f"{path}.rationale"),
        })
    return result


def _normalize_rules(values: Any) -> list[dict[str, Any]]:
    if not isinstance(values, list):
        _error("invalid-list", "calibrationRules", "must be a list")
    result = []
    rule_ids: set[str] = set()
    for index, value in enumerate(values):
        path = f"calibrationRules[{index}]"
        source = _object(value, path)
        rule_id = _string(source.get("ruleId"), f"{path}.ruleId")
        if rule_id in rule_ids:
            _error("duplicate-rule", f"{path}.ruleId", "must be unique")
        rule_ids.add(rule_id)
        scope_delta = _integer(source.get("scopeBandDelta"), f"{path}.scopeBandDelta")
        complexity_delta = _integer(source.get("complexityBandDelta"), f"{path}.complexityBandDelta")
        if abs(scope_delta) >= len(SCOPE_BANDS) or abs(complexity_delta) >= len(COMPLEXITY_BANDS):
            _error("invalid-band-delta", path, "delta exceeds the supported band index range")
        representative_refs = _strings(source.get("representativeRefs"), f"{path}.representativeRefs")
        if not representative_refs:
            _error("empty-reference", f"{path}.representativeRefs", "must not be empty")
        result.append({
            "ruleId": rule_id,
            "stratum": _normalize_stratum(source.get("stratum"), f"{path}.stratum"),
            "scopeBandDelta": scope_delta,
            "complexityBandDelta": complexity_delta,
            "representativeRefs": representative_refs,
        })
    return result


def _shift_band(value: int, delta: int, bands: tuple[int, ...]) -> tuple[int, bool]:
    raw_index = bands.index(value) + delta
    bounded_index = min(max(raw_index, 0), len(bands) - 1)
    return bands[bounded_index], raw_index != bounded_index


def _validate_calibration_audit(
    issues: list[dict[str, Any]],
    representatives: list[dict[str, Any]],
    corrections: list[dict[str, Any]],
    rules: list[dict[str, Any]],
    run_status: str,
) -> None:
    representative_keys = {(item["sourceType"], item["issueRef"]) for item in representatives}
    representative_reasons = {
        (item["sourceType"], item["issueRef"]): item["selectionReasons"] for item in representatives
    }
    corrections_by_key: dict[tuple[str, str], dict[str, Any]] = {}
    for index, correction in enumerate(corrections):
        target = correction["representative"]
        key = (target["sourceType"], target["issueRef"])
        if key not in representative_keys:
            _error("not-representative", f"corrections[{index}].representative", "must reference a selected issue")
        if key in corrections_by_key:
            _error("duplicate-correction", f"corrections[{index}]", "representative appears more than once")
        corrections_by_key[key] = correction
    rules_by_id = {item["ruleId"]: item for item in rules}
    correction_refs = {
        f"{item['representative']['sourceType']}:{item['representative']['issueRef']}" for item in corrections
    }
    seen_rule_strata: set[tuple[Any, ...]] = set()
    for index, rule in enumerate(rules):
        stratum = rule["stratum"]
        key = (
            stratum["primaryDiscipline"], stratum["workType"],
            tuple(stratum["scopeSignature"]), tuple(stratum["complexitySignature"]),
        )
        if key in seen_rule_strata:
            _error("duplicate-stratum-rule", f"calibrationRules[{index}]", "one stratum may have at most one rule")
        seen_rule_strata.add(key)
        if not set(rule["representativeRefs"]).issubset(correction_refs):
            _error("unknown-rule-source", f"calibrationRules[{index}].representativeRefs", "must reference corrections[]")
        if rule["scopeBandDelta"] == 0 and rule["complexityBandDelta"] == 0:
            _error("empty-rule", f"calibrationRules[{index}]", "at least one axis delta must be non-zero")
    for index, issue in enumerate(issues):
        path = f"issues[{index}].calibration"
        calibration = issue["calibration"]
        key = issue_identity(issue)
        expected_representative = key in representative_keys
        if calibration["isRepresentative"] != expected_representative:
            _error("representative-flag-mismatch", path, "must match representatives[]")
        expected_reasons = representative_reasons.get(key, [])
        if calibration["selectionReasons"] != expected_reasons:
            _error("selection-reason-mismatch", path, "must match representatives[].selectionReasons")
        status = calibration["status"]
        initial_axes = (issue["initialScope"], issue["initialComplexity"])
        final_axes = (issue["finalScope"], issue["finalComplexity"])
        if status in {"unchanged", "skipped"} and final_axes != initial_axes:
            _error("unaudited-change", path, f"status {status} cannot change final axes")
        if status in {"unchanged", "skipped"} and (
            calibration["scopeBandDelta"] or calibration["complexityBandDelta"] or calibration["saturated"]
        ):
            _error("unexpected-delta", path, f"status {status} cannot carry a calibration delta")
        if status in {"approved", "issue-specific"}:
            if not expected_representative:
                _error("invalid-approval", path, "only a representative may be approved")
            approved = (calibration["approvedScope"], calibration["approvedComplexity"])
            if approved != final_axes:
                _error("approval-mismatch", path, "approved axes must equal final axes")
            correction = corrections_by_key.get(key)
            if not correction or (correction["approvedScope"], correction["approvedComplexity"]) != final_axes:
                _error("correction-mismatch", path, "approved row must match one corrections[] entry")
            if calibration["issueSpecific"] != correction["issueSpecific"]:
                _error("correction-mismatch", path, "issue-specific audit does not match correction")
            expected_deltas = (
                SCOPE_BANDS.index(issue["finalScope"]) - SCOPE_BANDS.index(issue["initialScope"]),
                COMPLEXITY_BANDS.index(issue["finalComplexity"]) - COMPLEXITY_BANDS.index(issue["initialComplexity"]),
            )
            if (calibration["scopeBandDelta"], calibration["complexityBandDelta"]) != expected_deltas:
                _error("delta-mismatch", path, "representative band deltas do not match approved axes")
        if status == "propagated":
            if expected_representative:
                _error("invalid-propagation", path, "representatives are locked, not propagated")
            rule = rules_by_id.get(calibration["matchedRuleId"])
            if not rule:
                _error("missing-rule", path, "propagated row must name an existing rule")
            if rule["stratum"] != stratum_object(issue):
                _error("stratum-mismatch", path, "matched rule does not exactly match row stratum")
            if (calibration["scopeBandDelta"], calibration["complexityBandDelta"]) != (
                rule["scopeBandDelta"], rule["complexityBandDelta"],
            ):
                _error("delta-mismatch", path, "row deltas do not match its rule")
            expected_scope, scope_saturated = _shift_band(issue["initialScope"], rule["scopeBandDelta"], SCOPE_BANDS)
            expected_complexity, complexity_saturated = _shift_band(
                issue["initialComplexity"], rule["complexityBandDelta"], COMPLEXITY_BANDS,
            )
            if final_axes != (expected_scope, expected_complexity):
                _error("propagation-mismatch", path, "final axes do not match the rule band steps")
            if calibration["saturated"] != (scope_saturated or complexity_saturated):
                _error("saturation-mismatch", path, "saturation audit does not match bounded band steps")
        elif calibration["matchedRuleId"] is not None:
            _error("unexpected-rule", path, "only propagated rows may name a matched rule")

    changed = [
        item for item in issues
        if (item["initialScope"], item["initialComplexity"]) != (item["finalScope"], item["finalComplexity"])
    ]
    if run_status == "skipped":
        if corrections or rules or any(item["calibration"]["status"] != "skipped" for item in issues):
            _error("run-status-mismatch", "run.calibrationStatus", "skipped runs cannot contain feedback/rules or non-skipped rows")
    elif run_status == "accepted":
        if issues and not representative_keys:
            _error("missing-representatives", "representatives", "accepted runs require representative review")
        if set(corrections_by_key) != representative_keys:
            _error("missing-correction", "corrections", "accepted runs require feedback for every representative")
        if changed or rules or any(
            item["calibration"]["status"] not in {"approved", "issue-specific"}
            for item in issues if issue_identity(item) in representative_keys
        ):
            _error("run-status-mismatch", "run.calibrationStatus", "accepted runs must lock all representatives without score changes")
    elif run_status == "calibrated":
        if issues and not representative_keys:
            _error("missing-representatives", "representatives", "calibrated runs require representative review")
        if set(corrections_by_key) != representative_keys:
            _error("missing-correction", "corrections", "calibrated runs require feedback for every representative")
        if not changed or any(
            item["calibration"]["status"] not in {"approved", "issue-specific"}
            for item in issues if issue_identity(item) in representative_keys
        ):
            _error("run-status-mismatch", "run.calibrationStatus", "calibrated runs require a changed axis and locked representatives")


def _validate_source_family(run: dict[str, Any], rows: list[dict[str, Any]]) -> None:
    allowed = {
        "github": {"github"},
        "backlog": {"backlog"},
        "kpi-insight": set(SOURCE_TYPES) - {"file"},
        "file": {"file"},
    }[run["sourceFamily"]]
    invalid = sorted({row["sourceType"] for row in rows} - allowed)
    if invalid:
        _error("mixed-source-family", "payload", f"source types {invalid} do not belong to {run['sourceFamily']}")


def validate_payload(value: Any) -> dict[str, Any]:
    source = _object(value, "payload")
    if source.get("schemaVersion") != SCHEMA_VERSION:
        _error("unsupported-schema", "schemaVersion", f"must equal {SCHEMA_VERSION}")
    if source.get("scoringModel") != SCORING_MODEL:
        _error("unsupported-scoring-model", "scoringModel", f"must equal {SCORING_MODEL}")
    if source.get("scoringModelVersion") != SCORING_MODEL_VERSION:
        _error(
            "unsupported-scoring-model", "scoringModelVersion",
            f"must equal {SCORING_MODEL_VERSION}",
        )
    run = _normalize_run(source.get("run"))
    raw_issues = source.get("issues")
    if not isinstance(raw_issues, list):
        _error("invalid-list", "issues", "must be a list")
    issues = [normalize_issue(item, f"issues[{index}]") for index, item in enumerate(raw_issues)]
    raw_parents = source.get("parents", [])
    if not isinstance(raw_parents, list):
        _error("invalid-list", "parents", "must be a list")
    parents = [normalize_parent(item, f"parents[{index}]") for index, item in enumerate(raw_parents)]
    seen: set[tuple[str, str]] = set()
    for collection, rows in (("issues", issues), ("parents", parents)):
        for index, issue in enumerate(rows):
            identity = issue_identity(issue)
            if identity in seen:
                _error(
                    "duplicate-assessment", f"{collection}[{index}]",
                    f"duplicate identity {identity[0]}:{identity[1]}",
                )
            seen.add(identity)
    _validate_source_family(run, issues + parents)
    issues.sort(key=canonical_issue_key)
    parents = _derive_parent_rollups(issues, parents)
    direct_issue_keys = {issue_identity(issue) for issue in issues}

    representatives = source.get("representatives", [])
    if not isinstance(representatives, list):
        _error("invalid-list", "representatives", "must be a list")
    normalized_representatives = []
    representative_keys: set[tuple[str, str]] = set()
    for index, item in enumerate(representatives):
        entry = _object(item, f"representatives[{index}]")
        key = (
            _enum(entry.get("sourceType"), SOURCE_TYPES, f"representatives[{index}].sourceType"),
            _string(entry.get("issueRef"), f"representatives[{index}].issueRef"),
        )
        if key in representative_keys:
            _error("duplicate-representative", f"representatives[{index}]", "representative appears more than once")
        if key not in direct_issue_keys:
            _error(
                "unknown-representative", f"representatives[{index}]",
                "must match a directly assessed issue, not a parent container",
            )
        representative_keys.add(key)
        selection_reasons = _strings(
            entry.get("selectionReasons", []), f"representatives[{index}].selectionReasons",
        )
        if not selection_reasons:
            _error("empty-selection-reason", f"representatives[{index}].selectionReasons", "must not be empty")
        unknown_reasons = sorted(set(selection_reasons) - set(REPRESENTATIVE_SELECTION_REASONS))
        if unknown_reasons:
            _error(
                "unknown-selection-reason", f"representatives[{index}].selectionReasons",
                f"must use deterministic reasons only: {unknown_reasons}",
            )
        normalized_representatives.append({
            "sourceType": key[0],
            "issueRef": key[1],
            "selectionReasons": selection_reasons,
        })
    if len(normalized_representatives) > 5:
        _error("too-many-representatives", "representatives", "must contain at most five issues")

    caveats = _strings(source.get("caveats"), "caveats")
    corrections = _normalize_corrections(source.get("corrections"))
    rules = _normalize_rules(source.get("calibrationRules"))
    if not issues and (run["calibrationStatus"] != "skipped" or not caveats):
        _error("invalid-empty-run", "run", "an empty readable run must be skipped with a caveat")
    _validate_calibration_audit(
        issues, normalized_representatives, corrections, rules, run["calibrationStatus"],
    )

    return {
        "schemaVersion": SCHEMA_VERSION,
        "scoringModel": SCORING_MODEL,
        "scoringModelVersion": SCORING_MODEL_VERSION,
        "run": run,
        "issues": issues,
        "parents": parents,
        "representatives": normalized_representatives,
        "corrections": corrections,
        "calibrationRules": rules,
        "caveats": caveats,
    }


def normalize_candidates(candidates: list[dict[str, Any]]) -> list[dict[str, Any]]:
    """Dedupe normalized candidate evidence before semantic assessment.

    This intentionally does not accept assessment fields. It keeps the richest body/title
    and unions labels/provenance fields while preserving canonical order.
    """
    if not isinstance(candidates, list):
        _error("invalid-list", "candidates", "must be a list")
    merged: dict[tuple[str, str], dict[str, Any]] = {}
    for index, raw in enumerate(candidates):
        path = f"candidates[{index}]"
        item = _object(raw, path)
        source_type = _enum(item.get("sourceType"), SOURCE_TYPES, f"{path}.sourceType")
        issue_ref = _string(item.get("issueRef"), f"{path}.issueRef")
        title = _string(item.get("title"), f"{path}.title")
        labels = _sorted_unique_strings(item.get("labels", []), f"{path}.labels")
        body = item.get("body")
        if body is not None and not isinstance(body, str):
            _error("invalid-string", f"{path}.body", "must be a string or null")
        provenance = _normalize_provenance(item.get("provenance"), f"{path}.provenance")
        raw_url = item.get("url")
        raw_project = item.get("project")
        raw_period = item.get("period")
        for field, field_value in (("url", raw_url), ("project", raw_project), ("period", raw_period)):
            if field_value is not None and not isinstance(field_value, str):
                _error("invalid-string", f"{path}.{field}", "must be a string or null")
        candidate = {
            "sourceType": source_type,
            "issueRef": issue_ref,
            "url": raw_url,
            "title": title,
            "body": body,
            "labels": labels,
            "issueType": infer_issue_type(item.get("issueType"), labels, title, f"{path}.issueType"),
            "state": _enum(item.get("state", "unknown"), ISSUE_STATES, f"{path}.state"),
            "status": _nullable_text(item.get("status"), f"{path}.status"),
            "sprints": _sorted_unique_strings(item.get("sprints", []), f"{path}.sprints"),
            "milestones": _sorted_unique_strings(item.get("milestones", []), f"{path}.milestones"),
            "parentRef": _nullable_text(item.get("parentRef"), f"{path}.parentRef"),
            "functionRef": _nullable_text(item.get("functionRef"), f"{path}.functionRef"),
            "activityType": (
                _enum(item.get("activityType"), ACTIVITY_TYPES, f"{path}.activityType")
                if item.get("activityType") is not None else None
            ),
            "existingEstimate": _normalize_existing_estimate(
                item.get("existingEstimate"), f"{path}.existingEstimate",
            ),
            "project": raw_project,
            "period": raw_period,
            "provenance": provenance,
        }
        key = (source_type, issue_ref)
        if key not in merged:
            merged[key] = candidate
            continue
        current = merged[key]
        if len(candidate["title"]) > len(current["title"]):
            current["title"] = candidate["title"]
        if len(candidate["body"] or "") > len(current["body"] or ""):
            current["body"] = candidate["body"]
        detail_rank = {"full": 0, "partial": 1, "metadata-only": 2, "forbidden": 3, "unavailable": 4}
        if detail_rank[candidate["provenance"]["detailStatus"]] < detail_rank[current["provenance"]["detailStatus"]]:
            current["provenance"]["detailStatus"] = candidate["provenance"]["detailStatus"]
            current["provenance"]["retrievedVia"] = candidate["provenance"]["retrievedVia"]
            current["url"] = candidate["url"] or current["url"]
            current["project"] = candidate["project"] or current["project"]
            current["period"] = candidate["period"] or current["period"]
        else:
            current["url"] = current["url"] or candidate["url"]
            current["project"] = current["project"] or candidate["project"]
            current["period"] = current["period"] or candidate["period"]
        current["labels"] = sorted(set(current["labels"] + candidate["labels"]), key=str.casefold)
        for field in ("sprints", "milestones"):
            current[field] = sorted(set(current[field] + candidate[field]), key=str.casefold)
        if current["issueType"] != candidate["issueType"]:
            if current["issueType"] == "other":
                current["issueType"] = candidate["issueType"]
            elif candidate["issueType"] != "other":
                _error("conflicting-type", path, "duplicate candidates disagree on issueType")
        if current["state"] == "unknown":
            current["state"] = candidate["state"]
        elif candidate["state"] not in {"unknown", current["state"]}:
            _error("conflicting-state", path, "duplicate candidates disagree on state")
        current["status"] = current["status"] or candidate["status"]
        if current["parentRef"] and candidate["parentRef"] and current["parentRef"] != candidate["parentRef"]:
            _error("conflicting-parent", path, "duplicate candidates disagree on parentRef")
        current["parentRef"] = current["parentRef"] or candidate["parentRef"]
        for field in ("functionRef", "activityType"):
            if current[field] and candidate[field] and current[field] != candidate[field]:
                _error(f"conflicting-{field}", path, f"duplicate candidates disagree on {field}")
            current[field] = current[field] or candidate[field]
        estimate_priority = {"kpi": 0, "board": 1, "backlog": 2, "file": 3, "other": 4}
        if candidate["existingEstimate"] and (
            not current["existingEstimate"]
            or estimate_priority[candidate["existingEstimate"]["source"]]
            < estimate_priority[current["existingEstimate"]["source"]]
        ):
            current["existingEstimate"] = candidate["existingEstimate"]
        for field in ("fields", "notes"):
            current["provenance"][field] = sorted(
                set(current["provenance"][field] + candidate["provenance"][field]),
                key=str.casefold,
            )
    return sorted(merged.values(), key=canonical_issue_key)
