"""Schedule chapter → native Gantt on template slide 43.

A `工程 | 担当 | 開始 | 終了` table in the schedule chapter becomes bars drawn
inside slide 43's Gantt frame (the shape the template reserves for a PNG), so
the deck needs no chart image and the template's own legend
(その他 / 貴社 / Sun* / 次フェーズ) stays truthful — the 担当 column decides
each bar's colour. Rows whose 担当 says マイルストーン, or whose 工程 starts with
▲ ★ ◆, become milestone markers instead of bars.
"""
from __future__ import annotations

import re

from lib.gantt_layout import draw_gantt, owner_key

_EMU_IN = 914400
# Header spellings that identify the four Gantt columns (case-folded).
_HEADERS = {
    'task': ('工程', 'タスク', '作業', '作業項目', '項目', 'task', 'item', 'phase', 'giai đoạn'),
    'owner': ('担当', '担当者', 'owner', 'by', 'phụ trách'),
    'start': ('開始', '開始月', 'start', 'from', 'bắt đầu'),
    'end': ('終了', '終了月', 'end', 'to', 'kết thúc'),
}
_MILESTONE_MARK = re.compile(r'^[▲★◆◇△☆]')
_MILESTONE_WORDS = ('マイルストーン', 'milestone', 'mốc')
_INSET = 0.08  # inches kept clear inside the frame's grey border


def _column(headers: list, wanted: tuple) -> str | None:
    for header in headers:
        if header.strip().casefold() in wanted:
            return header
    return None


def find_gantt_table(tables: list) -> tuple | None:
    """Return (gantt_rows, milestones, source_table) for the first table that
    carries 工程 + 開始 columns, or None when the chapter has no such table."""
    for table in tables:
        if not table:
            continue
        headers = list(table[0].keys())
        cols = {name: _column(headers, spellings) for name, spellings in _HEADERS.items()}
        if not (cols['task'] and cols['start']):
            continue
        rows, milestones = [], []
        for row in table:
            task = str(row.get(cols['task'], '')).strip()
            start = str(row.get(cols['start'], '')).strip()
            owner = str(row.get(cols['owner'], '')).strip() if cols['owner'] else ''
            end = str(row.get(cols['end'], '')).strip() if cols['end'] else ''
            if not task or not start:
                continue
            if _MILESTONE_MARK.match(task) or owner.casefold() in _MILESTONE_WORDS:
                milestones.append({'label': task, 'at': start})
            else:
                rows.append({'task': task, 'owner': owner_key(owner),
                             'start': start, 'end': end or start})
        if rows:
            return rows, milestones, table
    return None


def fill_gantt_placeholder(slide, placeholder, schedule) -> bool:
    """Draw `schedule.gantt_rows` inside *placeholder*'s box; True when drawn.

    The placeholder is slide 43's white frame with a grey border — it stays as
    the chart's background; only the picture it was reserved for is replaced.
    """
    if not getattr(schedule, 'gantt_rows', None):
        return False
    _clear_sample_text_over(slide, placeholder)
    box = (placeholder.left / _EMU_IN + _INSET, placeholder.top / _EMU_IN + _INSET,
           placeholder.width / _EMU_IN - 2 * _INSET, placeholder.height / _EMU_IN - 2 * _INSET)
    draw_gantt(slide, box, {'rows': schedule.gantt_rows,
                            'milestones': schedule.milestones, 'legend': False})
    print(f'  - Schedule: drew a native Gantt ({len(schedule.gantt_rows)} bars, '
          f'{len(schedule.milestones)} milestone(s)) inside the slide-43 frame')
    return True


def _clear_sample_text_over(slide, frame) -> None:
    """Delete the template's sample task boxes that sit inside the Gantt frame.

    Slide 43 ships nine text boxes (要件整理（貴社）, スプリント開発, …) laid over
    its frame as an example schedule. No role fills them, so they would print
    another client's plan under this one's bars.
    """
    # A hair of tolerance: one sample box sits 0.0016in above the frame's top
    # edge and would otherwise survive, invisible but still in the file.
    slack = int(0.05 * _EMU_IN)
    top, bottom = frame.top - slack, frame.top + frame.height + slack
    for shape in list(slide.shapes):
        if shape is frame or not shape.has_text_frame or shape.top is None:
            continue
        if top <= shape.top < bottom and shape.text_frame.text.strip():
            shape._element.getparent().remove(shape._element)
