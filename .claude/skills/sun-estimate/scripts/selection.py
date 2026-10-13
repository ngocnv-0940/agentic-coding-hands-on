#!/usr/bin/env python3
"""Deterministically select direct work items and their parent containers."""

from __future__ import annotations

import argparse
import json
import sys
from typing import Any

from core.schema import INTRINSIC_PARENT_ISSUE_TYPES, normalize_candidates


def _string_list(value: Any, name: str) -> list[str]:
    if not isinstance(value, list) or not all(isinstance(item, str) and item.strip() for item in value):
        raise ValueError(f"{name} must be an array of non-empty strings")
    return sorted({item.strip() for item in value}, key=str.casefold)


def _boolean(value: Any, name: str) -> bool:
    if not isinstance(value, bool):
        raise ValueError(f"{name} must be a boolean")
    return value


def _overlaps(actual: list[str], requested: list[str]) -> bool:
    if not requested:
        return True
    return bool({item.casefold() for item in actual} & {item.casefold() for item in requested})


def _has_existing_estimate(candidate: dict[str, Any]) -> bool:
    estimate = candidate.get("existingEstimate")
    return bool(
        estimate
        and (estimate.get("standardWorkPoint") is not None or estimate.get("estimatedHours") is not None)
    )


def _passes_scope_filters(
    item: dict[str, Any], *, include_closed: bool,
    sprints: list[str], milestones: list[str], labels: list[str],
) -> str | None:
    """Return the first selection gate that excludes a candidate, if any."""
    if not include_closed and item["state"] == "closed":
        return "byStatus"
    if not _overlaps(item["sprints"], sprints):
        return "bySprint"
    if not _overlaps(item["milestones"], milestones):
        return "byMilestone"
    if not _overlaps(item["labels"], labels):
        return "byLabel"
    return None


def _parent_view(candidate: dict[str, Any]) -> dict[str, Any]:
    return {
        key: candidate[key]
        for key in (
            "sourceType", "issueRef", "url", "title", "labels", "issueType",
            "state", "status", "sprints", "milestones", "project", "period",
            "parentRef", "provenance",
        )
    }


def select_candidates(value: dict[str, Any]) -> dict[str, Any]:
    if not isinstance(value, dict):
        raise ValueError("payload must be an object")
    candidates = normalize_candidates(value.get("candidates", []))
    options = value.get("options", {})
    if not isinstance(options, dict):
        raise ValueError("options must be an object")

    force = _boolean(options.get("force", False), "options.force")
    include_closed = force or _boolean(
        options.get("includeClosed", False), "options.includeClosed",
    )
    reestimate_existing = force or _boolean(
        options.get("reestimateExisting", False), "options.reestimateExisting",
    )
    sprints = _string_list(options.get("sprints", []), "options.sprints")
    milestones = _string_list(options.get("milestones", []), "options.milestones")
    labels = _string_list(options.get("labels", []), "options.labels")
    explicit_refs = set(_string_list(options.get("explicitRefs", []), "options.explicitRefs"))
    estimate_check = options.get("existingEstimateCheck", "checked")
    if estimate_check not in {"checked", "unavailable", "not-applicable"}:
        raise ValueError("options.existingEstimateCheck has an unsupported value")

    candidate_keys = {(item["sourceType"], item["issueRef"]) for item in candidates}
    referenced_parent_keys = {
        (item["sourceType"], item["parentRef"])
        for item in candidates
        if item.get("parentRef") and (item["sourceType"], item["parentRef"]) in candidate_keys
    }

    def is_parent(item: dict[str, Any]) -> bool:
        return (
            item["issueType"] in INTRINSIC_PARENT_ISSUE_TYPES
            or (item["sourceType"], item["issueRef"]) in referenced_parent_keys
        )

    direct = [item for item in candidates if not is_parent(item)]
    parents = [item for item in candidates if is_parent(item)]
    excluded = {
        "byStatus": 0,
        "byExistingEstimate": 0,
        "bySprint": 0,
        "byMilestone": 0,
        "byLabel": 0,
    }
    selected: list[dict[str, Any]] = []
    for item in direct:
        if item["issueRef"] in explicit_refs:
            selected.append(item)
            continue
        if not reestimate_existing and estimate_check == "checked" and _has_existing_estimate(item):
            excluded["byExistingEstimate"] += 1
            continue
        excluded_by = _passes_scope_filters(
            item, include_closed=include_closed,
            sprints=sprints, milestones=milestones, labels=labels,
        )
        if excluded_by:
            excluded[excluded_by] += 1
            continue
        selected.append(item)

    parent_by_ref = {item["issueRef"]: item for item in parents}
    required = {item["parentRef"] for item in selected if item.get("parentRef")}
    required.update(ref for ref in explicit_refs if ref in parent_by_ref)
    selected_parents: list[dict[str, Any]] = []
    if not explicit_refs:
        for parent in parents:
            excluded_by = _passes_scope_filters(
                parent, include_closed=include_closed,
                sprints=sprints, milestones=milestones, labels=labels,
            )
            if excluded_by:
                excluded[excluded_by] += 1
                continue
            selected_parents.append(_parent_view(parent))
            if parent.get("parentRef"):
                required.add(parent["parentRef"])
    missing: set[str] = set()
    seen = {item["issueRef"] for item in selected_parents}
    while required:
        ref = required.pop()
        if ref in seen:
            continue
        seen.add(ref)
        parent = parent_by_ref.get(ref)
        if not parent:
            missing.add(ref)
            continue
        selected_parents.append(_parent_view(parent))
        if parent.get("parentRef"):
            required.add(parent["parentRef"])

    status_rule = "not-applicable" if include_closed else (
        "unavailable" if any(item["state"] == "unknown" for item in direct) else "issue-state"
    )
    return {
        "selectedIssues": selected,
        "selectedParents": sorted(
            selected_parents, key=lambda item: (item["sourceType"], item["issueRef"].casefold()),
        ),
        "parentRefsToFetch": sorted(missing, key=str.casefold),
        "selection": {
            "includeClosed": include_closed,
            "reestimateExisting": reestimate_existing,
            "statusRule": status_rule,
            "existingEstimateCheck": estimate_check,
            "filters": {"sprints": sprints, "milestones": milestones, "labels": labels},
            "excluded": {key: value for key, value in excluded.items() if value},
        },
    }


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--stdin", action="store_true", help="read selection JSON from stdin")
    args = parser.parse_args()
    if not args.stdin:
        parser.error("--stdin is required")
    try:
        payload = json.load(sys.stdin)
        result = select_candidates(payload)
    except (json.JSONDecodeError, TypeError, ValueError) as exc:
        print(json.dumps({"error": str(exc)}, separators=(",", ":")))
        return 2
    print(json.dumps(result, ensure_ascii=False, separators=(",", ":")))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
