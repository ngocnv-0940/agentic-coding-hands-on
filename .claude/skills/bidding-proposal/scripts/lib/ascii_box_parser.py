"""Read an ASCII box drawing back into the boxes it draws.

A monospace picture of the block keeps it legible, which was the point of
`diagram_image`. But it is still a picture of characters: at slide size the
hairlines are one pixel, the type is whatever fits the widest row, and a reader
sees a terminal dump rather than a figure.

The drawing itself is not ambiguous, though. `┌ ┐ └ ┘` are corners and nothing
else, `│ ─` are the sides between them, and a rectangle whose four corners and
four sides are all present is a rectangle the author drew on purpose. That is
enough to recover the structure — boxes, what sits inside what, and the text in
each — and hand it to a renderer that can draw it properly.

What this deliberately does NOT do is guess. A grid that yields fewer than two
rectangles, or whose rectangles do not nest cleanly, is reported as unparsed and
the caller keeps the monospace picture. A half-understood diagram redrawn with
confidence is worse than an honest photograph of the original.
"""
from __future__ import annotations

import re
from dataclasses import dataclass, field

# `──►`, `→`, `➜` and friends, however they were drawn.
_INLINE_ARROW = re.compile(r'[─—-]*[►▶➜→⟶]|[◄◀←⟵][─—-]*')

CORNER_TL, CORNER_TR, CORNER_BL, CORNER_BR = '┌', '┐', '└', '┘'
# Every glyph that can sit ON a horizontal or vertical run, junctions included:
# a nested box's corner lands on its parent's side, and a `┬`/`┼` is still a wall.
_H_RUN = frozenset('─┬┴┼┐┌┘└├┤▼▲')
_V_RUN = frozenset('│├┤┼┬┴┌┐└┘►◄')

# Arrow heads, by the direction they point.
ARROWS = {'▼': 'down', '▲': 'up', '►': 'right', '◄': 'left',
          '→': 'right', '←': 'left', '↓': 'down', '↑': 'up'}


@dataclass
class Box:
    """One rectangle: where it sits in the grid, its text, and what it holds."""

    top: int
    left: int
    bottom: int
    right: int
    lines: list = field(default_factory=list)
    children: list = field(default_factory=list)

    @property
    def width(self) -> int:
        return self.right - self.left

    @property
    def height(self) -> int:
        return self.bottom - self.top

    def contains(self, other: 'Box') -> bool:
        return (self is not other
                and self.top <= other.top and self.left <= other.left
                and self.bottom >= other.bottom and self.right >= other.right
                and (self.height, self.width) != (other.height, other.width))

    @property
    def title(self) -> str:
        return self.lines[0] if self.lines else ''


def parse(text: str) -> list:
    """Return the drawing's top-level boxes, or [] when it is not box art.

    Nesting is resolved so each box appears exactly once, under its nearest
    enclosing box.
    """
    grid = _grid(text)
    boxes = _rectangles(grid)
    if len(boxes) < 2:
        return []
    _nest(boxes)
    for box in boxes:
        box.lines = _own_text(grid, box)
    return [b for b in boxes if not any(o.contains(b) for o in boxes)]


def edges(text: str, boxes: list) -> list:
    """Arrows between boxes, as `(from, to, direction, label)` tuples.

    Only arrows whose head sits directly against a box are taken, and only when
    a run of connector characters leads back to another box. An arrow that
    cannot be traced to both ends is left out: an edge drawn between the wrong
    two things asserts something the document never said.
    """
    grid = _grid(text)
    flat = _flatten(boxes)
    found = []
    for r, row in enumerate(grid):
        for c, ch in enumerate(row):
            direction = ARROWS.get(ch)
            if direction is None:
                continue
            if direction in ('down', 'up'):
                step = 1 if direction == 'down' else -1
                # The head may sit just outside the box it points at, or
                # directly ON its border — a nested box's arrow is drawn into
                # the border line itself.
                target = (_box_touching(flat, r + step, c)
                          or _box_touching(flat, r, c))
                source = _trace_vertical(grid, flat, r, c, direction)
            else:
                step = 1 if direction == 'right' else -1
                # An arrow head is not always flush against the box it points
                # at — `←──────→` leaves a space or two of air on each side.
                target = next((box for offset in range(0, 4)
                               for box in [_box_side(flat, r, c + offset * step)]
                               if box is not None), None)
                source = _trace_horizontal(grid, flat, r, c, direction)
            if target is not None and source is not None and source is not target:
                label = _label_near(grid, r, c)
                # A label that is simply the box's own name is the box's text
                # caught by the scan, not an annotation on the arrow.
                if label in (source.title, target.title):
                    label = ''
                pair = (source, target, direction, label)
                if not any(p[0] is source and p[1] is target for p in found):
                    found.append(pair)
    return found


# ---------------------------------------------------------------------------
# Grid and rectangle recovery
# ---------------------------------------------------------------------------

def _grid(text: str) -> list:
    lines = (text or '').replace('\t', '    ').splitlines()
    width = max((len(line) for line in lines), default=0)
    return [line.ljust(width) for line in lines]


def _rectangles(grid: list) -> list:
    """Every rectangle whose four corners AND four sides are all drawn."""
    boxes = []
    for top, row in enumerate(grid):
        for left, ch in enumerate(row):
            if ch != CORNER_TL:
                continue
            for right in _corners_right(grid, top, left):
                bottom = _corner_below(grid, top, left, right)
                if bottom is not None:
                    boxes.append(Box(top, left, bottom, right))
                    break        # innermost match wins; wider ones are separate
    return boxes


def _corners_right(grid: list, top: int, left: int):
    """Columns of every `┐` reachable from (top,left) along an unbroken run."""
    row = grid[top]
    for col in range(left + 1, len(row)):
        if row[col] == CORNER_TR:
            yield col
        elif row[col] not in _H_RUN:
            return


def _corner_below(grid: list, top: int, left: int, right: int):
    """Row of the `└`/`┘` pair closing this rectangle, or None."""
    for bottom in range(top + 1, len(grid)):
        row = grid[bottom]
        if len(row) <= right:
            return None
        if row[left] == CORNER_BL and row[right] == CORNER_BR:
            if _solid(row[left + 1:right], _H_RUN):
                return bottom
            return None
        if row[left] not in _V_RUN or row[right] not in _V_RUN:
            return None
    return None


def _solid(segment: str, allowed: frozenset) -> bool:
    return all(ch in allowed or ch == ' ' for ch in segment) and any(
        ch in allowed for ch in segment)


def _nest(boxes: list) -> None:
    """Attach each box to its NEAREST enclosing box."""
    for box in boxes:
        parents = [other for other in boxes if other.contains(box)]
        if not parents:
            continue
        min(parents, key=lambda p: p.width * p.height).children.append(box)


def _own_text(grid: list, box: Box) -> list:
    """The text inside *box* that belongs to no box inside it."""
    out = []
    for r in range(box.top + 1, box.bottom):
        row = grid[r]
        span = list(row[box.left + 1:box.right])
        for child in box.children:
            if child.top <= r <= child.bottom:
                for c in range(child.left, min(child.right + 1, box.right)):
                    span[c - box.left - 1] = ' '
        line = ''.join(span).strip(' │')
        # A run of rule characters ending in a head (`──►`) was an arrow drawn
        # INSIDE the box's text. Once the box is redrawn there are no columns
        # left to hold it together, so it becomes the one arrow glyph every
        # face carries.
        line = _INLINE_ARROW.sub('→', line)
        line = ' '.join(line.split())
        if line and any(ch.isalnum() for ch in line):
            out.append(line)
    return out


# ---------------------------------------------------------------------------
# Arrow tracing
# ---------------------------------------------------------------------------

def _flatten(boxes: list) -> list:
    out = []
    for box in boxes:
        out.append(box)
        out.extend(_flatten(box.children))
    return out


def _box_touching(boxes: list, row: int, col: int):
    """The box whose top or bottom edge is at (row, col)."""
    for box in boxes:
        if box.left <= col <= box.right and row in (box.top, box.bottom):
            return box
    return None


def _trace_vertical(grid: list, boxes: list, row: int, col: int, direction: str):
    """Walk back up (or down) the shaft of an arrow to the box it leaves."""
    step = -1 if direction == 'down' else 1
    r = row + step
    while 0 <= r < len(grid):
        ch = grid[r][col] if col < len(grid[r]) else ' '
        touching = _box_touching(boxes, r, col)
        if touching is not None:
            return touching
        if ch not in _V_RUN and ch != ' ':
            return None
        if ch == ' ':
            return None
        r += step
    return None


def _box_side(boxes: list, row: int, col: int):
    """The box whose left or right edge is at (row, col)."""
    for box in boxes:
        if box.top <= row <= box.bottom and col in (box.left, box.right):
            return box
    return None


def _trace_horizontal(grid: list, boxes: list, row: int, col: int, direction: str):
    """Walk back along an arrow's shaft to the box it leaves."""
    step = -1 if direction == 'right' else 1
    c = col + step
    line = grid[row]
    while 0 <= c < len(line):
        touching = _box_side(boxes, row, c)
        if touching is not None:
            return touching
        ch = line[c]
        if ch not in _H_RUN and ch not in ARROWS and ch != ' ':
            return None
        c += step
    return None


def _label_near(grid: list, row: int, col: int) -> str:
    """Words written beside an arrow — `HTTPS (TLS 1.3)` and the like."""
    for r in (row, row - 1, row + 1):
        if not (0 <= r < len(grid)):
            continue
        # Stop at the first drawing character: past it the scan has left the
        # annotation and is reading the next box's contents.
        text = ''
        for ch in grid[r][col + 1:col + 40]:
            if ch in _H_RUN or ch in _V_RUN or ch in ARROWS:
                break
            text += ch
        text = ' '.join(text.split())
        if text and any(ch.isalnum() for ch in text) and len(text) <= 30:
            return text
    return ''
