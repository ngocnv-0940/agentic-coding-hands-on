"""Designed list layouts for appendix slides, drawn in the template's own idiom.

The appendix path used to render EVERY plain list the same way: one text box of
`■ item` lines pinned under the header, at a fixed size, whatever the list was.
Four short items and fourteen long ones got the identical treatment, and both
left the bottom half of the slide empty — a page the reader recognizes on sight
as machine output sitting between hand-authored ones.

This module replaces that with three list forms, each lifted from a real slide
in the shipped template rather than invented:

  * `cards`  — one white round card per item, red label left of a hairline
               divider, detail right. Slide 38 (想定作成物) draws exactly this.
  * `grid`   — a two-column field of small cards, each with a red accent chip.
               The card and chip come off slide 35 (非機能要件).
  * `panel`  — one large card holding the list as native `●` bullets, the way
               slide 35's card bodies and slide 13's benefit blocks read.

Every measurement below was read off those slides — fill `#FFFFFF`, hairline
`#ECECEC`, red label `#FF2200`, body `#3F3F3F`, `roundRect` adj 18112 — so an
appendix list sits beside a hand-authored slide without announcing itself.

Which form a list gets is decided by `pick_variant` from the list's own shape,
not by rotation for its own sake: a design that suits four labelled points does
not suit fourteen bare ones, and picking by shape is what keeps consecutive
appendix slides from looking stamped out.

Two invariants carried over from the layout this replaces:

  * **Never truncates.** `bullets` is the one layout with no cap, and it stays
    that way — type steps down before any item comes off.
  * **Never invents.** Labels are split out of the item's own text; no slot is
    written for.

Coordinates are canvas inches on the generate-slide 13.333 x 7.5 authoring
canvas that `extra_slide_layouts._Canvas` scales from, so each measured template
inch appears here multiplied by 4/3 (both canvases are 16:9, so one factor
serves both axes).
"""
from __future__ import annotations

import math
import re

from pptx.dml.color import RGBColor
from pptx.enum.shapes import MSO_SHAPE
from pptx.enum.text import MSO_ANCHOR, PP_ALIGN
from pptx.oxml.ns import qn
from pptx.util import Emu, Pt

# --- palette, read off slides 35 and 38 ------------------------------------
CARD_FILL = RGBColor(0xFF, 0xFF, 0xFF)
CARD_LINE = RGBColor(0xEC, 0xEC, 0xEC)
DIVIDER = RGBColor(0xD9, 0xD9, 0xD9)
LABEL_RED = RGBColor(0xFF, 0x22, 0x00)
BODY_GREY = RGBColor(0x3F, 0x3F, 0x3F)

T2C = 4 / 3  # template inch -> authoring-canvas inch

# --- the band a content slide may use --------------------------------------
# Top is slide 38's first row (0.91"); bottom clears the footer, which starts at
# 5.25" on every content slide.
BAND_TOP = 0.91 * T2C
BAND_BOTTOM = 5.12 * T2C
BAND_LEFT = 0.49 * T2C
BAND_WIDTH = 9.05 * T2C

# Type sizes, as canvas points. The template sets a card label and its body at
# 10pt and a bulleted card body at 9pt; canvas points scale by 0.75 on the way
# in, so each is written here as the template size / 0.75.
PT_BODY = 10 / 0.75
PT_SMALL = 9 / 0.75
PT_TINY = 8 / 0.75
# Steps the type comes down in when a list is too tall for the band. Nothing is
# dropped until the smallest has been tried, and not even then.
PT_LADDER = (PT_BODY, PT_SMALL, PT_TINY)
# The panel is the form a SHORT list lands in, so it is the one that has to be
# able to grow as well as shrink: three lines set at 10pt inside a card sized to
# the page is a hollow box, and the fix is bigger type, not a smaller card.
# Capped at 12pt — past that an appendix slide stops matching the deck it is in.
PT_PANEL_LADDER = (12 / 0.75, 11 / 0.75, PT_BODY, PT_SMALL, PT_TINY)

_LATIN_EM = 0.55  # latin sets about half an em per character, CJK a full one
_LINE_RATIO = 1.45  # line height as a multiple of the type size
FONT = 'Noto Sans JP'

# `Label: detail`, the one split that survives markdown stripping. A bold
# lead-in is gone by the time a list item reaches here, and an em dash already
# means something else to `content_condenser`, so the colon is what is left.
#
# The two colons are matched on different terms because they are used on
# different terms. A latin `:` must be followed by a space, or `09:30 JST` and
# `https://…` would each donate a label; a full-width `：` needs no space, and
# demanding one meant a Japanese proposal — which writes `品質戦略：本文` — never
# got a label at all.
_COLON_LABEL = re.compile(r'^\s*([^:：]{2,56})(?::\s+|：\s*)(.{4,})$', re.DOTALL)
# `A. Something` / `1) Something` — an enumerated appendix line. The marker is
# the label a reader scans for, so it is kept out of the body text.
_ENUM_LABEL = re.compile(r'^\s*([A-Z]|\d{1,2})[.)]\s+(.+)$', re.DOTALL)


def split_label(item: str) -> tuple[str, str]:
    """Split one list item into (label, detail), or ('', item) when it has none.

    Only the item's own words are used. A label longer than the card's label
    column would wrap into the divider, so the pattern caps it rather than
    letting the design decide silently.
    """
    flat = ' '.join((item or '').split())
    enum = _ENUM_LABEL.match(flat)
    if enum:
        rest = enum.group(2)
        inner = _COLON_LABEL.match(rest)
        if inner:
            return f'{enum.group(1)}. {inner.group(1).strip()}', inner.group(2).strip()
        return enum.group(1) + '.', rest
    colon = _COLON_LABEL.match(flat)
    if colon:
        return colon.group(1).strip(), colon.group(2).strip()
    return '', flat


# A tag-like item: short enough that a full-width bullet would be a word or two
# of type trailing off across nine inches of empty card.
_GRID_ITEM_MAX = 60
# Below this many such items the panel still reads as a block rather than a
# thin ribbon, so the grid is not worth breaking the block for.
_GRID_MIN_ITEMS = 8


def pick_variant(items: list) -> str:
    """Choose the list form that suits *items*' own shape.

    A plain markdown list — `- point.` after `- point.`, no lead-in labels — is
    ONE thought expressed in several lines, and it belongs in one block. Cutting
    it into a card per item is what made appendix slides read as a stack of
    unrelated tiles; `panel` is therefore the default, and the other two forms
    are taken only where the list's own shape asks for them:

      * `cards` — most items carry a `Label: detail` lead-in, so there is a real
                  label column to draw and each item is its own labelled entry.
      * `grid`  — many tag-like items (>= 8, none past 60 characters), where a
                  single column would be two words of type per nine-inch line.
    """
    flat = [' '.join((i or '').split()) for i in items if (i or '').strip()]
    n = len(flat)
    if n == 0:
        return 'panel'
    labelled = sum(1 for item in flat if split_label(item)[0])
    longest = max(len(item) for item in flat)

    if 2 <= n <= 7 and labelled >= math.ceil(n * 0.6):
        return 'cards'
    if n >= _GRID_MIN_ITEMS and longest <= _GRID_ITEM_MAX:
        return 'grid'
    # A simple list, however short or long its items: one block, the way a
    # hand-authored slide sets a list inside a single card.
    return 'panel'


# ---------------------------------------------------------------------------
# Drawing helpers
# ---------------------------------------------------------------------------

def _card(cv, x, y, w, h):
    """A white round card with the template's hairline outline.

    The corner radius is pinned to an absolute 0.11" (slide 38's own radius)
    rather than left at the preset's proportion of the shorter side, so a tall
    card and a short one round the same amount instead of the tall one turning
    into a lozenge.
    """
    sp = cv.slide.shapes.add_shape(
        MSO_SHAPE.ROUNDED_RECTANGLE, cv._x(x), cv._y(y), cv._x(w), cv._y(h))
    adj = min(50000, int(100000 * (0.11 * T2C) / max(0.01, min(w, h))))
    for gd in sp._element.findall('.//' + qn('a:gd')):
        if gd.get('name') == 'adj':
            gd.set('fmla', f'val {adj}')
    sp.fill.solid()
    sp.fill.fore_color.rgb = CARD_FILL
    sp.line.color.rgb = CARD_LINE
    sp.line.width = Pt(0.75)
    _flatten(sp)
    return sp


def _flatten(shape):
    """Drop the theme drop-shadow a freshly added autoshape is born with.

    `add_shape` attaches a `<p:style>` whose `effectRef` resolves to the theme's
    shadowed effect style, and clearing `shadow.inherit` does not outrank it —
    the cards came out floating over the page while every card on slides 35 and
    38 sits flat on it. Removing the style reference is what actually matches.
    """
    shape.shadow.inherit = False
    for style in shape._element.findall(qn('p:style')):
        shape._element.remove(style)
    return shape


def _divider(cv, x, y, h):
    """Slide 38's vertical hairline between a row's label and its detail."""
    sp = cv.slide.shapes.add_shape(
        MSO_SHAPE.RECTANGLE, cv._x(x), cv._y(y), Emu(max(1, int(0.75 * 12700))), cv._y(h))
    sp.fill.solid()
    sp.fill.fore_color.rgb = DIVIDER
    sp.line.fill.background()
    return _flatten(sp)


def _chip(cv, x, y, size):
    """The small red accent square each grid card carries, after slide 35."""
    sp = cv.slide.shapes.add_shape(
        MSO_SHAPE.ROUNDED_RECTANGLE, cv._x(x), cv._y(y), cv._x(size), cv._y(size))
    for gd in sp._element.findall('.//' + qn('a:gd')):
        if gd.get('name') == 'adj':
            gd.set('fmla', 'val 30000')
    sp.fill.solid()
    sp.fill.fore_color.rgb = LABEL_RED
    sp.line.fill.background()
    return _flatten(sp)


def _bulleted(cv, x, y, w, h, items: list, size: float):
    """A text box whose paragraphs carry the template's own `●` bullet.

    The glyph is set as paragraph styling, not written into the text, so a
    wrapped item hangs under its first word the way every hand-authored card
    body on slide 35 does — which is the whole reason not to prefix a character.
    """
    tb = cv.slide.shapes.add_textbox(cv._x(x), cv._y(y), cv._x(w), cv._y(h))
    tf = tb.text_frame
    tf.word_wrap = True
    tf.vertical_anchor = MSO_ANCHOR.MIDDLE
    tf.margin_left = tf.margin_right = tf.margin_top = tf.margin_bottom = 0
    for i, item in enumerate(items):
        para = tf.paragraphs[0] if i == 0 else tf.add_paragraph()
        para.alignment = PP_ALIGN.LEFT
        para.space_after = Pt(max(2.0, size * cv.fs * 0.45))
        pPr = para._p.get_or_add_pPr()
        pPr.set('marL', '200160')
        pPr.set('indent', '-142920')
        for tag in ('a:buNone', 'a:buChar'):
            for old in pPr.findall(qn(tag)):
                pPr.remove(old)
        bu = pPr.makeelement(qn('a:buChar'), {'char': '●'})
        pPr.append(bu)
        run = para.add_run()
        run.text = item
        run.font.name = FONT
        run.font.size = Pt(max(7, size * cv.fs))
        run.font.color.rgb = BODY_GREY
    return tb


def _shrink_to_fit(tf, ratio: float) -> None:
    """Write the `normAutofit` shrink a text frame needs to stay inside its box.

    An explicit `fontScale` rather than a bare `<a:normAutofit/>`: PowerPoint
    recomputes the scale when it opens the file, but every other renderer —
    LibreOffice, Google Slides, a thumbnailer — reads what is written and only
    that. The floor keeps the type legible; a list that would need less than
    half size is beyond what shrinking can rescue, and shrinking further only
    turns unreadable-and-inside into unreadable-and-still-inside.
    """
    scale = max(0.5, min(1.0, ratio))
    bodyPr = tf._txBody.bodyPr
    for old in bodyPr.findall(qn('a:normAutofit')):
        bodyPr.remove(old)
    fit = bodyPr.makeelement(qn('a:normAutofit'), {
        'fontScale': str(int(scale * 100000)),
        'lnSpcReduction': str(int((1 - scale) * 20000)),
    })
    bodyPr.append(fit)


def _span(text: str, size_pt: float) -> float:
    """Inches *text* would occupy set on one unbroken line.

    CJK sets about one em per character, latin roughly half — the same estimate
    the table layout uses, so a card and a table pack their text alike.
    """
    em = size_pt / 72
    return sum(em if ord(ch) > 0x2E7F else em * _LATIN_EM for ch in str(text))


def _lines(text: str, width_in: float, size_pt: float) -> int:
    """How many wrapped lines *text* takes in a box *width_in* inches wide."""
    return max(1, math.ceil(_span(text, size_pt) / max(0.1, width_in)))


def _height(text: str, width_in: float, size_pt: float) -> float:
    return _lines(text, width_in, size_pt) * size_pt * _LINE_RATIO / 72


# ---------------------------------------------------------------------------
# The three list forms
# ---------------------------------------------------------------------------

# Slide 38's row: label column, divider, detail column — as canvas inches.
_ROW_PAD_Y = 0.13 * T2C
_ROW_GAP = 0.10 * T2C
_LABEL_X = 0.28 * T2C          # inset from the card's own left edge
_LABEL_W = 1.62 * T2C

# A markdown thematic break (`---`, `***`) between two blocks of a chapter is
# punctuation, not a point. The list parser hands it on as an item all the same,
# and it reached the deck as a bullet reading `---`.
_RULE_ONLY = re.compile(r'^\s*([-*_])\1{2,}\s*$')


def _draw_cards(cv, items: list) -> None:
    """One row card per item — slide 38's 想定作成物 design, lent to a list."""
    parts = [split_label(item) for item in items]
    # The label column is the slide's decision, not each row's. One labelled item
    # among four unlabelled ones printed a lone red label beside three chips —
    # one design per slide, so a minority of labels is dropped rather than shown.
    if sum(1 for label, _ in parts if label) < math.ceil(len(parts) * 0.6):
        parts = [('', ' '.join(item.split())) for item in items]

    band = BAND_BOTTOM - BAND_TOP
    gap = _ROW_GAP if len(items) <= 6 else _ROW_GAP * 0.6
    # Fewer rows means taller ones. Without this a three-item list drew three
    # thin strips adrift in the middle of the page — the emptiness this module
    # exists to remove, merely rearranged.
    min_h = max(0.34 * T2C, min(0.85 * T2C, band / (len(items) * 1.75)))
    # Slide 38's label column fits `ソースコード`; an English proposal writes
    # `AI-driven development impact analysis` in the same slot. Widening the
    # column to the longest label it actually carries — within bounds the detail
    # column can spare — keeps a label to two lines instead of four.
    label_w = min(3.10 * T2C, max(
        [_LABEL_W] + [_span(label, PT_BODY) / 2 for label, _ in parts]))
    divider_x = _LABEL_X + label_w + 0.20 * T2C
    detail_x = divider_x + 0.29 * T2C
    detail_w = BAND_WIDTH - detail_x - _LABEL_X

    for size in PT_LADDER:
        heights = [
            max(min_h, _height(detail or label, detail_w, size) + 2 * _ROW_PAD_Y)
            for label, detail in parts
        ]
        if sum(heights) + gap * (len(items) - 1) <= band:
            break
    else:
        # Not even the smallest type fits. Seven labelled paragraphs asked for
        # 8.7" of a 5.6" slide and got it — the rows simply carried on past the
        # footer and off the page, taking their text with them.
        #
        # A row card is a line of type in a box; a list that needs this much
        # room is prose, and `panel` is the form built for prose. Handing it
        # over keeps every item ON the slide, which is the invariant; squeezing
        # seven cards into the band instead would keep them all on the page as
        # seven unreadable strips.
        return _draw_panel(cv, items)

    # Spare height goes into the gaps, so three rows spread down the band the
    # way slide 38's six do instead of huddling under the title. Capped, or two
    # rows would end up at opposite ends of the page with nothing between them.
    slack = band - sum(heights)
    if len(items) > 1 and slack > 0:
        # Capped against the rows themselves as well as absolutely: a gap taller
        # than the card above it stops reading as spacing and starts reading as
        # a missing row.
        cap = min(_ROW_GAP * 8, max(heights) * 0.6)
        gap = max(gap, min(cap, slack / (len(items) - 1)))
    total = sum(heights) + gap * (len(items) - 1)
    y = BAND_TOP + max(0.0, (band - total) / 2)
    for (label, detail), height in zip(parts, heights):
        _card(cv, BAND_LEFT, y, BAND_WIDTH, height)
        if label:
            cv.text(BAND_LEFT + _LABEL_X, y, label_w, height, label, size,
                    LABEL_RED, bold=True, anchor=MSO_ANCHOR.MIDDLE)
            _divider(cv, BAND_LEFT + divider_x, y + _ROW_PAD_Y * 0.5,
                     height - _ROW_PAD_Y)
            cv.text(BAND_LEFT + detail_x, y, detail_w, height, detail, size,
                    BODY_GREY, anchor=MSO_ANCHOR.MIDDLE)
        else:
            # No label of its own: the row takes the accent chip the grid cards
            # wear and gives the text the whole width, rather than leaving the
            # label column blank beside a stranded divider.
            _chip(cv, BAND_LEFT + _GRID_PAD, y + (height - _CHIP) / 2, _CHIP)
            text_x = _GRID_PAD + _CHIP + 0.10 * T2C
            cv.text(BAND_LEFT + text_x, y, BAND_WIDTH - text_x - _GRID_PAD,
                    height, detail, size, BODY_GREY, anchor=MSO_ANCHOR.MIDDLE)
        y += height + gap


# Slide 35's card: a chip, then the text beside it.
_GRID_GAP_X = 0.32 * T2C
_GRID_GAP_Y = 0.18 * T2C
_GRID_PAD = 0.20 * T2C
_CHIP = 0.11 * T2C


def _draw_grid(cv, items: list) -> None:
    """A two-column field of small cards — slide 35's card, multiplied.

    Two columns is what turns a seven-item list from a column of text down the
    left of an empty page into a field that occupies the slide. It is chosen
    only for items short enough to sit in half a slide's width; longer ones go
    to `panel`, where they have the full measure.
    """
    band = BAND_BOTTOM - BAND_TOP
    # Three columns once two would need more rows than the band has room for.
    # Twelve items in two columns ran six rows off the bottom of the slide and
    # under the footer; the same twelve in three columns are four comfortable
    # rows. Only short items qualify — a third of the width is not enough
    # measure for a sentence.
    cols = 3 if len(items) >= 9 and max(len(i) for i in items) <= 110 else 2
    rows = math.ceil(len(items) / cols)
    col_w = (BAND_WIDTH - _GRID_GAP_X * (cols - 1)) / cols
    text_w = col_w - 2 * _GRID_PAD - _CHIP - 0.10 * T2C
    # A last row with one item short of a full one would leave a hole beside it,
    # so that item takes the leftover width instead.
    tail = len(items) % cols

    for size in PT_LADDER:
        # One height for every row. Sizing each row to its own tallest item made
        # a field of cards in five different heights, which reads as a mistake
        # rather than a grid; the design's regularity is the point of it.
        height = max(
            [0.40 * T2C]
            + [_height(item, text_w, size) + 2 * _GRID_PAD for item in items])
        if height * rows + _GRID_GAP_Y * (rows - 1) <= band:
            break
    else:
        # Even the smallest type overflows. Share the band out evenly rather
        # than running past the footer: every item still appears, which is the
        # invariant, and the type inside each card shrinks to suit.
        height = (band - _GRID_GAP_Y * (rows - 1)) / rows

    y = BAND_TOP
    for r in range(rows):
        row_items = items[r * cols:(r + 1) * cols]
        widen = (r == rows - 1 and tail == 1 and len(row_items) == 1)
        for c, item in enumerate(row_items):
            x = BAND_LEFT + c * (col_w + _GRID_GAP_X)
            width = BAND_WIDTH if widen else col_w
            _card(cv, x, y, width, height)
            _chip(cv, x + _GRID_PAD, y + (height - _CHIP) / 2, _CHIP)
            cv.text(x + _GRID_PAD + _CHIP + 0.10 * T2C, y,
                    width - 2 * _GRID_PAD - _CHIP - 0.10 * T2C,
                    height, item, size, BODY_GREY, anchor=MSO_ANCHOR.MIDDLE)
        y += height + _GRID_GAP_Y


_PANEL_PAD_X = 0.34 * T2C
_PANEL_PAD_Y = 0.26 * T2C


def _draw_panel(cv, items: list) -> None:
    """One card holding the whole list as `●` bullets — slide 35's card body.

    The form for prose: long items keep the full width, and the card is sized to
    them so the list sits in a block instead of trailing off into blank page.
    """
    text_w = BAND_WIDTH - 2 * _PANEL_PAD_X
    band = BAND_BOTTOM - BAND_TOP

    for size in PT_PANEL_LADDER:
        body = sum(_height(item, text_w, size) + size * cv.fs / 72 * 0.45
                   for item in items)
        if body + 2 * _PANEL_PAD_Y <= band:
            break

    height = min(band, body + 2 * _PANEL_PAD_Y)
    _card(cv, BAND_LEFT, BAND_TOP, BAND_WIDTH, height)
    box = _bulleted(cv, BAND_LEFT + _PANEL_PAD_X, BAND_TOP + _PANEL_PAD_Y, text_w,
                    height - 2 * _PANEL_PAD_Y, items, size)
    # The CARD is clamped to the band; the text inside it was not. Thirty long
    # items need 14" of type at the smallest step, and the paragraphs simply ran
    # out through the bottom of the card and off the slide while the card itself
    # measured correctly. Nothing is dropped — the invariant holds — the type is
    # given the shrink factor PowerPoint's own auto-fit would have written.
    inner = height - 2 * _PANEL_PAD_Y
    if body > inner > 0:
        _shrink_to_fit(box.text_frame, inner / body)


_VARIANTS = {'cards': _draw_cards, 'grid': _draw_grid, 'panel': _draw_panel}


def render_list(cv, items: list, variant: str = '') -> None:
    """Draw *items* in the named variant, or in the one their shape asks for."""
    items = [' '.join((i or '').split()) for i in items if (i or '').strip()]
    items = [i for i in items if not _RULE_ONLY.match(i)]
    if not items:
        return
    name = (variant or '').strip().lower() or pick_variant(items)
    _VARIANTS.get(name, _draw_panel)(cv, items)
