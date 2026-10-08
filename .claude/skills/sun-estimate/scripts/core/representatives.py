"""Deterministic representative selection for review calibration."""

from __future__ import annotations

from typing import Any

from .schema import canonical_issue_key, issue_identity, validate_payload

CONFIDENCE_RANK = {"low": 0, "medium": 1, "high": 2}
EVIDENCE_RANK = {"AMBIGUOUS": 0, "INFERRED": 1, "EXTRACTED": 2}


def _score_key(issue: dict[str, Any]) -> tuple[Any, ...]:
    return issue["initialSWP"], *canonical_issue_key(issue)


def _pick(
    chosen: list[dict[str, Any]],
    candidate: dict[str, Any],
    reason: str,
) -> None:
    if candidate not in chosen:
        chosen.append(candidate)
    reasons = candidate.setdefault("_selectionReasons", [])
    if reason not in reasons:
        reasons.append(reason)


def _best_fill(
    issues: list[dict[str, Any]],
    chosen: list[dict[str, Any]],
    median_score: int,
) -> dict[str, Any] | None:
    chosen_ids = {issue_identity(item) for item in chosen}
    covered = {(item["primaryDiscipline"], item["workType"]) for item in chosen}
    remaining = [item for item in issues if issue_identity(item) not in chosen_ids]
    if not remaining:
        return None
    return min(
        remaining,
        key=lambda item: (
            0 if (item["primaryDiscipline"], item["workType"]) not in covered else 1,
            -abs(item["initialSWP"] - median_score),
            canonical_issue_key(item),
        ),
    )


def select_representatives(value: dict[str, Any], limit: int = 5) -> dict[str, Any]:
    """Select stable low/median/high/boundary/confidence representatives."""
    if isinstance(limit, bool) or not isinstance(limit, int) or limit < 1 or limit > 5:
        raise ValueError("limit must be an integer from 1 to 5")
    payload = validate_payload(value)
    issues = payload["issues"]
    for issue in issues:
        issue["calibration"]["isRepresentative"] = False
        issue["calibration"]["selectionReasons"] = []
        issue.pop("_selectionReasons", None)

    chosen: list[dict[str, Any]] = []
    if len(issues) <= limit:
        for issue in issues:
            _pick(chosen, issue, "all-issues")
    elif issues:
        by_score = sorted(issues, key=_score_key)
        median_index = (len(by_score) - 1) // 2
        median_score = by_score[median_index]["initialSWP"]
        _pick(chosen, by_score[0], "minimum")
        if len(chosen) < limit:
            _pick(chosen, by_score[median_index], "lower-median")
        if len(chosen) < limit:
            _pick(chosen, by_score[-1], "maximum")

        chosen_ids = {issue_identity(item) for item in chosen}
        boundary = next(
            (
                item for item in sorted(issues, key=canonical_issue_key)
                if item["splitRecommended"] and issue_identity(item) not in chosen_ids
            ),
            None,
        )
        if boundary is None:
            remaining = [item for item in issues if issue_identity(item) not in chosen_ids]
            boundary = min(
                remaining,
                key=lambda item: (-abs(item["initialSWP"] - median_score), canonical_issue_key(item)),
            )
            boundary_reason = "outlier"
        else:
            boundary_reason = "split-boundary"
        if len(chosen) < limit:
            _pick(chosen, boundary, boundary_reason)

        chosen_ids = {issue_identity(item) for item in chosen}
        remaining = [item for item in issues if issue_identity(item) not in chosen_ids]
        if remaining and len(chosen) < limit:
            low_confidence = min(
                remaining,
                key=lambda item: (
                    CONFIDENCE_RANK[item["confidence"]],
                    EVIDENCE_RANK[item["evidenceStatus"]],
                    canonical_issue_key(item),
                ),
            )
            _pick(chosen, low_confidence, "lowest-confidence")

        while len(chosen) < limit:
            fill = _best_fill(issues, chosen, median_score)
            if fill is None:
                break
            _pick(chosen, fill, "coverage-fill")

    payload["representatives"] = []
    for issue in chosen:
        reasons = issue.pop("_selectionReasons", [])
        issue["calibration"]["isRepresentative"] = True
        issue["calibration"]["selectionReasons"] = reasons
        payload["representatives"].append({
            "sourceType": issue["sourceType"],
            "issueRef": issue["issueRef"],
            "selectionReasons": reasons,
        })
    return validate_payload(payload)
