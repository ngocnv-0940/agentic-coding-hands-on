#!/usr/bin/env python3
"""Composable deterministic CLI for Sun Estimate internal payloads."""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path
from typing import Any

from core.calibration import CalibrationConflict, apply_calibration
from core.render_html import RenderError, write_report
from core.representatives import select_representatives
from core.schema import ContractError, validate_payload


def _read_json(path: str) -> Any:
    try:
        with Path(path).open(encoding="utf-8") as handle:
            return json.load(handle)
    except (OSError, json.JSONDecodeError) as error:
        raise ContractError("invalid-json", path, str(error)) from error


def _emit(value: Any) -> None:
    json.dump(value, sys.stdout, ensure_ascii=False, sort_keys=True, separators=(",", ":"))
    sys.stdout.write("\n")


def _feedback(path: str) -> list[dict[str, Any]]:
    value = _read_json(path)
    if isinstance(value, dict):
        value = value.get("corrections")
    if not isinstance(value, list):
        raise ContractError("invalid-list", path, "feedback must be a list or an object with corrections[]")
    return value


def _accept_all(payload: dict[str, Any]) -> list[dict[str, Any]]:
    by_key = {(item["sourceType"], item["issueRef"]): item for item in payload["issues"]}
    return [
        {
            "representative": {"sourceType": item["sourceType"], "issueRef": item["issueRef"]},
            "approvedScope": by_key[(item["sourceType"], item["issueRef"])]["initialScope"],
            "approvedComplexity": by_key[(item["sourceType"], item["issueRef"])]["initialComplexity"],
            "issueSpecific": False,
            "rationale": "Accepted without changes.",
        }
        for item in payload["representatives"]
    ]


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description=__doc__)
    commands = parser.add_subparsers(dest="command", required=True)
    for name in ("validate", "select"):
        command = commands.add_parser(name)
        command.add_argument("input", help="Internal assessment JSON")
    calibrate = commands.add_parser("calibrate")
    calibrate.add_argument("input")
    group = calibrate.add_mutually_exclusive_group(required=True)
    group.add_argument("--feedback")
    group.add_argument("--skip", action="store_true")
    group.add_argument("--accept-all", action="store_true")
    render = commands.add_parser("render")
    render.add_argument("input")
    render.add_argument("output")
    run = commands.add_parser("run")
    run.add_argument("input")
    run.add_argument("output")
    run_group = run.add_mutually_exclusive_group(required=True)
    run_group.add_argument("--feedback")
    run_group.add_argument("--skip", action="store_true")
    run_group.add_argument("--accept-all", action="store_true")
    return parser


def main(argv: list[str] | None = None) -> int:
    args = build_parser().parse_args(argv)
    try:
        payload = validate_payload(_read_json(args.input))
        if args.command == "validate":
            _emit(payload)
        elif args.command == "select":
            _emit(select_representatives(payload))
        elif args.command == "calibrate":
            payload = select_representatives(payload) if not payload["representatives"] else payload
            corrections = _feedback(args.feedback) if args.feedback else (_accept_all(payload) if args.accept_all else None)
            _emit(apply_calibration(payload, corrections, skip=args.skip))
        elif args.command == "render":
            print(write_report(payload, args.output))
        elif args.command == "run":
            payload = select_representatives(payload)
            corrections = _feedback(args.feedback) if args.feedback else (_accept_all(payload) if args.accept_all else None)
            payload = apply_calibration(payload, corrections, skip=args.skip)
            print(write_report(payload, args.output))
        return 0
    except CalibrationConflict as error:
        _emit(error.as_dict())
        return 3
    except ContractError as error:
        _emit(error.as_dict())
        return 2
    except (RenderError, FileExistsError) as error:
        _emit({"type": "render-error", "message": str(error)})
        return 4


if __name__ == "__main__":
    raise SystemExit(main())
