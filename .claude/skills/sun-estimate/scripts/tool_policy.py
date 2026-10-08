#!/usr/bin/env python3
"""Fail-closed preflight policy for sun-estimate external read calls."""

from __future__ import annotations

import argparse
import json
import re
import sys
from typing import Any


KPI_READ_TOOLS = frozenset(
    {
        "kpi_issue_estimate_candidates",
        "kpi_issue_estimate_detail",
        "kpi_estimate_themes",
    }
)

GITHUB_READ_COMMANDS = frozenset(
    {
        ("auth", "status"),
        ("issue", "list"),
        ("issue", "view"),
        ("project", "field-list"),
        ("project", "item-list"),
        ("project", "list"),
        ("project", "view"),
        ("repo", "view"),
    }
)


def evaluate_call(call: dict[str, Any]) -> tuple[bool, str]:
    """Return whether a normalized planned call is permitted and why."""

    family = call.get("family")

    if family == "github-rest":
        method = str(call.get("method", "GET")).upper()
        if method != "GET":
            return False, "GitHub REST permits GET only"
        return True, "read-only GitHub REST"

    if family == "github-graphql":
        document = call.get("document")
        if not isinstance(document, str) or not document.strip():
            return False, "GitHub GraphQL document is required"
        if re.search(r"\b(mutation|subscription)\b", document, re.IGNORECASE):
            return False, "GitHub GraphQL permits queries only"
        return True, "read-only GitHub GraphQL"

    if family == "github-cli":
        argv = call.get("argv")
        if not isinstance(argv, list) or not all(isinstance(arg, str) for arg in argv):
            return False, "GitHub CLI argv must be a string array"
        if "--show-token" in argv:
            return False, "GitHub CLI credential disclosure flags are forbidden"
        command = tuple(argv[:2])
        if command not in GITHUB_READ_COMMANDS:
            return False, "GitHub CLI command is not in the read-only allowlist"
        return True, "read-only GitHub CLI"

    if family == "backlog":
        method = str(call.get("method", "")).upper()
        if method != "GET":
            return False, "Backlog permits GET only"
        return True, "read-only Backlog"

    if family == "kpi-mcp":
        tool = call.get("tool")
        if tool not in KPI_READ_TOOLS:
            return False, "KPI MCP tool is not in the read-only allowlist"
        return True, "read-only KPI Insight MCP"

    return False, "unknown external call family"


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--stdin",
        action="store_true",
        help="read one normalized call object as JSON from standard input",
    )
    args = parser.parse_args()
    if not args.stdin:
        parser.error("--stdin is required")

    try:
        call = json.load(sys.stdin)
    except (json.JSONDecodeError, UnicodeDecodeError) as exc:
        print(json.dumps({"allowed": False, "reason": f"invalid JSON: {exc.msg}"}))
        return 2

    if not isinstance(call, dict):
        print(json.dumps({"allowed": False, "reason": "call must be a JSON object"}))
        return 2

    allowed, reason = evaluate_call(call)
    print(json.dumps({"allowed": allowed, "reason": reason}, separators=(",", ":")))
    return 0 if allowed else 3


if __name__ == "__main__":
    raise SystemExit(main())
