"""Read a schedule TABLE into the chart it is really describing.

Three tables state a plan, and all three are hard to read as tables:

  * `Phase | Duration | Months | Focus` — six one-month phases, and a reader has
    to assemble the sequence in their head;
  * `Position | 2026/05 | 2026/06 | … | Total` — a staffing matrix, where the
    shape of the ramp-up is what matters and the digits hide it;
  * `Milestone | Target date | Exit criterion` — dates a reader has to sort.

The template draws all three (slides 42 and 46: a month axis, a phase band,
lanes of chips, dated markers). This module is the reading that lets the renderer
do the same, and `timeline_layouts` is the drawing.

Deliberately strict. Anything that is not one of the three comes back as None and
keeps its table: a two-column table that happens to mention a date must not be
redrawn as a timeline of nothing. Pure and stateless — text and numbers in, a
model out, no pptx.
"""
from __future__ import annotations

import re
from dataclasses import dataclass, field
from typing import List, NamedTuple, Optional, Sequence, Tuple


class Month(NamedTuple):
    """One month of the axis. Ordered, so a span is a slice."""
    year: int
    month: int

    def next(self) -> 'Month':
        return Month(self.year + 1, 1) if self.month == 12 else Month(self.year, self.month + 1)


# Past a year and a half the month columns are too narrow to label, and the axis
# groups into quarters instead — see `timeline_layouts._Axis`.
QUARTER_THRESHOLD = 18

# `2026/05`, `2026-5`, `2026.05`, `2026年5月`. A third number means a DATE, and a
# date is not a month: the milestone column must not read as a phase column.
_MONTH = re.compile(r'^(\d{4})\s*[/\-.年]\s*(\d{1,2})\s*月?$')
_DATE = re.compile(r'^(\d{4})\s*[/\-.年]\s*(\d{1,2})\s*[/\-.月]\s*(\d{1,2})\s*日?$')
_MARKUP = re.compile(r'[*_`]+')
_NUMBER = re.compile(r'^-?\d+(?:\.\d+)?$')
# Column headings that number the rows rather than naming them.
_ROW_NUMBER_HEADS = {'#', 'no', 'no.', 'num', '番号', 'stt'}


# The years a project plan can honestly fall in. A four-digit number outside
# this window is a typo or a `9999` "TBD" placeholder, and taking it literally
# is not harmless: the axis runs every month from the earliest to the latest, so
# one such cell asked for ~96,000 months and the timeline hung the whole build
# before it drew anything. Refusing the cell leaves the table drawn as a table,
# which shows every figure the author wrote.
_YEAR_RANGE = (1990, 2100)


def _in_range(year: int) -> bool:
    return _YEAR_RANGE[0] <= year <= _YEAR_RANGE[1]


def parse_month(text: str) -> Optional[Month]:
    """`2026/05` in any of its spellings, or None."""
    match = _MONTH.match(_clean(text))
    if not match:
        return None
    year, month = int(match.group(1)), int(match.group(2))
    if not _in_range(year):
        return None
    return Month(year, month) if 1 <= month <= 12 else None


def parse_date(text: str) -> Optional[Tuple[Month, int]]:
    """`2026/05/31` as (month, day), or None. A bare month is not a date."""
    match = _DATE.match(_clean(text))
    if not match:
        return None
    year, month, day = (int(match.group(i)) for i in (1, 2, 3))
    if not (_in_range(year) and 1 <= month <= 12 and 1 <= day <= 31):
        return None
    return Month(year, month), day


def _clean(text: str) -> str:
    return _MARKUP.sub('', str(text or '')).strip()


def _number(text: str) -> Optional[float]:
    cleaned = _clean(text).replace(',', '')
    return float(cleaned) if _NUMBER.match(cleaned) else None


@dataclass
class Bar:
    """One phase: a label, the months it spans, and what happens in it."""
    label: str
    start: Month
    end: Month
    detail: str = ''


@dataclass
class Marker:
    """One dated milestone."""
    label: str
    month: Month
    day: int
    detail: str = ''


@dataclass
class Chart:
    """What a schedule table turns out to be."""
    kind: str                                   # phases | resources | milestones
    months: List[Month]
    bars: List[Bar] = field(default_factory=list)
    markers: List[Marker] = field(default_factory=list)
    rows: List[Tuple[str, List[Optional[float]]]] = field(default_factory=list)
    totals: Optional[Tuple[str, List[Optional[float]]]] = None
    detail_label: str = ''
    title: str = ''


def build_chart(rows: Sequence[dict]) -> Optional[Chart]:
    """The chart *rows* describe, or None when they describe no chart at all.

    Tried in order of how much structure each shape demands: a matrix (month
    HEADERS), then milestones (a column of full dates), then phases (a column of
    months). The first that fits wins; nothing else is guessed at.
    """
    table = [dict(row) for row in rows if any(_clean(v) for v in row.values())]
    if len(table) < 2:
        # One row is a fact, not a timeline.
        return None
    # Every column ANY row carries, first-seen order. Rows arrive as
    # `dict(zip(headers, cells))`, so a row one cell short of the header row
    # simply lacks that key — and reading the column set off `table[0]` alone
    # let one short row (a missing trailing `|`, the commonest markdown slip)
    # delete a column from the WHOLE table: a schedule whose first row omitted
    # its Focus cell drew every bar's detail from the Duration column instead,
    # and the authored per-phase text never reached the deck.
    headers = list(dict.fromkeys(head for row in table for head in row))
    return (_resources(table, headers)
            or _milestones(table, headers)
            or _phases(table, headers))


# --- the three shapes -------------------------------------------------------

def _resources(table: List[dict], headers: List[str]) -> Optional[Chart]:
    """`Position | 2026/05 | 2026/06 | …` — effort per role per month."""
    month_cols = [(head, parse_month(head)) for head in headers]
    month_cols = [(head, month) for head, month in month_cols if month]
    if len(month_cols) < 3:
        # Two columns of months is a table with dates in it, not a matrix.
        return None
    month_heads = {head for head, _ in month_cols}
    label_col = _label_column(headers, month_heads)
    if not label_col:
        return None
    # A trailing `Total (MM)` column is not a month, so the axis has no room for
    # it — but it is the one number a reader looks for per role, so it rides on
    # the role's own name instead of being dropped.
    total_col = next((head for head in headers
                      if head not in month_heads and head != label_col
                      and _is_total(head)), None)
    months = [month for _, month in month_cols]
    axis = _span(months)
    lanes, totals = [], None
    for row in table:
        label = _clean(row.get(label_col, ''))
        if not label:
            continue
        own_total = _number(row.get(total_col, '')) if total_col else None
        if own_total is not None:
            label = f'{label} · {own_total:g}'
        # Indexed by the gap-filled axis, NOT by the month columns the table
        # happens to carry: `Chart.months` runs every month from first to last,
        # and the drawing code zips the two together. A matrix that skips a
        # month (a role with no effort that month, so the author omitted the
        # column) made the two lists disagree — 2026/07's effort was drawn
        # under June, and the last month's was dropped by `zip` altogether.
        by_month = {month: row.get(head, '') for head, month in month_cols}
        values = [_number(by_month.get(month, '')) for month in axis]
        if _is_total(_clean(row.get(label_col, ''))):
            # Drawn as a role it would carry every other role's effort a second
            # time, and dwarf them all.
            totals = totals or (label, values)
            continue
        lanes.append((label, values))
    if not lanes:
        return None
    return Chart(kind='resources', months=axis, rows=lanes, totals=totals)


def _milestones(table: List[dict], headers: List[str]) -> Optional[Chart]:
    """`Milestone | Target date | Exit criterion` — dated points on the axis."""
    date_col = _column_where(table, headers, lambda text: parse_date(text) is not None)
    if not date_col:
        return None
    label_col = _label_column(headers, {date_col})
    if not label_col:
        return None
    detail_col = _wordiest_column(table, headers, {date_col, label_col})
    markers = []
    for row in table:
        parsed = parse_date(row.get(date_col, ''))
        label = _clean(row.get(label_col, ''))
        if not parsed or not label:
            continue
        month, day = parsed
        markers.append(Marker(label=label, month=month, day=day,
                              detail=_clean(row.get(detail_col, '')) if detail_col else ''))
    if len(markers) < 2:
        return None
    return Chart(kind='milestones', months=_span([m.month for m in markers]),
                 markers=markers, detail_label=detail_col or '')


def _phases(table: List[dict], headers: List[str]) -> Optional[Chart]:
    """`Phase | Duration | Months | Focus` — a band of consecutive spans."""
    month_col = _column_where(table, headers, lambda text: _month_span(text) is not None)
    if not month_col:
        return None
    label_col = _label_column(headers, {month_col})
    if not label_col:
        return None
    detail_col = _wordiest_column(table, headers, {month_col, label_col})
    bars = []
    for row in table:
        span = _month_span(row.get(month_col, ''))
        label = _clean(row.get(label_col, ''))
        if not span or not label:
            continue
        bars.append(Bar(label=label, start=span[0], end=span[1],
                        detail=_clean(row.get(detail_col, '')) if detail_col else ''))
    if len(bars) < 2:
        return None
    return Chart(kind='phases', months=_span([m for bar in bars for m in (bar.start, bar.end)]),
                 bars=bars, detail_label=detail_col or '')


# --- reading columns --------------------------------------------------------

def _month_span(text: str) -> Optional[Tuple[Month, Month]]:
    """`2026/05` or `2026/05 – 2026/07` as (first, last), or None.

    A plain ASCII hyphen counts as the range dash when it stands BETWEEN two
    months with whitespace around it. It cannot be accepted bare: `2026-05`
    spells one month with the same character, and splitting there would turn
    every ISO-style cell into two unparseable halves. Requiring the space is
    what separates the two, and without it the commonest way anyone writes a
    range — `2026/06 - 2026/08` — parsed as nothing and the whole table fell
    back to a plain grid.
    """
    parts = [part for part in
             re.split(r'\s+[-–—~〜]\s+|\s*[–—~〜]\s*|\s+to\s+', _clean(text)) if part]
    months = [parse_month(part) for part in parts]
    if not months or any(month is None for month in months):
        return None
    return months[0], months[-1]


def _column_where(table: List[dict], headers: List[str], predicate) -> Optional[str]:
    """The first column EVERY row satisfies — all the cells, not most of them.

    One hit is a coincidence: a free-text column mentioning a single date is a
    note, and reading it as the schedule's spine invents a timeline.
    """
    for head in headers:
        values = [row.get(head, '') for row in table]
        if all(_clean(value) for value in values) and all(predicate(value) for value in values):
            return head
    return None


def _label_column(headers: List[str], taken: set) -> Optional[str]:
    """The column that NAMES each row — not the one that numbers them."""
    for head in headers:
        if head in taken or _clean(head).casefold() in _ROW_NUMBER_HEADS:
            continue
        return head
    return None


def _wordiest_column(table: List[dict], headers: List[str], taken: set) -> Optional[str]:
    """The remaining column with the most to say, by average cell length.

    `Duration` holds `1 month` and says almost nothing; `Focus` holds the
    sentence a chip is worth drawing for.
    """
    candidates = []
    for head in headers:
        if head in taken:
            continue
        lengths = [len(_clean(row.get(head, ''))) for row in table]
        if any(lengths):
            candidates.append((sum(lengths) / len(lengths), head))
    return max(candidates)[1] if candidates else None


def _is_total(label: str) -> bool:
    lowered = label.casefold()
    return any(word in lowered for word in ('total', '合計', 'tổng'))


def _span(months: Sequence[Month]) -> List[Month]:
    """Every month from the earliest to the latest, inclusive.

    Filled in, not merely collected: a timeline with a hole where nothing happens
    is not a timeline, and the gap is exactly what a reader needs to see.
    """
    if not months:
        return []
    current, last = min(months), max(months)
    axis = [current]
    while current < last:
        current = current.next()
        axis.append(current)
    return axis
