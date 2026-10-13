"""`gantt` extra-slide layout — bars per month, coloured by owner.

Entry: {rows: [{task, owner, start, end}], milestones?: [{label, at}],
        months?: ['2026/12', ...], legend?: bool, milestone_label?: str}
owner ∈ sun | client | next | other (or a 担当 cell, mapped by `owner_key`);
dates are YYYY/MM. Caps raise ValueError rather than truncating silently.
`draw_gantt` is also what the renderer calls to fill template slide 43's frame.
"""
from __future__ import annotations

import re

from pptx.enum.shapes import MSO_SHAPE
from pptx.enum.text import MSO_ANCHOR, PP_ALIGN

from lib.abs_draw import (
    OWNER_COLORS, OWNER_LABELS, content_band, _rect, _text,
)
from lib.brand import BORDER_GREY, LIGHT_GREY, SUN_RED, TEXT_DARK, TEXT_GREY, WHITE

GANTT_MAX_ROWS, GANTT_MAX_MONTHS = 10, 14
_MONTH = re.compile(r'^(\d{4})[/\-.年](\d{1,2})月?$')


def _month_key(text: str) -> tuple:
    m = _MONTH.match(str(text).strip())
    if not m:
        raise ValueError(f'gantt: month {text!r} is not YYYY/MM')
    return int(m.group(1)), int(m.group(2))


def _month_span(first: tuple, last: tuple) -> list:
    out, (y, m) = [], first
    while (y, m) <= last:
        out.append(f'{y}/{m:02d}')
        y, m = (y + 1, 1) if m == 12 else (y, m + 1)
    return out


def owner_key(text: str) -> str:
    """Map a 担当 cell to the legend key it colours by."""
    t = str(text or '').strip().casefold()
    if not t or t in ('sun*', 'sun', 'sun asterisk', 'sun＊'):
        return 'sun'
    if t in ('貴社', 'client', 'customer', 'お客様', 'khách hàng'):
        return 'client'
    if t.startswith(('次フェーズ', 'p2', '第2フェーズ', 'next', 'phase 2', 'phase2')):
        return 'next'
    return 'other'


def gantt_rows(entry: dict) -> tuple:
    """Validate and normalize (rows, milestones, months) of a gantt entry."""
    rows = []
    for raw in entry.get('rows') or []:
        if not raw.get('task') or not raw.get('start'):
            raise ValueError(f'gantt: row needs task/start/end: {raw!r}')
        owner = raw.get('owner') or 'sun'
        owner = owner if owner in OWNER_LABELS else owner_key(owner)
        start, end = _month_key(raw['start']), _month_key(raw.get('end') or raw['start'])
        if end < start:
            raise ValueError(f'gantt: row {raw["task"]!r} ends ({raw.get("end")}) before it '
                             f'starts ({raw["start"]}) — swap 開始/終了')
        rows.append({'task': str(raw['task']), 'owner': owner, 'start': start, 'end': end})
    milestones = [{'label': str(m.get('label') or '▲'), 'at': _month_key(m['at'])}
                  for m in entry.get('milestones') or []]
    if not rows:
        raise ValueError('gantt: no rows')
    if len(rows) > GANTT_MAX_ROWS:
        raise ValueError(f'gantt: {len(rows)} rows > cap {GANTT_MAX_ROWS}')
    if entry.get('months'):
        months = [f'{y}/{m:02d}' for y, m in map(_month_key, entry['months'])]
    else:
        keys = [r['start'] for r in rows] + [r['end'] for r in rows] + [m['at'] for m in milestones]
        months = _month_span(min(keys), max(keys))
    if len(months) > GANTT_MAX_MONTHS:
        raise ValueError(f'gantt: {len(months)} months > cap {GANTT_MAX_MONTHS}')
    return rows, milestones, months


def draw_gantt(slide, box: tuple, entry: dict) -> None:
    """Draw the Gantt inside *box* = (left, top, width, height) template inches."""
    rows, milestones, months = gantt_rows(entry)
    idx = {m: i for i, m in enumerate(months)}
    l, t, w, h = box
    label_w = min(2.2, w * 0.24)
    grid_l, mw = l + label_w, (w - label_w) / len(months)
    header_h, legend_h = 0.26, 0.3 if entry.get('legend') else 0.0
    n = len(rows) + (1 if milestones else 0)
    rh = min(0.36, (h - header_h - legend_h) / n)
    body_t = t + header_h

    for r in range(1, n, 2):  # zebra first, everything else on top
        _rect(slide, l, body_t + r * rh, w, rh, fill=LIGHT_GREY)
    for i, m in enumerate(months):
        _text(slide, grid_l + i * mw, t, mw, header_h, m[2:], 7, TEXT_GREY,
              align=PP_ALIGN.CENTER, anchor=MSO_ANCHOR.MIDDLE)
    _rect(slide, l, body_t - 0.01, w, 0.012, fill=BORDER_GREY)
    for i in range(len(months) + 1):
        _rect(slide, grid_l + i * mw, body_t, 0.008, n * rh, fill=BORDER_GREY)

    def _col(key: tuple) -> int:
        label = f'{key[0]}/{key[1]:02d}'
        if label not in idx:
            raise ValueError(f'gantt: {label} outside the month axis {months[0]}–{months[-1]}')
        return idx[label]

    for r, row in enumerate(rows):
        y = body_t + r * rh
        _text(slide, l + 0.05, y, label_w - 0.1, rh, row['task'], 7.5, TEXT_DARK,
              anchor=MSO_ANCHOR.MIDDLE)
        s, e = _col(row['start']), _col(row['end'])
        bh = rh * 0.58
        bar = (grid_l + s * mw + 0.03, y + (rh - bh) / 2, (e - s + 1) * mw - 0.06, bh)
        if row['owner'] == 'next':
            _rect(slide, *bar, fill=WHITE, line=SUN_RED, dash=True,
                  shape=MSO_SHAPE.ROUNDED_RECTANGLE)
        else:
            _rect(slide, *bar, fill=OWNER_COLORS[row['owner']],
                  shape=MSO_SHAPE.ROUNDED_RECTANGLE)
    if milestones:
        y = body_t + len(rows) * rh
        _text(slide, l + 0.05, y, label_w - 0.1, rh,
              entry.get('milestone_label') or 'マイルストーン', 7.5, TEXT_DARK,
              anchor=MSO_ANCHOR.MIDDLE)
        for ms in milestones:
            cx, tri = grid_l + _col(ms['at']) * mw + mw / 2, 0.13
            _rect(slide, cx - tri / 2, y + 0.03, tri, tri, fill=SUN_RED,
                  shape=MSO_SHAPE.ISOSCELES_TRIANGLE)
            _text(slide, cx - mw, y + tri + 0.03, mw * 2, rh - tri - 0.03,
                  ms['label'], 6.5, SUN_RED, bold=True, align=PP_ALIGN.CENTER)
    if legend_h:
        x = l + w
        for key in ('next', 'sun', 'client', 'other'):
            x -= 0.7
            if key == 'next':
                _rect(slide, x, t + h - 0.2, 0.62, 0.17, fill=WHITE, line=SUN_RED, dash=True)
                _text(slide, x, t + h - 0.2, 0.62, 0.17, OWNER_LABELS[key], 6.5, SUN_RED,
                      align=PP_ALIGN.CENTER, anchor=MSO_ANCHOR.MIDDLE)
            else:
                _rect(slide, x, t + h - 0.2, 0.62, 0.17, fill=OWNER_COLORS[key])
                _text(slide, x, t + h - 0.2, 0.62, 0.17, OWNER_LABELS[key], 6.5, WHITE,
                      align=PP_ALIGN.CENTER, anchor=MSO_ANCHOR.MIDDLE)




def _gantt_layout(cv, entry: dict) -> None:
    draw_gantt(cv.slide, content_band(cv), entry)


def register(table: dict) -> None:
    table['gantt'] = _gantt_layout
