"""Exact-stratum, band-step calibration with typed conflicts."""

from __future__ import annotations

import copy
from typing import Any

from .representatives import select_representatives
from .schema import (
    COMPLEXITY_BANDS,
    SCOPE_BANDS,
    ContractError,
    calibration_stratum,
    canonical_issue_key,
    derive_swp,
    issue_identity,
    stratum_object,
    validate_payload,
)


class CalibrationConflict(ContractError):
    """Conflicting non-issue-specific corrections for one exact stratum."""

    def __init__(self, conflicts: list[dict[str, Any]], partial_payload: dict[str, Any]):
        self.conflicts = conflicts
        self.partial_payload = partial_payload
        super().__init__("calibration-conflict", "corrections", "same-stratum corrections disagree")

    def as_dict(self) -> dict[str, Any]:
        result = super().as_dict()
        result["conflicts"] = self.conflicts
        return result


def _require_int(value: Any, path: str) -> int:
    if isinstance(value, bool) or not isinstance(value, int):
        raise ContractError("invalid-integer", path, "must be an integer, not a boolean")
    return value


def _band_delta(initial: int, approved: int, bands: tuple[int, ...]) -> int:
    return bands.index(approved) - bands.index(initial)


def _shift(value: int, delta: int, bands: tuple[int, ...]) -> tuple[int, bool]:
    raw_index = bands.index(value) + delta
    bounded_index = min(max(raw_index, 0), len(bands) - 1)
    return bands[bounded_index], bounded_index != raw_index


def _normalize_correction(
    raw: Any,
    issues_by_key: dict[tuple[str, str], dict[str, Any]],
    representative_keys: set[tuple[str, str]],
    index: int,
) -> dict[str, Any]:
    path = f"corrections[{index}]"
    if not isinstance(raw, dict):
        raise ContractError("invalid-type", path, "must be an object")
    representative = raw.get("representative")
    if not isinstance(representative, dict):
        raise ContractError("invalid-reference", f"{path}.representative", "must be an object")
    source_type = representative.get("sourceType")
    issue_ref = representative.get("issueRef")
    if not isinstance(source_type, str) or not isinstance(issue_ref, str):
        raise ContractError("invalid-reference", path, "sourceType and representativeRef are required")
    key = (source_type, issue_ref)
    if key not in issues_by_key:
        raise ContractError("unknown-representative", path, "does not match an issue")
    if key not in representative_keys:
        raise ContractError("not-representative", path, "feedback is only accepted for selected representatives")
    issue = issues_by_key[key]
    approved_scope = _require_int(raw.get("approvedScope", issue["initialScope"]), f"{path}.approvedScope")
    approved_complexity = _require_int(
        raw.get("approvedComplexity", issue["initialComplexity"]),
        f"{path}.approvedComplexity",
    )
    if approved_scope not in SCOPE_BANDS:
        raise ContractError("invalid-band", f"{path}.approvedScope", f"must be one of {list(SCOPE_BANDS)}")
    if approved_complexity not in COMPLEXITY_BANDS:
        raise ContractError(
            "invalid-band", f"{path}.approvedComplexity", f"must be one of {list(COMPLEXITY_BANDS)}",
        )
    if "approvedSWP" in raw:
        raise ContractError("derived-field", f"{path}.approvedSWP", "must not be supplied")
    issue_specific = raw.get("issueSpecific", False)
    if not isinstance(issue_specific, bool):
        raise ContractError("invalid-boolean", f"{path}.issueSpecific", "must be a boolean")
    rationale = raw.get("rationale", "")
    if not isinstance(rationale, str):
        raise ContractError("invalid-string", f"{path}.rationale", "must be a string")
    return {
        "representative": {"sourceType": source_type, "issueRef": issue_ref},
        "approvedScope": approved_scope,
        "approvedComplexity": approved_complexity,
        "scopeBandDelta": _band_delta(issue["initialScope"], approved_scope, SCOPE_BANDS),
        "complexityBandDelta": _band_delta(issue["initialComplexity"], approved_complexity, COMPLEXITY_BANDS),
        "stratum": stratum_object(issue),
        "issueSpecific": issue_specific,
        "rationale": rationale.strip(),
        "_stratumKey": calibration_stratum(issue),
    }


def _lock_representative(issue: dict[str, Any], correction: dict[str, Any]) -> None:
    issue["finalScope"] = correction["approvedScope"]
    issue["finalComplexity"] = correction["approvedComplexity"]
    issue["finalSWP"] = derive_swp(issue["finalScope"], issue["finalComplexity"])
    calibration = issue["calibration"]
    calibration.update({
        "approvedScope": issue["finalScope"],
        "approvedComplexity": issue["finalComplexity"],
        "issueSpecific": correction["issueSpecific"],
        "matchedRuleId": None,
        "scopeBandDelta": correction["scopeBandDelta"],
        "complexityBandDelta": correction["complexityBandDelta"],
        "saturated": False,
        "status": "issue-specific" if correction["issueSpecific"] else "approved",
    })


def _public_correction(correction: dict[str, Any]) -> dict[str, Any]:
    return {
        "representative": copy.deepcopy(correction["representative"]),
        "approvedScope": correction["approvedScope"],
        "approvedComplexity": correction["approvedComplexity"],
        "issueSpecific": correction["issueSpecific"],
        "rationale": correction["rationale"],
    }


def _validate_after_issue_changes(payload: dict[str, Any]) -> dict[str, Any]:
    """Re-derive parent rollups after calibration changes child SWP values."""
    for parent in payload["parents"]:
        parent.pop("initialSWP", None)
        parent.pop("finalSWP", None)
    return validate_payload(payload)


def apply_calibration(
    value: dict[str, Any],
    corrections: list[dict[str, Any]] | None = None,
    *,
    skip: bool = False,
) -> dict[str, Any]:
    payload = validate_payload(value)
    if not payload["representatives"] and payload["issues"]:
        payload = select_representatives(payload)
    issues_by_key = {issue_identity(item): item for item in payload["issues"]}
    representative_keys = {
        (item["sourceType"], item["issueRef"]) for item in payload["representatives"]
    }

    if not payload["issues"]:
        if corrections:
            raise ContractError("unexpected-feedback", "corrections", "an empty run has no representatives")
        payload["run"]["calibrationStatus"] = "skipped"
        payload["corrections"] = []
        payload["calibrationRules"] = []
        return _validate_after_issue_changes(payload)

    if skip:
        for issue in payload["issues"]:
            issue["finalScope"] = issue["initialScope"]
            issue["finalComplexity"] = issue["initialComplexity"]
            issue["finalSWP"] = issue["initialSWP"]
            issue["calibration"].update({
                "approvedScope": None, "approvedComplexity": None, "issueSpecific": False,
                "matchedRuleId": None, "scopeBandDelta": 0, "complexityBandDelta": 0,
                "saturated": False, "status": "skipped",
            })
        payload["run"]["calibrationStatus"] = "skipped"
        payload["corrections"] = []
        payload["calibrationRules"] = []
        return _validate_after_issue_changes(payload)

    if corrections is None:
        corrections = []
    if not isinstance(corrections, list):
        raise ContractError("invalid-list", "corrections", "must be a list")
    normalized = [
        _normalize_correction(item, issues_by_key, representative_keys, index)
        for index, item in enumerate(corrections)
    ]
    normalized.sort(key=lambda item: canonical_issue_key({
        "sourceType": item["representative"]["sourceType"],
        "issueRef": item["representative"]["issueRef"],
    }))
    seen_corrections: set[tuple[str, str]] = set()
    for item in normalized:
        key = (item["representative"]["sourceType"], item["representative"]["issueRef"])
        if key in seen_corrections:
            raise ContractError("duplicate-correction", "corrections", f"duplicate feedback for {key[0]}:{key[1]}")
        seen_corrections.add(key)
        _lock_representative(issues_by_key[key], item)
    missing_feedback = sorted(representative_keys - seen_corrections)
    if missing_feedback:
        refs = [f"{source}:{ref}" for source, ref in missing_feedback]
        raise ContractError("missing-feedback", "corrections", f"feedback is required for every representative: {refs}")

    grouped: dict[tuple[Any, ...], list[dict[str, Any]]] = {}
    for correction in normalized:
        if not correction["issueSpecific"]:
            grouped.setdefault(correction["_stratumKey"], []).append(correction)
    conflicts = []
    merged_deltas: dict[tuple[Any, ...], tuple[int, int]] = {}
    for stratum, items in grouped.items():
        scope_deltas = {item["scopeBandDelta"] for item in items if item["scopeBandDelta"] != 0}
        complexity_deltas = {
            item["complexityBandDelta"] for item in items if item["complexityBandDelta"] != 0
        }
        axis_conflicts = {}
        if len(scope_deltas) > 1:
            axis_conflicts["Scope"] = sorted(scope_deltas)
        if len(complexity_deltas) > 1:
            axis_conflicts["Complexity"] = sorted(complexity_deltas)
        if axis_conflicts:
            conflicts.append({
                "stratum": copy.deepcopy(items[0]["stratum"]),
                "representativeRefs": [
                    f"{item['representative']['sourceType']}:{item['representative']['issueRef']}"
                    for item in items
                ],
                "axisConflicts": axis_conflicts,
            })
        merged_deltas[stratum] = (
            next(iter(scope_deltas), 0), next(iter(complexity_deltas), 0),
        )
    if conflicts:
        payload["corrections"] = [_public_correction(item) for item in normalized]
        payload["calibrationRules"] = []
        raise CalibrationConflict(conflicts, _validate_after_issue_changes(payload))

    rules_by_stratum: dict[tuple[Any, ...], dict[str, Any]] = {}
    public_rules = []
    for stratum, items in sorted(grouped.items(), key=lambda pair: repr(pair[0])):
        first = items[0]
        scope_delta, complexity_delta = merged_deltas[stratum]
        if scope_delta == 0 and complexity_delta == 0:
            continue
        rule = {
            "ruleId": f"cal-{len(public_rules) + 1:03d}",
            "representativeRefs": [
                f"{item['representative']['sourceType']}:{item['representative']['issueRef']}"
                for item in items
            ],
            "stratum": copy.deepcopy(first["stratum"]),
            "scopeBandDelta": scope_delta,
            "complexityBandDelta": complexity_delta,
        }
        public_rules.append(rule)
        rules_by_stratum[stratum] = rule

    for issue in payload["issues"]:
        key = issue_identity(issue)
        if key in representative_keys:
            continue
        rule = rules_by_stratum.get(calibration_stratum(issue))
        if not rule:
            continue
        final_scope, scope_saturated = _shift(issue["initialScope"], rule["scopeBandDelta"], SCOPE_BANDS)
        final_complexity, complexity_saturated = _shift(
            issue["initialComplexity"], rule["complexityBandDelta"], COMPLEXITY_BANDS,
        )
        saturated = scope_saturated or complexity_saturated
        issue["finalScope"] = final_scope
        issue["finalComplexity"] = final_complexity
        issue["finalSWP"] = derive_swp(final_scope, final_complexity)
        issue["calibration"].update({
            "approvedScope": None, "approvedComplexity": None, "issueSpecific": False,
            "matchedRuleId": rule["ruleId"],
            "scopeBandDelta": rule["scopeBandDelta"],
            "complexityBandDelta": rule["complexityBandDelta"],
            "saturated": saturated,
            "status": "propagated",
        })

    payload["corrections"] = [_public_correction(item) for item in normalized]
    payload["calibrationRules"] = public_rules
    changed = any(
        item["scopeBandDelta"] or item["complexityBandDelta"] for item in normalized
    )
    payload["run"]["calibrationStatus"] = "calibrated" if changed else "accepted"
    return _validate_after_issue_changes(payload)
