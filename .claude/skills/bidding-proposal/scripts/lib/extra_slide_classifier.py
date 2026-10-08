"""Heuristic classifier for markdown sections that don't match the known
ProjectProfile schema (`profile_parser._SECTION_MAP`).

Hand-written project_content_{id}.md files won't always use the ~13
canonical `## heading` names gen-md.py emits. Rather than silently dropping
unrecognized sections, `build_extra_slide_entry` shapes their content into
one of the generate-slide-style layouts in `extra_slide_layouts.py` so every
section lands somewhere in the deck.

Deliberately conservative: `comparison_2` and `numbered_points` are only
chosen when the content's natural shape already fits their hard render-time
caps (2 columns / 5 points — see `extra_slide_layouts.py`). Everything else
falls back to `bullets`, the one layout with no cap, so this classifier can
never re-introduce the silent-truncation problem it exists to avoid.

Pure/stateless: takes already-parsed pieces (subsections/table_rows/list_items
from `markdown_primitives`) rather than re-parsing raw markdown itself, so it
has no dependency on `profile_parser.py` (avoids a circular import).
"""
from __future__ import annotations

import re
from typing import Optional

# The drawn `numbered_points` layout in `extra_slide_layouts.py` caps at 5 items.
# The donor library reaches 6 (template slide 38's labelled rows), so the
# classifier considers up to 6 and only keeps the extra one when a donor took it.
_MAX_DRAWN_POINTS = 5
_MAX_DONOR_POINTS = 6


def build_extra_slide_entry(
    heading: str,
    *,
    subsections: Optional[dict] = None,
    table_rows: Optional[list] = None,
    list_items: Optional[list] = None,
    raw_text: str = '',
) -> dict:
    """Pick a layout + shape content for one unrecognized `## heading` block.

    Returns a dict matching the extra-slide entry contract consumed by
    `renderer._render_extra_slides` (same shape as --extra-slides JSON):
    `layout`, `title`, layout-specific content key, `anchor_section`
    (filled in by the caller).
    """
    title = heading.strip()
    subsections = subsections or {}

    # A drawn block outranks every other shape this chapter has. It is the one
    # piece of content that cannot survive being turned into prose — reflow it
    # and the picture is gone — so it claims the slide, and the chapter's own
    # sentences ride above it as a lead-in.
    diagram = _first_diagram(raw_text)
    if diagram:
        return {
            'layout': 'diagram',
            'title': title,
            'diagram': diagram,
            'lead_in': _lead_in(raw_text),
        }

    # A table stays a table. This comes before the subsection layouts because a
    # chapter that is mostly a matrix (a responsibility split, a cost breakdown)
    # is about its columns — flattening it into one bullet per subsection, or
    # per row, destroys the very thing it was written to show.
    if table_rows:
        headers = list(table_rows[0].keys())
        return {
            'layout': 'table',
            'title': title,
            'headers': headers,
            'rows': [[str(row.get(h, '')) for h in headers] for row in table_rows],
        }

    if len(subsections) == 2:
        return {
            'layout': 'comparison_2',
            'title': title,
            'columns': [
                {'title': sub_title, 'items': _to_bullet_lines(body)}
                for sub_title, body in subsections.items()
            ],
        }

    if 3 <= len(subsections) <= _MAX_DONOR_POINTS:
        entry = {
            'layout': 'numbered_points',
            'title': title,
            'points': [
                {'header': sub_title, 'body': _flatten(body)}
                for sub_title, body in subsections.items()
            ],
        }
        _offer_donor(entry, 'numbered_points', len(subsections), subsections)
        # The DRAWN numbered_points layout caps at 5. Past that the entry is only
        # safe if a template design took it, so a six-point chapter that found no
        # donor falls through to bullets rather than losing its sixth point.
        if entry.get('donor') or len(subsections) <= _MAX_DRAWN_POINTS:
            return entry

    if list_items:
        return {'layout': 'bullets', 'title': title, 'bullets': list_items}

    if subsections:
        # n == 1 or n >= 6: outside comparison_2/numbered_points' safe caps —
        # bullets never truncates, so flatten every subsection into one line
        # each instead of picking a capped layout that would drop the rest.
        bullets = [
            f'{sub_title}: {_flatten(body)}' if body.strip() else sub_title
            for sub_title, body in subsections.items()
        ]
        return {'layout': 'bullets', 'title': title, 'bullets': bullets}

    text = raw_text.strip()
    if text and len(text) <= 280 and '\n\n' not in text:
        return {'layout': 'hero', 'title': title, 'message': text}

    return {'layout': 'bullets', 'title': title, 'bullets': _to_bullet_lines(text) or [title]}


def _first_diagram(raw_text: str) -> str:
    """The chapter's first fenced block that is a DRAWING, or ''.

    A fenced block of YAML or SQL is a listing and reads fine as text; only a
    block made of box-drawing and arrows loses its meaning when reflowed, and
    only that one is worth a picture.

    Two things draw the line, and the first is the author's own label. A fence
    opened as ```` ```bash ```` is a listing because the person who wrote it
    said so, whatever characters it holds — and a shell pipeline holds enough
    `|` to read as a drawing to anything that only counts characters. Only an
    unlabelled fence, or one labelled as plain text, is even considered; then
    `looks_like_diagram` judges the characters.
    """
    from lib.diagram_image import looks_like_diagram
    from lib.markdown_primitives import parse_fenced_blocks_tagged

    for lang, block in parse_fenced_blocks_tagged(raw_text):
        if lang and lang not in _DRAWING_FENCE_TAGS:
            continue
        if looks_like_diagram(block):
            return block
    return ''


# Info strings that still leave a fence eligible to be a picture. Everything
# else — a language, a data format, a diagram DSL this skill cannot render —
# marks the block as a listing.
_DRAWING_FENCE_TAGS = frozenset({'text', 'txt', 'plain', 'plaintext', 'ascii',
                                 'asciiart', 'ascii-art', 'diagram', 'none'})


def _lead_in(raw_text: str) -> list:
    """The chapter's own sentences, to stand above its diagram.

    `parse_prose` is reused rather than reimplemented: it already strips the
    fence, the tables, the headings and the inline markup, which is the same
    cleanup this needs and the same cleanup every other slide gets.
    """
    from lib.markdown_primitives import parse_prose

    return _to_bullet_lines(parse_prose(raw_text))


def _offer_donor(entry: dict, shape: str, count: int, subsections: dict) -> None:
    """Attach a real template slide to *entry* when one fits its shape exactly.

    "Exactly" is the whole point of the conservatism here: a donor is taken only
    when its design has room for EVERY item. A four-card slide handed five
    points would drop one silently, and a drawn layout that shows all five beats
    a prettier one that shows four.

    Leaves *entry* untouched when nothing fits — the drawn layout it already
    carries stays, so this can only ever upgrade a slide, never break one.
    """
    from lib.content_condenser import split_headline
    from lib.section_aliases import heading_display
    from lib.templates.svn import DONOR_SLIDES

    # TIGHTEST fit, not first fit. The library holds several designs of one shape
    # at different capacities (3, 4 and 6 slots). Handing a three-point chapter
    # the six-row design leaves three rows blanked and the slide reads as
    # half-finished; the design drawn FOR three points reads as designed.
    fits = sorted(
        (spec['capacity'], slide_no, spec)
        for slide_no, spec in DONOR_SLIDES.items()
        if spec['shape'] == shape and count <= spec['capacity']
    )
    if not fits:
        return
    _, slide_no, spec = fits[0]
    entry['donor'] = slide_no
    entry['donor_source'] = spec['source']
    # `heading_display`, not the raw heading: a card titled `2.1. Trunk-Based
    # Delivery` wears the source document's outline numbering on a slide
    # that has its own 01-04 badges. Same treatment the configured path
    # gives the same design.
    entry['donor_items'] = [
        dict(zip(('subtitle', 'body'), split_headline(body)),
             title=heading_display(sub_title))
        for sub_title, body in subsections.items()
    ]


def _flatten(text: str) -> str:
    """Collapse a block to one line of PLAIN SENTENCES — one run's worth.

    A slide is not markdown. `- **Model**: Quasi-delegation contract` printed its
    own asterisks and hyphen on the General Terms slide, which reads as a
    document nobody finished converting — and collapsing a four-item list with
    `' '.join` put the second item's `- ` in the middle of a sentence.

    So the list is promoted to paragraphs first (each item becomes a block), the
    markup is stripped, and the blocks are joined as sentences — with the full
    stop the source left out supplied, since a slide reading `contract Billing:
    monthly` has run two statements together.
    """
    from lib.markdown_primitives import promote_lists_to_paragraphs, strip_inline_markup

    sentences: list[str] = []
    for block in re.split(r'\n\s*\n', promote_lists_to_paragraphs(text or '')):
        flat = _LEADING_MARKER.sub('', strip_inline_markup(' '.join(block.split()))).strip()
        if not flat or _THEMATIC_BREAK.match(flat):
            # A `---` between chapters is a rule the markdown draws, not a
            # sentence; flattened with the rest it printed as three hyphens at
            # the end of the last bullet.
            continue
        if sentences and sentences[-1][-1] not in _SENTENCE_ENDINGS:
            sentences[-1] += '.'
        sentences.append(flat)
    return ' '.join(sentences)


# A list marker or a `####` heading left at the head of a promoted block.
_LEADING_MARKER = re.compile(r'^\s*(?:#{1,6}\s+|[-*•]\s+|\d+[.)]\s+)')

# Punctuation that already closes a statement — nothing is added after these.
_SENTENCE_ENDINGS = '.!?:;。．！？：；'

# A markdown horizontal rule, alone on its block.
_THEMATIC_BREAK = re.compile(r'^(?:-{3,}|\*{3,}|_{3,})$')


def _to_bullet_lines(text: str) -> list:
    """Split free text into separate PLAIN items for bullet/column-item layouts."""
    if not text:
        return []
    items = [
        _flatten(m.group(1))
        for line in text.splitlines()
        if (m := re.match(r'^\s*(?:-|\*|\d+\.)\s+(.+)$', line))
    ]
    items = [item for item in items if item]
    if items:
        return items
    paragraphs = [p.strip() for p in text.split('\n\n') if p.strip()]
    if len(paragraphs) > 1:
        return [_flatten(p) for p in paragraphs]
    flat = _flatten(text)
    return [flat] if flat else []
