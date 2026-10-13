"""Stateless markdown content primitives shared by `profile_parser.py` and
`extra_slide_classifier.py`.

Kept dependency-free (no imports from either module) so both can import from
here without a circular import.
"""
from __future__ import annotations

import re

# `\[`, `Sun\*`, `1\.` — escapes a Google Docs export sprinkles through text.
_ESCAPE = re.compile(r'\\(.)')
# `[label](url)` → `label`. Non-greedy up to the first `](`, so a label that
# itself contains brackets (`[[Styleport] ROOV compass …`) survives intact.
_LINK = re.compile(r'\[(.+?)\]\((?:[^()\s]|\([^()]*\))*\)')
# `**bold**` → `bold`. Single asterisks are deliberately left alone: `Sun*` is a
# brand name in these documents, not emphasis.
_BOLD = re.compile(r'\*\*(.+?)\*\*')

# `*emphasis*` — a single-asterisk pair. Run AFTER `_BOLD`, and written so it can
# never touch `Sun*`, which is a brand name and must survive verbatim:
#
#   `(?<![\w*])`  the opener may not follow a word character, so the `*` in
#                 `Sun*` and `Sun*'s` is never read as one;
#   `(?!\s)`      an opener is not followed by a space (`a * b` is arithmetic);
#   `(?<!\s)`     a closer is not preceded by one;
#   `(?![\w*])`   the closer may not be followed by a word character, so the
#                 first `*` of a `**` pair cannot serve as one.
#
# Without this, `*The primary purpose of this application…*` reached the deck
# with its asterisks intact, which on a client slide reads as a typo.
_EMPHASIS = re.compile(r'(?<![\w*])\*(?!\s)([^*\n]+?)(?<!\s)\*(?![\w*])')


def strip_inline_markup(text: str) -> str:
    """Render markdown inline markup as the plain text a slide should show.

    A slide is not a markdown reader: `**bold**`, `*emphasis*`, `[label](url)`
    and backslash escapes reach the deck verbatim if nobody removes them. Schema
    markdown written by gen-md.py carries none of this, so this is a no-op there;
    it matters for a chapter lifted straight out of a human-written proposal.

    `Sun*` survives — it is a brand name, not emphasis. See `_EMPHASIS`.
    """
    text = _ESCAPE.sub(r'\1', text)
    text = _LINK.sub(r'\1', text)
    text = _BOLD.sub(r'\1', text)
    return _EMPHASIS.sub(r'\1', text)


def split_subsections(content: str) -> dict[str, str]:
    """Split section content by `^### ` headings. Returns {heading_text: content}."""
    parts: dict[str, str] = {}
    current = None
    buf: list[str] = []
    for line in content.splitlines():
        m = re.match(r'^###\s+(.+?)\s*$', line)
        if m:
            if current is not None:
                parts[current] = '\n'.join(buf).strip()
            current = m.group(1).strip()
            buf = []
        else:
            if current is not None:
                buf.append(line)
    if current is not None:
        parts[current] = '\n'.join(buf).strip()
    return parts


def split_sub_subsections(content: str) -> dict[str, str]:
    """Split section content by `^#### ` headings. Returns {heading: content}.

    One level below `split_subsections`. A feature chapter routinely nests its
    real material here — `#### 1.4.1 Screen groups`, `#### 1.4.2 Full feature
    breakdown` — each with its own table. Read as one block those tables merge
    into a single grid whose second header row lands in the deck as data, so the
    blocks have to be seen separately.
    """
    parts: dict[str, str] = {}
    current = None
    buf: list[str] = []
    for line in content.splitlines():
        m = re.match(r'^####\s+(.+?)\s*$', line)
        if m:
            if current is not None:
                parts[current] = '\n'.join(buf).strip()
            current = m.group(1).strip()
            buf = []
        elif current is not None:
            buf.append(line)
    if current is not None:
        parts[current] = '\n'.join(buf).strip()
    return parts


def parse_table(content: str) -> list[dict]:
    """Parse a markdown pipe table into a list of dicts (keys = header row)."""
    lines = [l.strip() for l in content.splitlines() if l.strip().startswith('|')]
    if len(lines) < 2:
        return []

    def split_row(line: str) -> list[str]:
        cells = [c.strip() for c in line.split('|')]
        # Strip empty leading/trailing cells from outer pipes
        if cells and cells[0] == '':
            cells = cells[1:]
        if cells and cells[-1] == '':
            cells = cells[:-1]
        return cells

    # Header cells become dict keys, and a table layout paints them as the
    # header row — so they need the same markup cleanup the body cells get, or
    # a column is titled `Sun\*` on the finished slide.
    header = [strip_inline_markup(cell) for cell in split_row(lines[0])]
    rows = []
    for line in lines[1:]:
        # Skip separator |---|---|
        if all(c in '|-: \t' for c in line):
            continue
        cells = split_row(line)
        if not cells:
            continue
        row = {header[i] if i < len(header) else f'col{i}': strip_inline_markup(cells[i])
               for i in range(len(cells))}
        rows.append(row)
    return rows


def parse_tables(content: str) -> list[list[dict]]:
    """Parse EVERY pipe table in *content* separately, in order.

    `parse_table` concatenates whatever pipe rows it finds, which is right for
    a block holding one table and wrong for a chapter holding several: the
    first table's header would be applied to the second table's rows. This
    splits on the prose between them and parses each block on its own.
    """
    blocks: list[list[str]] = []
    current: list[str] = []
    for line in content.splitlines():
        if line.strip().startswith('|'):
            current.append(line)
        elif current:
            blocks.append(current)
            current = []
    if current:
        blocks.append(current)
    tables = [parse_table('\n'.join(block)) for block in blocks]
    return [table for table in tables if table]


def parse_list(content: str) -> list[str]:
    """Parse bulleted (`- item`) or numbered (`1. item`) list. Other lines ignored."""
    items: list[str] = []
    for line in content.splitlines():
        s = line.strip()
        m = re.match(r'^(?:-|\*|\d+\.)\s+(.+)$', s)
        if m:
            items.append(strip_inline_markup(m.group(1).strip()))
    return items


def parse_image_ref(content: str) -> str:
    """Extract path from `Image: path` line. Returns empty string if not found."""
    m = re.search(r'^Image:\s*(.+)$', content, re.MULTILINE)
    return m.group(1).strip() if m else ''


def parse_text(content: str) -> str:
    """Strip and return text content (multi-line preserved), inline markup removed."""
    return strip_inline_markup(content.strip())


def parse_fenced_blocks(content: str) -> list[str]:
    """Return the contents of every ``` fenced block, fences excluded.

    `parse_prose` already knows where a fence starts and ends — it drops the
    block outright, because a diagram is not a sentence. That was right for a
    text box and wrong for the slide: the block was the most informative thing
    in the chapter and it left the deck entirely. Handing the blocks back lets
    the caller draw them instead of losing them.

    Line breaks and leading spaces are preserved exactly. In a block of box
    drawing they are not formatting, they are the picture.
    """
    return [body for _, body in parse_fenced_blocks_tagged(content)]


def parse_fenced_blocks_tagged(content: str) -> list[tuple[str, str]]:
    """Every fenced block as `(info string, body)`, the info string lowercased.

    The info string is what the author wrote after the opening fence — ```` ```bash ````,
    ```` ```yaml ````, or nothing at all. `parse_fenced_blocks` throws it away
    because a caller that only wants the picture has no use for it; a caller
    deciding WHETHER the block is a picture has every use for it, since a block
    the author labelled as a language is a listing whatever characters it holds.
    """
    blocks: list[tuple[str, str]] = []
    current: list[str] = []
    lang, inside = '', False
    for line in (content or '').splitlines():
        stripped = line.strip()
        if stripped.startswith('```'):
            if inside:
                blocks.append((lang, '\n'.join(current)))
                current, lang = [], ''
            else:
                lang = stripped[3:].strip().lower()
            inside = not inside
            continue
        if inside:
            current.append(line)
    if current:                      # an unclosed fence still holds a diagram
        blocks.append((lang, '\n'.join(current)))
    return [(lang, body) for lang, body in blocks if body.strip()]


def parse_prose(content: str) -> str:
    """Return only the prose of *content* — table rows, list items and image
    refs removed, blank lines collapsed.

    A schema-shaped section keeps its prose under its own `### Description`
    subsection, but a chapter lifted straight out of a proposal has the prose
    and its table sitting together in one block. This gives the description
    half of that block without dragging the table into it.
    """
    kept = []
    in_code_fence = False
    for line in content.splitlines():
        stripped = line.strip()
        # A fenced block is a diagram or a listing — layout, never a sentence.
        # Dropped whole: half of an ASCII pipeline on a slide reads as damage.
        if stripped.startswith('```'):
            in_code_fence = not in_code_fence
            continue
        if in_code_fence:
            continue
        if stripped.startswith('|') or stripped.startswith('Image:'):
            continue
        # A horizontal rule separates chapters in the source; on a slide it is
        # three stray dashes at the end of a sentence.
        if re.fullmatch(r'(?:-{3,}|\*{3,}|_{3,})', stripped):
            continue
        # A heading is a label for what follows, not prose. `### 1.4 Feature
        # List` holds three `#### ` sub-blocks, and keeping their heading lines
        # put `#### 1.4.1. Screen groups / #### 1.4.2. Full feature breakdown`
        # into the slide's description box as loose words with nothing under
        # them — the sub-block's content having gone to a table or a list.
        if _ATX_HEADING.match(stripped):
            continue
        if re.match(r'^(?:-|\*|\d+\.)\s+', stripped):
            continue
        kept.append(stripped)  # blank lines survive — they separate paragraphs
    return strip_inline_markup(re.sub(r'\n{3,}', '\n\n', '\n'.join(kept)).strip())


def split_paragraphs(content: str) -> list[str]:
    """Split prose into blank-line-separated paragraphs."""
    blocks = re.split(r'\n\s*\n', content.strip())
    return [block.strip() for block in blocks if block.strip()]


_LIST_ITEM = re.compile(r'^\s*(?:[-*]|\d+[.)])\s+(.+?)\s*$')

# Any ATX heading — `# ` through `###### `.
_ATX_HEADING = re.compile(r'^#{1,6}\s+\S')


def promote_lists_to_paragraphs(content: str) -> str:
    """Turn each list item into a paragraph of its own, marker removed.

    `parse_prose` drops every list item, which is the right call when a section
    handler is about to read the same block as a table or a list through another
    parser. It is the wrong call when the block's only destination is a prose
    box: a chapter's four numbered success indicators are the most condensed
    thing it has to say, and they were being discarded in favour of the prose
    around them.

    Promoting first means `parse_prose` keeps them — as paragraphs, which is
    also the unit `content_condenser` counts. Table rows and image refs are left
    exactly as written so `parse_table` and `parse_image_ref` still see the
    shapes they expect.
    """
    out: list[str] = []
    for line in content.splitlines():
        stripped = line.strip()
        if stripped.startswith('|') or stripped.startswith('Image:'):
            out.append(line)
            continue
        item = _LIST_ITEM.match(line)
        if item:
            # Blank lines around it, so the promoted item reads as its own
            # paragraph to every downstream splitter.
            if out and out[-1].strip():
                out.append('')
            out.append(item.group(1))
            out.append('')
            continue
        out.append(line)
    return re.sub(r'\n{3,}', '\n\n', '\n'.join(out)).strip()
