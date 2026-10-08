"""`org_chart` extra-slide layout — 1–3 lanes of role boxes + a role legend.

Entry: {lead?: str, lanes: [{title, accent?: red|gold|blue|grey,
        nodes: [{label, sub?}]}], roles?: [{name, desc}], roles_title?: str}
Lanes with more than 4 nodes wrap into two columns. Caps raise ValueError.
"""
from __future__ import annotations

from pptx.enum.shapes import MSO_SHAPE
from pptx.enum.text import MSO_ANCHOR, PP_ALIGN

from lib.abs_draw import LANE_ACCENTS, NEUTRAL_GREY, content_band, _rect, _text
from lib.brand import BORDER_GREY, LIGHT_GREY, SUN_RED, TEXT_DARK, TEXT_GREY, WHITE

ORG_MAX_LANES, ORG_MAX_NODES, ORG_MAX_ROLES = 3, 6, 8


def draw_org_chart(slide, box: tuple, entry: dict) -> None:
    lanes = entry.get('lanes') or []
    roles = entry.get('roles') or []
    if not 1 <= len(lanes) <= ORG_MAX_LANES:
        raise ValueError(f'org_chart: needs 1–{ORG_MAX_LANES} lanes, got {len(lanes)}')
    if len(roles) > ORG_MAX_ROLES:
        raise ValueError(f'org_chart: {len(roles)} roles > cap {ORG_MAX_ROLES}')
    l, t, w, h = box
    y = t
    if entry.get('lead'):
        _text(slide, l, y, w, 0.3, entry['lead'], 8, TEXT_GREY)
        y += 0.34
    roles_h = 0.13 * len(roles) + 0.14 if roles else 0.0
    lanes_h = t + h - y - roles_h - (0.12 if roles else 0.0)
    gap = 0.25
    lane_w = (w - gap * (len(lanes) - 1)) / len(lanes)
    first_mid = None
    for i, lane in enumerate(lanes):
        nodes = lane.get('nodes') or []
        if len(nodes) > ORG_MAX_NODES:
            raise ValueError(f'org_chart: lane {lane.get("title")!r} has {len(nodes)} nodes > cap {ORG_MAX_NODES}')
        x = l + i * (lane_w + gap)
        accent = LANE_ACCENTS.get(str(lane.get('accent') or '').lower(), SUN_RED)
        _rect(slide, x, y, lane_w, lanes_h, fill=LIGHT_GREY)
        _rect(slide, x, y, lane_w, 0.3, fill=accent)
        _text(slide, x + 0.1, y, lane_w - 0.2, 0.3, lane.get('title') or '', 8.5, WHITE,
              bold=True, anchor=MSO_ANCHOR.MIDDLE)
        cols = 2 if len(nodes) > 4 else 1
        per_col = -(-len(nodes) // cols) if nodes else 1
        col_w = (lane_w - 0.15 * (cols + 1)) / cols
        nh = min(0.46, (lanes_h - 0.42 - 0.08 * per_col) / per_col)
        for j, node in enumerate(nodes):
            nx = x + 0.15 + (j // per_col) * (col_w + 0.15)
            ny = y + 0.4 + (j % per_col) * (nh + 0.08)
            _rect(slide, nx, ny, col_w, nh, fill=WHITE, line=BORDER_GREY)
            _rect(slide, nx, ny, 0.06, nh, fill=accent)
            sub = node.get('sub') if isinstance(node, dict) else ''
            label = node.get('label') if isinstance(node, dict) else str(node)
            if sub:
                _text(slide, nx + 0.14, ny + 0.03, col_w - 0.2, nh * 0.5, label, 7.5,
                      TEXT_DARK, bold=True, anchor=MSO_ANCHOR.MIDDLE)
                _text(slide, nx + 0.14, ny + nh * 0.5, col_w - 0.2, nh * 0.48, sub, 6.5,
                      TEXT_GREY, anchor=MSO_ANCHOR.TOP)
            else:
                _text(slide, nx + 0.14, ny, col_w - 0.2, nh, label, 7.5, TEXT_DARK,
                      bold=True, anchor=MSO_ANCHOR.MIDDLE)
        mid = y + 0.4 + nh / 2
        if first_mid is not None:  # connector from the previous lane's first node
            _rect(slide, x - gap, mid - 0.008, gap, 0.016, fill=NEUTRAL_GREY)
        first_mid = mid
    if roles:
        ry = y + lanes_h + 0.12
        _rect(slide, l, ry, 1.35, 0.24, fill=SUN_RED, shape=MSO_SHAPE.ROUNDED_RECTANGLE)
        _text(slide, l, ry, 1.35, 0.24, entry.get('roles_title') or '各ロールの役割', 7.5,
              WHITE, bold=True, align=PP_ALIGN.CENTER, anchor=MSO_ANCHOR.MIDDLE)
        lines = [f'・{r.get("name", "")}　{r.get("desc", "")}'.rstrip('　') for r in roles]
        _text(slide, l + 1.5, ry - 0.02, w - 1.5, roles_h, lines, 6.8, TEXT_DARK)




def _org_chart_layout(cv, entry: dict) -> None:
    draw_org_chart(cv.slide, content_band(cv), entry)


def register(table: dict) -> None:
    table['org_chart'] = _org_chart_layout
