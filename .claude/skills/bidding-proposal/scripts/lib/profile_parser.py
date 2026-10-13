"""Profile markdown parser — converts project_content_{id}_{ts}.md into ProjectProfile.

Markdown structure:
  # Project Profile: {id}
  Generated: {ts}

  ## Section Heading
  ### Subsection Heading      (optional)
  free text / bullet list / numbered list / table / `Image: path`
  ...

Tolerant: unknown sections logged + skipped; missing sections leave defaults.
"""
from __future__ import annotations

import re
from typing import Optional

from lib.extra_slide_classifier import build_extra_slide_entry
from lib.markdown_primitives import (
    parse_image_ref as _parse_image_ref,
    parse_list as _parse_list,
    parse_prose as _parse_prose,
    parse_table as _parse_table,
    promote_lists_to_paragraphs as _promote_lists_to_paragraphs,
    parse_tables as _parse_tables,
    parse_text as _parse_text,
    split_paragraphs as _split_paragraphs,
    split_sub_subsections as _split_sub_subsections,
    split_subsections as _split_subsections,
    strip_inline_markup as _strip_inline_markup,
)
from lib.profile_schema import (
    AfterBlock,
    AgendaSection,
    AssumptionSection,
    BackgroundSection,
    BenefitSection,
    BusinessProcessSection,
    CoverSection,
    FeaturesSection,
    NFROverviewSection,
    NFRSection,
    ProjectProfile,
    ScheduleSection,
    ScreenFlowSection,
    TableSection,
    FIELD_TARGETS,
    field_has_content,
    section_has_content,
    _SECTION_CONTENT_CHECKS,
)
from lib.content_condenser import split_headline as _split_headline
from lib.section_aliases import (
    heading_display,
    heading_label,
    heading_variants,
    is_schema_heading,
    resolve_section_key,
)

# Hiragana + katakana. Kana, not the CJK ideograph block, is what separates a
# Japanese document from a Chinese one and from an English one quoting a
# Japanese product name — 株式会社 alone appears in an English proposal's
# footer, kana does not.
_KANA = re.compile(r'[぀-ゟ゠-ヿ]')


def parse_profile(markdown: str) -> ProjectProfile:
    """Top-level: parse markdown text into a ProjectProfile.

    A `## heading` is resolved to a section key through `section_aliases`, which
    accepts both gen-md.py's English schema headings and the chapter titles a
    human-written proposal uses (`## 1. システムの概要 — System Overview`).

    A heading that names no section is not dropped. It is first tried as a
    CONTAINER: a proposal chapter whose own `###` subsections are the real
    sections (chapter 1 holds 背景・目的 and 機能一覧). If any subsection
    resolves, the chapter is consumed and its subsections become sections.
    Only a block that resolves neither way is classified into an extra-slide
    entry (`auto_extra_slides`), which gen-slide.py places via the generic
    layouts in `extra_slide_layouts.py`, anchored after the last known section.
    """
    mapping, authored_copy, markdown = split_front_matter(markdown)
    project_id, timestamp = _parse_header(markdown)
    profile = ProjectProfile.empty(project_id=project_id, timestamp=timestamp)

    profile.is_japanese_source = bool(_KANA.search(markdown))
    # Front matter is the mark of a supplied document whose chapters an agent
    # has read and mapped. Only such a document opts into content shaping — see
    # `ProjectProfile.shape_content`.
    profile.shape_content = bool(mapping or authored_copy)

    routes = {'mapping': 0, 'alias': 0, 'appendix': 0}
    last_known_key = None
    for heading, content in _chapters_from_agenda(_split_sections(markdown), mapping):
        target, route = _resolve(heading, mapping)
        if target == APPENDIX_KEY:
            # The author stood this chapter down so a later one could fill the
            # slide. Anchor is left untouched: this block is not the section.
            routes['appendix'] += 1
            _route_to_extra_slide(profile, heading, content, last_known_key,
                                  edge='before' if last_known_key is None else 'after')
            continue
        if target == CONTAINER_KEY:
            target = None
        if target and _apply_target(profile, target, content, heading):
            routes[route] += 1
            last_known_key = _section_of(target)
            profile.section_chapters.setdefault(last_known_key, heading_display(heading))
            _route_surplus_tables(profile, content,
                                  _placed_table(profile, last_known_key),
                                  last_known_key, heading_display(heading))
            continue
        consumed = _consume_container(profile, content, last_known_key, mapping,
                                      routes, chapter=heading)
        if consumed is not _UNCONSUMED:
            last_known_key = consumed
            continue
        routes['appendix'] += 1
        _route_to_extra_slide(profile, heading, content, last_known_key,
                              edge='before' if last_known_key is None else 'after')
    _report_coverage(routes)

    # AFTER the loop: an explicit `## Cover` section is written for this purpose
    # and must win, while the front matter is only being interpreted. Filling
    # first and letting the section overwrite lost whichever field the section
    # omitted — a `## Cover` carrying only a company erased the date.
    _fill_cover_from_preamble(profile, markdown)
    _apply_authored_copy(profile, authored_copy)
    return profile


def _chapters_from_agenda(sections: list, mapping: dict[str, str]) -> list:
    """Drop the chapters before the AGENDA that name no section of the deck.

    The AGENDA is the deck's contents page, and it is the document's own
    statement of where the proposal begins. What comes before it is usually
    front matter for a READER of the document — a covering summary, a revision
    history — and putting it on a slide announces a chapter the contents page
    never listed. An executive summary is the usual case: it repeats, in
    advance, the chapters that follow it.

    Position alone does not condemn a chapter, though. gen-md.py emits
    `## Cover` first and `## Agenda` second, so dropping everything above the
    contents page threw away the cover of the pipeline's OWN markdown and left
    slide 1 wearing the template placeholder. A pre-agenda chapter that
    resolves — through the agent's mapping or the alias table — to a real
    section key is one the deck has a slide for, and it is kept in the place
    the document put it.

    Everything else above the contents page is still dropped, which is every
    case this rule was written for: an executive summary and a revision history
    resolve to nothing, and a chapter the front matter maps to `appendix` was
    stood down by its own author — a mapping that says "not a section of this
    deck" is not a claim on a slide.

    A document with no AGENDA at all is left whole: there is then no stated
    beginning to trust, and dropping its opening chapter would lose content on
    a guess.
    """
    for i, (heading, _) in enumerate(sections):
        if resolve_section_key(heading) == 'agenda':
            kept, dropped = [], []
            for chapter in sections[:i]:
                target, _route = _resolve(chapter[0], mapping)
                names_section = bool(target) and target != APPENDIX_KEY
                (kept if names_section else dropped).append(chapter)
            if dropped:
                names = ', '.join(h for h, _ in dropped)
                print(f'[profile-parser] Skipped {len(dropped)} chapter(s) before '
                      f'the AGENDA: {names} — they name no section the contents '
                      f'page lists')
            return kept + sections[i:]
    return sections


def _apply_authored_copy(profile: ProjectProfile, authored: dict[str, str]) -> None:
    """Overwrite boxes with the copy the front matter's `slides:` block supplies.

    Runs LAST, and overwrites rather than deferring to first-occupant-wins: the
    other routes are the parser interpreting the document, while this was
    written by something that read the whole of it and knew the box's size. When
    the two disagree, the one that could see both should win.
    """
    for dotted, value in authored.items():
        section_key, _, field_name = dotted.partition('.')
        section = getattr(profile, section_key, None)
        if section is None or not value:
            continue
        setattr(section, field_name, value)
        _record_section_seen(profile, section_key, '')
        print(f'[profile-parser] slides: authored copy written to "{dotted}" '
              f'({len(value)} chars) — overrides what the chapter parsed to')


# Honorific that FOLLOWS the addressee's name, anchored at end of line.
#
# Anchored, not a substring test: `様` is a character inside 仕様 (specification),
# 多様 (diverse) and 様々 (various) — words an opening paragraph uses constantly.
# Matching it anywhere picked up the document's first sentence instead of its
# addressee, and stripping it with `str.replace` then deleted those characters
# from the middle of that sentence, putting the wreckage on the cover.
# 御中 comes first because it is unambiguous where 様 is not.
_HONORIFIC_SUFFIX = re.compile(r'\s*(御中|様)\s*$')

# Honorific that PRECEDES the name, as Vietnamese writes it. Longest form first
# so `Kính gửi Quý công ty X` does not strip down to `Quý công ty X`.
_HONORIFIC_PREFIX = re.compile(r'^\s*Kính gửi(?:\s+Quý công ty)?\s+', re.IGNORECASE)

# An English proposal has no honorific at all — it labels its addressee instead
# (`**Prepared for**: Evering`). The label is what carries the meaning, so it is
# matched as a field name, anchored at line start and requiring the colon: an
# unanchored `for` or `to` appears in every other sentence of a preamble.
#
# `Prepared for` must not be shortened to `for` in the alternation, or the
# neighbouring `**Prepared by**: Sun Asterisk Inc.` line would match too and put
# the VENDOR's name on the client's cover. Longest label first, for the same
# reason the Vietnamese prefix lists its long form first.
_ADDRESSEE_LABEL = re.compile(
    r'^\s*(?:Prepared for|Addressed to|Addressee|Client|To|For)\s*[:：]\s*',
    re.IGNORECASE,
)

# `2026.03.15` / `2026/03/15` / the ISO `2026-03-15`, and the JP business form
# `2026年3月15日`. ISO is what an English proposal writes and what every
# document generator emits by default; without it such a document silently kept
# the template's own placeholder date.
_DATE_PATTERNS = (
    re.compile(r'\b(\d{4})[./-](\d{1,2})[./-](\d{1,2})\b'),
    re.compile(r'(\d{4})\s*年\s*(\d{1,2})\s*月\s*(\d{1,2})\s*日'),
)
# Any four-digit year, used only to notice a date notation none of the patterns
# above understands — so an unsupported format is visible rather than silently
# falling back to the template's own placeholder date.
_YEAR_HINT = re.compile(r'\b(19|20)\d{2}\b')


def _fill_cover_from_preamble(profile: ProjectProfile, markdown: str) -> None:
    """Read the cover's client name and date off the document's own front matter.

    A proposal opens with its title, the addressee, and the date — above the
    first `##`, which is territory `_split_sections` discards. Without this, a
    document that plainly names its client on line 3 still shipped a cover
    reading `SVN Proposal Menu` / `○○株式会社　御中`, the template's placeholder.

    Runs AFTER the section loop and fills only what a `## Cover` section left
    empty: an explicit section was written for this purpose, while the front
    matter is only being interpreted.
    """
    preamble = re.split(r'^##\s', markdown, maxsplit=1, flags=re.MULTILINE)[0]
    company = profile.cover.company
    date = profile.cover.date
    if preamble.strip():
        company = company or _parse_addressee(preamble)
        date = date or parse_cover_date(preamble)
    if company or date:
        profile.cover = CoverSection(company=company, date=date)
        print(f'[profile-parser] Cover read from the document front matter: '
              f'company={company!r} date={date!r}')
    _warn_unfilled_cover(company, date)


def _warn_unfilled_cover(company: str, date: str) -> None:
    """Say plainly which cover field will ship the template's placeholder.

    Falling back is deliberate — a guessed client name is worse than a known
    placeholder — but the fallback used to be announced only by the ABSENCE of
    a line, which reads identically to a document that had no cover data to
    give. A deck went out headed `SVN Proposal Menu` / `○○株式会社　御中`
    because that silence was indistinguishable from success.
    """
    unfilled = [name for name, value in (('company', company), ('date', date)) if not value]
    if not unfilled:
        return
    print(f'[profile-parser] WARNING: cover {" and ".join(unfilled)} not found in the '
          f'document front matter — slide 1 will ship the TEMPLATE PLACEHOLDER '
          f'("SVN Proposal Menu" / "2025.04.04"). Pass '
          f'{" ".join("--cover-" + name for name in unfilled)} to gen-slide.py to set '
          f'it, or see references/cover-and-agenda.md for the addressee/date '
          f'notations the parser reads.')


def _parse_addressee(preamble: str) -> str:
    """Client name from the addressee line, honorific or label stripped as an affix.

    Three notations, one per language the source proposals are written in: the
    Japanese suffix honorific, the Vietnamese prefix honorific, and the English
    field label. Each is anchored to a line edge, so none of them can match the
    middle of a sentence.

    Returns '' when no line carries one. That is a real answer, not a failure:
    the cover then keeps the template's own wording, which is what
    `references/cover-and-agenda.md` documents as the fallback. A guessed name
    is worse than a known placeholder.
    """
    for line in preamble.splitlines():
        text = _strip_inline_markup(line.strip().lstrip('#').strip())
        if not text:
            continue
        for affix in (_HONORIFIC_SUFFIX, _HONORIFIC_PREFIX, _ADDRESSEE_LABEL):
            stripped = affix.sub('', text)
            if stripped != text:
                break
        else:
            continue
        stripped = stripped.strip(' 　:：')
        if stripped:
            return stripped
    return ''


def parse_cover_date(preamble: str) -> str:
    """The latest date in the front matter, normalized to `YYYY.MM.DD`.

    A revised proposal states both its original and its revision date; the cover
    carries the revision, so the latest one wins.

    Public because `gen-slide.py` runs a `--cover-date` value through it too, so
    a date typed on the command line reaches the cover in the same notation as
    one read out of the document.
    """
    matches = [m for pattern in _DATE_PATTERNS for m in pattern.findall(preamble)]
    if not matches:
        if _YEAR_HINT.search(preamble):
            print('[profile-parser] NOTE: the front matter names a year but no '
                  'date notation this parser reads (YYYY.MM.DD, YYYY/MM/DD, '
                  'YYYY-MM-DD, YYYY年M月D日) — the cover keeps the template\'s '
                  'own date')
        return ''
    year, month, day = max(matches, key=lambda m: (int(m[0]), int(m[1]), int(m[2])))
    return f'{year}.{int(month):02d}.{int(day):02d}'


def _apply_section(profile: ProjectProfile, key: str, content: str,
                   heading: str = '') -> bool:
    """Run the handler for *key* over *content*. True when it was applied.

    False when no handler exists OR the section is already filled. A second
    chapter resolving to a key that already holds content does NOT overwrite
    it: the first occupant wins and the caller routes this block to an appendix
    slide, so both reach the deck. Overwriting silently deleted the first
    chapter — `## 機能一覧` and `## 機能一覧表` both resolve to `features`, and
    the second one replaced the first one's whole table.
    """
    handler = globals().get(f'_handle_{key}')
    if not handler:
        return False
    if section_has_content(profile, key):
        print(f'[profile-parser] WARNING: a second block also resolves to '
              f'"{key}", which is already filled — keeping the first and '
              f'routing this one to an appendix slide instead of overwriting')
        return False
    handler(profile, content)
    _record_section_seen(profile, key, heading)
    return True


def _section_of(target: str) -> str:
    """The section key a target belongs to — `a.b` -> `a`, `a` -> `a`."""
    return target.partition('.')[0]


def _apply_target(profile: ProjectProfile, target: str, content: str,
                  heading: str = '') -> bool:
    """Route *target* to the section- or field-level applier. True when applied.

    The single dispatch point, so the main loop and `_consume_container` can
    never drift apart on what a dotted target means.
    """
    if '.' in target:
        return _apply_field(profile, target, content, heading,
                            shape_content=profile.shape_content)
    return _apply_section(profile, target, content, heading)


def _apply_field(profile: ProjectProfile, dotted: str, content: str,
                 heading: str = '', shape_content: bool = False) -> bool:
    """Fill ONE box of a section — `project_background.current_issues`.

    The field-level twin of `_apply_section`, for a heading that names a box
    rather than a chapter. Same first-occupant-wins rule, one resolution finer:
    two chapters may fill the two boxes of slide 4, but neither may overwrite
    the other's.

    The section's own order and display heading are recorded from whichever box
    is filled first, so the slide still appears where the document put the
    chapter and is still titled after it.
    """
    section_key, _, field_name = dotted.partition('.')
    if field_name not in FIELD_TARGETS.get(section_key, set()):
        return False
    if field_has_content(profile, dotted):
        print(f'[profile-parser] WARNING: a second block also resolves to '
              f'"{dotted}", which is already filled — keeping the first and '
              f'routing this one to an appendix slide instead of overwriting')
        return False
    section = getattr(profile, section_key, None)
    if section is None:
        return False
    value = _field_text(content, shape_content=shape_content)
    if not value:
        return False
    setattr(section, field_name, value)
    _record_section_seen(profile, section_key, heading)
    return True


# A blockquote marker is layout, not words. `1.3 Primary Objective` opens with
# `> *The primary purpose…*`, and the box is prose — the `>` belongs to the
# markdown, not to the sentence.
_BLOCKQUOTE_PREFIX = re.compile(r'^\s*>\s?', re.MULTILINE)


def _field_text(content: str, shape_content: bool = False) -> str:
    """Shape one chapter's markdown into text fit for a single prose BOX.

    A section handler can hand its table to a table shape and its prose to a
    prose shape. A field target has one box and must choose, so the order is:

      1. prose, when the chapter has any — a chapter carrying a table beside its
         text puts the text in the box, never the pipes;
      2. the table's rows, flattened to `first column — rest`, when the chapter
         is nothing but a matrix. `1.2 Current Challenges` is exactly that, and
         its six challenge names are what the `現状の課題` box was drawn to hold;
      3. the raw text, for anything else.

    Rows are flattened rather than dropped because a table-only chapter that
    resolved to a prose box would otherwise render as an empty panel — and
    rendering its markdown pipes verbatim is worse than either.

    Under `shape_content`, list items are promoted to paragraphs before step 1,
    so a chapter's numbered points survive `parse_prose` instead of being
    discarded in favour of the prose around them. Deliberately scoped to THIS
    function: a section handler parses its own block as a list or a table, and
    promoting there would take the markers those parsers read — it emptied the
    AGENDA and put its Japanese chapter names back on an English deck.
    """
    if shape_content:
        content = _promote_lists_to_paragraphs(content)
    prose = _BLOCKQUOTE_PREFIX.sub('', _parse_prose(content)).strip()
    if prose:
        return prose
    flattened = _flattened_table_rows(content)
    if flattened:
        return flattened
    return _parse_text(content)


def _flattened_table_rows(content: str) -> str:
    """*content*'s table as prose — one paragraph per row, `label — rest`.

    Shared by `_field_text` and `_cell_text`, so a matrix reads the same wherever
    it has to fit somewhere that is not a grid.
    """
    lines = []
    for row in _parse_table(content):
        cells = [str(v).strip() for v in row.values() if str(v).strip()]
        if cells:
            lines.append(cells[0] if len(cells) == 1 else f'{cells[0]} — {cells[1]}')
    return '\n\n'.join(lines)


def _cell_text(content: str) -> str:
    """Shape *content* for one CELL or CARD of a template design — matrix first.

    `_field_text` must choose between a chapter's table and its prose, because
    the box it fills is a paragraph panel. A grid row is different: its matrix IS
    the row. §5.3 `Programming stack` is a stack table followed by one caveat
    sentence, and taking the prose left the row saying only *If Evering prefers
    Flutter…* — the caveat, with the stack it qualifies nowhere on the slide.

    So both, table first: `Mobile — React Native. Charts — Victory Native. … If
    Evering has a strong preference for Flutter…`. What the cell cannot hold is
    cut at a sentence boundary by the renderer, which cuts from the end — so the
    part that goes is the caveat, not the substance.

    Used by every design that gives a block of the document ONE box: an
    assumptions row, a benefit card. What must never reach such a box is the
    markdown itself — a `|` table written into a cell is escaped by the renderer
    and prints as `&#124;`.
    """
    flattened = _flattened_table_rows(content)
    prose = _BLOCKQUOTE_PREFIX.sub(
        '', _parse_prose(_promote_lists_to_paragraphs(content))).strip()
    both = '\n\n'.join(part for part in (flattened, prose) if part)
    return both or _parse_text(content)


def _record_section_seen(profile: ProjectProfile, key: str, heading: str) -> None:
    """Note that section *key* now has content, and what the document called it.

    Both are recorded from the FIRST block to fill the section, matching
    first-occupant-wins: the slide keeps the position and the title of the
    chapter whose content it actually carries.
    """
    if key not in profile.section_order:
        profile.section_order.append(key)
    # A schema heading (`## Features`) on a Japanese document is the profile's
    # plumbing, not a title the author chose — the template's Japanese title
    # (機能一覧) stays. Any other heading names its slide.
    display = heading_display(heading)
    if (display and key not in profile.section_headings
            and not (profile.is_japanese_source and is_schema_heading(heading))):
        profile.section_headings[key] = display


# Sentinel: `_consume_container` returning this means the block held nothing it
# recognized, so the caller should fall through to the extra-slide route. A
# plain None can't say that — None is also a valid "no section seen yet" anchor.
_UNCONSUMED = object()


def _resolve(heading: str, mapping: dict[str, str]) -> tuple[Optional[str], str]:
    """Resolve *heading* to a section key, and say which route found it.

    The agent's mapping wins over the alias table: it was written by something
    that read THIS document, while the table only knows the wordings someone
    met before. Exact spelling first, then the same normalization the alias
    table uses, so a mapping key survives the numbering and gloss a heading
    carries.
    """
    if heading in mapping:
        return mapping[heading], 'mapping'
    for variant in heading_variants(heading):
        if variant in mapping:
            return mapping[variant], 'mapping'
    return resolve_section_key(heading), 'alias'


def _report_coverage(routes: dict[str, int]) -> None:
    """Say how many chapters found a template slide, and by which route.

    A document whose chapters mostly fall through to appendix slides still
    renders — it just renders as a generic deck wearing the SVN chrome, which
    is easy to miss when every individual WARNING looks routine. The ratio is
    the signal the per-heading warnings cannot give.
    """
    total = sum(routes.values())
    if not total:
        return
    placed = routes['mapping'] + routes['alias']
    print(f'[profile-parser] Sections resolved: {placed}/{total} chapters '
          f'({routes["mapping"]} mapping, {routes["alias"]} alias, '
          f'{routes["appendix"]} appendix)')
    if placed * 2 < total:
        print('[profile-parser] WARNING: fewer than half the chapters reached a '
              'template slide — the deck will be mostly appendix slides. Supply '
              'a front-matter `sections:` mapping (see '
              'references/supplied-document.md).')


def _consume_container(profile: ProjectProfile, content: str,
                       last_known_key: Optional[str],
                       mapping: Optional[dict] = None,
                       routes: Optional[dict] = None,
                       chapter: str = ''):
    """Try *content* as a chapter whose `###` subsections are the real sections.

    Returns the last section key applied, or `_UNCONSUMED` when no subsection
    resolved — in which case the caller routes the whole chapter to an extra
    slide, exactly as before.

    A subsection that resolves to nothing is routed to its own extra slide
    rather than discarded, so `### 1.3 UIデザイン・画面遷移` still reaches the
    deck instead of vanishing inside a chapter that was otherwise understood.
    """
    mapping = mapping or {}
    subs = _split_subsections(content)
    if not subs:
        return _UNCONSUMED
    resolved = []
    for sub in subs:
        target, route = _resolve(sub, mapping)
        # A subsection is never itself a container — nesting stops here. An
        # `appendix` subsection IS honored: standing one subsection down so a
        # sibling can claim the box is exactly the 1.1/1.2/1.3 case.
        if target == CONTAINER_KEY:
            target = None
        resolved.append((sub, target, route))
    if not any(t and t != APPENDIX_KEY for _, t, _ in resolved):
        return _UNCONSUMED

    # Pass 1 — every subsection that claims a template section, in document
    # order. Filling comes first so that pass 2 knows which section THIS chapter
    # occupies before any of its appendix subsections has to pick an anchor.
    # Relative order among the claiming subsections is unchanged, so the
    # first-one-wins duplicate guard resolves exactly as it did before.
    applied: dict = {}
    for sub_heading, target, route in resolved:
        if target and target != APPENDIX_KEY and _apply_target(
                profile, target, subs[sub_heading], sub_heading):
            if routes is not None:
                routes[route] += 1
            applied[sub_heading] = _section_of(target)
            if chapter:
                profile.section_chapters.setdefault(applied[sub_heading], heading_display(chapter))
                # This section reached its slide through a container chapter,
                # so it shares that chapter's divider — `chapter_dividers`.
                profile.section_containers[applied[sub_heading]] = heading_display(chapter)
            _route_surplus_tables(profile, subs[sub_heading],
                                  _placed_table(profile, applied[sub_heading]),
                                  applied[sub_heading],
                                  heading_display(chapter or sub_heading),
                                  label=heading_display(sub_heading))

    # The section this chapter occupies. `None` when every subsection fell
    # through (a chapter whose target was already claimed by an earlier one),
    # and then the incoming `last_known_key` — the previous chapter — is still
    # the honest anchor.
    chapter_key = next(iter(applied.values()), None)

    # Pass 2 — route what is left, anchored inside its own chapter.
    seen = None
    for sub_heading, target, route in resolved:
        if sub_heading in applied:
            seen = last_known_key = applied[sub_heading]
            continue
        if routes is not None:
            routes['appendix'] += 1
        if seen is None and chapter_key:
            # Ahead of anything this chapter fills: it belongs before that
            # section's slides, not after them.
            _route_to_extra_slide(profile, sub_heading, subs[sub_heading],
                                  chapter_key, edge='before', chapter=chapter)
        else:
            _route_to_extra_slide(profile, sub_heading, subs[sub_heading],
                                  seen or last_known_key, chapter=chapter)
    return last_known_key


def _tables_by_label(content: str) -> list:
    """Every table the chapter holds, each with the `###` heading above it.

    Order is the document's. The label is what tells a reader which table they
    are looking at once it has left the chapter that framed it — `Key
    milestones` rather than a second nameless grid after the schedule.
    """
    labelled = []
    for sub_heading, body in _split_subsections(content).items():
        # A `####` below the `###` is the closer label, and often the only
        # honest one: §9.1 holds the option table AND two `####` breakdowns, so
        # labelling all three `Development cost` names none of them.
        blocks = _split_sub_subsections(body)
        loose = re.split(r'^####\s', body, maxsplit=1, flags=re.MULTILINE)[0]
        for rows in _parse_tables(loose):
            labelled.append((_strip_leading_number(sub_heading), rows))
        for deep_heading, deep_body in blocks.items():
            for rows in _parse_tables(deep_body):
                labelled.append((_strip_leading_number(deep_heading), rows))
    if labelled:
        return labelled
    return [('', rows) for rows in _parse_tables(content)]


def _route_surplus_tables(profile: ProjectProfile, content: str, used: list,
                          anchor: Optional[str], chapter: str,
                          label: str = '', rescue_all: bool = False) -> None:
    """Give a slide to every table of a chapter except the one already placed.

    A chapter's box takes ONE table — `_handle_schedule` and
    `_parse_table_section` both keep the largest and drop the rest. For a
    schedule chapter that is a phase plan, a resource plan and a milestone list,
    two of the three left the deck; for a cost chapter, three of four did. The
    reader was told the deck covered cost, and the operation, infrastructure and
    summary figures were simply gone.

    Nothing here overwrites what the template slide already shows: the table it
    took is skipped by identity, and each survivor gets its own appendix slide
    right after the chapter it came from.

    A schedule chapter places TWO tables, and only one of them is visible from
    the section: `schedule.table` is the leftover the renderer gives its own
    slide, while the `工程 | 担当 | 開始 | 終了` table became bars drawn inside
    slide 43's own frame and left no rows behind to match against. Matching by
    identity alone therefore called the Gantt's own table surplus and printed
    the whole schedule a second time, as an appendix slide immediately after the
    Gantt it duplicated.
    """
    from lib.schedule_gantt_fill import find_gantt_table

    # Only inside the schedule chapter, and only once the Gantt was actually
    # drawn: another chapter carrying 工程/開始 columns has no slide-43 frame to
    # have been consumed by, so its table is still a real surplus.
    gantt_drawn = (anchor == 'schedule' and bool(
        getattr(getattr(profile, 'schedule', None), 'gantt_rows', None)))

    if not used and not rescue_all:
        # Nothing identifiable was placed. That can mean the section took no
        # table — or that it keeps one somewhere this cannot see. The two are
        # indistinguishable from here, and guessing wrong prints the chapter's
        # own table a second time, so the chapter is left exactly as it was.
        return
    # `used` is every table the slide took, not just one: a section that renders
    # several (labelled feature groups) has several, and matching against only
    # the first re-prints the rest. `rescue_all` is the case where NOTHING took
    # a table — a chapter whose slide went to its diagram — so every table it
    # holds is surplus and every one needs a slide.
    surplus = [(name, rows) for name, rows in _tables_by_label(content)
               if rows and (rescue_all or all(rows != taken for taken in used))
               and not (gantt_drawn and find_gantt_table([rows]))]
    # Two tables under one `###` would arrive as two slides with one title, and
    # a reader cannot tell which is which. Numbering only the repeats keeps the
    # common case — one table, one name — unmarked.
    seen: dict = {}
    for name, rows in surplus:
        name = name or label or chapter
        seen[name] = seen.get(name, 0) + 1
        if seen[name] > 1:
            name = f'{name} ({seen[name]})'
        headers = list(rows[0].keys())
        profile.auto_extra_slides.append({
            'layout': 'table',
            'title': name,
            'headers': headers,
            'rows': [[str(row.get(h, '')) for h in headers] for row in rows],
            'anchor_section': anchor,
            'anchor_edge': 'after',
            'chapter': chapter,
        })
    if surplus and rescue_all:
        print(f'[profile-parser] "{chapter}" carries {len(surplus)} table(s) '
              f'beside its diagram; each gets a slide of its own rather than '
              f'being dropped')
    elif surplus:
        print(f'[profile-parser] "{chapter}" carries {len(surplus) + 1} tables; '
              f'the template slide takes one and the other {len(surplus)} get '
              f'slides of their own rather than being dropped')

def _placed_table(profile: ProjectProfile, key: str) -> list:
    """EVERY table the section's slide took, whatever the section calls them.

    Returns a list of row-lists, because one section can place more than one
    table. `features` is the case that matters: slide 5 renders each labelled
    `groups[*]['table']` on its own page, and reading only `features.table`
    reported the first group as the whole of what was placed — so the second
    group looked like an unplaced surplus and was printed a second time as an
    appendix slide (the duplicate `Feature List` at deck slide 13).

    `table`/`rows` is still read, and still first: a section with one unlabelled
    table keeps it there, and that is the shape gen-md.py emits.
    """
    section = getattr(profile, key, None)
    placed = []
    for attr in ('table', 'rows'):
        rows = getattr(section, attr, None)
        if rows:
            placed.append(rows)
            break
    for group in getattr(section, 'groups', None) or []:
        rows = group.get('table') if isinstance(group, dict) else None
        if rows:
            placed.append(rows)
    return placed


def _route_to_extra_slide(profile: ProjectProfile, heading: str, content: str,
                          anchor: Optional[str], edge: str = 'after',
                          chapter: str = '') -> Optional[str]:
    """Record one unrecognized block as an extra slide. Returns *anchor* unchanged.

    `edge` says which side of the anchor section the slide belongs on. A chapter
    routinely opens with a subsection the schema has no box for (`2.1 System
    Flow` ahead of `2.2 Key Benefits`); anchoring it AFTER the section its
    chapter does fill would print it after content the document puts it before.
    """
    entry = _route_unmatched_section(heading, content, anchor)
    entry['anchor_edge'] = edge
    # The `##` chapter this slide came out of. A chapter every one of whose
    # subsections ends up here has no section, so nothing else in the deck
    # records that it exists — and the renderer needs the name to give it back
    # its divider. `''` for a chapter that IS the slide (no subsections).
    entry['chapter'] = heading_display(chapter) if chapter else ''
    profile.auto_extra_slides.append(entry)
    # The same surplus-table rule a mapped chapter gets: this slide took one
    # table, and the chapter's others follow it rather than staying in the
    # markdown. After the append, so they keep the document's order.
    if entry.get('layout') == 'table':
        tables = _parse_tables(content)
        placed = [max(tables, key=len)] if tables else []
        # Tableless subsections first: the document writes `4.2 In Scope` before
        # `4.4 Delivery Options`, and the deck should follow it.
        _route_tableless_subsections(profile, content, anchor,
                                     heading_display(chapter or heading))
        _route_surplus_tables(profile, content, placed,
                              anchor, heading_display(chapter or heading))
    elif entry.get('layout') == 'diagram':
        # The drawing claimed the slide, and a table is not part of a drawing.
        # Without this the chapter's grids left the deck with nothing said —
        # the one outcome this routing exists to refuse. Its prose already
        # rides above the picture as the lead-in, so only tables are rescued.
        _route_surplus_tables(profile, content, [], anchor,
                              heading_display(chapter or heading),
                              rescue_all=True)
    print(f'[profile-parser] WARNING: unrecognized section "{heading}" — '
          f'auto-routed to \'{entry["layout"]}\' extra-slide layout '
          f'(anchor: {anchor or "end of deck"}); review the '
          f'rendered slide before handing the deck over')
    return anchor


def _route_tableless_subsections(profile: ProjectProfile, content: str,
                                 anchor: Optional[str], chapter: str) -> None:
    """Give a slide to the subsections a table chapter left behind.

    `build_extra_slide_entry` picks ONE layout for a chapter, and a chapter that
    holds a table becomes a table slide — the right call, because a matrix is
    what such a chapter is about. `_route_surplus_tables` then rescues its other
    tables. Nothing rescued its other SUBSECTIONS, so a chapter written as
    `4.1 Responsibility Split` (table), `4.2 In Scope` (list), `4.3 Out of
    Scope` (list), `4.4 Delivery Options` (table) shipped both tables and
    dropped both lists — silently, which is the one outcome this pipeline is
    built to refuse.

    The orphans are handed to the classifier AS A GROUP rather than one at a
    time, so it reads them the way it reads any chapter: two of them become the
    two-column `comparison_2` a reader expects of In Scope / Out of Scope,
    three-to-five become numbered points (and may borrow a template design),
    and anything else falls to bullets, which never truncates.
    """
    orphans = {
        sub_heading: body
        for sub_heading, body in _split_subsections(content).items()
        if not _parse_tables(body) and (_parse_list(body) or _parse_prose(body))
    }
    if not orphans:
        return
    # Titled after the subsections it holds, not after the chapter: the chapter's
    # own name is already on the table slide, and two slides wearing one title
    # tell the reader nothing about which is which.
    names = [heading_display(h) for h in orphans]
    title = ' / '.join(names) if len(names) <= 3 else chapter
    entry = build_extra_slide_entry(title, subsections=orphans,
                                    raw_text='\n\n'.join(orphans.values()))
    entry['anchor_section'] = anchor
    entry['anchor_edge'] = 'after'
    entry['chapter'] = chapter
    profile.auto_extra_slides.append(entry)
    print(f'[profile-parser] "{chapter}" is a table chapter but also carries '
          f'{len(orphans)} subsection(s) with no table ({", ".join(names)}) — '
          f'they get a \'{entry["layout"]}\' slide rather than being dropped')


def _route_unmatched_section(heading: str, content: str, anchor_section: Optional[str]) -> dict:
    """Classify one unrecognized `## heading` block into an extra-slide entry.

    Parsing (table/list/subsection detection) stays here, reusing the same
    primitives the known-section handlers use; `build_extra_slide_entry` only
    picks a layout and shapes the already-parsed pieces.

    Tables are looked for whether or not the block has `###` subsections. They
    used to be skipped entirely when it did, which is exactly the case that
    matters: a chapter like `## 4. Sun* のスコープ` carries its whole
    responsibility matrix inside `### 4.1 Responsibility Split`, and skipping it
    flattened an 11-row table into one unreadable bullet. The largest table in
    the block wins — that is the one the chapter is about.
    """
    subs = _split_subsections(content)
    tables = _parse_tables(content)
    table_rows = max(tables, key=len) if tables else []
    if len(tables) > 1:
        # What happens to the others is `_route_to_extra_slide`'s business —
        # it gives each one a slide right after this — so this line reports the
        # choice it makes and nothing more. It used to end "the rest stay in the
        # markdown only", which the very next line of output contradicted.
        print(f'[profile-parser] NOTE: "{heading}" holds {len(tables)} tables — '
              f'this slide takes the largest ({len(table_rows)} rows)')
    list_items = _parse_list(content) if not subs and not table_rows else []
    entry = build_extra_slide_entry(
        # The heading becomes the slide's visible title, so it gets the same
        # markup cleanup as body text — a raw `4\. Sun\* のスコープ` otherwise
        # ships its backslashes to the deck.
        _strip_inline_markup(heading), subsections=subs, table_rows=table_rows,
        list_items=list_items, raw_text=content,
    )
    entry['anchor_section'] = anchor_section
    return entry


# ---------------------------------------------------------------------------
# Header + section splitting
# ---------------------------------------------------------------------------

# Leading `---` … `---` block carrying the agent's heading → section mapping.
_FRONT_MATTER = re.compile(r'\A---[ \t]*\n(.*?)\n---[ \t]*(?:\n|\Z)', re.DOTALL)
# One `"heading": key` line inside it. Flat by design — see `_parse_front_matter`.
_MAPPING_LINE = re.compile(r'^\s{2,}(.+?)\s*:\s*(\S+)\s*$')

# The value that says "this chapter is a wrapper; its `###` subsections are the
# real sections" — the shape `_consume_container` already handles.
CONTAINER_KEY = 'container'

# The value that says "this chapter claims no template slide; send it straight
# to an appendix slide". Its twin, `container`, unwraps a chapter; this one
# stands one down.
#
# It exists because first-occupant-wins is decided by document order, and a
# chapter often arrives BEFORE the one that should really fill the slide: §1.1
# Project Background precedes §1.2 Current Challenges, resolves to the same
# section, and locks §1.2 out. Only the author of the front matter can know
# which of the two the slide was meant to carry, so only they can stand one
# down — this is deliberately absent from the alias table.
APPENDIX_KEY = 'appendix'

# Both sentinels, for the places that only need to ask "is this a real target?".
_SENTINELS = frozenset({CONTAINER_KEY, APPENDIX_KEY})


def split_front_matter(md: str) -> tuple[dict[str, str], dict[str, str], str]:
    """Split a leading `---` block off *md*.

    Returns (section mapping, authored slide copy, body).

    A supplied proposal names its chapters however its author chose, and no
    fixed alias table can cover every wording in every language. The agent that
    reads the document at Step 0.0 writes what it found into front matter:

        ---
        sections:
          "1. 本システムの全体像": container
          "1.1 現行業務の課題と狙い": project_background
        ---

    A second block, `slides:`, may carry the slide COPY for a box the document
    says at greater length than the box can hold:

        ---
        slides:
          project_background.objectives:
            - All ring sensor data received without loss
            - BLE stable under realistic daily use
        ---

    That is still metadata about the document — copy DERIVED from it, written by
    the agent that read it, for a box with a fixed size. It never edits the
    document, and it must never state anything the document does not.

    This is the ONLY thing that may be added to a supplied document — the
    chapters, their order, their heading levels and their wording stay exactly
    as written. The mapping is metadata ABOUT the document, never a rewrite OF
    it.

    The body is returned with the block removed, so `_parse_header` and
    `_fill_cover_from_preamble` — both of which read the text above the first
    `##` — never see it.
    """
    match = _FRONT_MATTER.match(md)
    if not match:
        return {}, {}, md
    mapping, authored = _parse_front_matter(match.group(1))
    return mapping, authored, md[match.end():]


def _parse_front_matter(block: str) -> tuple[dict[str, str], dict[str, str]]:
    """Read the `sections:` and `slides:` blocks out of a front-matter block.

    Deliberately a flat reader rather than a YAML dependency: the shape is fixed
    and narrow, `scripts/requirements.txt` carries no yaml, and a real YAML
    loader would accept far more than this file should ever hold from a
    user-supplied document.

    `slides:` accepts either form under a `section.field` key — one inline value,
    or a list of `- ` lines that become one paragraph each (the same unit
    `content_condenser` counts):

        slides:
          project_background.objectives: One sentence, inline
          project_background.current_issues:
            - First point
            - Second point
    """
    authored: dict[str, list[str]] = {}
    in_slides = False
    current_field: str | None = None
    for line in block.splitlines():
        if not line.strip() or line.lstrip().startswith('#'):
            continue
        if re.match(r'^\S', line):
            in_slides = line.strip().rstrip(':').strip() == 'slides'
            current_field = None
            continue
        if not in_slides:
            continue
        stripped = line.strip()
        bullet = _SLIDES_BULLET.match(line)
        if bullet and current_field:
            authored[current_field].append(bullet.group(1).strip().strip('"\''))
            continue
        key, _, inline = stripped.partition(':')
        current_field = key.strip().strip('"\'')
        authored.setdefault(current_field, [])
        if inline.strip():
            authored[current_field].append(inline.strip().strip('"\''))
    return (_read_sections_block(block),
            _validated_authored({k: '\n\n'.join(v) for k, v in authored.items() if v}))


# A `- item` line inside the `slides:` block.
_SLIDES_BULLET = re.compile(r'^\s+-\s+(.+?)\s*$')


def _read_sections_block(block: str) -> dict[str, str]:
    """Read only the `sections:` map — the original, unchanged reader."""
    mapping: dict[str, str] = {}
    in_sections = False
    for line in block.splitlines():
        if not line.strip() or line.lstrip().startswith('#'):
            continue
        if re.match(r'^\S', line):
            in_sections = line.strip().rstrip(':').strip() == 'sections'
            continue
        if not in_sections:
            continue
        entry = _MAPPING_LINE.match(line)
        if entry:
            heading = entry.group(1).strip().strip('"\'')
            mapping[heading] = entry.group(2).strip().strip('"\'')
    return _validated_mapping(mapping)


def _validated_authored(authored: dict[str, str]) -> dict[str, str]:
    """Reject any `slides:` key that is not a real `section.field` path.

    Same allowlist as the mapping's dotted form, and the same reason: the key
    drives a `setattr` on a profile section, and a typo that is silently ignored
    looks exactly like copy that was applied.
    """
    valid = {f'{section}.{name}'
             for section, names in FIELD_TARGETS.items() for name in names}
    bad = sorted(set(authored) - valid)
    if bad:
        raise ValueError(
            'Invalid field path(s) in the front-matter `slides:` block: '
            + ', '.join(repr(k) for k in bad)
            + '\nValid field paths: ' + ', '.join(sorted(valid))
        )
    return authored


def _validated_mapping(mapping: dict[str, str]) -> dict[str, str]:
    """Reject any value that is not a real section key, field path, or sentinel.

    The value reaches `globals().get(f'_handle_{key}')` or a `setattr` on a
    profile section, so an unchecked one is an arbitrary-attribute write driven
    by a user-supplied document. `FIELD_TARGETS` is the allowlist for the dotted
    form — never `dataclasses.fields`, which would expose the structural
    `table` / `image_path` / `rows` fields to raw markdown.

    A bad value is also simply a typo the author wants to hear about: a silently
    ignored mapping line looks identical to a mapping that worked.
    """
    valid_sections = set(_SECTION_CONTENT_CHECKS) | _SENTINELS
    bad: dict[str, str] = {}
    for heading, target in mapping.items():
        if '.' in target:
            section_key, _, field_name = target.partition('.')
            if field_name not in FIELD_TARGETS.get(section_key, set()):
                bad[heading] = target
        elif target not in valid_sections:
            bad[heading] = target
    if bad:
        field_paths = sorted(
            f'{section}.{name}'
            for section, names in FIELD_TARGETS.items() for name in names
        )
        raise ValueError(
            'Invalid section key(s) in the front-matter `sections:` mapping: '
            + ', '.join(f'{h!r} -> {k!r}' for h, k in sorted(bad.items()))
            + '\nValid keys: ' + ', '.join(sorted(valid_sections))
            + '\nValid field paths: ' + ', '.join(field_paths)
        )
    return mapping


def _parse_header(md: str) -> tuple[str, str]:
    """Extract project_id from `# Project Profile: X` and timestamp from `Generated: X`."""
    pid_match = re.search(r'^#\s*Project Profile:\s*(\S+)', md, re.MULTILINE)
    ts_match = re.search(r'^Generated:\s*(\S+)', md, re.MULTILINE)
    return (pid_match.group(1) if pid_match else '',
            ts_match.group(1) if ts_match else '')


def _split_sections(md: str) -> list[tuple[str, str]]:
    """Split markdown by `^## ` headings, in document order.

    A list of pairs rather than a dict: a proposal may repeat a heading (two
    `## 機能一覧` chapters), and a dict drops the first one before any section
    logic can see it — content the user wrote, gone with no warning. Order
    matters too: the prune pass emits slides in the order the markdown
    introduces its sections.
    """
    parts: list[tuple[str, str]] = []
    current_heading = None
    current_lines: list[str] = []
    for line in md.splitlines():
        m = re.match(r'^##\s+(.+?)\s*$', line)
        if m and not line.startswith('###'):
            if current_heading is not None:
                parts.append((current_heading, '\n'.join(current_lines).strip()))
            current_heading = m.group(1).strip()
            current_lines = []
        else:
            if current_heading is not None:
                current_lines.append(line)
    if current_heading is not None:
        parts.append((current_heading, '\n'.join(current_lines).strip()))
    return parts


# ---------------------------------------------------------------------------
# Section handlers — one per top-level section
# ---------------------------------------------------------------------------

def _handle_cover(profile: ProjectProfile, content: str):
    subs = _split_subsections(content)
    profile.cover = CoverSection(
        # `Title` is the pre-rename spelling, still accepted so older profile
        # markdown keeps filling the cover instead of silently falling back to
        # the template's 'SVN Proposal Menu' placeholder.
        company=_parse_text(subs.get('Company') or subs.get('Title', '')),
        date=_parse_text(subs.get('Date', '')),
    )


def _handle_agenda(profile: ProjectProfile, content: str):
    subs = _split_subsections(content)
    if subs:
        chapters = _parse_list(subs.get('Chapters', ''))
        cost_breakdown = _parse_list(subs.get('Cost Breakdown', ''))
    else:
        # A bare `## Agenda` followed by the source document's numbered list —
        # the shape a hand-written profile most naturally takes. Everything is
        # a chapter; the 費用 sub-items then stay at the template's wording.
        chapters, cost_breakdown = _parse_list(content), []
    profile.agenda = AgendaSection(chapters=chapters, cost_breakdown=cost_breakdown)


# Every handler below reads the schema's own `###` subsection names first and
# falls back to the bare block. The fallback is what lets a chapter lifted
# straight out of a proposal fill its slide: `### 1.2 機能一覧` carries its
# intro prose and its table together, with no `### Description` to look under.
# The fallback never overrides a named subsection — it only fills what one
# would have filled and didn't.

def _handle_project_background(profile: ProjectProfile, content: str):
    subs = _split_subsections(content)
    current_issues = _parse_text(subs.get('Current Issues', ''))
    objectives = _parse_text(subs.get('Objectives', ''))
    if not (current_issues or objectives):
        # A bare 背景・目的 block states the situation first and the goal after,
        # in that order — the same order the template's two boxes sit in. One
        # paragraph only fills the first box rather than being split in half.
        paragraphs = _split_paragraphs(_parse_prose(content))
        current_issues = paragraphs[0] if paragraphs else ''
        objectives = '\n\n'.join(paragraphs[1:])
    profile.project_background = BackgroundSection(
        current_issues=current_issues, objectives=objectives,
    )


def _handle_features(profile: ProjectProfile, content: str):
    subs = _split_subsections(content)
    groups = _parse_labelled_tables(content)
    # `groups[0]` when the chapter is split into labelled sub-blocks: reading the
    # whole block instead merged every sub-table into one grid, putting the
    # second table's header row on the slide as data.
    table = (_parse_table(subs.get('Feature Table', ''))
             or (groups[0]['table'] if groups else _parse_table(content)))
    if table and not groups:
        # One unlabelled table — the shape gen-md.py emits. Wrapped as a single
        # group with NO label so the renderer takes one path for both cases and
        # the slide's pill keeps whatever wording the template gave it.
        groups = [{'label': '', 'table': table}]
    profile.features = FeaturesSection(
        description=_parse_text(subs.get('Description', '')) or _parse_prose(content),
        table=table,
        groups=groups,
    )
    _route_tableless_sub_blocks(profile, content, 'features')


def _route_tableless_sub_blocks(profile: ProjectProfile, content: str,
                                anchor: str) -> None:
    """Give a `####` sub-block with no table a slide of its own.

    `#### 1.4.3 Out-of-scope features (confirmed)` is a bulleted list inside a
    chapter whose slide holds a grid. It fits no table role, and `parse_prose`
    drops its bullets — so it was reaching the deck as nothing but its own
    heading in the description box, and once that heading stopped leaking it was
    reaching the deck not at all.
    """
    for label, block in _split_sub_subsections(content).items():
        if _parse_table(block) or not block.strip():
            continue
        print(f'[profile-parser] NOTE: "{label}" carries no table — giving it an '
              f'appendix slide of its own rather than dropping it')
        _route_to_extra_slide(profile, label, block, anchor)


def _parse_labelled_tables(content: str) -> list[dict]:
    """Read `#### ` sub-blocks that carry a table into `{label, table}` entries.

    A sub-block with no table is skipped — `#### 1.4.3 Out-of-scope features` is
    a bulleted list, and it reaches the deck through its own route rather than
    as an empty grid. Returns [] when the chapter has no labelled sub-blocks at
    all, which is the schema shape `gen-md.py` writes.
    """
    groups = []
    for label, block in _split_sub_subsections(content).items():
        rows = _parse_table(block)
        if rows:
            groups.append({'label': heading_display(label), 'table': rows})
    return groups


def _handle_nfr_overview(profile: ProjectProfile, content: str):
    subs = _split_subsections(content)
    profile.nfr_overview = NFROverviewSection(
        description=_parse_text(subs.get('Description', '')) or _parse_prose(content),
        table=_parse_table(subs.get('Requirements Table', '')) or _parse_table(content),
    )


def _handle_screen_flow(profile: ProjectProfile, content: str):
    profile.screen_flow = ScreenFlowSection(image_path=_parse_image_ref(content))


def _handle_business_process(profile: ProjectProfile, content: str):
    subs = _split_subsections(content)
    after_blocks = []
    after_content = subs.get('After (Post-Introduction)') or subs.get('After', '')
    # Each `#### title` followed by body
    for m in re.finditer(r'^####\s+(.+?)\s*$\n(.*?)(?=^####\s|\Z)', after_content, re.MULTILINE | re.DOTALL):
        after_blocks.append(AfterBlock(title=_parse_text(m.group(1)), body=_parse_text(m.group(2))))
    profile.business_process = BusinessProcessSection(
        categories=_parse_list(subs.get('Categories', '')),
        before_steps=_parse_list(subs.get('Before (Current Process)') or subs.get('Before', '')),
        after_blocks=after_blocks,
    )


def _handle_benefits(profile: ProjectProfile, content: str):
    """Read システム導入のメリット as one card per `###` block.

    A card is one box, so its content goes through `_cell_text` like an
    assumptions row: §2.2 `Key Benefits` is a `Dimension | Benefit` matrix, and
    handed over raw it reached the card — and the appendix slide its overflow
    went to — as markdown pipes.
    """
    benefits = []
    for m in re.finditer(r'^###\s+(.+?)\s*$\n(.*?)(?=^###\s|\Z)', content, re.MULTILINE | re.DOTALL):
        benefits.append(BenefitSection(title=heading_label(m.group(1)),
                                       content=_cell_text(m.group(2))))
    if not benefits:
        # A proposal states its benefits as a two-column `観点 | メリット` table
        # rather than as headed blocks. Same pairs, different shape.
        benefits = [
            BenefitSection(title=title.strip(), content=body.strip())
            for title, body in (
                tuple(row.values())[:2] for row in _parse_table(content)
                if len(row) >= 2
            )
        ]
    profile.benefits = benefits


def _handle_approach_comparison(profile: ProjectProfile, content: str):
    """Read 提案の要諦 in whichever of its two shapes the document wrote.

    A comparison MATRIX fills slide 21; `###` POINTS fill slide 16's four cards.
    Both are read, and the prune pass drops whichever slide got nothing — so a
    document never has to know which shape the template prefers.
    """
    profile.approach_comparison = _parse_table(content)
    profile.approach_points = _parse_points(content, limit=_APPROACH_POINT_SLOTS)


# Slide 16 draws four cards, and its badges are numbered 01–04 in the artwork.
# A fifth point has nowhere to go, so it is reported rather than dropped in
# silence — see `_parse_points`.
_APPROACH_POINT_SLOTS = 4


def _parse_points(content: str, limit: int) -> list[dict]:
    """Turn `###` subsections into {title, subtitle, body} cards.

    The template's card carries a headline slot above its body, and a proposal's
    subsection gives only a heading and prose. The prose's own first sentence is
    the honest filler for that slot: it states the point, it is already written,
    and nothing is invented. The body then continues from where it left off, so
    the card never prints the same sentence twice.
    """
    subs = _split_subsections(content)
    if not subs:
        return []
    points = []
    for sub_heading, sub_content in subs.items():
        body = _parse_prose(_promote_lists_to_paragraphs(sub_content))
        if not body.strip():
            continue
        headline, remainder = _split_headline(body)
        points.append({
            'title': heading_display(sub_heading),
            'subtitle': headline,
            'body': remainder,
        })
    if len(points) > limit:
        print(f'[profile-parser] NOTE: the essence chapter holds {len(points)} points '
              f'but its slide draws {limit} cards — the remaining '
              f'{len(points) - limit} stay in the markdown only')
    return points[:limit]


def _handle_assumptions(profile: ProjectProfile, content: str):
    """Read 前提条件 as one row per `###` subsection: its name, then what it says.

    Each row is ONE cell of a two-column grid, so the content goes through
    `_cell_text`. That matters here more than anywhere: an assumption is routinely
    written as a little `Item | Assumption` matrix, and `_parse_text` handed
    those pipes to the cell verbatim, where the renderer escaped them and the
    slide printed `&#124; Item &#124; Assumption`. Flattened, the same matrix
    reads as the prose it always was — `Methodology — Scrum, 2-week sprints.
    Repository — GitHub.`

    The label is `heading_display`: the document's own name for the row, minus
    the outline numbering. `5.1. Development approach` is a cross-reference in
    the document and noise in a table cell whose column IS the row's name.
    """
    assumptions = []
    for m in re.finditer(r'^###\s+(.+?)\s*$\n(.*?)(?=^###\s|\Z)', content, re.MULTILINE | re.DOTALL):
        assumptions.append(AssumptionSection(
            label=heading_label(m.group(1)),
            content=_cell_text(m.group(2)),
        ))
    profile.assumptions = assumptions


def _handle_infrastructure(profile: ProjectProfile, content: str):
    profile.infrastructure = _parse_table(content)


def _handle_software_stack(profile: ProjectProfile, content: str):
    profile.software_stack = _parse_table(content)


def _handle_nfr_sections(profile: ProjectProfile, content: str):
    sections = []
    for m in re.finditer(r'^###\s+(.+?)\s*$\n(.*?)(?=^###\s|\Z)', content, re.MULTILINE | re.DOTALL):
        sections.append(NFRSection(title=_parse_text(m.group(1)), body=_parse_text(m.group(2))))
    profile.nfr_sections = sections


def _handle_nfr_detailed(profile: ProjectProfile, content: str):
    profile.nfr_detailed = _parse_table(content)


def _handle_deliverables(profile: ProjectProfile, content: str):
    profile.deliverables = _table_section(content)


def _handle_cost(profile: ProjectProfile, content: str):
    profile.cost = _table_section(content)


def _table_section(content: str) -> TableSection:
    """Shape a chapter into its main table plus the wording around it.

    `parse_tables` rather than `parse_table`: these chapters carry more than one
    table (費用 holds a cost breakdown and an infra note), and concatenating them
    would apply the first one's header to the second one's rows. The largest is
    the one the chapter is about.

    Title and description come from wherever that table actually lives — under a
    `###` subsection (費用's table sits under 9.1 開発費用) it is that
    subsection's heading and prose; loose in the chapter, the title is left
    empty so the template's own heading stands.
    """
    # The chapter's opening prose, before its first `###`. That is the sentence
    # introducing the table; anything after it is the footnotes and caveats the
    # subsection appends, which do not belong in a slide's lead-in.
    lead_in = _parse_prose(re.split(r'^###\s', content, maxsplit=1,
                                    flags=re.MULTILINE)[0])
    subs = _split_subsections(content)
    for heading, body in subs.items():
        tables = _subsection_main_tables(body)
        if tables:
            return TableSection(title=_strip_leading_number(heading),
                                description=lead_in, rows=max(tables, key=len))
    tables = _parse_tables(content)
    return TableSection(description=lead_in,
                        rows=max(tables, key=len) if tables else [])


def _subsection_main_tables(body: str) -> list:
    """The tables a `###` subsection is ABOUT — its own, not its breakdowns'.

    A subsection routinely states its matter in one table and then breaks part of
    it down under `####` headings. §9.1 `Development cost — two options` is
    exactly that: a four-column table of the two options, followed by a
    seven-row breakdown of which domains stay human-first. Taking the largest
    table in the subsection put the breakdown on the cost slide, under the
    option table's own heading, and exiled the prices to an appendix.

    So the subsection's own tables win when it has any; the breakdowns are
    considered only when it has none of its own. Either way `_route_surplus_
    tables` still gives every table the chapter holds a slide, so nothing is
    lost — this only decides which one the template slide gets.
    """
    own = _parse_tables(re.split(r'^####\s', body, maxsplit=1, flags=re.MULTILINE)[0])
    return own or _parse_tables(body)


def _strip_leading_number(heading: str) -> str:
    """`9.1 開発費用（概算工数）` -> `開発費用（概算工数）`.

    Section numbering belongs to the document's outline, not to a slide that
    carries its own chapter divider.
    """
    return _strip_inline_markup(re.sub(r'^\d+(?:\.\d+)*\s*[.．、）)]?\s+', '',
                                       heading.strip()))


def _handle_schedule(profile: ProjectProfile, content: str):
    from lib.schedule_gantt_fill import find_gantt_table

    subs = _split_subsections(content)
    tables = _parse_tables(content)
    # A 工程/担当/開始/終了 table is the Gantt itself, drawn into slide 43;
    # any other table is the milestone list that gets a slide of its own.
    gantt = find_gantt_table(tables)
    others = [t for t in tables if gantt is None or t is not gantt[2]]
    profile.schedule = ScheduleSection(
        description=_parse_text(subs.get('Description', '')) or _parse_prose(content),
        image_path=(_parse_image_ref(subs.get('Chart', ''))
                    or _parse_image_ref(content)),
        table=max(others, key=len) if others else [],
        gantt_rows=gantt[0] if gantt else [],
        milestones=gantt[1] if gantt else [],
    )


def _handle_team(profile: ProjectProfile, content: str):
    profile.team = _table_section(content)
