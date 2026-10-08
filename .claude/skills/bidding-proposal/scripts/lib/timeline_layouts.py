"""Draw a schedule chart in the template's own visual language.

`timeline_data` reads a schedule table into a model; this draws it — a month
axis, a red phase band, lanes of arrow chips, dated markers — using the shapes,
colours and proportions template slides 42 (Milestone and KPIs) and 46 (System
development schedule) are drawn with. Nothing here invents a style: the red, the
pale chip fill, the dotted month rules and the sand-coloured second lane are read
off those two slides.

Everything is drawn inside a box the caller owns, so the same code serves a
template slide's placeholder and an appendix slide's canvas.
"""
from __future__ import annotations

from typing import List, Sequence

from pptx.enum.text import PP_ALIGN

from lib.timeline_data import QUARTER_THRESHOLD, Chart, Month
from lib.timeline_shapes import (
    CHIP_FILL, EMU_IN, INK, LANE_ALT_FILL, LANE_ALT_TEXT, RED, WHITE,
    chip, dot, hline, panel, text, vline,
)

_LANE_LABEL_IN = 1.05      # width of the lane-name column
_HEADER_H_IN = 0.22        # the month-label strip
_BAND_H_IN = 0.26          # the red phase band
_GAP_IN = 0.06
_DETAIL_LANE_IN = 1.15     # the lane under the band, holding what each phase does
_ROLE_LANE_IN = 0.42       # one role's lane in a resource matrix
_AXIS_GAP_IN = 0.10        # between the lowest marker label and the axis line
_PANEL_MAX_IN = 1.60       # the grey panel of milestone criteria
_PANEL_COLS = 2
# Rows of marker labels above the axis. Two was not enough: milestones a
# fortnight apart, each already pushed clear of its neighbour, ran out of room
# at the right-hand edge and printed over one another.
_LABEL_ROWS = 3


class _Axis:
    """Month columns between *left* and *right* (inches), or quarters if many.

    Past `QUARTER_THRESHOLD` months a column is too narrow to carry a label, so
    the axis groups into quarters — the same thing a human does when the plan
    outgrows a page.
    """

    def __init__(self, months: Sequence[Month], left: float, right: float):
        self.months = list(months)
        self.left, self.right = left, right
        self.by_quarter = len(self.months) > QUARTER_THRESHOLD
        self.slots: List[str] = (self._quarter_slots() if self.by_quarter
                                 else self._month_slots())
        self.slot_w = (right - left) / max(1, len(self.slots))

    def _month_slots(self) -> List[str]:
        labels = []
        for i, month in enumerate(self.months):
            new_year = i == 0 or month.month == 1
            labels.append(f'{month.year}/{month.month:02d}' if new_year
                          else f'{month.month:02d}')
        return labels

    def _quarter_slots(self) -> List[str]:
        """The quarters the axis spans, in order, each named once.

        Deduped through a dict rather than by scanning a list: `in` over a
        growing list is quadratic in the number of months, and the month count
        comes from the document's own dates.
        """
        return list(dict.fromkeys(
            f'{month.year} Q{(month.month - 1) // 3 + 1}' for month in self.months))

    def _slot_of(self, month: Month) -> int:
        if not self.by_quarter:
            return self.months.index(month) if month in self.months else 0
        label = f'{month.year} Q{(month.month - 1) // 3 + 1}'
        return self.slots.index(label) if label in self.slots else 0

    def x(self, month: Month) -> float:
        """Left edge of *month*'s column, in inches."""
        return self.left + self._slot_of(month) * self.slot_w

    def span(self, start: Month, end: Month) -> tuple:
        """(x, width) covering *start* through *end* inclusive, in inches."""
        first, last = self.x(start), self.x(end) + self.slot_w
        return first, max(self.slot_w * 0.4, last - first)

    def point(self, month: Month, day: int) -> float:
        """Where inside its column a dated day falls, in inches."""
        return self.x(month) + self.slot_w * min(max(day, 1), 31) / 31


def draw_chart_in_box(slide, left, top, width, height, chart: Chart,
                      font_pt: float = 8.0) -> None:
    """Draw *chart* inside the EMU box (*left*, *top*, *width*, *height*).

    The chart takes the height it needs and sits in the middle of what it is
    given: a six-month plan stretched over four inches reads as a diagram of
    nothing in particular, and the template never draws one that way.
    """
    if chart is None or not chart.months:
        return
    box = _Box(left / EMU_IN, top / EMU_IN, width / EMU_IN, height / EMU_IN)
    axis = _Axis(chart.months, box.x + _LANE_LABEL_IN, box.x + box.w)
    draw = {'phases': _draw_phases, 'resources': _draw_resources}.get(
        chart.kind, _draw_milestones)
    wanted = draw(None, box, axis, chart, font_pt, measure=True)
    if wanted < box.h:
        box = _Box(box.x, box.y + (box.h - wanted) / 2, box.w, wanted)
        axis = _Axis(chart.months, box.x + _LANE_LABEL_IN, box.x + box.w)
    _month_header(slide, box, axis, font_pt)
    draw(slide, box, axis, chart, font_pt)


class _Box:
    def __init__(self, x: float, y: float, w: float, h: float):
        self.x, self.y, self.w, self.h = x, y, w, h


# --- the three charts -------------------------------------------------------
#
# Each takes `measure=True` to report the height it wants without drawing, so
# `draw_chart_in_box` can centre it. One function, one answer — a separate
# measuring pass would drift from the drawing it predicts.

def _draw_phases(slide, box: _Box, axis: _Axis, chart: Chart, font_pt: float,
                 measure: bool = False) -> float:
    """A red band of phase arrows, and under it what each phase is for."""
    details = [bar for bar in chart.bars if bar.detail]
    lane_h = min(_DETAIL_LANE_IN, max(0.5, box.h - _HEADER_H_IN - _BAND_H_IN - _GAP_IN))
    if measure:
        return _HEADER_H_IN + _BAND_H_IN + (_GAP_IN + lane_h if details else 0)
    band_y = box.y + _HEADER_H_IN
    _lane_label(slide, box, band_y, _BAND_H_IN, 'Phase', font_pt, band=True)
    for bar in chart.bars:
        x, w = axis.span(bar.start, bar.end)
        chip(slide, x, band_y, w, _BAND_H_IN, bar.label, font_pt - 1,
              fill=RED, ink=WHITE, arrow=True)
    if not details:
        return 0.0
    lane_y = band_y + _BAND_H_IN + _GAP_IN
    _lane_label(slide, box, lane_y, lane_h, chart.detail_label or 'Focus', font_pt - 1)
    _rules(slide, box, axis, lane_y, lane_h)
    for bar in details:
        x, w = axis.span(bar.start, bar.end)
        chip(slide, x + 0.02, lane_y, w - 0.04, lane_h, bar.detail,
              font_pt - 2, fill=CHIP_FILL, ink=RED)
    return 0.0


def _draw_resources(slide, box: _Box, axis: _Axis, chart: Chart, font_pt: float,
                    measure: bool = False) -> float:
    """One lane per role, one chip per month, the effort written in it.

    A row with no numbers in it is not a role — the source's own `Phase` row is
    one — and it is left out rather than drawn as a lane of empty cells.
    """
    lanes = [(label, values) for label, values in chart.rows if any(values)]
    lane_h = min(_ROLE_LANE_IN, max(0.22, (box.h - _HEADER_H_IN - _BAND_H_IN - _GAP_IN)
                                    / max(1, len(lanes))))
    if measure:
        return (_HEADER_H_IN + lane_h * len(lanes)
                + (_GAP_IN + _BAND_H_IN if chart.totals else 0))
    lanes_top = box.y + _HEADER_H_IN
    for i, (label, values) in enumerate(lanes):
        lane_y = lanes_top + i * lane_h
        _lane_label(slide, box, lane_y, lane_h - 0.03, label, font_pt - 2)
        _rules(slide, box, axis, lane_y, lane_h - 0.03)
        for month, value in zip(axis.months, values):
            if not value:
                continue
            chip(slide, axis.x(month) + 0.02, lane_y + 0.02, axis.slot_w - 0.04,
                  lane_h - 0.07, f'{value:g}', font_pt - 1, fill=CHIP_FILL, ink=RED)
    if not chart.totals:
        return 0.0
    label, values = chart.totals
    band_y = lanes_top + len(lanes) * lane_h + _GAP_IN
    _lane_label(slide, box, band_y, _BAND_H_IN, label, font_pt - 2, band=True)
    for month, value in zip(axis.months, values):
        if value is None:
            continue
        chip(slide, axis.x(month) + 0.02, band_y, axis.slot_w - 0.04, _BAND_H_IN,
              f'{value:g}', font_pt - 1, fill=RED, ink=WHITE)
    return 0.0


def _draw_milestones(slide, box: _Box, axis: _Axis, chart: Chart, font_pt: float,
                     measure: bool = False) -> float:
    """Dated markers on a timeline, and their criteria listed under it.

    The criteria are a LIST, not chips pinned to their dates. Eight milestones
    over six months put three in one column, and chips drawn where their dates
    fall printed on top of one another; the template's own grey panel says the
    same thing in the space it actually has.
    """
    label_h = 0.20
    rows = -(-len(chart.markers) // _PANEL_COLS)
    panel_h = min(_PANEL_MAX_IN, 0.24 + rows * 0.19)
    if measure:
        return _HEADER_H_IN + label_h * _LABEL_ROWS + _AXIS_GAP_IN * 3 + panel_h
    axis_y = box.y + _HEADER_H_IN + label_h * _LABEL_ROWS + _AXIS_GAP_IN
    hline(slide, axis.left, axis_y, axis.right - axis.left)
    # Where each label row is already spoken for. Two milestones a fortnight
    # apart want the same inch of slide; alternating rows by index is not enough
    # (`09/30` and `10/30` both landed on row one and printed over each other),
    # so a label takes the first row whose last neighbour has ended.
    filled = [box.x] * _LABEL_ROWS
    label_w = max(0.7, axis.slot_w)
    for marker in chart.markers:
        x = axis.point(marker.month, marker.day)
        # Never past the right edge: pushed out of a collision, the last label
        # ran off the slide and `Handover 10/30` printed as `Handover 10/3`.
        wanted = min(max(x - label_w / 2, box.x), box.x + box.w - label_w)
        row = next((r for r in range(_LABEL_ROWS) if filled[r] <= wanted),
                   min(range(_LABEL_ROWS), key=lambda r: filled[r]))
        left = min(max(wanted, filled[row]), box.x + box.w - label_w)
        filled[row] = left + label_w
        label_y = box.y + _HEADER_H_IN + row * label_h
        text(slide, left, label_y, label_w, label_h,
              f'{marker.label}  {marker.month.month:02d}/{marker.day:02d}',
              font_pt - 2.5, color=RED, bold=True)
        vline(slide, x, label_y + label_h, axis_y - label_y - label_h)
        dot(slide, x, axis_y)
    _criteria_panel(slide, box, axis_y + _AXIS_GAP_IN * 2, panel_h, chart, font_pt)
    return 0.0


# --- chrome -----------------------------------------------------------------

def _month_header(slide, box: _Box, axis: _Axis, font_pt: float) -> None:
    """The row of month (or quarter) labels the whole chart is read against."""
    for i, label in enumerate(axis.slots):
        text(slide, axis.left + i * axis.slot_w, box.y, axis.slot_w, _HEADER_H_IN,
             label, font_pt - 1, color=INK, bold=True)


def _lane_label(slide, box: _Box, y: float, h: float, label: str, font_pt: float,
                band: bool = False, alt: bool = False) -> None:
    """The chip in the left-hand column that names a lane or the band."""
    fill = RED if band else (LANE_ALT_FILL if alt else CHIP_FILL)
    ink = WHITE if band else (LANE_ALT_TEXT if alt else RED)
    chip(slide, box.x, y, _LANE_LABEL_IN - _GAP_IN, h, label, font_pt,
         fill=fill, ink=ink)


def _rules(slide, box: _Box, axis: _Axis, y: float, h: float) -> None:
    """The dotted month separators the template rules its lanes with."""
    for i in range(len(axis.slots) + 1):
        vline(slide, axis.left + i * axis.slot_w, y, h, dotted=True)


def _criteria_panel(slide, box: _Box, y: float, h: float, chart: Chart,
                    font_pt: float) -> None:
    """The template's grey panel, holding one line per milestone in two columns."""
    panel(slide, box.x, y, box.w, h)
    column_w = (box.w - 0.3) / _PANEL_COLS
    per_column = -(-len(chart.markers) // _PANEL_COLS)
    for column in range(_PANEL_COLS):
        listed = chart.markers[column * per_column:(column + 1) * per_column]
        if not listed:
            continue
        lines = '\n'.join(f'■ {marker.label} — {marker.detail}' if marker.detail
                          else f'■ {marker.label}' for marker in listed)
        text(slide, box.x + 0.15 + column * column_w, y + 0.08, column_w - 0.1,
             h - 0.16, lines, font_pt - 2, color=INK, align=PP_ALIGN.LEFT)
