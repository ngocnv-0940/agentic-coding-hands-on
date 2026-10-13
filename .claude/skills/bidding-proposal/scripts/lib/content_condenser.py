"""Shape a chapter's text into what one fixed template box can actually say.

The pipeline could already extract text, measure a box, and cut what overflowed.
What it had no tier for was DECIDING what the slide says: a chapter arrived as
prose and was poured into a box until the box was full.

This module is that tier. Given the text and the box's real budget, it steps
down through progressively tighter forms — full text, one line per item, first
sentence per item, fewer items — and stops at the first that fits.

Two rules it never breaks:

  * **Never cut mid-sentence.** A clause ending in "…which is an order of" is
    worse than the same sentence set one point smaller. When nothing fits, the
    longest single sentence is returned whole and auto-fit deals with it.
  * **Never invent.** Every character out is a character in. Condensing selects;
    it does not summarize. Copy the author wants instead belongs in the
    front-matter `slides:` block, which overrides this entirely.

Pure and stateless — takes text and numbers, returns text. No pptx, no profile,
no renderer import, mirroring `extra_slide_classifier`'s independence.
"""
from __future__ import annotations

import re

# Sentence ends, Japanese first. `．` and `。` are unambiguous; the latin `.` is
# not (it ends "etc." and "0.5" too), so it only counts when whitespace follows.
_SENTENCE_END = re.compile(r'(?<=[。．！？])\s*|(?<=[.!?])\s+')

# The deck's own bullet glyph — the same one `extra_slide_layouts` draws with,
# so a condensed box and an appendix slide look like one deck.
DEFAULT_BULLET = '■  '


def condense(text: str, *, max_chars: int, chars_per_line: int, max_lines: int,
             bullet: str = DEFAULT_BULLET) -> str:
    """Return the fullest form of *text* that fits the given budget.

    `max_chars` is the box's capacity in characters of this text's own script,
    `chars_per_line` and `max_lines` its capacity in wrapped lines. Both are
    supplied by the caller, which is the only party that can see the shape.
    """
    text = (text or '').strip()
    if not text:
        return ''

    items = _items(text)
    if _fits(text, max_chars, chars_per_line, max_lines):
        return text

    # One item is a paragraph, not a list — bulleting a single paragraph makes a
    # list of one, which reads as a mistake.
    if len(items) < 2:
        return _first_sentence(text)

    # Keep every point, one line each.
    rendered = _render(items, bullet)
    if _fits(rendered, max_chars, chars_per_line, max_lines):
        return rendered

    # Keep every point, shortened to its headline. Shortening every point comes
    # BEFORE dropping any — a reader who sees five of six topics has been misled
    # about the scope, while one who sees six headlines has not.
    headlines = [_first_sentence(item) for item in items]
    rendered = _render(headlines, bullet)
    if _fits(rendered, max_chars, chars_per_line, max_lines):
        return rendered

    # Only now, points come off the end — the caller reports how many.
    #
    # Found by halving rather than by walking down one point at a time: each
    # attempt re-renders and re-measures the whole prefix, so the walk was
    # quadratic in the number of points, and the point count is whatever the
    # chapter holds. A chapter of a few thousand blank-line-separated blocks
    # took half a minute here. Fitting is monotonic — a prefix that fits means
    # every shorter one does — so a bisection finds the same answer.
    low, high, best = 1, len(headlines) - 1, None
    while low <= high:
        count = (low + high) // 2
        rendered = _render(headlines[:count], bullet)
        if _fits(rendered, max_chars, chars_per_line, max_lines):
            best, low = rendered, count + 1
        else:
            high = count - 1
    if best is not None:
        return best

    # Nothing fits even at one headline: hand that sentence back whole and let
    # auto-fit shrink it. Cutting it would be the one thing worse.
    return _render([headlines[0]], bullet)


def describe(original: str, shaped: str) -> str:
    """Say in one phrase what condensing actually did to *original*.

    The caller prints this, so it is the only account anyone gets of what the
    slide no longer says. It must never round a loss up to a success: keeping
    six points while dropping the sentence after each one is NOT "every point
    kept in full", and a reader of the log who believes it will not go looking
    for the detail that is now nowhere in the deck.
    """
    kept, was = emitted_items(shaped), count_items(original)
    dropped = was - kept
    if dropped > 0:
        return (f'{kept} of {was} point(s) kept, headline only; '
                f'{dropped} left off this slide entirely')
    if _trimmed_points(original, shaped):
        return f'all {kept} point(s) kept, elaborations trimmed to headlines'
    return f'all {kept} point(s) kept in full, reflowed as a list'


def _trimmed_points(original: str, shaped: str) -> bool:
    """True when some point survived only as its headline."""
    body = shaped.replace(DEFAULT_BULLET, '')
    return any(item not in body for item in _items(original))


def count_items(text: str) -> int:
    """How many separate points raw chapter *text* holds — blank-line blocks.

    For a CONDENSED result use `emitted_items` instead. The two are deliberately
    separate functions: raw text separates its points with blank lines while a
    condensed result separates them with single newlines, and one function
    guessing between the two got the count wrong whenever the glyph changed.
    """
    return len(_items(text or ''))


def emitted_items(shaped: str) -> int:
    """How many points a condensed result carries — one per non-empty line.

    `_render` always joins with a single newline, glyph or no glyph, so this
    holds whether the box marks its own paragraphs or the text carries a bullet.
    """
    return len([line for line in (shaped or '').split('\n') if line.strip()])


def _items(text: str) -> list[str]:
    """Blank-line-separated blocks, each collapsed to one line.

    Blank-line separation is what `promote_lists_to_paragraphs` leaves behind,
    so a chapter's list items and its paragraphs arrive here as the same unit.
    """
    blocks = re.split(r'\n\s*\n', text.strip())
    return [' '.join(b.split()) for b in blocks if b.strip()]


def split_headline(text: str) -> tuple[str, str]:
    """Split *text* into (headline, what follows it).

    A template card carries a headline slot above its body. Both halves come
    from the text itself — nothing is written for the slot — and the split is
    done on the FLATTENED string so the remainder is a true suffix: computing a
    headline from flattened text and subtracting it from text that still has its
    newlines fails the prefix test silently, and the card then prints the same
    sentence in both slots.

    Shared by the profile parser (filling slide 16 from its own chapter) and the
    extra-slide classifier (lending that design to any chapter), so a card looks
    the same however it was reached.
    """
    flat = ' '.join((text or '').split())
    if not flat:
        return '', ''
    headline = _first_sentence(flat)
    if not flat.startswith(headline):
        return headline, ''
    return headline, flat[len(headline):].lstrip(' .:—–')


def _first_sentence(text: str) -> str:
    """The headline of *text* — its first sentence, or its label.

    A flattened table row (`Integration unverified — Firmware must be proven`)
    carries no sentence punctuation at all, so sentence splitting returns the
    whole row and the point cannot be shortened. Its label is before the dash
    and its elaboration after, which is exactly the headline/body split, so a
    spaced dash — and a colon, which introduces the same way — counts as a
    boundary too.
    """
    flat = ' '.join(text.split())
    parts = [p for p in _SENTENCE_END.split(flat) if p and p.strip()]
    headline = parts[0].strip() if parts else flat
    return _label_head(headline) or headline


def _label_head(sentence: str) -> str:
    """The label *sentence* opens with, or the whole sentence when it has none.

    A boundary is only taken when what FOLLOWS it starts a clause of its own —
    its first letter is a capital (or a script that has no case). A dash used
    mid-sentence does not qualify: cutting `... not "AI assistance" — it is a
    default workflow ...` there left the card's body beginning `it is`, a
    lower-case fragment that reads as a typo rather than as a sentence.

    The earliest qualifying boundary wins, so `... lifecycle: This is not ...`
    is split at the colon the author already wrote it at.
    """
    for match in _LABEL_SEPARATOR.finditer(sentence):
        head = sentence[:match.start()].strip()
        rest = sentence[match.end():].lstrip()
        if not head or not rest:
            continue
        initial = next((ch for ch in rest if ch.isalpha()), '')
        if initial.islower():
            continue
        return head
    return sentence


# `label — elaboration`, as `_field_text` writes a flattened table row, or
# `label: elaboration`, as prose introduces one. The dash is spaced, so a
# hyphenated word or an unspaced range is never mistaken for a boundary; the
# colon needs no space before it because no word carries one.
_LABEL_SEPARATOR = re.compile(r'\s[—–]\s|:\s')


def _render(items: list[str], bullet: str) -> str:
    if len(items) < 2:
        return items[0] if items else ''
    return '\n'.join(f'{bullet}{item}' for item in items)


def _fits(text: str, max_chars: int, chars_per_line: int, max_lines: int) -> bool:
    """True when *text* fits both budgets — characters and wrapped lines.

    Lines are counted per paragraph AND per hard newline, because a bulleted
    render breaks a line wherever a bullet starts, not where the character count
    happens to run out.
    """
    if len(text) > max_chars:
        return False
    lines = 0
    for line in text.split('\n'):
        lines += max(1, -(-len(line) // max(1, chars_per_line)))
    return lines <= max_lines
