"""Safe, self-contained Sun Estimate HTML renderer (estimate-report layout).

The report is a pre-work estimate artifact: executive summary with an
uncertainty range and explicit exclusions, Build vs Bug/Rework composition,
SWP distribution, team load, risk-and-action tables, issues grouped by parent
container, an old-estimate diff, and a client-side SWP<->hours view with a
user-adjustable reference rate. Every number is projected from the validated
payload embedded in the page.
"""

from __future__ import annotations

import copy
import html
import json
import re
import statistics
from html.parser import HTMLParser
from pathlib import Path
from typing import Any, Iterable
from urllib.parse import urlparse

from .schema import SWP_MATRIX, derive_swp, validate_payload

REQUIRED_SECTION_IDS = (
    "summary", "methodology", "calibration-audit", "issues", "provenance", "caveats",
)
# Every distinct matrix cell, ascending — the only valid direct-work SWP values.
VALID_SWP = tuple(sorted({cell for row in SWP_MATRIX for cell in row}))
GENERIC_SECRET_PATTERNS = (
    re.compile(r"(?i)(authorization\s*[:=]\s*(?:bearer\s+)?)[^\s<]+"),
    re.compile(r"\bgh[pousr]_[A-Za-z0-9_]{20,}\b"),
    re.compile(r"\bgithub_pat_[A-Za-z0-9_]{20,}\b"),
)
FORBIDDEN_EXECUTABLES = (
    re.compile(r"\bfetch\s*\(", re.I),
    re.compile(r"\beval\s*\(", re.I),
    re.compile(r"XMLHttpRequest|WebSocket|EventSource", re.I),
)


class RenderError(ValueError):
    """A report could not be rendered or validated safely."""


def _redact_text(value: str, fingerprints: Iterable[str]) -> str:
    result = value
    for pattern in GENERIC_SECRET_PATTERNS:
        result = pattern.sub("[REDACTED]", result)
    for fingerprint in fingerprints:
        if fingerprint:
            result = result.replace(fingerprint, "[REDACTED]")
    return result


def _redact(value: Any, fingerprints: tuple[str, ...]) -> Any:
    if isinstance(value, str):
        return _redact_text(value, fingerprints)
    if isinstance(value, list):
        return [_redact(item, fingerprints) for item in value]
    if isinstance(value, dict):
        return {key: _redact(item, fingerprints) for key, item in value.items()}
    return value


def report_view_model(value: dict[str, Any], fingerprints: Iterable[str] = ()) -> dict[str, Any]:
    """Remove raw bodies and redact secret fingerprints before embedding."""
    secrets = tuple(item for item in fingerprints if isinstance(item, str) and item)
    payload = validate_payload(value)
    payload = copy.deepcopy(payload)
    for issue in payload["issues"]:
        issue.pop("body", None)
    return _redact(payload, secrets)


def _safe_issue_url(value: Any) -> str | None:
    if not isinstance(value, str) or any(ord(char) < 32 for char in value):
        return None
    parsed = urlparse(value)
    if parsed.scheme != "https" or not parsed.hostname or parsed.username or parsed.password:
        return None
    hostname = parsed.hostname.casefold()
    supported = (
        hostname == "github.com"
        or hostname == "backlog.com"
        or hostname.endswith(".backlog.com")
        or hostname == "backlog.jp"
        or hostname.endswith(".backlog.jp")
        or hostname == "backlogtool.com"
        or hostname.endswith(".backlogtool.com")
    )
    if not supported:
        return None
    return value


def _safe_json(value: Any) -> str:
    serialized = json.dumps(value, ensure_ascii=False, sort_keys=True, separators=(",", ":"))
    return (
        serialized.replace("&", "\\u0026")
        .replace("<", "\\u003c")
        .replace(">", "\\u003e")
        .replace(" ", "\\u2028")
        .replace(" ", "\\u2029")
    )


def _list_items(values: list[str], empty: str = "Không có") -> str:
    if not values:
        return f"<li>{html.escape(empty)}</li>"
    return "".join(f"<li>{html.escape(item)}</li>" for item in values)


# User-facing 5-level difficulty scale derived from SWP; the Scope/Complexity
# axes stay in the embedded audit payload but are never shown as S×C notation.
DIFFICULTY_BANDS = ((2, "rất dễ"), (5, "dễ"), (12, "vừa"), (25, "khó"))
RUN_CALIBRATION_VI = {
    "accepted": "đã review, giữ nguyên",
    "calibrated": "đã hiệu chỉnh",
    "skipped": "bỏ qua",
    "pending": "chưa hoàn tất",
}
ROW_CALIBRATION_VI = {
    "approved": "issue mẫu — đã duyệt",
    "issue-specific": "chỉnh riêng issue này",
    "propagated": "chỉnh theo issue mẫu tương tự",
    "unchanged": "không đổi",
    "skipped": "bỏ qua",
}
SELECTION_REASON_VI = {
    "all-issues": "toàn bộ issue (≤5)",
    "minimum": "issue nhỏ nhất",
    "lower-median": "mức trung vị",
    "maximum": "issue lớn nhất",
    "split-boundary": "chạm trần điểm",
    "outlier": "khác biệt nhất so với mặt bằng",
    "lowest-confidence": "độ tin cậy thấp nhất",
    "coverage-fill": "phủ thêm nhóm việc khác",
}


def _difficulty(swp: int) -> str:
    for ceiling, label in DIFFICULTY_BANDS:
        if swp <= ceiling:
            return label
    return "rất khó"


def _calibration_label(issue: dict[str, Any]) -> str:
    status = ROW_CALIBRATION_VI.get(issue["calibration"]["status"], issue["calibration"]["status"])
    if issue["calibration"]["saturated"]:
        return f"{status} · chạm biên thang điểm"
    return status


def _link(url: Any, text: str) -> str:
    safe_url = _safe_issue_url(url)
    if safe_url:
        return f'<a href="{html.escape(safe_url, quote=True)}" rel="noreferrer">{html.escape(text)}</a>'
    return html.escape(text)


def _chip(swp: int) -> str:
    tier = "t1" if swp <= 2 else "t2" if swp <= 5 else "t3" if swp <= 13 else "t4"
    return f'<span class="chip {tier}">{swp}</span>'


def _swp_span(value: int) -> str:
    """A convertible SWP figure — client JS rewrites it in hours mode."""
    return f'<span class="v" data-swp="{value}">{value}</span>'


def _conf_dot(confidence: str) -> str:
    labels = {"high": "cao", "medium": "vừa", "low": "thấp"}
    return f'<span class="conf {confidence}"><span class="dot"></span>{labels[confidence]}</span>'


def _shift_swp(value: int, delta: int) -> int:
    index = min(max(VALID_SWP.index(value) + delta, 0), len(VALID_SWP) - 1)
    return VALID_SWP[index]


def _summary(payload: dict[str, Any]) -> dict[str, int]:
    issues = payload["issues"]
    return {
        "issues": len(issues),
        "parents": len(payload["parents"]),
        "needsBreakdown": sum(1 for item in payload["parents"] if item["aggregationStatus"] == "needs-breakdown"),
        "representatives": len(payload["representatives"]),
        "changed": sum(1 for item in issues if (item["initialScope"], item["initialComplexity"]) != (item["finalScope"], item["finalComplexity"])),
        "lowConfidence": sum(1 for item in issues if item["confidence"] == "low"),
        "splitRecommended": sum(1 for item in issues if item["splitRecommended"]),
        "closed": sum(1 for item in issues if item["state"] == "closed"),
    }


BUG_LABELS = frozenset({"type:qabug", "type:uatbug", "type:productionbug"})
TEST_LABELS = frozenset({"type:testdesign", "type:testexecution"})
WORK_TYPE_VI = {
    "feature": "feature", "bugfix": "bugfix", "refactor": "refactor",
    "investigation": "điều tra", "documentation": "tài liệu",
    "infrastructure": "hạ tầng", "deployment": "deploy", "migration": "migration",
    "test-design": "test", "test-execution": "test", "other": "khác",
}


def _categorize(issues: list[dict[str, Any]]) -> dict[str, list[dict[str, Any]]]:
    """Group directly assessed work items into build, test, and rework."""
    groups: dict[str, list[dict[str, Any]]] = {"build": [], "test": [], "bug": []}
    for item in issues:
        labels = set(item["labels"])
        if item["issueType"] == "bug" or BUG_LABELS & labels or item["workType"] == "bugfix":
            groups["bug"].append(item)
        elif TEST_LABELS & labels or item["workType"] in ("test-design", "test-execution"):
            groups["test"].append(item)
        else:
            groups["build"].append(item)
    return groups


def _uncertainty_range(issues: list[dict[str, Any]]) -> tuple[int, int, int]:
    """(min, max, uncertain count): non-high-confidence rows shift one SWP step."""
    low = sum(
        item["finalSWP"] if item["confidence"] == "high" else _shift_swp(item["finalSWP"], -1)
        for item in issues
    )
    high = sum(
        item["finalSWP"] if item["confidence"] == "high" else _shift_swp(item["finalSWP"], +1)
        for item in issues
    )
    uncertain = sum(1 for item in issues if item["confidence"] != "high")
    return low, high, uncertain


def _default_hour_rate(issues: list[dict[str, Any]]) -> tuple[float, int]:
    """Median hours-per-SWP from rows carrying an existing hour estimate; (rate, sample size)."""
    ratios = sorted(
        item["existingEstimate"]["estimatedHours"] / item["finalSWP"]
        for item in issues
        if item.get("existingEstimate")
        and item["existingEstimate"].get("estimatedHours")
        and item["finalSWP"]
    )
    if not ratios:
        return 1.0, 0
    return round(statistics.median(ratios), 2), len(ratios)


def _team_rows(issues: list[dict[str, Any]]) -> list[tuple[str, int, int, int]]:
    """(team, item count, build SWP, rework SWP) from team:* labels; [] when unused."""
    if not any(label.startswith("team:") for item in issues for label in item["labels"]):
        return []
    teams: dict[str, dict[str, int]] = {}
    for item in issues:
        labels = [label for label in item["labels"] if label.startswith("team:")]
        key = labels[0].split(":", 1)[1] if labels else "(chưa gán team)"
        entry = teams.setdefault(key, {"n": 0, "build": 0, "bug": 0})
        entry["n"] += 1
        is_bug = item["issueType"] == "bug" or BUG_LABELS & set(item["labels"]) or item["workType"] == "bugfix"
        entry["bug" if is_bug else "build"] += item["finalSWP"]
    return sorted(
        ((name, entry["n"], entry["build"], entry["bug"]) for name, entry in teams.items()),
        key=lambda row: -(row[2] + row[3]),
    )


def _issue_detail(issue: dict[str, Any]) -> str:
    rationale = html.escape(issue["rationale"])
    assumptions = _list_items(issue["assumptions"], "Không có assumption")
    gaps = _list_items(issue["gaps"], "Không có gap")
    evidence = _list_items(issue.get("supportingEvidence", []), "Không có historical evidence")
    provenance = issue["provenance"]
    split = (
        f'<p class="warning">Đề xuất tách: {html.escape(issue["splitReason"])}</p>'
        if issue["splitRecommended"] else ""
    )
    if issue["initialSWP"] != issue["finalSWP"]:
        score_text = (
            f"Điểm ban đầu {issue['initialSWP']} SWP → sau hiệu chỉnh {issue['finalSWP']} SWP"
            f" (mức {_difficulty(issue['finalSWP'])})"
        )
    else:
        score_text = f"Điểm: {issue['finalSWP']} SWP (mức {_difficulty(issue['finalSWP'])})"
    audit = (
        f"{score_text} · hiệu chỉnh: {_calibration_label(issue)} · căn cứ: {issue['evidenceStatus']} · "
        f"function: {issue['functionRef']} · activity: {issue['activityType']}"
    )
    return (
        f"<details><summary>Chi tiết</summary><p class=\"audit\">{html.escape(audit)}</p>"
        f"<p>{rationale}</p>{split}"
        f"<h4>Assumptions</h4><ul>{assumptions}</ul><h4>Gaps</h4><ul>{gaps}</ul>"
        f"<h4>Supporting evidence</h4><ul>{evidence}</ul><h4>Provenance</h4>"
        f"<p>{html.escape(provenance['retrievedVia'])} · {html.escape(provenance['detailStatus'])} · "
        f"fields: {html.escape(', '.join(provenance['fields']) or '—')}</p></details>"
    )


def _issue_row(issue: dict[str, Any]) -> str:
    ref = issue["issueRef"]
    short_ref = "#" + ref.rsplit("#", 1)[-1] if "#" in ref else ref
    flags = []
    if issue["splitRecommended"]:
        flags.append('<span class="flag split">tách</span>')
    if issue["state"] == "closed":
        flags.append('<span class="flag closed">closed</span>')
    search = " ".join((
        issue["issueRef"], issue["title"], issue["functionRef"], issue["activityType"],
        issue["primaryDiscipline"], issue["workType"],
    )).casefold()
    return f"""
      <tr data-search="{html.escape(search, quote=True)}" data-discipline="{html.escape(issue['primaryDiscipline'], quote=True)}"
          data-work-type="{html.escape(issue['workType'], quote=True)}" data-confidence="{issue['confidence']}"
          data-calibration="{issue['calibration']['status']}" data-initial-swp="{issue['initialSWP']}"
          data-final-swp="{issue['finalSWP']}">
        <td class="num">{_chip(issue['finalSWP'])}</td>
        <td class="ref">{_link(issue.get('url'), short_ref)}</td>
        <td class="title">{html.escape(issue['title'])} {''.join(flags)}{_issue_detail(issue)}</td>
        <td>{html.escape(issue['primaryDiscipline'])}</td>
        <td>{html.escape(WORK_TYPE_VI.get(issue['workType'], issue['workType']))}</td>
        <td>{_conf_dot(issue['confidence'])}</td>
      </tr>"""


GROUP_TABLE_HEAD = """<thead><tr>
<th class="num"><button class="sort" type="button" data-sort="finalSwp">SWP ↕</button></th>
<th>Ref</th><th>Tiêu đề</th><th>Mảng</th><th>Loại</th><th>Tin cậy</th>
</tr></thead>"""


def _group_details(group_id: str, title_html: str, rows: list[dict[str, Any]], subtotal_html: str, open_group: bool) -> str:
    body = "".join(_issue_row(item) for item in sorted(rows, key=lambda x: (-x["finalSWP"], x["issueRef"])))
    open_attr = " open" if open_group else ""
    return f"""
<details class="group"{open_attr}>
  <summary><span class="g-title">{title_html}</span>
    <span class="g-meta">{len(rows)} item · <b>{subtotal_html}</b></span></summary>
  <div class="tablewrap"><table>{GROUP_TABLE_HEAD}<tbody data-rows id="{group_id}">{body}</tbody></table></div>
</details>"""


def _issue_groups(payload: dict[str, Any]) -> str:
    issues = payload["issues"]
    if not issues:
        return '<p class="note empty-state">Không có issue phù hợp trong phạm vi đã chọn.</p>'
    parents = payload["parents"]
    children: dict[str, list[dict[str, Any]]] = {}
    for item in issues:
        children.setdefault(item.get("parentRef") or "", []).append(item)
    blocks = []
    index = 0
    for parent in parents:
        rows = children.pop(parent["issueRef"], [])
        if not rows:
            continue  # childless containers surface in the needs-breakdown risk table
        index += 1
        short_ref = "#" + parent["issueRef"].rsplit("#", 1)[-1] if "#" in parent["issueRef"] else parent["issueRef"]
        title = (
            f"{html.escape(parent['issueType'].upper())} {_link(parent.get('url'), short_ref)}"
            f" — {html.escape(parent['title'])}"
        )
        subtotal = parent["finalSWP"] if parent["finalSWP"] is not None else sum(r["finalSWP"] for r in rows)
        blocks.append(_group_details(f"group-{index}-rows", title, rows, _swp_span(subtotal), len(rows) > 2))
    standalone = children.get("", [])
    if standalone:
        blocks.append(_group_details(
            "standalone-rows", "Task/Bug độc lập (không thuộc epic/story)", standalone,
            _swp_span(sum(item["finalSWP"] for item in standalone)), True,
        ))
    return "".join(blocks)


def _risk_tables(payload: dict[str, Any]) -> str:
    issues = payload["issues"]
    splits = sorted((i for i in issues if i["splitRecommended"]), key=lambda x: x["issueRef"])
    low = sorted((i for i in issues if i["confidence"] == "low"), key=lambda x: (-x["finalSWP"], x["issueRef"]))
    breakdown = [p for p in payload["parents"] if p["aggregationStatus"] == "needs-breakdown"]
    if not (splits or low or breakdown):
        return ""

    def row(swp_cell: str, url: Any, ref: str, title: str, action: str) -> str:
        short_ref = "#" + ref.rsplit("#", 1)[-1] if "#" in ref else ref
        return (
            f'<tr><td class="num">{swp_cell}</td><td class="ref">{_link(url, short_ref)}</td>'
            f'<td class="title">{html.escape(title)}</td>'
            f'<td class="action">{html.escape(action)}</td></tr>'
        )

    head = '<thead><tr><th class="num">SWP</th><th>Ref</th><th>Tiêu đề</th><th>Đề xuất hành động</th></tr></thead>'
    parts = ['<section id="risks"><h2>Rủi ro &amp; việc cần làm trước khi chốt estimate</h2>']
    if splits:
        rows = "".join(
            row(_chip(i["finalSWP"]), i.get("url"), i["issueRef"], i["title"],
                f"Tách thành issue độc lập rồi ước lượng lại từng phần — {(i['splitReason'] or '')[:220]}")
            for i in splits
        )
        parts.append(f'<h3>1. Tách issue ({len(splits)} item, {_swp_span(sum(i["finalSWP"] for i in splits))})</h3>'
                     f'<div class="tablewrap card-table"><table>{head}<tbody>{rows}</tbody></table></div>')
    if low:
        rows = "".join(
            row(_chip(i["finalSWP"]), i.get("url"), i["issueRef"], i["title"],
                f"Làm rõ trong ticket: {(i['gaps'] or [i['rationale']])[0][:260]}")
            for i in low
        )
        parts.append(f'<h3>2. Làm rõ ticket ({len(low)} item tin cậy thấp, {_swp_span(sum(i["finalSWP"] for i in low))})</h3>'
                     f'<div class="tablewrap card-table"><table>{head}<tbody>{rows}</tbody></table></div>')
    if breakdown:
        rows = "".join(
            row("—", p.get("url"), p["issueRef"], f"{p['issueType']} — {p['title']}",
                "Breakdown thành task con có thể ước lượng trước buổi planning kế tiếp")
            for p in breakdown
        )
        parts.append(f'<h3>3. Breakdown container ({len(breakdown)} story/epic chưa có task con)</h3>'
                     f'<div class="tablewrap card-table"><table>{head}<tbody>{rows}</tbody></table></div>')
    parts.append("</section>")
    return "".join(parts)


def _parent_table(payload: dict[str, Any]) -> str:
    if not payload["parents"]:
        return ""
    rows = []
    for parent in payload["parents"]:
        ref = parent["issueRef"]
        short_ref = "#" + ref.rsplit("#", 1)[-1] if "#" in ref else ref
        children = ", ".join(parent["childRefs"]) or "—"
        initial = parent["initialSWP"] if parent["initialSWP"] is not None else "—"
        final = parent["finalSWP"] if parent["finalSWP"] is not None else "—"
        status_class = ' class="warning"' if parent["aggregationStatus"] == "needs-breakdown" else ""
        rows.append(
            f"<tr><td>{_link(parent.get('url'), short_ref)}</td><td>{html.escape(parent['title'])}</td>"
            f"<td>{html.escape(parent['issueType'])}</td><td{status_class}>{parent['aggregationStatus']}</td>"
            f"<td>{html.escape(children)}</td><td class=\"num\">{initial}</td>"
            f"<td class=\"num strong\">{final}</td></tr>"
        )
    return f"""<h3>Container (User Story / Epic) — {len(payload['parents'])}</h3>
<p class="note">SWP của container là tổng dẫn xuất từ work item con; không chấm trực tiếp, không làm tròn lại theo ma trận.</p>
<div class="tablewrap card-table"><table><thead><tr><th>Parent</th><th>Tiêu đề</th><th>Type</th><th>Status</th><th>Children</th><th class="num">Initial SWP</th><th class="num">Final SWP</th></tr></thead><tbody id="parent-rows">{rows and ''.join(rows)}</tbody></table></div>"""


def _histogram(issues: list[dict[str, Any]]) -> str:
    if not issues:
        return ""
    counts: dict[int, int] = {}
    for item in issues:
        counts[item["finalSWP"]] = counts.get(item["finalSWP"], 0) + 1
    peak = max(counts.values())
    bars = "".join(
        f'<div class="hbar" title="{counts[value]} item có {value} SWP">'
        f'<span class="hcount">{counts[value]}</span>'
        f'<span class="hfill" style="height:{round(counts[value] * 100 / peak)}%"></span>'
        f'<span class="hlabel">{value}</span></div>'
        for value in sorted(counts)
    )
    return (
        f'<div class="hist" role="img" aria-label="Phân bố SWP">{bars}</div>'
        '<p class="note">Phân bố điểm theo mức SWP (trục hoành luôn hiển thị theo điểm).</p>'
    )


def render_html(value: dict[str, Any], fingerprints: Iterable[str] = ()) -> str:
    payload = report_view_model(value, fingerprints)
    if payload["issues"] and payload["run"]["calibrationStatus"] == "pending":
        raise RenderError("non-empty pending runs must complete or skip representative review before rendering")
    issues = payload["issues"]
    summary = _summary(payload)
    groups = _categorize(issues)
    totals = {key: sum(item["finalSWP"] for item in items) for key, items in groups.items()}
    counts = {key: len(items) for key, items in groups.items()}
    planned_total = totals["build"] + totals["test"]
    planned_count = counts["build"] + counts["test"]
    run_total = planned_total + totals["bug"]
    total_min, total_max, uncertain_n = _uncertainty_range(issues)
    rate, rate_samples = _default_hour_rate(issues)
    conf_counts = {level: sum(1 for item in issues if item["confidence"] == level) for level in ("high", "medium", "low")}
    open_count = summary["issues"] - summary["closed"]

    # --- summary bullets: render only the applicable ones ---
    bullets = []
    if issues:
        rework_pct = round(totals["bug"] * 100 / run_total) if run_total else 0
        bullets.append(
            f"Tổng khối lượng ước lượng: <b>{_swp_span(run_total)}</b> trên {summary['issues']} work item"
            f" ({open_count} open, {summary['closed']} closed) — trong đó Bug/Rework <b>{_swp_span(totals['bug'])}</b> ({rework_pct}%)."
        )
        bullets.append(
            f"Khoảng bất định: <b>{_swp_span(total_min)}–{_swp_span(total_max)}</b> — dịch ±1 bậc SWP cho"
            f" {uncertain_n} item tin cậy vừa/thấp; {conf_counts['high']} item tin cậy cao giữ nguyên điểm."
        )
    if summary["needsBreakdown"]:
        refs = ", ".join(
            "#" + p["issueRef"].rsplit("#", 1)[-1] if "#" in p["issueRef"] else p["issueRef"]
            for p in payload["parents"] if p["aggregationStatus"] == "needs-breakdown"
        )
        bullets.append(
            f"⚠ Tổng trên <b>chưa bao gồm</b> {summary['needsBreakdown']} container chưa breakdown ({html.escape(refs)})"
            " — khối lượng thật sẽ lớn hơn sau khi các container này được tách task."
        )
    if summary["splitRecommended"]:
        split_refs = ", ".join(
            "#" + i["issueRef"].rsplit("#", 1)[-1] if "#" in i["issueRef"] else i["issueRef"]
            for i in issues if i["splitRecommended"]
        )
        bullets.append(f"{summary['splitRecommended']} issue chạm trần điểm kèm đề xuất tách ({html.escape(split_refs)}) — xử lý trước khi cam kết.")
    if summary["lowConfidence"]:
        low_total = sum(i["finalSWP"] for i in issues if i["confidence"] == "low")
        bullets.append(f"{summary['lowConfidence']} item độ tin cậy thấp (tổng {_swp_span(low_total)}) — ticket thiếu thông tin, điểm có thể lệch.")
    if not issues:
        bullets.append("Không có issue phù hợp trong phạm vi đã chọn — báo cáo ở trạng thái rỗng hợp lệ.")
    summary_bullets = "".join(f"<li>{item}</li>" for item in bullets)

    # --- composition bar (planned vs rework) ---
    if run_total:
        rework_pct = round(totals["bug"] * 100 / run_total)
        compbar = f"""
  <p class="thesis">Bug/Rework chiếm <b>{rework_pct}%</b> khối lượng ({_swp_span(totals['bug'])}/{_swp_span(run_total)}).</p>
  <div class="compbar" role="img" aria-label="Kế hoạch {planned_total} SWP, Bug/Rework {totals['bug']} SWP">
    <div class="seg build" style="flex:{max(planned_total, 1)}">Build+Test · <span class="v" data-swp="{planned_total}">{planned_total}</span> ({100 - rework_pct}%)</div>
    <div class="seg rework" style="flex:{max(totals['bug'], 1)}">Bug/Rework · <span class="v" data-swp="{totals['bug']}">{totals['bug']}</span> ({rework_pct}%)</div>
  </div>
  <div class="legend">
    <span><i style="background:var(--build)"></i>Kế hoạch — Build {counts['build']} item{f" + Test/QA {counts['test']} item" if counts['test'] else ""}</span>
    <span><i style="background:var(--rework)"></i>Bug/Rework — {counts['bug']} item (subtotal riêng, không cộng vào tổng kế hoạch)</span>
  </div>"""
    else:
        compbar = ""

    # --- category subtotals (planned vs rework stay separate) ---
    def _cat_row(label: str, count: int, total: int, note: str, strong: bool = False) -> str:
        if count == 0 and not strong:
            return ""
        cell = ' class="strong"' if strong else ""
        num = ' class="num strong"' if strong else ' class="num"'
        return f"<tr><td{cell}>{label}</td><td{num}>{count}</td><td{num}>{_swp_span(total)}</td><td>{note}</td></tr>"

    category_rows = (
        _cat_row("Build (devtask/CR)", counts["build"], totals["build"], "Khối lượng xây — tính vào tổng kế hoạch")
        + _cat_row("Test/QA", counts["test"], totals["test"], "Khối lượng kiểm thử — tính vào tổng kế hoạch")
        + (_cat_row("TỔNG KẾ HOẠCH", planned_count, planned_total, "Build + Test/QA", strong=True) if planned_count else "")
        + _cat_row("Bug/Rework (qa/uat/production)", counts["bug"], totals["bug"], "Phát sinh — subtotal riêng, không cộng vào tổng kế hoạch")
        + _cat_row("TỔNG WORK ITEM", summary["issues"], run_total, "Mọi work item được chấm trực tiếp", strong=True)
    )
    category_summary = f"""<h3>Theo loại issue</h3><div class="tablewrap card-table"><table>
<thead><tr><th>Loại</th><th class="num">Số issue</th><th class="num">Khối lượng</th><th>Ghi chú</th></tr></thead><tbody>
{category_rows}</tbody></table></div>"""

    tiles = f"""
  <div class="tiles">
    <div class="tile"><b>{_swp_span(run_total)}</b><span>Tổng khối lượng ({summary['issues']} item) · khoảng {_swp_span(total_min)}–{_swp_span(total_max)}</span></div>
    <div class="tile"><b>{open_count}/{summary['closed']}</b><span>Open / Closed</span></div>
    <div class="tile"><b>{conf_counts['high']}/{conf_counts['medium']}/{conf_counts['low']}</b><span>Tin cậy cao / vừa / thấp</span></div>
    <div class="tile warn"><b>{summary['lowConfidence']}</b><span>Item tin cậy thấp</span></div>
    <div class="tile alert"><b>{summary['splitRecommended']}</b><span>Đề xuất tách issue</span></div>
  </div>""" if issues else ""

    # --- team load ---
    team_rows = _team_rows(issues)
    if team_rows:
        no_team = next((row for row in team_rows if row[0] == "(chưa gán team)"), None)
        body = "".join(
            f'<tr><td>{html.escape(name)}</td><td class="num">{n}</td>'
            f'<td class="num">{_swp_span(build)}</td><td class="num">{_swp_span(bug)}</td>'
            f'<td class="num"><b>{_swp_span(build + bug)}</b></td></tr>'
            for name, n, build, bug in team_rows
        )
        warning = (
            f'<p class="note">⚠ {no_team[1]}/{summary["issues"]} item chưa có label <code>team:*</code> —'
            ' gán team label trên board để bảng này dùng được cho phân bổ thực tế.</p>'
            if no_team else ""
        )
        team_section = f"""<section id="team"><h2>Cân tải theo team</h2>
<div class="tablewrap card-table"><table>
<thead><tr><th>Team</th><th class="num">Số item</th><th class="num">Build</th><th class="num">Bug/Rework</th><th class="num">Tổng</th></tr></thead>
<tbody id="team-rows">{body}</tbody></table></div>{warning}</section>"""
    else:
        team_section = ""

    # --- calibration (hiệu chỉnh theo issue mẫu) ---
    # Canonical issue identity is (sourceType, issueRef): a kpi-insight run may
    # mix trackers whose bare refs collide, so never key by issueRef alone.
    issue_by_ref = {(item["sourceType"], item["issueRef"]): item for item in issues}

    def _rep_row(rep: dict[str, Any]) -> str:
        issue = issue_by_ref.get((rep["sourceType"], rep["issueRef"]))
        short_ref = "#" + rep["issueRef"].rsplit("#", 1)[-1] if "#" in rep["issueRef"] else rep["issueRef"]
        reasons = ", ".join(SELECTION_REASON_VI.get(r, r) for r in rep["selectionReasons"])
        if issue:
            score = _chip(issue["finalSWP"])
            title = html.escape(issue["title"])
            level = _difficulty(issue["finalSWP"])
            link = _link(issue.get("url"), short_ref)
        else:
            score, title, level, link = "—", "—", "—", html.escape(short_ref)
        return (
            f'<tr><td class="num">{score}</td><td class="ref">{link}</td>'
            f'<td class="title">{title}</td><td>{level}</td>'
            f'<td>{html.escape(reasons)}</td></tr>'
        )

    if payload["representatives"]:
        rep_rows = "".join(_rep_row(item) for item in payload["representatives"])
        representatives_html = (
            '<div class="tablewrap card-table"><table>'
            '<thead><tr><th class="num">SWP</th><th>Ref</th><th>Tiêu đề</th>'
            '<th>Độ khó</th><th>Vì sao được chọn làm mẫu</th></tr></thead>'
            f"<tbody>{rep_rows}</tbody></table></div>"
        )
    else:
        representatives_html = '<p class="note">Không có issue mẫu (run rỗng).</p>'

    def _correction_line(item: dict[str, Any]) -> str:
        rep = item.get("representative", {})
        ref = rep.get("issueRef", "?")
        short_ref = "#" + ref.rsplit("#", 1)[-1] if "#" in ref else ref
        issue = issue_by_ref.get((rep.get("sourceType"), ref))
        try:
            approved_swp = derive_swp(item["approvedScope"], item["approvedComplexity"])
            approved_text = f"{approved_swp} SWP (mức {_difficulty(approved_swp)})"
        except (KeyError, ValueError):
            approved_text = "?"
        initial_text = f"{issue['initialSWP']} SWP" if issue else "?"
        reach = "chỉ issue này" if item.get("issueSpecific") else "áp dụng cho các issue tương tự"
        rationale = item.get("rationale", "")
        return f"{short_ref}: {initial_text} → {approved_text} · {reach}" + (f" · {rationale}" if rationale else "")

    corrections = [_correction_line(item) for item in payload["corrections"]]

    def _band_step(delta: Any) -> str:
        return f"{delta:+d} bậc" if isinstance(delta, int) else "?"

    rules = [
        f"Nhóm {item.get('stratum', {}).get('primaryDiscipline', '?')} / "
        f"{item.get('stratum', {}).get('workType', '?')}: dịch độ rộng {_band_step(item.get('scopeBandDelta'))}, "
        f"độ khó {_band_step(item.get('complexityBandDelta'))} — theo mẫu {', '.join(item.get('representativeRefs', []))}"
        for item in payload["calibrationRules"]
    ]

    # --- scope banner ---
    selection = payload["run"].get("selection")
    if selection:
        mode_label = (
            f"closed={'included' if selection['includeClosed'] else 'excluded'}; "
            f"existing estimates={'re-estimated' if selection['reestimateExisting'] else 'skipped'}"
        )
        rule_labels = {"issue-state": "dùng state open/closed từ nguồn",
                       "unavailable": "state không khả dụng — giữ candidate",
                       "not-applicable": "không áp dụng"}
        estimate_labels = {"checked": "đã đối chiếu estimate hiện có",
                           "unavailable": "nguồn estimate hiện có không khả dụng — vẫn estimate",
                           "not-applicable": "không áp dụng"}
        active_filters = "; ".join(
            f"{name}: {', '.join(values)}"
            for name, values in (("sprint", selection["filters"]["sprints"]),
                                 ("milestone", selection["filters"]["milestones"]),
                                 ("label", selection["filters"]["labels"])) if values
        ) or "không có"
        excluded_text = "; ".join(f"{key}: {value}" for key, value in selection["excluded"].items()) or "không có"
        scope_banner = f"""<section id="scope"><h2>Phạm vi run</h2><ul>
<li>Chế độ: <strong>{html.escape(mode_label)}</strong></li>
<li>Quy tắc status: {html.escape(rule_labels[selection['statusRule']])}</li>
<li>Kiểm tra estimate hiện có: {html.escape(estimate_labels[selection['existingEstimateCheck']])}</li>
<li>Filter phạm vi: {html.escape(active_filters)}</li>
<li>Số issue bị loại theo từng cửa: {html.escape(excluded_text)}</li>
</ul></section>"""
    else:
        scope_banner = ""

    # --- old-estimate diff: differing SWP, or hour-only estimates (not comparable) ---
    diff_rows = [
        item for item in issues
        if item.get("existingEstimate") and (
            (item["existingEstimate"].get("standardWorkPoint") is not None
             and item["existingEstimate"]["standardWorkPoint"] != item["finalSWP"])
            or (item["existingEstimate"].get("standardWorkPoint") is None
                and item["existingEstimate"].get("estimatedHours") is not None)
        )
    ]
    if diff_rows:
        def _old_cell(item: dict[str, Any]) -> tuple[str, str]:
            estimate = item["existingEstimate"]
            if estimate.get("standardWorkPoint") is not None:
                delta = item["finalSWP"] - estimate["standardWorkPoint"]
                return f"{estimate['standardWorkPoint']} SWP", f"{delta:+g}"
            return f"{estimate['estimatedHours']}h", "—"

        diff_body = "".join(
            f"<tr><td class=\"ref\">{_link(item.get('url'), '#' + item['issueRef'].rsplit('#', 1)[-1] if '#' in item['issueRef'] else item['issueRef'])}</td><td class=\"title\">{html.escape(item['title'])}</td>"
            f"<td class=\"num\">{html.escape(_old_cell(item)[0])}</td>"
            f"<td class=\"num\">{_chip(item['finalSWP'])}</td>"
            f"<td class=\"num\">{html.escape(_old_cell(item)[1])}</td>"
            f"<td>{html.escape(item['existingEstimate']['source'])}</td></tr>"
            for item in sorted(diff_rows, key=lambda x: x["issueRef"])
        )
        estimate_diff = f"""<h3 id="doichieu">Đối chiếu estimate hiện có — {len(diff_rows)} issue</h3>
<p class="note">SWP mới tính từ rubric cấu trúc; estimate hiện có đọc từ cột Nguồn (giờ cũ không quy đổi trực tiếp sang SWP — Δ chỉ tính khi cùng đơn vị). Con người quyết định dùng số nào.</p>
<div class="tablewrap card-table"><table><thead><tr><th>Issue</th><th>Tiêu đề</th><th class="num">Estimate hiện có</th><th class="num">SWP mới</th><th class="num">Δ</th><th>Nguồn</th></tr></thead><tbody>{diff_body}</tbody></table></div>"""
    else:
        estimate_diff = ""

    generated_at = html.escape(payload["run"]["generatedAt"])
    source_label = html.escape(payload["run"]["sourceLabel"])
    source_url = _safe_issue_url(payload["run"].get("sourceUrl"))
    source_display = (
        f'<a href="{html.escape(source_url, quote=True)}" rel="noreferrer">{source_label}</a>'
        if source_url else source_label
    )
    rate_note = (
        f"rate mặc định = trung vị giờ-cũ/SWP của {rate_samples} issue có giờ trên nguồn"
        if rate_samples else "chưa có dữ liệu giờ lịch sử — rate mặc định 1, team tự chỉnh"
    )
    embedded = _safe_json(payload)

    document = f"""<!doctype html>
<html lang="vi"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Sun Estimate — {source_label}</title>
<style>
:root{{--ink:#22303F;--muted:#5B6B7C;--paper:#F5F7F8;--card:#FFFFFF;--line:#DDE4E9;
--build:#0C7E9E;--rework:#B45309;--ok:#15803D;--warncol:#CA8A04;--bad:#B91C1C;
--chip1:#E9F1F4;--chip2:#CBE2EA;--chip3:#8FC2D2;--chip4:#0C7E9E}}
*{{box-sizing:border-box}}
body{{margin:0;background:var(--paper);color:var(--ink);font:15px/1.55 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif}}
main{{max-width:1120px;margin:0 auto;padding:20px 20px 64px}}
h1,h2,h3{{font-family:"Avenir Next","Segoe UI",system-ui,sans-serif;letter-spacing:-.015em}}
h1{{font-size:28px;font-weight:700;margin:14px 0 4px}}
h2{{font-size:20px;margin:40px 0 12px;display:flex;align-items:center;gap:10px;scroll-margin-top:64px}}
h2::after{{content:"";flex:1;height:1px;background:var(--line)}}
.eyebrow{{text-transform:uppercase;letter-spacing:.14em;font-size:11px;color:var(--muted);font-weight:600}}
.meta{{color:var(--muted);font-size:13px;margin-bottom:18px}}
a{{color:var(--build);text-decoration:none}} a:hover,a:focus-visible{{text-decoration:underline}}
:focus-visible{{outline:2px solid var(--build);outline-offset:2px;border-radius:2px}}
.num,.axes,.chip,.hcount,.hlabel,.tile b,.v{{font-family:ui-monospace,"SF Mono",Menlo,Consolas,monospace}}
nav{{position:sticky;top:0;z-index:10;background:var(--paper);border-bottom:1px solid var(--line);
display:flex;flex-wrap:wrap;gap:4px 14px;align-items:center;padding:8px 20px;font-size:13px}}
nav .links{{display:flex;flex-wrap:wrap;gap:2px 14px}} nav a{{color:var(--ink);font-weight:600}}
.unitbox{{margin-left:auto;display:flex;align-items:center;gap:6px}}
.unitbox input{{width:64px;padding:4px 6px;border:1px solid var(--line);border-radius:6px;font:inherit;text-align:right;background:var(--card);color:var(--ink)}}
#rate-wrap{{display:none;align-items:center;gap:6px}}
body.hours #rate-wrap{{display:inline-flex}} body.hours .unit-note{{display:block}}
.unit-note{{display:none;font-size:12px;color:var(--warncol);font-weight:600}}
.thesis{{font-size:18px;margin:16px 0 10px}} .thesis b{{color:var(--rework)}}
.compbar{{display:flex;gap:2px;height:32px;border-radius:6px;overflow:hidden}}
.compbar .seg{{display:flex;align-items:center;padding:0 12px;color:#fff;font-size:13px;font-weight:600;white-space:nowrap}}
.seg.build{{background:var(--build);border-radius:6px 0 0 6px}} .seg.rework{{background:var(--rework);border-radius:0 6px 6px 0}}
.legend{{display:flex;flex-wrap:wrap;gap:6px 18px;font-size:12.5px;color:var(--muted);margin-top:6px}}
.legend i{{display:inline-block;width:10px;height:10px;border-radius:2px;margin-right:5px;vertical-align:-1px}}
.summary-card{{background:var(--card);border:1px solid var(--line);border-left:4px solid var(--build);border-radius:8px;padding:14px 18px;margin:18px 0}}
.summary-card h3{{margin:0 0 8px;font-size:15px}} .summary-card li{{margin:4px 0;font-size:14px}}
.tiles{{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:12px;margin:20px 0 8px}}
.tile{{background:var(--card);border:1px solid var(--line);border-radius:8px;padding:13px 16px}}
.tile b{{display:block;font-size:24px;font-weight:700}} .tile span{{font-size:12.5px;color:var(--muted)}}
.tile.alert b{{color:var(--bad)}} .tile.warn b{{color:var(--warncol)}}
.chip{{display:inline-flex;align-items:center;justify-content:center;min-width:30px;height:24px;padding:0 7px;border-radius:12px;font-size:12.5px;font-weight:700;background:var(--chip1);color:var(--ink)}}
.chip.t2{{background:var(--chip2)}} .chip.t3{{background:var(--chip3)}} .chip.t4{{background:var(--chip4);color:#fff}}
.tablewrap{{overflow-x:auto}}
table{{width:100%;border-collapse:collapse;font-size:13.5px;background:var(--card)}}
.card-table{{border:1px solid var(--line);border-radius:8px;overflow:hidden}}
th{{text-align:left;font-size:11px;text-transform:uppercase;letter-spacing:.08em;color:var(--muted);padding:8px 10px;border-bottom:1px solid var(--line);background:var(--card)}}
th.num{{text-align:right}}
td{{padding:8px 10px;border-bottom:1px solid var(--line);vertical-align:top}}
tr:last-child td{{border-bottom:none}}
td.num{{white-space:nowrap;text-align:right}} td.axes{{white-space:nowrap}}
th:first-child,td:first-child{{padding-left:14px}} td.title{{min-width:260px}}
td.action{{min-width:260px;font-size:12.5px;color:var(--muted)}}
button.sort{{border:0;background:transparent;color:inherit;font:inherit;font-weight:inherit;text-transform:inherit;letter-spacing:inherit;cursor:pointer;padding:0}}
.flag{{display:inline-block;font-size:10.5px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;border-radius:4px;padding:1px 6px;margin-left:6px;vertical-align:1px}}
.flag.split{{background:#FBE9E9;color:var(--bad)}} .flag.closed{{background:#EAEEF1;color:var(--muted)}}
.conf{{display:inline-flex;align-items:center;gap:5px;font-size:12.5px}}
.conf .dot{{width:8px;height:8px;border-radius:50%}}
.conf.high .dot{{background:var(--ok)}} .conf.medium .dot{{background:var(--warncol)}} .conf.low .dot{{background:var(--bad)}}
.conf.low{{font-weight:700;color:var(--bad)}}
.hist{{display:flex;gap:10px;align-items:flex-end;height:140px;padding:10px 4px 0;background:var(--card);border:1px solid var(--line);border-radius:8px;margin-top:14px}}
.hbar{{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:flex-end;height:100%;gap:4px}}
.hfill{{width:70%;max-width:56px;background:var(--build);border-radius:4px 4px 0 0;min-height:3px}}
.hcount{{font-size:12px;font-weight:700}} .hlabel{{font-size:12px;color:var(--muted);padding-bottom:6px}}
.controls{{display:flex;flex-wrap:wrap;gap:8px;margin:0 0 14px;align-items:center}}
.controls input[type=search]{{flex:1 1 220px;padding:8px 12px;border:1px solid var(--line);border-radius:8px;font:inherit;background:var(--card);color:var(--ink)}}
.controls select{{min-height:36px;border:1px solid var(--line);border-radius:8px;padding:6px 8px;background:var(--card);color:inherit;font:inherit}}
.controls label{{font-size:12.5px;color:var(--muted);display:inline-flex;align-items:center;gap:6px}}
.group{{background:var(--card);border:1px solid var(--line);border-radius:8px;margin-bottom:14px}}
.group summary{{display:flex;flex-wrap:wrap;gap:6px 14px;align-items:baseline;cursor:pointer;padding:13px 16px;font-weight:600;list-style:none}}
.group summary::-webkit-details-marker{{display:none}}
.group summary::before{{content:"▸";color:var(--muted);margin-right:2px}} .group[open] summary::before{{content:"▾"}}
.g-meta{{margin-left:auto;color:var(--muted);font-size:13px;font-weight:400}} .g-meta b{{color:var(--ink)}}
td.title details{{margin-top:4px;font-size:12.5px}} td.title summary{{cursor:pointer;color:var(--build)}}
td.title details h4{{margin:8px 0 2px;font-size:11px;text-transform:uppercase;letter-spacing:.06em;color:var(--muted)}}
.audit{{color:var(--muted)}}
.warning{{color:var(--bad);font-weight:650}}
.note{{font-size:13px;color:var(--muted)}} .empty-state{{background:var(--card);border:1px solid var(--line);border-radius:8px;padding:26px;text-align:center}}
.cols2{{display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:20px}}
ul.plain{{padding-left:18px;font-size:13.5px}}
.fbtn{{border:1px solid var(--line);background:var(--card);color:var(--ink);border-radius:16px;padding:5px 13px;font:600 12.5px/1 inherit;cursor:pointer}}
.fbtn[aria-pressed=true]{{background:var(--ink);color:#fff;border-color:var(--ink)}}
code{{background:#EAEEF1;padding:2px 5px;border-radius:4px}}
footer{{margin-top:44px;border-top:1px solid var(--line);padding-top:14px;font-size:12.5px;color:var(--muted)}}
@media (max-width:640px){{.compbar .seg{{font-size:0;padding:0}}.legend{{flex-direction:column;gap:4px}}h1{{font-size:23px}}nav{{font-size:12px}}}}
@media (prefers-reduced-motion:reduce){{*{{transition:none!important;animation:none!important;scroll-behavior:auto!important}}}}
@media print{{body{{background:#fff}}nav,.controls{{display:none}}.group{{break-inside:avoid}}details:not([open])>*:not(summary){{display:block}}}}
</style></head><body>
<nav aria-label="Mục lục">
  <div class="links">
    <a href="#summary">Tổng quan</a><a href="#team">Team</a><a href="#risks">Rủi ro</a>
    <a href="#issues">Chi tiết</a><a href="#calibration-audit">Hiệu chỉnh</a><a href="#caveats">Lưu ý</a>
  </div>
  <div class="unitbox">
    <button class="fbtn" id="u-swp" aria-pressed="true" type="button">SWP</button>
    <button class="fbtn" id="u-h" aria-pressed="false" type="button">Giờ</button>
    <span id="rate-wrap"><label for="rate">1 SWP =</label>
      <input id="rate" type="number" min="0.1" step="0.1" value="{rate}"> <span>giờ</span></span>
  </div>
</nav>
<main>
<header>
  <p class="eyebrow">{html.escape(payload['run']['sourceFamily'])} · Sun Estimate · Standard Work Point</p>
  <h1>Estimate Report</h1>
  <p class="meta">Nguồn: {source_display} · Chấm điểm {generated_at} · Hiệu chỉnh: <b>{html.escape(RUN_CALIBRATION_VI.get(payload['run']['calibrationStatus'], payload['run']['calibrationStatus']))}</b></p>
  <p class="unit-note">Đang xem theo GIỜ ước tính = SWP × rate ({html.escape(rate_note)}) — chỉ để tham khảo, không phải cam kết.</p>
</header>
{scope_banner}
<section id="summary"><h2>Tổng quan</h2>
  <div class="summary-card"><h3>Tóm tắt estimate</h3><ul>{summary_bullets}</ul></div>
  {compbar}
  {tiles}
  {category_summary}
  {_histogram(issues)}
  {estimate_diff}
</section>
{team_section}
{_risk_tables(payload)}
<section id="issues"><h2>Chi tiết theo nhóm</h2>
  <div class="controls">
    <input id="search" type="search" placeholder="Tìm theo #ref hoặc tiêu đề…" aria-label="Tìm kiếm issue" autocomplete="off">
    <label>Discipline <select id="discipline"><option value="">Tất cả</option>{"".join(f'<option value="{html.escape(item, quote=True)}">{html.escape(item)}</option>' for item in sorted({i["primaryDiscipline"] for i in issues}))}</select></label>
    <label>Work type <select id="work-type"><option value="">Tất cả</option>{"".join(f'<option value="{html.escape(item, quote=True)}">{html.escape(item)}</option>' for item in sorted({i["workType"] for i in issues}))}</select></label>
    <label>Confidence <select id="confidence"><option value="">Tất cả</option><option>high</option><option>medium</option><option>low</option></select></label>
    <label>Hiệu chỉnh <select id="calibration"><option value="">Tất cả</option>{"".join(f'<option value="{html.escape(item, quote=True)}">{html.escape(ROW_CALIBRATION_VI.get(item, item))}</option>' for item in sorted({i["calibration"]["status"] for i in issues}))}</select></label>
  </div>
  {_issue_groups(payload)}
  {_parent_table(payload)}
</section>
<section id="methodology"><h2>Phương pháp</h2>
<p>Mỗi work item nhận một điểm khối lượng chuẩn — <strong>Standard Work Point (SWP)</strong> — chấm theo cùng một bảng chuẩn cố định, nên cùng một mô tả công việc luôn ra cùng một điểm. Điểm càng cao, việc càng nặng; trên báo cáo, điểm được diễn giải theo thang 5 mức: <strong>rất dễ</strong> (1–2), <strong>dễ</strong> (3–5), <strong>vừa</strong> (6–12), <strong>khó</strong> (13–25), <strong>rất khó</strong> (26+). User Story/Epic không được chấm trực tiếp — điểm của chúng là tổng điểm các task con. Quy đổi giờ trên báo cáo chỉ là tham khảo theo rate người xem tự đặt, không phải cam kết.</p>
<details><summary>Chi tiết kỹ thuật (cách tính điểm)</summary><p class="note">SWP được tra từ ma trận Scope × Complexity 6×6 (Scope bands: 1, 2, 3, 5, 8, 13 — độ rộng công việc; Complexity bands: 0, 1, 2, 3, 5, 8 — độ khó bên trong phạm vi đó); mỗi ô = Scope × hệ số Complexity (×1, ×1.25, ×1.5, ×2, ×3, ×5) làm tròn về số nguyên — không snap Fibonacci; giá trị hợp lệ: {", ".join(str(v) for v in VALID_SWP)}. Confidence và historical evidence không thay đổi điểm. Hai trục Scope/Complexity của từng issue nằm trong audit payload nhúng cuối trang.</p></details></section>
<section id="calibration-audit"><h2>Hiệu chỉnh theo issue mẫu (Calibration)</h2>
<p class="note">Hệ thống chọn ra tối đa 5 issue mẫu đại diện cho cả tập; với mỗi issue mẫu, người dùng chọn mức độ khó (rất dễ → rất khó) rồi chốt điểm cụ thể trong dải điểm của mức đó, và điểm của các issue tương tự được hiệu chỉnh theo. Đây là bước để estimate phản ánh cảm nhận thực tế của team thay vì chỉ nội dung ticket.</p>
<p>Trạng thái: <strong>{html.escape(RUN_CALIBRATION_VI.get(payload['run']['calibrationStatus'], payload['run']['calibrationStatus']))}</strong> · Số issue đổi điểm sau hiệu chỉnh: <strong>{summary['changed']}</strong> · Số issue mẫu: <strong>{summary['representatives']}</strong></p>
<h3>Issue mẫu</h3>{representatives_html}
<div class="cols2"><div><h3>Điều chỉnh của người dùng</h3><ul class="plain">{_list_items(corrections)}</ul></div>
<div><h3>Quy tắc đã áp dụng</h3><ul class="plain">{_list_items(rules)}</ul></div></div></section>
<section id="provenance"><h2>Provenance</h2><p>Source family: {html.escape(payload['run']['sourceFamily'])}. Raw issue bodies and tool transcripts are intentionally omitted from this artifact.</p></section>
<section id="caveats"><h2>Lưu ý &amp; giới hạn</h2><ul class="plain">{_list_items(payload['caveats'])}</ul></section>
<footer>Sun Estimate — run read-only, không thay đổi dữ liệu nguồn. Mọi con số chiếu từ audit payload nhúng trong trang.</footer>
<script id="report-data" type="application/json">{embedded}</script>
<script>
(()=>{{'use strict';
const body=document.body;
const rate=document.getElementById('rate');
const uSwp=document.getElementById('u-swp'),uH=document.getElementById('u-h');
const vals=[...document.querySelectorAll('.v[data-swp]')];
function fmtHours(n){{const h=n*parseFloat(rate.value||'0');const s=h>=100?Math.round(h):Math.round(h*10)/10;return s+'h';}}
function renderUnits(){{const hours=body.classList.contains('hours');
for(const el of vals){{const n=parseFloat(el.getAttribute('data-swp'));el.textContent=hours?fmtHours(n):(n+' SWP');}}
uSwp.setAttribute('aria-pressed',hours?'false':'true');uH.setAttribute('aria-pressed',hours?'true':'false');
try{{localStorage.setItem('sun-estimate-unit',hours?'h':'swp');localStorage.setItem('sun-estimate-rate',rate.value);}}catch(e){{}}}}
uSwp.addEventListener('click',()=>{{body.classList.remove('hours');renderUnits();}});
uH.addEventListener('click',()=>{{body.classList.add('hours');renderUnits();}});
rate.addEventListener('input',renderUnits);
try{{const r=localStorage.getItem('sun-estimate-rate');if(r&&parseFloat(r)>0)rate.value=r;
if(localStorage.getItem('sun-estimate-unit')==='h')body.classList.add('hours');}}catch(e){{}}
renderUnits();
const bodies=[...document.querySelectorAll('tbody[data-rows]')];
const allRows=bodies.flatMap(b=>[...b.querySelectorAll('tr[data-search]')]);
const search=document.getElementById('search'),discipline=document.getElementById('discipline'),workType=document.getElementById('work-type'),confidence=document.getElementById('confidence'),calibration=document.getElementById('calibration');
function filterRows(){{const query=search.value.trim().toLocaleLowerCase();
for(const row of allRows){{row.hidden=!!((query&&!row.dataset.search.includes(query))||(discipline.value&&row.dataset.discipline!==discipline.value)||(workType.value&&row.dataset.workType!==workType.value)||(confidence.value&&row.dataset.confidence!==confidence.value)||(calibration.value&&row.dataset.calibration!==calibration.value));}}
const active=query||discipline.value||workType.value||confidence.value||calibration.value;
for(const group of document.querySelectorAll('details.group')){{if(active&&group.querySelector('tbody tr:not([hidden])'))group.open=true;}}}}
search.addEventListener('input',filterRows);
for(const control of [discipline,workType,confidence,calibration])control.addEventListener('change',filterRows);
for(const button of document.querySelectorAll('button[data-sort]'))button.addEventListener('click',()=>{{
const tbody=button.closest('table').querySelector('tbody[data-rows]');
const rows=[...tbody.querySelectorAll('tr[data-search]')];
const field=button.dataset.sort;const ascending=button.dataset.dir!=='asc';
button.dataset.dir=ascending?'asc':'desc';const direction=ascending?1:-1;
rows.sort((a,b)=>(Number(a.dataset[field])-Number(b.dataset[field]))*direction||a.dataset.search.localeCompare(b.dataset.search));
for(const row of rows)tbody.appendChild(row);}});
}})();
</script></main></body></html>"""
    validate_rendered_html(document, payload, fingerprints)
    return document


class _AssetParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self.external_assets: list[str] = []

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        attributes = dict(attrs)
        if tag in {"script", "img", "link", "iframe", "audio", "video", "source"}:
            target = attributes.get("src") or attributes.get("href")
            if target:
                self.external_assets.append(target)


def validate_rendered_html(document: str, expected: dict[str, Any], fingerprints: Iterable[str] = ()) -> None:
    for section_id in REQUIRED_SECTION_IDS:
        if f'id="{section_id}"' not in document:
            raise RenderError(f"missing required section: {section_id}")
    match = re.search(r'<script id="report-data" type="application/json">(.*?)</script>', document, re.S)
    if not match:
        raise RenderError("embedded audit payload is missing")
    try:
        embedded = json.loads(match.group(1))
    except json.JSONDecodeError as error:
        raise RenderError(f"embedded audit payload is invalid: {error}") from error
    checked = validate_payload(embedded)
    if len(checked["issues"]) != len(expected["issues"]):
        raise RenderError("embedded issue count does not match")
    if checked["parents"] != expected["parents"]:
        raise RenderError("embedded parent rollups do not match")
    for issue in checked["issues"]:
        if issue["initialSWP"] != derive_swp(issue["initialScope"], issue["initialComplexity"]):
            raise RenderError("initial formula mismatch")
        if issue["finalSWP"] != derive_swp(issue["finalScope"], issue["finalComplexity"]):
            raise RenderError("final formula mismatch")
    parser = _AssetParser()
    parser.feed(document)
    if parser.external_assets:
        raise RenderError(f"external assets are forbidden: {parser.external_assets}")
    scripts = re.findall(r'<script(?![^>]*type="application/json")[^>]*>(.*?)</script>', document, re.S | re.I)
    for script in scripts:
        for pattern in FORBIDDEN_EXECUTABLES:
            if pattern.search(script):
                raise RenderError(f"forbidden executable construct: {pattern.pattern}")
    for fingerprint in fingerprints:
        if fingerprint and fingerprint in document:
            raise RenderError("secret fingerprint found in report")
    for pattern in GENERIC_SECRET_PATTERNS:
        if pattern.search(document):
            raise RenderError("secret-like content found in report")


def write_report(
    value: dict[str, Any],
    output_path: str | Path,
    fingerprints: Iterable[str] = (),
) -> Path:
    path = Path(output_path).expanduser().resolve()
    if path.suffix.lower() != ".html" or "reports" not in path.parts:
        raise RenderError("output must be an explicit .html path under a reports directory")
    if path.exists():
        raise FileExistsError(f"refusing to overwrite existing report: {path}")
    document = render_html(value, fingerprints)
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("x", encoding="utf-8", newline="\n") as handle:
        handle.write(document)
    return path
