"""Deterministic source-family gate and bounded worker dispatch planning."""

from __future__ import annotations

import argparse
import json
import sys
from collections.abc import Iterable
from typing import Any


MAX_ACTIVE_WORKERS = 5
INLINE_LIMIT = 5
SOURCE_FAMILIES = frozenset({"github", "backlog", "kpi-insight", "file"})
NORMALIZED_SOURCE_TYPES = frozenset({"github", "backlog", "redmine", "jira", "notion", "file"})
SOURCE_TYPES_BY_FAMILY = {
    "github": frozenset({"github"}),
    "backlog": frozenset({"backlog"}),
    "kpi-insight": NORMALIZED_SOURCE_TYPES - {"file"},
    "file": frozenset({"file"}),
}


def issue_identity(record: dict[str, Any]) -> str:
    source_type = record.get("sourceType")
    issue_ref = record.get("issueRef")
    if source_type not in NORMALIZED_SOURCE_TYPES:
        raise ValueError(f"unsupported sourceType: {source_type!r}")
    if not isinstance(issue_ref, str) or not issue_ref.strip():
        raise ValueError("issueRef must be a non-empty string")
    return f"{source_type}:{issue_ref}"


def validate_single_source(
    records: Iterable[dict[str, Any]], source_family: str
) -> list[dict[str, Any]]:
    """Validate a resolved run family, identities, duplicates, and ordering."""

    if source_family not in SOURCE_FAMILIES:
        raise ValueError(f"unsupported source family: {source_family!r}")
    normalized = list(records)
    identities: set[str] = set()
    for record in normalized:
        identity = issue_identity(record)
        if record["sourceType"] not in SOURCE_TYPES_BY_FAMILY[source_family]:
            raise ValueError(
                f"sourceType {record['sourceType']!r} is invalid for {source_family!r} run"
            )
        if identity in identities:
            raise ValueError(f"duplicate issue identity: {identity}")
        identities.add(identity)
    return sorted(normalized, key=issue_identity)


def plan_dispatch(records: Iterable[dict[str, Any]], source_family: str) -> dict[str, Any]:
    """Build a stable inline plan or at most five balanced worker batches."""

    ordered = validate_single_source(records, source_family)
    count = len(ordered)
    if count <= INLINE_LIMIT:
        return {
            "mode": "inline",
            "workerCount": 0,
            "batches": [ordered] if ordered else [],
        }

    worker_count = min(MAX_ACTIVE_WORKERS, count)
    base_size, remainder = divmod(count, worker_count)
    batches: list[list[dict[str, Any]]] = []
    cursor = 0
    for index in range(worker_count):
        size = base_size + (1 if index < remainder else 0)
        batches.append(ordered[cursor : cursor + size])
        cursor += size

    return {
        "mode": "workers",
        "workerCount": worker_count,
        "batches": batches,
    }


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--stdin", action="store_true", help="read run JSON from standard input")
    args = parser.parse_args()
    if not args.stdin:
        parser.error("--stdin is required")
    try:
        payload = json.load(sys.stdin)
        if not isinstance(payload, dict):
            raise ValueError("payload must be a JSON object")
        records = payload.get("records", [])
        if not isinstance(records, list) or not all(isinstance(row, dict) for row in records):
            raise ValueError("records must be an array of objects")
        plan = plan_dispatch(records, payload.get("sourceFamily"))
    except (json.JSONDecodeError, TypeError, ValueError) as exc:
        print(json.dumps({"error": str(exc)}, separators=(",", ":")))
        return 2
    print(json.dumps(plan, separators=(",", ":")))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
