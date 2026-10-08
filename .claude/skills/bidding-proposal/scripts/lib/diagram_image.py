"""Draw a fenced ASCII diagram as a picture, instead of pouring it into a text box.

A proposal's architecture and pipeline chapters carry their diagrams as fenced
blocks of box-drawing characters. Everything that makes such a block READ is
geometry: one column per character, one line per row, nothing reflowed. The
appendix path had none of that — it collapsed the block with `' '.join(split())`
and set the result in a proportional font with word wrap, so a logical
architecture diagram arrived as four lines of `│ │ ▼ ──▶` with the boxes gone.

So the block is rendered here, as an image, with a monospace face and the
author's own line breaks and spacing intact, and the picture is what goes on the
slide. Nothing is reflowed because nothing can be: the drawing IS the layout.

Pillow only — it is already a dependency of this skill (see `ensure_deps`), and
no diagram language (Mermaid, Graphviz) is introduced. That is deliberate as
well as convenient: the author drew this diagram, and redrawing it from a parsed
model would be inventing a picture they did not make.
"""
from __future__ import annotations

import io
import os
import re

# Monospace faces, best first. These are paths, not a guarantee: Pillow's wheel
# carries no TTF of its own, so a host with none of them installed (a slim
# container, an Alpine image) has no monospace face at all. `find_mono_font`
# says so out loud rather than letting the diagram degrade in silence.
_FONT_CANDIDATES = (
    '/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf',
    '/usr/share/fonts/truetype/noto/NotoSansMono-Regular.ttf',
    '/usr/share/fonts/truetype/liberation2/LiberationMono-Regular.ttf',
    '/usr/share/fonts/truetype/liberation/LiberationMono-Regular.ttf',
    '/System/Library/Fonts/Menlo.ttc',
    'C:/Windows/Fonts/consola.ttf',
)

# Rendered at 4x the slide's own pixel density so the picture stays crisp when
# the deck is opened at full screen or printed.
SUPERSAMPLE = 4

INK = (0x3F, 0x3F, 0x3F)          # the template's body grey
PAPER = (0xFF, 0xFF, 0xFF)        # the card the diagram sits on
_PAD_PX = 14                      # inside the picture, at 1x
MAX_PT = 12.0                     # largest the diagram's type may be set at


# Proportional faces for the REDRAWN diagram. Once the boxes are real boxes,
# nothing is holding the columns any more, and a monospace label inside a drawn
# rectangle just looks like a terminal that grew a border.
# DejaVu leads because it carries the arrows (`→`, `►`) a diagram's own text
# uses. Noto Sans is the better-looking face but drops them to tofu, and a
# pipeline reading `GitHub □ CodePipeline` is worse than a plainer typeface.
_TEXT_FONT_CANDIDATES = (
    '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',
    '/usr/share/fonts/truetype/noto/NotoSans-Regular.ttf',
    '/usr/share/fonts/truetype/liberation2/LiberationSans-Regular.ttf',
    '/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf',
)


def find_text_font() -> str:
    """Path of a proportional face, falling back to the monospace one."""
    for path in _TEXT_FONT_CANDIDATES:
        if os.path.exists(path):
            return path
    return find_mono_font()


def find_mono_font() -> str:
    """Path of a monospace face, or '' when the host has none of them.

    Warns once when there is none. Without the warning the only sign is the
    output: every diagram in the deck collapses to a line of text, which is
    exactly the failure this module was written to remove — and a silent
    regression to it is worse than a loud one.
    """
    for path in _FONT_CANDIDATES:
        if os.path.exists(path):
            return path
    global _FONT_WARNED
    if not _FONT_WARNED:
        _FONT_WARNED = True
        print('[diagram] WARNING: no monospace font on this host — fenced '
              'diagrams cannot be drawn and fall back to plain text. Install '
              'one (e.g. `fonts-dejavu-core`) to restore them.')
    return ''


_FONT_WARNED = False


def looks_like_diagram(text: str) -> bool:
    """True when *text* is drawn rather than written.

    More than one line, and enough drawing characters to be a picture. The
    threshold alone is not enough, because `+` and `|` are drawing characters
    in an ASCII box and ordinary punctuation everywhere else: `cat log | grep
    ERROR | sort | uniq` carries four of them and is a shell command, and a
    chapter misread that way loses its table to a picture of its own code.

    So ASCII art has to prove it is art. A `+---` corner run is the one mark an
    ASCII box cannot be drawn without and a line of code has no reason to
    carry, and it is what separates the two. Unicode box drawing needs no such
    proof — `┌ │ ▼` mean one thing only.
    """
    lines = [line for line in (text or '').splitlines() if line.strip()]
    if len(lines) < 2:
        return False
    body = '\n'.join(lines)
    drawing = sum(ch in _DRAWING for ch in body)
    if drawing < 4:
        return False
    unicode_drawing = sum(ch in _DRAWING and ch not in _ASCII_DRAWING for ch in body)
    return unicode_drawing >= 4 or _ASCII_BOX.search(body) is not None


# The two characters an ASCII box borrows from ordinary punctuation. Counted
# apart from the rest so `looks_like_diagram` can hold them to a higher bar.
_ASCII_DRAWING = frozenset('+|')

# A `+---` / `+===` corner run: the join an ASCII box is drawn with, and the
# thing a line of code never writes.
_ASCII_BOX = re.compile(r'\+[-=]{2,}')

# Box drawing, block elements, and the arrows a hand-drawn pipeline uses.
_DRAWING = frozenset(
    '─━│┃┄┅┆┇┈┉┊┋┌┍┎┏┐┑┒┓└┕┖┗┘┙┚┛├┤┬┴┼╭╮╯╰═║╔╗╚╝╠╣╦╩╬'
    '▀▄█▌▐░▒▓■□▲▼◀▶←↑→↓↔↕⇄⇅⟶⟵+|'
)


CONTAINER_FILL = (0xF7, 0xF7, 0xF7)
CONTAINER_LINE = (0xBF, 0xBF, 0xBF)
LEAF_LINE = (0xFF, 0x22, 0x00)     # the deck's red, as the boxes wear it
EDGE_LINE = (0x66, 0x66, 0x66)


def render_boxes(text: str, box_w_in: float, box_h_in: float, dpi: int = 96):
    """Draw the block as the boxes it draws, or `(None, 0, 0)` if it is not box art.

    The layout is the AUTHOR's: every rectangle keeps the position and size it
    has in the character grid, scaled up. Re-laying the graph out would mean
    deciding where things belong, and the person who drew it already did that —
    what the grid cannot give is the rendering, which is what this replaces.
    Only the drawing changes: proper hairlines, proportional type that is
    readable at slide size, containers behind their contents, and arrowheads.
    """
    from PIL import Image, ImageDraw, ImageFont

    from lib.ascii_box_parser import edges as parse_edges, parse

    font_path = find_mono_font()
    tops = parse(text)
    if not font_path or not tops:
        return None, 0.0, 0.0

    lines = _trimmed(text)
    cols = max((len(line) for line in lines), default=0)
    rows = len(lines)
    if not cols or not rows:
        return None, 0.0, 0.0

    px_w = int(box_w_in * dpi * SUPERSAMPLE)
    px_h = int(box_h_in * dpi * SUPERSAMPLE)
    # Cell size from whichever axis runs out first, so the drawing keeps its
    # proportions inside the box it was given.
    cell = min(px_w / (cols + 2), px_h / (rows + 2))
    pad = int(cell)
    width = int(cols * cell) + 2 * pad
    height = int(rows * cell) + 2 * pad

    image = Image.new('RGB', (max(1, width), max(1, height)), PAPER)
    draw = ImageDraw.Draw(image)

    def place(box):
        return (pad + box.left * cell, pad + box.top * cell,
                pad + box.right * cell, pad + box.bottom * cell)

    text_path = find_text_font()
    title_font = ImageFont.truetype(text_path, max(6, int(cell * 1.5)))
    body_font = ImageFont.truetype(text_path, max(5, int(cell * 1.25)))

    def fitted(lines, width_px, height_px):
        """The largest of the body sizes whose block fits inside a box."""
        for scale in (1.25, 1.1, 0.95, 0.85, 0.75, 0.65):
            font = ImageFont.truetype(text_path, max(5, int(cell * scale)))
            step = cell * scale * 1.35
            widest = max(draw.textlength(line, font=font) for line in lines)
            if widest <= width_px and step * len(lines) <= height_px:
                return font, step
        font = ImageFont.truetype(text_path, max(5, int(cell * 0.65)))
        return font, cell * 0.65 * 1.35

    def draw_box(box, depth=0):
        x0, y0, x1, y1 = place(box)
        leaf = not box.children
        draw.rounded_rectangle(
            (x0, y0, x1, y1), radius=int(cell * 0.6),
            fill=PAPER if leaf else CONTAINER_FILL,
            outline=LEAF_LINE if leaf else CONTAINER_LINE,
            width=max(1, int(cell * (0.16 if leaf else 0.10))))
        text_lines = box.lines
        if not text_lines:
            return
        if leaf:
            inner_w, inner_h = (x1 - x0) - cell * 1.2, (y1 - y0) - cell * 0.6
            font, step = fitted(text_lines, inner_w, inner_h)
            _centred(draw, text_lines, x0, y0, x1, y1, font, INK, step)
        else:
            # A container names itself along its top edge and keeps whatever
            # else it says as a block under that, clear of its children.
            draw.text((x0 + cell, y0 + cell * 0.4), text_lines[0],
                      font=title_font, fill=INK)
            _below_children(draw, box, text_lines[1:], x0, x1, place, body_font, cell)
        for child in box.children:
            draw_box(child, depth + 1)

    for box in tops:
        draw_box(box)
    for source, target, direction, label in parse_edges(text, tops):
        _arrow(draw, place(source), place(target), direction, label, body_font, cell)

    stream = io.BytesIO()
    image.save(stream, format='PNG')
    stream.seek(0)
    return stream, width / (dpi * SUPERSAMPLE), height / (dpi * SUPERSAMPLE)


def _centred(draw, lines, x0, y0, x1, y1, font, fill, step):
    top = (y0 + y1) / 2 - step * len(lines) / 2
    for i, line in enumerate(lines):
        span = draw.textlength(line, font=font)
        draw.text(((x0 + x1) / 2 - span / 2, top + i * step), line,
                  font=font, fill=fill)


def _below_children(draw, box, lines, x0, x1, place, font, cell):
    """Put a container's loose text under the last thing inside it."""
    if not lines:
        return
    bottom = max((place(child)[3] for child in box.children), default=None)
    y = (bottom + cell) if bottom is not None else place(box)[1] + cell * 2.5
    for i, line in enumerate(lines):
        draw.text((x0 + cell, y + i * cell * 1.6), line, font=font, fill=INK)


def _arrow(draw, src, dst, direction, label, font, cell):
    """A straight connector between two boxes' facing edges, with its head."""
    sx0, sy0, sx1, sy1 = src
    dx0, dy0, dx1, dy1 = dst
    if direction in ('down', 'up'):
        x = (max(sx0, dx0) + min(sx1, dx1)) / 2
        y_from, y_to = (sy1, dy0) if direction == 'down' else (sy0, dy1)
        draw.line((x, y_from, x, y_to), fill=EDGE_LINE, width=max(1, int(cell * 0.12)))
        head = cell * 0.7
        tip = y_to if direction == 'down' else y_to
        sign = 1 if direction == 'down' else -1
        draw.polygon([(x, tip), (x - head / 2, tip - sign * head),
                      (x + head / 2, tip - sign * head)], fill=EDGE_LINE)
        if label:
            draw.text((x + head, (y_from + y_to) / 2 - cell), label,
                      font=font, fill=EDGE_LINE)
        return
    y = (max(sy0, dy0) + min(sy1, dy1)) / 2
    x_from, x_to = (sx1, dx0) if direction == 'right' else (sx0, dx1)
    draw.line((x_from, y, x_to, y), fill=EDGE_LINE, width=max(1, int(cell * 0.12)))
    head = cell * 0.7
    sign = 1 if direction == 'right' else -1
    draw.polygon([(x_to, y), (x_to - sign * head, y - head / 2),
                  (x_to - sign * head, y + head / 2)], fill=EDGE_LINE)
    if label:
        span = draw.textlength(label, font=font)
        draw.text(((x_from + x_to) / 2 - span / 2, y - cell * 1.8), label,
                  font=font, fill=EDGE_LINE)


def render(text: str, box_w_in: float, box_h_in: float, dpi: int = 96):
    """Render *text* to a PNG stream sized to fit a *box_w_in* × *box_h_in* box.

    Returns `(stream, width_in, height_in)` — the actual drawn size, which keeps
    the diagram's aspect ratio and is therefore usually smaller than the box in
    one direction. Returns `(None, 0, 0)` when no monospace face is available,
    and the caller then falls back to setting the block as text.
    """
    from PIL import Image, ImageDraw, ImageFont

    font_path = find_mono_font()
    lines = _trimmed(text)
    if not font_path or not lines:
        return None, 0.0, 0.0

    cols = max(len(line) for line in lines)
    rows = len(lines)

    # One probe at a known size gives the cell metrics; a monospace face scales
    # linearly from there, so the size that fits is arithmetic, not a search.
    probe = ImageFont.truetype(font_path, 100)
    cell_w = probe.getlength('M') / 100
    ascent, descent = probe.getmetrics()
    cell_h = (ascent + descent) / 100 * 1.18   # a little leading between rows

    px_w = box_w_in * dpi * SUPERSAMPLE
    px_h = box_h_in * dpi * SUPERSAMPLE
    pad = _PAD_PX * SUPERSAMPLE
    size = min((px_w - 2 * pad) / (cols * cell_w),
               (px_h - 2 * pad) / (rows * cell_h))
    # A wide, short diagram would otherwise be scaled up until its height ran
    # out, and arrive set two or three times larger than any other text in the
    # deck — a terminal dump rather than a figure. The cap is the template's
    # own body size plus a little, so a diagram reads AS body copy.
    size = min(size, MAX_PT / 72 * dpi * SUPERSAMPLE)
    size = max(4.0, size)

    font = ImageFont.truetype(font_path, int(size))
    step = size * cell_h
    width = int(cols * size * cell_w + 2 * pad)
    height = int(rows * step + 2 * pad)

    image = Image.new('RGB', (max(1, width), max(1, height)), PAPER)
    draw = ImageDraw.Draw(image)
    for i, line in enumerate(lines):
        draw.text((pad, pad + i * step), line, font=font, fill=INK)

    stream = io.BytesIO()
    image.save(stream, format='PNG')
    stream.seek(0)
    return stream, width / (dpi * SUPERSAMPLE), height / (dpi * SUPERSAMPLE)


def _trimmed(text: str) -> list:
    """The block's lines with the common left indent and blank edges removed.

    The indent is shared by every line, so removing it moves the drawing left
    without moving any part of it relative to any other — which is the one thing
    that must not change.
    """
    lines = (text or '').replace('\t', '    ').splitlines()
    while lines and not lines[0].strip():
        lines.pop(0)
    while lines and not lines[-1].strip():
        lines.pop()
    if not lines:
        return []
    indent = min((len(line) - len(line.lstrip(' '))
                  for line in lines if line.strip()), default=0)
    return [line[indent:].rstrip() for line in lines]
